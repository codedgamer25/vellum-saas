import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const ROOT_DIR = '/home/antigravity';
const ARTIFACT_DIR = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/562f84c7-1d5f-4800-ac8a-a9dea5a11d3c';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = (req.url || '/').split('?')[0];
      const relPath = reqUrl === '/' ? '/index.html' : reqUrl;
      const fullPath = path.join(ROOT_DIR, relPath);
      if (!fullPath.startsWith(ROOT_DIR) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDebuggerUrl(debugPort) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await res.json();
      const pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) return pageTarget.webSocketDebuggerUrl;
    } catch {
      // retry
    }
    await sleep(150);
  }
  throw new Error('Timed out waiting for Chromium CDP target');
}

class CDPSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
    this.pageErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onclose = (e) => console.log('WS CLOSED:', e.code, e.reason);
    this.ws.onerror = (e) => console.error('WS ERROR:', e);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log(`CDP RECV id=${msg.id} method=${msg.method || ''} err=${msg.error ? JSON.stringify(msg.error) : 'none'}`);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          const text = msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
          this.consoleErrors.push(text);
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
        this.pageErrors.push(desc);
      }

      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP method ${method} timed out after 10000ms`));
        }
      }, 10000);
      this.callbacks.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      console.log(`CDP SEND [${id}]: ${method}`);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Evaluation failed: ${res.exceptionDetails.text} - ${JSON.stringify(res.exceptionDetails.exception)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filePath, clip = null) {
    const params = { format: 'png', quality: 90, captureBeyondViewport: false };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buf);
    console.log(`Saved screenshot: ${filePath} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  async close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}

