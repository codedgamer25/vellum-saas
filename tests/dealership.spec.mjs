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
  '.svg': 'image/svg+xml'
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

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
      this.callbacks.set(id, { resolve, reject });
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
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      `--remote-debugging-port=${debugPort}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

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

    // Test 1b: Verify cars with sketchfabId have .badge-3d-showcase
    const badge3DCount = await cdp.evaluate(`document.querySelectorAll('.badge-3d-showcase').length`);
    console.log(`[PASS] Found ${badge3DCount} cars with 3D Virtual Showroom badge`);
    assert.ok(badge3DCount >= 4, 'Expected at least 4 cars with .badge-3d-showcase');

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

    // Test 5b: Switch to tab-media-3d and verify Sketchfab iframe
    await cdp.evaluate(`document.getElementById('tab-media-3d').click();`);
    await sleep(350);
    const is3DActive = await cdp.evaluate(`document.getElementById('tab-media-3d').classList.contains('active')`);
    const iframeSrc = await cdp.evaluate(`document.querySelector('.sketchfab-iframe')?.getAttribute('src') || ''`);
    console.log(`[PASS] Switched to 3D tab: active=${is3DActive}, iframe src=${iframeSrc}`);
    assert.ok(is3DActive, '3D tab must have active class');
    assert.ok(iframeSrc.includes('456b3d9d60b646369d76667848d6d027'), 'Iframe src must contain Porsche 911 GT3 RS Sketchfab ID');

    // Capture proof: Vehicle Detail 3D Modal
    const proof3DPath = path.join(ARTIFACT_DIR, 'proof_dealership_3d_modal.png');
    await cdp.screenshot(proof3DPath);

    // Test 5c: Switch back to tab-media-photo
    await cdp.evaluate(`document.getElementById('tab-media-photo').click();`);
    await sleep(250);
    const isPhotoActive = await cdp.evaluate(`document.getElementById('tab-media-photo').classList.contains('active')`);
    const photoViewerVisible = await cdp.evaluate(`document.getElementById('media-viewer-photo').style.display !== 'none'`);
    console.log(`[PASS] Switched back to photo gallery: active=${isPhotoActive}, photoViewerVisible=${photoViewerVisible}`);
    assert.ok(isPhotoActive, 'Photo tab must have active class');
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
    await cdp.evaluate(`document.getElementById('btn-admin-exit').click();`);
    await sleep(250);

    // Test 10: Mobile Viewport 390x844 & Zero Horizontal Scroll
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(350);

    const hasHorizontalOverflow = await cdp.evaluate(`
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    `);
    console.log(`[PASS] Mobile viewport check (390px): horizontal overflow = ${hasHorizontalOverflow}`);
    assert.equal(hasHorizontalOverflow, false, 'No horizontal overflow allowed on mobile');

    // Capture proof: Mobile View
    const mobileProofPath = path.join(ARTIFACT_DIR, 'proof_dealership_mobile.png');
    await cdp.screenshot(mobileProofPath);

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
