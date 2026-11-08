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
    this.id = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    this.pageErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params?.type === 'error') {
          this.consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.pageErrors.push(msg.params?.exceptionDetails?.text || 'Uncaught exception');
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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
      throw new Error(`Evaluation error: ${res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }

  async screenshot(outPath) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runSuite() {
  const { server, port } = await startStaticServer();
  const debugPort = 9333;
  const userDataDir = `/tmp/chromium-rhm-${Date.now()}`;

  const chromeProc = spawn('/usr/bin/chromium', [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=1440,900',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    `http://127.0.0.1:${port}/index.html`
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const wsUrl = await waitForDebuggerUrl(debugPort);
    cdp = new CDPSession(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait for page readyState === 'complete' and all images loaded
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.evaluate(`document.readyState === 'complete'`);
      if (ready) break;
      await sleep(150);
    }
    await sleep(400);

    // 1. Verify title & all images loaded with naturalWidth > 0
    const pageDiagnostics = await cdp.evaluate(`(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return {
        title: document.title,
        totalImages: imgs.length,
        loadedImages: imgs.filter(img => img.complete && img.naturalWidth > 0).length,
        sources: imgs.map(img => ({ src: img.getAttribute('src'), width: img.naturalWidth }))
      };
    })()`);

    assert.equal(pageDiagnostics.title, 'Royal Headmistress — Premium Wigs • Luxury Hair');
    assert.equal(pageDiagnostics.loadedImages, pageDiagnostics.totalImages, 'All couture images and official logo must load cleanly');

    // Screenshot 1: Hero & Scroll-Wipe Cinema
    const shotHero = path.join(ARTIFACT_DIR, 'proof_hero_cinema.png');
    await cdp.screenshot(shotHero);

    // 2. Test Scroll-Wipe Cinema chapter scrubbing across all 5 chapters
    for (let ch = 0; ch < 5; ch++) {
      await cdp.evaluate(`document.getElementById('scrub-ch-${ch}').click()`);
      await sleep(350);
    }
    const chapterCounter = await cdp.evaluate(`document.getElementById('chapter-step-counter').textContent.trim()`);
    assert.equal(chapterCounter, 'CHAPTER 05 / 05', 'Scrubbing to chapter 5 must activate CHAPTER 05 / 05');

    // 3. Test Custom Crown Configurator & capture screenshot 2
    await cdp.evaluate(`(() => {
      document.getElementById('live-sandbox-section').scrollIntoView({ behavior: 'instant' });
      document.getElementById('tab-scenario-migration').click();
      document.getElementById('sandbox-run-btn').click();
    })()`);
    await sleep(300);

    const sandboxTitle = await cdp.evaluate(`document.getElementById('sandbox-scenario-title').textContent.trim()`);
    assert.ok(sandboxTitle.includes('Empress 5×5 Glueless'), 'Configurator tab switch must update scenario title');

    const shotBuilder = path.join(ARTIFACT_DIR, 'proof_custom_builder.png');
    await cdp.screenshot(shotBuilder);

    // 4. Test Bundle Length Calculator & Royal Shopping Bag Drawer + capture screenshot 3
    await cdp.evaluate(`(() => {
      const slider = document.getElementById('roi-team-slider');
      slider.value = '32';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('architecture-section').scrollIntoView({ behavior: 'instant' });
      const addBtn = document.querySelector('[data-add-to-bag="0.10mm Swiss HD Lace Frontal"]');
      addBtn.click();
    })()`);
    await sleep(300);

    const bagState = await cdp.evaluate(`(() => ({
      isOpen: document.getElementById('royal-cart-drawer').classList.contains('is-open'),
      badge: document.getElementById('cart-count-badge').textContent.trim(),
      subtotal: document.getElementById('cart-subtotal-amount').textContent.trim(),
      roiWeight: document.getElementById('roi-hours-saved').textContent.trim(),
      roiDensity: document.getElementById('roi-dollar-saved').textContent.trim()
    }))()`);

    assert.equal(bagState.isOpen, true, 'Clicking Add to Royal Bag must open #royal-cart-drawer');
    assert.equal(bagState.badge, '2', 'Cart badge must increment from 1 to 2');
    assert.equal(bagState.subtotal, '$920', 'Cart subtotal must update from $680 to $920');
    assert.equal(bagState.roiWeight, '5 Bundles (500g)');
    assert.equal(bagState.roiDensity, '250% Red Carpet');

    const shotBag = path.join(ARTIFACT_DIR, 'proof_collection_bag.png');
    await cdp.screenshot(shotBag);

    // 5. Test Checkout -> Concierge Modal Submission
    const modalResult = await cdp.evaluate(`(() => {
      document.getElementById('cart-checkout-btn').click();
      document.getElementById('demo-company-name').value = 'Queen Amina';
      document.getElementById('demo-work-email').value = 'amina@royalheadmistress.com';
      document.getElementById('demo-booking-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return {
        modalOpen: document.getElementById('demo-booking-modal').classList.contains('is-open'),
        feedback: document.getElementById('demo-form-feedback').textContent.trim()
      };
    })()`);

    assert.equal(modalResult.modalOpen, true);
    assert.ok(modalResult.feedback.includes('Thank you, Queen Amina!'));

    // 6. Assert zero console errors and zero uncaught page errors
    assert.equal(cdp.consoleErrors.length, 0, `Expected 0 console errors, got: ${cdp.consoleErrors.join('; ')}`);
    assert.equal(cdp.pageErrors.length, 0, `Expected 0 page errors, got: ${cdp.pageErrors.join('; ')}`);

    console.log(JSON.stringify({
      status: 'PASSED',
      consoleErrors: cdp.consoleErrors.length,
      pageErrors: cdp.pageErrors.length,
      imagesVerified: pageDiagnostics.loadedImages,
      bagState,
      screenshots: [shotHero, shotBuilder, shotBag]
    }, null, 2));
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill('SIGKILL');
    server.close();
  }
}

runSuite().catch((err) => {
  console.error('E2E_SUITE_FAILED:', err);
  process.exit(1);
});