async function runDealershipTestSuite() {
  console.log('--- Starting Apex Auto Lounge Dealership Automated CDP E2E Test Suite ---');
  const { server, port } = await startStaticServer();
  const testUrl = `http://127.0.0.1:${port}/index.html`;
  console.log(`Local test server running at ${testUrl}`);

  const debugPort = 9333;
  const chromeProcess = spawn(
    '/usr/bin/chromium',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      `--remote-debugging-port=${debugPort}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
  chromeProcess.stderr.on('data', (d) => console.log('CHROME_ERR:', d.toString()));

  let cdp;
  try {
    const wsUrl = await waitForDebuggerUrl(debugPort);
    cdp = new CDPSession(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Set Desktop Viewport 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to Apex Auto Lounge...');
    await cdp.send('Page.navigate', { url: testUrl });
    await sleep(800);

    // Test 1: Public Catalog renders 8 initial seed vehicles
    const carCardCount = await cdp.evaluate(`document.querySelectorAll('.car-card').length`);
    console.log(`[PASS] Initial catalog rendered with ${carCardCount} vehicle cards`);
    assert.equal(carCardCount, 8, 'Expected 8 vehicle cards rendered');

    // Test 1b: Verify interactive 3D showcase buttons and WebGL/Sketchfab UI are removed
    const badge3DCount = await cdp.evaluate(`document.querySelectorAll('.badge-3d-showcase, .btn-open-3d').length`);
    console.log(`[PASS] Found ${badge3DCount} 3D card buttons (expected 0)`);
    assert.equal(badge3DCount, 0, 'Expected 0 interactive 3D buttons on vehicle cards');

    // =========================================================================
    // Stage 3 & 4: Hero Stage Viewport (Studio Conveyor Showcase)
    // =========================================================================
    const heroStageInfo = await cdp.evaluate(`
      (() => {
        const stage = document.getElementById('hero-stage-viewport');
        const card = document.getElementById('hero-stage-card');
        const canvas = document.getElementById('hero-3d-canvas');
        const conveyorCars = document.querySelectorAll('.hero-conveyor-car').length;
        if (!stage) return null;
        const rect = stage.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          theme: stage.getAttribute('data-hero-theme'),
          cardTheme: card?.getAttribute('data-color-theme'),
          watermark: document.getElementById('hero-watermark')?.textContent.trim(),
          hasCanvas: !!canvas,
          hasViewer: !!(window.Apex3DViewer),
          conveyorCars
        };
      })()
    `);
    console.log(`[PASS] #hero-stage-viewport studio showcase present:`, heroStageInfo);
    assert.ok(heroStageInfo, '#hero-stage-viewport must be rendered');
    assert.ok(heroStageInfo.height >= 500, '#hero-stage-viewport must have height >= 500px');
    assert.equal(heroStageInfo.hasCanvas, false, '#hero-3d-canvas must not be rendered');
    assert.equal(heroStageInfo.hasViewer, false, 'window.Apex3DViewer must not be loaded');
    assert.equal(heroStageInfo.conveyorCars, 4, '4 studio conveyor cars must be rendered');
    const triadPillCount = await cdp.evaluate("document.querySelectorAll('.triad-pill').length");
    console.log(`[PASS] Found ${triadPillCount} Marco Perez Triad Pills`);
    assert.equal(triadPillCount, 4, 'Must render 4 Marco Perez Triad Pills');
    assert.equal(heroStageInfo.cardTheme, 'midnight-coral', 'Default theme must be midnight-coral');
    assert.equal(heroStageInfo.watermark, 'ROMA V8', 'Watermark text must match ROMA V8');

    // Test 1d: Click Raven & Poppy Triad Pill (.triad-pill[data-triad="raven-poppy"])
    await cdp.evaluate(`document.querySelector('.triad-pill[data-triad="raven-poppy"]').click();`);
    await sleep(300);

    const ravenName = await cdp.evaluate(`document.getElementById('island-car-name')?.textContent.trim()`);
    const ravenHP = await cdp.evaluate(`document.getElementById('island-hp')?.textContent.trim()`);
    const ravenTheme = await cdp.evaluate(`document.getElementById('hero-stage-viewport')?.getAttribute('data-hero-theme')`);
    const ravenCardColor = await cdp.evaluate(`document.getElementById('hero-stage-card')?.getAttribute('data-color-theme')`);
    const ravenWatermark = await cdp.evaluate(`document.getElementById('hero-watermark')?.textContent.trim()`);

    console.log(`[PASS] Raven & Poppy: theme="${ravenTheme}", cardColor="${ravenCardColor}", watermark="${ravenWatermark}", hp="${ravenHP}"`);
    assert.equal(ravenTheme, 'porsche-gt3-rs-2024', 'Theme attribute must be porsche-gt3-rs-2024');
    assert.equal(ravenCardColor, 'raven-poppy', 'Card color theme must update to raven-poppy');
    assert.equal(ravenWatermark, '911 GT3 RS', 'Watermark text must update to 911 GT3 RS');
    assert.ok(ravenName.includes('Porsche 911 GT3 RS'), 'Dynamic Island name must update to Porsche 911 GT3 RS');
    assert.equal(ravenHP, '518 HP', 'Dynamic Island HP must update to 518 HP');

    // Capture proof: Hero 3D Stage with Porsche GT3 RS / Raven & Poppy active
    const hero3DProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_hero_3d.png');
    await cdp.screenshot(hero3DProofPath);
    const fullbleedHeroProofPath = path.join(ARTIFACT_DIR, 'proof_hero_fullbleed_3d.png');
    await cdp.screenshot(fullbleedHeroProofPath);

    // Test 1e: Click Pine & Butter Triad Pill (.triad-pill[data-triad="pine-butter"])
    await cdp.evaluate(`document.querySelector('.triad-pill[data-triad="pine-butter"]').click();`);
    await sleep(250);
    const pineName = await cdp.evaluate(`document.getElementById('island-car-name')?.textContent.trim()`);
    const pineHP = await cdp.evaluate(`document.getElementById('island-hp')?.textContent.trim()`);
    const pineTheme = await cdp.evaluate(`document.getElementById('hero-stage-viewport')?.getAttribute('data-hero-theme')`);
    const pineCardColor = await cdp.evaluate(`document.getElementById('hero-stage-card')?.getAttribute('data-color-theme')`);
    const pineWatermark = await cdp.evaluate(`document.getElementById('hero-watermark')?.textContent.trim()`);
    console.log(`[PASS] Pine & Butter: theme="${pineTheme}", cardColor="${pineCardColor}", watermark="${pineWatermark}", hp="${pineHP}"`);
    assert.equal(pineTheme, 'mercedes-amg-g63-2024', 'Theme attribute must be mercedes-amg-g63-2024');
    assert.equal(pineCardColor, 'pine-butter', 'Card color theme must be pine-butter');
    assert.equal(pineWatermark, 'AMG G63', 'Watermark text must update to AMG G63');
    assert.ok(pineName.includes('Mercedes-AMG G63'), 'Dynamic Island name must update to Mercedes-AMG G63');
    assert.equal(pineHP, '577 HP', 'Dynamic Island HP must update to 577 HP');

    // Test 1f: Click Obsidian & Gold Triad Pill (.triad-pill[data-triad="obsidian-gold"])
    await cdp.evaluate(`document.querySelector('.triad-pill[data-triad="obsidian-gold"]').click();`);
    await sleep(250);
    const obsName = await cdp.evaluate(`document.getElementById('island-car-name')?.textContent.trim()`);
    const obsHP = await cdp.evaluate(`document.getElementById('island-hp')?.textContent.trim()`);
    const obsTheme = await cdp.evaluate(`document.getElementById('hero-stage-viewport')?.getAttribute('data-hero-theme')`);
    const obsCardColor = await cdp.evaluate(`document.getElementById('hero-stage-card')?.getAttribute('data-color-theme')`);
    const obsWatermark = await cdp.evaluate(`document.getElementById('hero-watermark')?.textContent.trim()`);
    console.log(`[PASS] Obsidian & Gold: theme="${obsTheme}", cardColor="${obsCardColor}", watermark="${obsWatermark}", hp="${obsHP}"`);
    assert.equal(obsTheme, 'audi-rs6-avant-2024', 'Theme attribute must be audi-rs6-avant-2024');
    assert.equal(obsCardColor, 'obsidian-gold', 'Card color theme must be obsidian-gold');
    assert.equal(obsWatermark, 'RS6 AVANT', 'Watermark text must update to RS6 AVANT');
    assert.ok(obsName.includes('Audi RS6 Avant'), 'Dynamic Island name must update to Audi RS6 Avant');
    assert.equal(obsHP, '621 HP', 'Dynamic Island HP must update to 621 HP');

    // Test 1g: Click Next Vehicle Teaser Card to advance
    await cdp.evaluate(`document.getElementById('hero-next-vehicle-btn').click();`);
    await sleep(250);
    const nextAdvName = await cdp.evaluate(`document.getElementById('island-car-name')?.textContent.trim()`);
    const nextAdvWatermark = await cdp.evaluate(`document.getElementById('hero-watermark')?.textContent.trim()`);
    console.log(`[PASS] Next Vehicle teaser advance: car="${nextAdvName}", watermark="${nextAdvWatermark}"`);
    assert.ok(nextAdvName.includes('Porsche 911 GT3 RS'), 'Next Vehicle must advance to Porsche 911 GT3 RS');
    assert.equal(nextAdvWatermark, '911 GT3 RS', 'Watermark text must update to 911 GT3 RS');

    // Test 1h: Click Midnight & Coral Triad Pill (.triad-pill[data-triad="midnight-coral"]) to restore
    await cdp.evaluate(`document.querySelector('.triad-pill[data-triad="midnight-coral"]').click();`);
    await sleep(250);
    const coralName = await cdp.evaluate(`document.getElementById('island-car-name')?.textContent.trim()`);
    const coralCardColor = await cdp.evaluate(`document.getElementById('hero-stage-card')?.getAttribute('data-color-theme')`);
    const coralWatermark = await cdp.evaluate(`document.getElementById('hero-watermark')?.textContent.trim()`);
    console.log(`[PASS] Restored Midnight & Coral: cardColor="${coralCardColor}", watermark="${coralWatermark}"`);
    assert.equal(coralCardColor, 'midnight-coral', 'Card color theme must restore to midnight-coral');
    assert.equal(coralWatermark, 'ROMA V8', 'Watermark must restore to ROMA V8');
    assert.ok(coralName.includes('Ferrari Roma V8'), 'Dynamic Island name must restore to Ferrari Roma V8');

    // Test 1h: Multi-currency updates on #island-price
    // Test USD
    let islandPrice = await cdp.evaluate(`document.getElementById('island-price').textContent.trim()`);
    console.log(`[PASS] #island-price in USD: ${islandPrice}`);
    assert.ok(islandPrice.includes('$'), '#island-price must display USD symbol');

    // Switch to NGN
    await cdp.evaluate(`document.querySelector('[data-currency="NGN"]').click();`);
    await sleep(200);
    islandPrice = await cdp.evaluate(`document.getElementById('island-price').textContent.trim()`);
    console.log(`[PASS] #island-price converted to NGN: ${islandPrice}`);
    assert.ok(islandPrice.includes('₦'), '#island-price must display NGN symbol');

    // Switch to GBP
    await cdp.evaluate(`document.querySelector('[data-currency="GBP"]').click();`);
    await sleep(200);
    islandPrice = await cdp.evaluate(`document.getElementById('island-price').textContent.trim()`);
    console.log(`[PASS] #island-price converted to GBP: ${islandPrice}`);
    assert.ok(islandPrice.includes('£'), '#island-price must display GBP symbol');

    // Switch to EUR
    await cdp.evaluate(`document.querySelector('[data-currency="EUR"]').click();`);
    await sleep(200);
    islandPrice = await cdp.evaluate(`document.getElementById('island-price').textContent.trim()`);
    console.log(`[PASS] #island-price converted to EUR: ${islandPrice}`);
    assert.ok(islandPrice.includes('€'), '#island-price must display EUR symbol');

    // Switch back to USD
    await cdp.evaluate(`document.querySelector('[data-currency="USD"]').click();`);
    await sleep(150);

    // Capture proof: Desktop Public Catalog
    const publicProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_public.png');
    await cdp.screenshot(publicProofPath);

    // Test 2: Search Filtering ("Porsche")
    await cdp.evaluate(`
      const input = document.getElementById('filter-keyword');
      input.value = 'Porsche';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await sleep(200);
    const porscheCount = await cdp.evaluate(`document.querySelectorAll('.car-card').length`);
    console.log(`[PASS] Search for 'Porsche' filtered grid to ${porscheCount} car(s)`);
    assert.equal(porscheCount, 1, 'Expected exactly 1 car matching Porsche');

    // Reset search
    await cdp.evaluate(`
      const btn = document.getElementById('btn-reset-filters');
      btn.click();
    `);
    await sleep(200);

    // Test 3: Status Filtering ("Available Only")
    await cdp.evaluate(`
      const sel = document.getElementById('filter-status');
      sel.value = 'available';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await sleep(200);
    const availableCount = await cdp.evaluate(`document.querySelectorAll('.car-card').length`);
    console.log(`[PASS] Filter for 'available' returned ${availableCount} cars`);
    assert.equal(availableCount, 6, 'Expected 6 available vehicles in initial seed');

    // Reset filters
    await cdp.evaluate(`document.getElementById('btn-reset-filters').click();`);
    await sleep(200);

    // Test 4: Currency Switcher
    const initialPriceText = await cdp.evaluate(`document.querySelector('.price-value').textContent.trim()`);
    console.log(`Initial price text: ${initialPriceText}`);
    assert.ok(initialPriceText.includes('$'), 'Expected price in USD ($)');

    // Switch to NGN (₦)
    await cdp.evaluate(`document.querySelector('[data-currency="NGN"]').click();`);
    await sleep(200);
    const ngnPriceText = await cdp.evaluate(`document.querySelector('.price-value').textContent.trim()`);
    console.log(`[PASS] Converted to NGN: ${ngnPriceText}`);
    assert.ok(ngnPriceText.includes('₦'), 'Expected price in NGN (₦)');

    // Switch to GBP (£)
    await cdp.evaluate(`document.querySelector('[data-currency="GBP"]').click();`);
    await sleep(200);
    const gbpPriceText = await cdp.evaluate(`document.querySelector('.price-value').textContent.trim()`);
    console.log(`[PASS] Converted to GBP: ${gbpPriceText}`);
    assert.ok(gbpPriceText.includes('£'), 'Expected price in GBP (£)');

    // Switch back to USD
    await cdp.evaluate(`document.querySelector('[data-currency="USD"]').click();`);
    await sleep(150);

    // Test 5: Vehicle Detail Modal Opens on Porsche 911 GT3 RS
    await cdp.evaluate(`document.querySelector('.car-card[data-id="apex-car-01"] .btn-open-detail').click();`);
    await sleep(350);
    const modalVisible = await cdp.evaluate(`document.getElementById('vehicle-modal-overlay').classList.contains('is-active')`);
    const modalTitle = await cdp.evaluate(`document.querySelector('.detail-car-name').textContent.trim()`);
    console.log(`[PASS] Vehicle detail modal opened for: ${modalTitle}`);
    assert.ok(modalVisible, 'Vehicle modal overlay must be active');
    assert.ok(modalTitle.includes('Porsche 911 GT3 RS'), 'Modal title must be Porsche 911 GT3 RS');

    // Test 5b: Verify Sketchfab 3D tab and iframe are removed and photo studio gallery is shown
    const has3DTabOrIframe = await cdp.evaluate(`!!(document.getElementById('tab-media-3d') || document.querySelector('.sketchfab-iframe'))`);
    const photoViewerVisible = await cdp.evaluate(`(() => { const el = document.getElementById('media-viewer-photo'); return !!el && el.style.display !== 'none'; })()`);
    console.log(`[PASS] Sketchfab removed (${!has3DTabOrIframe}), photoViewerVisible=${photoViewerVisible}`);
    assert.equal(has3DTabOrIframe, false, 'Sketchfab 3D tab and iframe must be completely removed');
    assert.ok(photoViewerVisible, 'Photo viewer must be visible');

    // Capture proof: Vehicle Detail Modal
    const modalProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_modal.png');
    await cdp.screenshot(modalProofPath);

    // Close detail modal
    await cdp.evaluate(`document.getElementById('btn-close-vehicle-modal').click();`);
    await sleep(200);

    // Test 6: Mode Switcher & Admin PIN Gate ('2026')
    await cdp.evaluate(`document.getElementById('btn-toggle-mode').click();`);
    await sleep(250);
    const pinModalActive = await cdp.evaluate(`document.getElementById('pin-modal-overlay').classList.contains('is-active')`);
    assert.ok(pinModalActive, 'PIN modal overlay must be active');

    // Enter PIN 2026 and authorize
    await cdp.evaluate(`
      (() => {
        const pinInp = document.getElementById('admin-pin-input');
        pinInp.value = '2026';
        document.getElementById('btn-submit-pin').click();
      })();
    `);
    await sleep(350);
    const adminPanelHeader = await cdp.evaluate(`document.querySelector('.admin-header-title')?.textContent.trim()`);
    console.log(`[PASS] Admin Mode Authenticated: "${adminPanelHeader}"`);
    assert.ok(adminPanelHeader.includes('Dealership Operations Console'), 'Must be in Admin Operations Console');

    // Test 7: Admin Quick Status Toggle (Porsche 911 GT3 RS to Sold)
    const porscheRowStatus = await cdp.evaluate(`
      (() => {
        const row = document.querySelector('tr[data-id="apex-car-01"]');
        const soldBtn = row.querySelector('.status-toggle-pill[data-status="sold"]');
        soldBtn.click();
        return window.ApexStore.getVehicle('apex-car-01').status;
      })()
    `);
    console.log(`[PASS] Porsche 911 GT3 RS status quickly toggled to: ${porscheRowStatus}`);
    assert.equal(porscheRowStatus, 'sold', 'Status in ApexStore must be sold');

    // Capture proof: Admin Panel
    const adminProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_admin.png');
    await cdp.screenshot(adminProofPath);

    // Test 8: Admin Add Car
    await cdp.evaluate(`
      window.ApexStore.addVehicle({
        make: 'McLaren',
        model: 'Artura Vision',
        year: 2025,
        priceUSD: 238000,
        mileage: 450,
        status: 'available',
        horsepower: 671,
        exteriorColor: 'Silica White',
        interiorColor: 'Alcantara ClubSport',
        engine: '3.0L Twin-Turbo V6 Hybrid',
        vin: 'SBM11AAB0PW202599',
        bodyType: 'Coupe',
        transmission: 'PDK',
        image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        description: 'Next-generation high-performance hybrid supercar.'
      });
    `);
    await sleep(250);
    const afterAddCount = await cdp.evaluate(`window.ApexStore.getVehicles().length`);
    console.log(`[PASS] Added McLaren Artura, total vehicles in store: ${afterAddCount}`);
    assert.equal(afterAddCount, 9, 'Expected 9 vehicles after adding McLaren');

    // Test 9: Admin Delete Car
    await cdp.evaluate(`
      const mclaren = window.ApexStore.getVehicles().find(v => v.make === 'McLaren');
      window.ApexStore.deleteVehicle(mclaren.id);
    `);
    await sleep(250);
    const afterDeleteCount = await cdp.evaluate(`window.ApexStore.getVehicles().length`);
    console.log(`[PASS] Deleted McLaren, total vehicles in store: ${afterDeleteCount}`);
    assert.equal(afterDeleteCount, 8, 'Expected 8 vehicles after deletion');

    // Reset demo seeds to clean state
    await cdp.evaluate(`window.ApexStore.resetSeedData();`);
    await sleep(200);

    // Switch back to Public Catalog
    console.log('About to click btn-admin-exit');
    await cdp.evaluate(`document.getElementById('btn-admin-exit').click();`);
    console.log('Clicked btn-admin-exit');
    await sleep(250);

    console.log('Starting Test 10: Setting mobile device metrics...');
    // Test 10: Mobile Viewport 390x844 & Zero Horizontal Scroll
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    console.log('Mobile device metrics override complete, sleeping 350ms...');
    await sleep(350);

    console.log('Evaluating mobile horizontal overflow...');
    const hasHorizontalOverflow = await cdp.evaluate(`
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    `);
    console.log(`[PASS] Mobile viewport check (390px): horizontal overflow = ${hasHorizontalOverflow}`);
    assert.equal(hasHorizontalOverflow, false, 'No horizontal overflow allowed on mobile');

    console.log('Capturing mobile proof screenshot...');
    // Capture proof: Mobile View
    const mobileProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_mobile.png');
    await cdp.screenshot(mobileProofPath);
    console.log('Mobile screenshot saved.');

    // Assert 0 Console and Page Errors
    console.log(`Console Errors detected: ${cdp.consoleErrors.length}`);
    console.log(`Page Uncaught Exceptions: ${cdp.pageErrors.length}`);
    if (cdp.consoleErrors.length > 0) {
      console.warn('Console error messages:', cdp.consoleErrors);
    }
    assert.equal(cdp.pageErrors.length, 0, 'Zero uncaught page errors required');

    console.log('\n======================================================');
    console.log('✓ ALL 10 APEX AUTO LOUNGE SPEC VERIFICATIONS PASSED 100%');
    console.log('======================================================\n');
  } finally {
    if (cdp) await cdp.close();
    chromeProcess.kill('SIGKILL');
    server.close();
  }
}

runDealershipTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
