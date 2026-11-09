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

    for (let i = 0; i < 40; i++) {
      const ready = await cdp.evaluate(`(() => {
        if (document.readyState !== 'complete') return false;
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0);
      })()`);
      if (ready) break;
      await sleep(150);
    }
    await sleep(250);

    // 1. Verify title, zero horizontal overflow, & all 11+ images loaded with naturalWidth > 0
    const pageDiagnostics = await cdp.evaluate(`(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const navInner = document.querySelector('.nav-inner');
      return {
        title: document.title,
        totalImages: imgs.length,
        loadedImages: imgs.filter(img => img.complete && img.naturalWidth > 0).length,
        docScrollWidth: document.documentElement.scrollWidth,
        winInnerWidth: window.innerWidth,
        navOverflow: navInner ? (navInner.scrollWidth > navInner.clientWidth) : false
      };
    })()`);

    assert.equal(pageDiagnostics.title, 'Royal Headmistress — Premium Wigs • Luxury Hair');
    assert.ok(pageDiagnostics.totalImages >= 11, `Expected at least 11 images, found ${pageDiagnostics.totalImages}`);
    assert.equal(pageDiagnostics.loadedImages, pageDiagnostics.totalImages, 'All couture images and official logo must load cleanly');
    assert.ok(pageDiagnostics.docScrollWidth <= pageDiagnostics.winInnerWidth, `Expected zero horizontal overflow (${pageDiagnostics.docScrollWidth} <= ${pageDiagnostics.winInnerWidth})`);
    assert.equal(pageDiagnostics.navOverflow, false, 'Top navigation bar must fit on a single horizontal line without overflow');

    // 2. Verify #scroll-cinema is removed and #apple-showcase is visible
    const showcasePresence = await cdp.evaluate(`(() => {
      const oldScrollCinema = document.getElementById('scroll-cinema');
      const appleShowcase = document.getElementById('apple-showcase');
      const rect = appleShowcase ? appleShowcase.getBoundingClientRect() : null;
      return {
        hasScrollCinema: Boolean(oldScrollCinema),
        hasAppleShowcase: Boolean(appleShowcase),
        showcaseVisible: Boolean(rect && rect.width > 600 && rect.height > 300)
      };
    })()`);

    assert.equal(showcasePresence.hasScrollCinema, false, '#scroll-cinema must not exist in DOM');
    assert.equal(showcasePresence.hasAppleShowcase, true, '#apple-showcase must exist in DOM');
    assert.equal(showcasePresence.showcaseVisible, true, '#apple-showcase must be visibly rendered');

    // Screenshot 1: Hero & Apple Pro Bento Showcase
    const shotHero = path.join(ARTIFACT_DIR, 'proof_hero_cinema.png');
    await cdp.screenshot(shotHero);

    // 3. Test Apple Segmented Pill Finish Tabs (#tab-finish-hd-lace, #tab-finish-cambodian, #tab-finish-blonde, #tab-finish-obsidian)
    const studioTabsCheck = await cdp.evaluate(`(() => {
      const getStageState = () => ({
        title: document.getElementById('apple-stage-title').textContent.trim(),
        spec: document.getElementById('apple-island-spec').textContent.trim(),
        price: document.getElementById('apple-stage-price').textContent.trim()
      });

      document.getElementById('tab-finish-hd-lace').click();
      const hdLace = getStageState();

      document.getElementById('tab-finish-cambodian').click();
      const cambodian = getStageState();

      document.getElementById('tab-finish-blonde').click();
      const blonde = getStageState();

      document.getElementById('tab-finish-obsidian').click();
      const obsidian = getStageState();

      return { hdLace, cambodian, blonde, obsidian };
    })()`);

    assert.ok(studioTabsCheck.hdLace.title.includes('0.10mm Swiss HD Melt'), 'HD Lace tab must update stage title');
    assert.ok(studioTabsCheck.hdLace.spec.includes('0.10MM SWISS HD LACE'), 'HD Lace tab must update Dynamic Island spec');
    assert.equal(studioTabsCheck.hdLace.price, '$320', 'HD Lace tab must update stage price to $320');

    assert.ok(studioTabsCheck.cambodian.title.includes('Raw Cambodian Bundles'), 'Cambodian tab must update stage title');
    assert.ok(studioTabsCheck.cambodian.spec.includes('100% UNIDIRECTIONAL CUTICLE'), 'Cambodian tab must update Dynamic Island spec');
    assert.equal(studioTabsCheck.cambodian.price, '$420', 'Cambodian tab must update stage price to $420');

    assert.ok(studioTabsCheck.blonde.title.includes('613 Champagne Blonde'), 'Blonde tab must update stage title');
    assert.ok(studioTabsCheck.blonde.spec.includes('#613 CHAMPAGNE LIFT'), 'Blonde tab must update Dynamic Island spec');
    assert.equal(studioTabsCheck.blonde.price, '$1,380', 'Blonde tab must update stage price to $1,380');

    assert.ok(studioTabsCheck.obsidian.title.includes('Noir Hollywood Wave'), 'Obsidian tab must restore stage title');
    assert.ok(studioTabsCheck.obsidian.spec.includes('13×6 SWISS HD FRONTAL'), 'Obsidian tab must restore Dynamic Island spec');
    assert.equal(studioTabsCheck.obsidian.price, '$1,250', 'Obsidian tab must restore stage price to $1,250');

    // 4. Test Interactive Before/After HD Lace X-Ray Slider (#lace-xray-range -> 82%)
    const xraySliderCheck = await cdp.evaluate(`(() => {
      const range = document.getElementById('lace-xray-range');
      const container = document.getElementById('lace-xray-slider-container');
      const readout = document.getElementById('xray-melt-readout');
      range.value = '82';
      range.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        xrayPos: container.style.getPropertyValue('--xray-pos').trim(),
        readoutText: readout.textContent.trim()
      };
    })()`);

    assert.equal(xraySliderCheck.xrayPos, '82%', 'Setting #lace-xray-range to 82 must update --xray-pos to 82%');
    assert.equal(xraySliderCheck.readoutText, '82% HD Melt Reveal', 'Setting #lace-xray-range to 82 must update #xray-melt-readout');

    // 5. Test #apple-stage-add-btn creates a .royal-toast inside #royal-toast-container with .visible, and action button opens #royal-cart-drawer
    await cdp.evaluate(`(() => {
      document.getElementById('apple-stage-add-btn').click();
    })()`);
    await sleep(60);

    const toastCheck = await cdp.evaluate(`(() => {
      const container = document.getElementById('royal-toast-container');
      const toast = container ? container.querySelector('.royal-toast') : null;
      const isVisible = toast ? toast.classList.contains('visible') : false;
      const title = toast ? toast.querySelector('.royal-toast-title')?.textContent.trim() : '';
      const actionBtn = toast ? toast.querySelector('.royal-toast-action') : null;
      const initialDrawerOpen = document.getElementById('royal-cart-drawer').classList.contains('is-open');

      if (actionBtn) {
        actionBtn.click();
      }

      const postActionDrawerOpen = document.getElementById('royal-cart-drawer').classList.contains('is-open');
      const badge = document.getElementById('cart-count-badge').textContent.trim();
      const subtotal = document.getElementById('cart-subtotal-amount').textContent.trim();
      const itemsText = document.getElementById('cart-items-list').textContent;
      document.getElementById('cart-close-btn').click();

      return {
        hasContainer: Boolean(container),
        hasToast: Boolean(toast),
        isVisible,
        title,
        hasActionBtn: Boolean(actionBtn),
        initialDrawerOpen,
        postActionDrawerOpen,
        badge,
        subtotal,
        itemsText
      };
    })()`);

    assert.equal(toastCheck.hasContainer, true, '#royal-toast-container must exist in DOM');
    assert.equal(toastCheck.hasToast, true, 'Clicking #apple-stage-add-btn must create .royal-toast');
    assert.equal(toastCheck.isVisible, true, '.royal-toast must have class .visible');
    assert.ok(toastCheck.title.includes('Crown Added to Royal Bag'), 'Toast title must indicate Crown Added to Royal Bag');
    assert.equal(toastCheck.hasActionBtn, true, '.royal-toast must include action button');
    assert.equal(toastCheck.postActionDrawerOpen, true, 'Clicking toast action button must open #royal-cart-drawer');
    assert.equal(toastCheck.badge, '2', 'Clicking #apple-stage-add-btn must increment cart badge to 2');
    assert.equal(toastCheck.subtotal, '$1,930', 'Cart subtotal must equal $680 + $1,250 = $1,930');
    assert.ok(toastCheck.itemsText.includes('Noir Hollywood Wave'), 'Cart items must include Noir Hollywood Wave studio crown');

    // 6. Test Custom Crown Configurator & capture screenshot 2
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

    // 7. Test Multi-Currency Switcher (USD -> NGN -> GBP -> USD) including #apple-stage-price
    const currencyCheck = await cdp.evaluate(`(() => {
      const stagePriceEl = document.getElementById('apple-stage-price');
      const cardPriceEl = document.getElementById('card-price-hd-lace');
      const growthEl = document.getElementById('price-tier-growth');
      const bagSubEl = document.getElementById('cart-subtotal-amount');

      const usdInitial = cardPriceEl.textContent.trim();
      const usdStageInitial = stagePriceEl.textContent.trim();

      document.getElementById('curr-ngn').click();
      const ngnStage = stagePriceEl.textContent.trim();
      const ngnCard = cardPriceEl.textContent.trim();
      const ngnGrowth = growthEl.textContent.trim();
      const ngnBag = bagSubEl.textContent.trim();

      document.getElementById('curr-gbp').click();
      const gbpStage = stagePriceEl.textContent.trim();
      const gbpCard = cardPriceEl.textContent.trim();
      const gbpGrowth = growthEl.textContent.trim();

      document.getElementById('curr-usd').click();
      const usdRestored = cardPriceEl.textContent.trim();
      const usdStageRestored = stagePriceEl.textContent.trim();

      return { usdInitial, usdStageInitial, ngnStage, ngnCard, ngnGrowth, ngnBag, gbpStage, gbpCard, gbpGrowth, usdRestored, usdStageRestored };
    })()`);

    assert.equal(currencyCheck.usdInitial, '$1,250');
    assert.equal(currencyCheck.usdStageInitial, '$1,250');
    assert.equal(currencyCheck.ngnStage, '₦2,000,000', '#curr-ngn must convert #apple-stage-price $1,250 to ₦2,000,000');
    assert.equal(currencyCheck.ngnCard, '₦2,000,000', '#curr-ngn must convert $1,250 to ₦2,000,000');
    assert.ok(currencyCheck.ngnGrowth.startsWith('₦'), 'Calculator price must convert to ₦');
    assert.ok(currencyCheck.ngnBag.startsWith('₦'), 'Shopping Bag subtotal must convert to ₦');
    assert.equal(currencyCheck.gbpStage, '£988', '#curr-gbp must convert #apple-stage-price $1,250 to £988');
    assert.equal(currencyCheck.gbpCard, '£988', '#curr-gbp must convert $1,250 to £988');
    assert.ok(currencyCheck.gbpGrowth.startsWith('£'), 'Calculator price must convert to £');
    assert.equal(currencyCheck.usdRestored, '$1,250', '#curr-usd must restore $1,250');
    assert.equal(currencyCheck.usdStageRestored, '$1,250', '#curr-usd must restore #apple-stage-price to $1,250');

    // 8. Test 3D Tilt Spotlight Cards ([data-tilt-card] & .tilt-spotlight-glare)
    const tiltCheck = await cdp.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('#collection [data-tilt-card]'));
      const first = cards[0];
      const rect = first.getBoundingClientRect();
      first.dispatchEvent(new PointerEvent('pointermove', {
        clientX: rect.left + rect.width * 0.75,
        clientY: rect.top + rect.height * 0.25,
        bubbles: true
      }));
      const activeTransform = first.style.transform;
      const spotX = first.style.getPropertyValue('--spot-x');
      first.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      return {
        cardCount: cards.length,
        glareCount: cards.filter(c => c.querySelector('.tilt-spotlight-glare')).length,
        activeTransform,
        spotX
      };
    })()`);

    assert.equal(tiltCheck.cardCount, 3, 'All 3 collection cards must have [data-tilt-card]');
    assert.equal(tiltCheck.glareCount, 3, 'All 3 collection cards must contain .tilt-spotlight-glare');
    assert.ok(tiltCheck.activeTransform.includes('perspective(900px)'), 'Pointermove must apply 3D perspective transform');
    assert.ok(tiltCheck.spotX.endsWith('px'), 'Pointermove must set --spot-x CSS custom property');

    // 9. Verify #royal-quickview-modal card has scale(0.95) natural entrance base transform, then test Interactive Wig Quick-View & Shade Matcher Studio + capture proof_quickview_studio.png
    const qvBaseTransform = await cdp.evaluate(`(() => {
      const qvCard = document.querySelector('#royal-quickview-modal .quickview-card') || document.querySelector('#royal-quickview-modal .quickview-studio-dialog');
      return window.getComputedStyle(qvCard).transform;
    })()`);
    assert.ok(qvBaseTransform.includes('0.95'), `#royal-quickview-modal card must have scale(0.95) entrance base transform, got: ${qvBaseTransform}`);

    await cdp.evaluate(`(() => {
      document.getElementById('architecture-section').scrollIntoView({ behavior: 'instant' });
      document.getElementById('quick-view-hd-lace').click();
      document.getElementById('shade-caramel').click();
      const len30Btn = Array.from(document.querySelectorAll('#qv-length-selector [data-length]')).find(
        (b) => b.getAttribute('data-length') === '30"'
      );
      if (len30Btn) len30Btn.click();
      const den250Btn = document.querySelector('#qv-density-selector [data-density="250% Red Carpet"]');
      if (den250Btn) den250Btn.click();
    })()`);
    await sleep(300);

    const quickViewState = await cdp.evaluate(`(() => ({
      isOpen: document.getElementById('royal-quickview-modal').classList.contains('is-open'),
      cardTransform: window.getComputedStyle(document.querySelector('#royal-quickview-modal .quickview-card') || document.querySelector('#royal-quickview-modal .quickview-studio-dialog')).transform,
      shadeBadge: document.getElementById('qv-shade-badge').textContent.trim(),
      livePrice: document.getElementById('qv-live-price').textContent.trim()
    }))()`);

    assert.equal(quickViewState.isOpen, true, 'Clicking #quick-view-hd-lace must open #royal-quickview-modal');
    assert.ok(quickViewState.cardTransform === 'matrix(1, 0, 0, 1, 0, 0)' || quickViewState.cardTransform === 'none', `Active modal card must scale to 1, got: ${quickViewState.cardTransform}`);
    assert.ok(quickViewState.shadeBadge.includes('Rich Caramel'), 'Shade badge must reflect Rich Caramel');
    assert.ok(quickViewState.shadeBadge.includes('30"'), 'Shade badge must reflect 30" length');
    assert.ok(quickViewState.shadeBadge.includes('250% Red Carpet'), 'Shade badge must reflect 250% Red Carpet');
    assert.equal(quickViewState.livePrice, '$1,530', 'Quick-View live price must equal $1,250 + $180 + $100 = $1,530');

    const shotQuickView = path.join(ARTIFACT_DIR, 'proof_quickview_studio.png');
    await cdp.screenshot(shotQuickView);

    // 10. Click #qv-add-to-bag-btn & test Bundle Length Calculator + Royal Shopping Bag Drawer + capture proof_collection_bag.png
    await cdp.evaluate(`(() => {
      const slider = document.getElementById('roi-team-slider');
      slider.value = '32';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('qv-add-to-bag-btn').click();
    })()`);
    await sleep(300);

    const bagState = await cdp.evaluate(`(() => ({
      quickViewClosed: !document.getElementById('royal-quickview-modal').classList.contains('is-open'),
      isOpen: document.getElementById('royal-cart-drawer').classList.contains('is-open'),
      badge: document.getElementById('cart-count-badge').textContent.trim(),
      subtotal: document.getElementById('cart-subtotal-amount').textContent.trim(),
      itemsText: document.getElementById('cart-items-list').textContent,
      roiWeight: document.getElementById('roi-hours-saved').textContent.trim(),
      roiDensity: document.getElementById('roi-dollar-saved').textContent.trim()
    }))()`);

    assert.equal(bagState.quickViewClosed, true, 'Clicking #qv-add-to-bag-btn must close #royal-quickview-modal');
    assert.equal(bagState.isOpen, true, 'Clicking #qv-add-to-bag-btn must open #royal-cart-drawer');
    assert.equal(bagState.badge, '3', 'Cart badge must increment to 3');
    assert.equal(bagState.subtotal, '$3,460', 'Cart subtotal must equal $680 + $1,250 + $1,530 = $3,460');
    assert.ok(bagState.itemsText.includes('Rich Caramel'), 'Cart items must include customized Rich Caramel crown');
    assert.equal(bagState.roiWeight, '5 Bundles (500g)');
    assert.equal(bagState.roiDensity, '250% Red Carpet');

    const shotBag = path.join(ARTIFACT_DIR, 'proof_collection_bag.png');
    await cdp.screenshot(shotBag);

    // 11. Test Checkout -> Concierge Modal Submission
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

    // 12. Assert zero console errors and zero uncaught page errors
    assert.equal(cdp.consoleErrors.length, 0, `Expected 0 console errors, got: ${cdp.consoleErrors.join('; ')}`);
    assert.equal(cdp.pageErrors.length, 0, `Expected 0 page errors, got: ${cdp.pageErrors.join('; ')}`);

    // 13. Verify node --check passes on all JS files
    const jsFiles = ['scripts/interactions.js', 'scripts/react-luxury-components.js', 'scripts/scroll-cinema.js'];
    for (const relJs of jsFiles) {
      const fullJs = path.join(ROOT_DIR, relJs);
      const syntaxResult = await new Promise((resolve) => {
        const proc = spawn(process.execPath, ['--check', fullJs]);
        proc.on('close', (code) => resolve(code));
      });
      assert.equal(syntaxResult, 0, `node --check must pass for ${relJs}`);
    }

    console.log(JSON.stringify({
      status: 'PASSED',
      consoleErrors: cdp.consoleErrors.length,
      pageErrors: cdp.pageErrors.length,
      imagesVerified: pageDiagnostics.loadedImages,
      showcasePresence,
      studioTabsCheck,
      xraySliderCheck,
      currencyCheck,
      tiltCheck,
      quickViewState,
      bagState: {
        isOpen: bagState.isOpen,
        badge: bagState.badge,
        subtotal: bagState.subtotal
      },
      screenshots: [shotHero, shotQuickView, shotBuilder, shotBag]
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
