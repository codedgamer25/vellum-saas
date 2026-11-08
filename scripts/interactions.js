/**
 * Royal Headmistress — Custom Crown Configurator, Client Diaries,
 * Bundle & Length Calculator, FAQ Accordion, and Atelier Order Modal
 */

(function () {
  'use strict';

  const SANDBOX_SCENARIOS = {
    latency: {
      title: 'Sovereign 13×6 HD Frontal Crown — Hollywood Body Wave',
      slaTarget: '220% Royal Density',
      eventsPerSec: '100% Raw Cuticle',
      steps: [
        { code: '01', name: 'Select Single-Donor Raw Vietnamese Cuticle Bundles', status: 'GRADE 12A+ RAW', active: false },
        { code: '02', name: 'Hand-Ventilate 0.10mm Ultra-Thin Swiss HD Lace Frontal', status: 'SINGLE KNOTS', active: true },
        { code: '03', name: 'Micro-Bleach Knots & Sculpt Pre-Plucked Contoured Hairline', status: 'INVISIBLE MELT', active: true },
        { code: '04', name: 'Infuse Silk Amino Steam Wave & Seal Royal Crown Tag', status: 'READY TO SHIP', active: false }
      ],
      payload: `{
  "atelier_certificate": "RHM-CROWN-2026-8841",
  "collection": "Sovereign 13x6 HD Frontal Wig",
  "hair_origin": "100% Unprocessed Single-Donor Raw Hair",
  "lace_specification": {
    "material": "0.10mm Ultra-Thin Swiss HD Lace",
    "dimensions": "13 inch Ear-to-Ear x 6 inch Deep Parting",
    "knots": "Hand-Tied Single Strand (Pre-Bleached)"
  },
  "density": "220% Couture Fullness",
  "lifespan_guarantee": "5+ Years with Proper Silk Care"
}`
    },
    migration: {
      title: 'Empress 5×5 Glueless Silk-Melt Closure Unit — Bone Straight',
      slaTarget: '30-Sec Put-On',
      eventsPerSec: 'Zero Adhesive',
      steps: [
        { code: '01', name: 'Align Double-Drawn Bone-Straight Raw Strands (Full Ends)', status: 'DOUBLE DRAWN', active: false },
        { code: '02', name: 'Construct 3D Contoured Breathable Silk Dome Cap', status: 'CRANIAL FIT', active: true },
        { code: '03', name: 'Integrate Adjustable Piano-Key Elastic Band & Crown Combs', status: '100% GLUELESS', active: true },
        { code: '04', name: 'Flat-Iron Glass-Shine Finish & Pack in Satin Crown Pouch', status: 'INSPECTED', active: false }
      ],
      payload: `{
  "atelier_certificate": "RHM-EMPRESS-2026-4109",
  "collection": "Empress 5x5 Glueless Closure Wig",
  "install_method": "True Wear-and-Go (Zero Glue or Gel Required)",
  "cap_architecture": {
    "dome": "Breathable Stretch Antibacterial Mesh",
    "security": "Removable Piano-Key Elastic + 3 Sterling Combs",
    "ear_tabs": "Contoured Velvet C-Cut (Glasses Friendly)"
  },
  "shine_finish": "Mirror Glass-Silk Press"
}`
    },
    audit: {
      title: 'Royal Couture 4-Bundle + HD Frontal Set — Burmese Deep Wave',
      slaTarget: '400g Full Weight',
      eventsPerSec: 'Zero Shedding',
      steps: [
        { code: '01', name: 'Harvest Lush Raw Burmese Temple Curls (Unsteamed)', status: 'AUTHENTIC RAW', active: false },
        { code: '02', name: 'Triple-Stitch Reinforced Machine Wefts to Prevent Shedding', status: 'SEALED WEFT', active: true },
        { code: '03', name: 'Pair with Matching 13×6 Pre-Customized HD Lace Frontal', status: 'COLOR MATCHED', active: true },
        { code: '04', name: 'Include Crystal Crown Comb & Silk Maintenance Kit', status: 'GIFT BOXED', active: false }
      ],
      payload: `{
  "atelier_certificate": "RHM-BUNDLES-2026-9920",
  "collection": "Royal Burmese Deep Wave Bundle Deal",
  "bundle_weight_grams": 400,
  "weft_construction": "Micro-Thin Triple-Reinforced Flat Weft",
  "coloring_capability": "Lifts Cleanly to #613 Platinum Blonde",
  "included_accessories": [
    "Embroidered Royal Satin Storage Bag",
    "Jeweled Crown Detangling Comb"
  ]
}`
    }
  };

  const CASE_STUDIES = {
    kestrel: {
      company: 'Chidinma A. — Luxury Bridal & Red Carpet Stylist',
      sector: 'Lagos • London • Paris Bridal Couture',
      quote: '“Royal Headmistress HD lace disappears into every skin tone without heavy foundation or tint spray. My brides dance for 14 hours straight and the hairline looks like it is growing directly from their scalp.”',
      author: 'Chidinma Adeyemi — Lead Bridal Hair Architect',
      metrics: [
        { val: '0.10 mm', label: 'Ultra-Thin Undetectable Swiss Lace' },
        { val: '5+ Years', label: 'Verified Raw Hair Lifespan' },
        { val: '100%', label: 'Single-Donor Aligned Cuticles' }
      ]
    },
    helios: {
      company: 'Simone V. — Executive & Glueless Collector',
      sector: 'Atlanta • New York Private Client',
      quote: '“I own seven units from Royal Headmistress. The glueless piano-key cap fits so securely I wear my 28-inch Hollywood Body Wave to boardroom meetings and flights without a single drop of adhesive.”',
      author: 'Simone Vance — Managing Partner & VIP Collector',
      metrics: [
        { val: '30 sec', label: 'Effortless Glueless Application' },
        { val: '0.0%', label: 'Matting or Shedding After 18 Washes' },
        { val: '220%', label: 'True-to-Length Couture Density' }
      ]
    },
    vanguard: {
      company: 'Maison Noir Salon — Luxury Extension Partner',
      sector: 'Dubai • Beverly Hills Colorists',
      quote: '“Most ‘raw’ hair on the market fails the bleach test. Royal Headmistress bundles lift to #613 honey and platinum blonde in a single session while keeping their bounce, luster, and curl memory.”',
      author: 'Camille Laurent — Master Colorist, Maison Noir',
      metrics: [
        { val: '#613', label: 'Single-Session Blonde Lift Safe' },
        { val: '400 g', label: 'Full-Weight 4-Bundle Couture Sets' },
        { val: '48 hrs', label: 'DHL Express Worldwide Dispatch' }
      ]
    }
  };

  function initInteractions() {
    // 1. Custom Crown Configurator Switcher & Step Runner
    const scenarioBtns = Array.from(document.querySelectorAll('[data-scenario]'));
    const sandboxTitle = document.getElementById('sandbox-scenario-title');
    const sandboxSla = document.getElementById('sandbox-sla-readout');
    const sandboxRate = document.getElementById('sandbox-rate-readout');
    const stepsContainer = document.getElementById('sandbox-steps-list');
    const jsonBlock = document.getElementById('sandbox-json-inspector');
    const runSimulationBtn = document.getElementById('sandbox-run-btn');

    let currentScenarioKey = 'latency';
    let stepCursor = 1;

    function renderScenario(key) {
      const data = SANDBOX_SCENARIOS[key];
      if (!data) return;
      currentScenarioKey = key;

      if (sandboxTitle) sandboxTitle.textContent = data.title;
      if (sandboxSla) sandboxSla.textContent = data.slaTarget;
      if (sandboxRate) sandboxRate.textContent = data.eventsPerSec;
      if (jsonBlock) jsonBlock.textContent = data.payload;

      if (stepsContainer) {
        stepsContainer.innerHTML = data.steps.map((s, idx) => `
          <div class="pipeline-step-row ${idx === stepCursor ? 'is-running' : ''}" data-step-idx="${idx}">
            <div class="pipeline-step-left">
              <span class="step-index-box">${s.code}</span>
              <span style="font-weight: 600; font-size: 0.9rem;">${s.name}</span>
            </div>
            <span class="mono-tag" style="color: ${idx === stepCursor ? 'var(--accent-primary)' : 'var(--accent-emerald)'}; font-weight: 700;">
              ${idx === stepCursor ? '♛ ACTIVE STAGE' : s.status}
            </span>
          </div>
        `).join('');
      }
    }

    scenarioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-scenario');
        scenarioBtns.forEach(b => b.classList.toggle('active', b === btn));
        stepCursor = 1;
        renderScenario(key);
      });
    });

    if (runSimulationBtn) {
      runSimulationBtn.addEventListener('click', () => {
        const data = SANDBOX_SCENARIOS[currentScenarioKey];
        stepCursor = (stepCursor + 1) % data.steps.length;
        renderScenario(currentScenarioKey);
        runSimulationBtn.textContent = `♛ INSPECT STAGE 0${stepCursor + 1} — NEXT STEP`;
      });
    }

    // 2. Client Diaries Tabs
    const caseBtns = Array.from(document.querySelectorAll('[data-case]'));
    const caseSectorEl = document.getElementById('case-study-sector');
    const caseQuoteEl = document.getElementById('case-study-quote');
    const caseAuthorEl = document.getElementById('case-study-author');
    const caseMetricsEl = document.getElementById('case-study-metrics');

    caseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-case');
        const study = CASE_STUDIES[key];
        if (!study) return;

        caseBtns.forEach(b => b.classList.toggle('active', b === btn));
        if (caseSectorEl) caseSectorEl.textContent = `${study.company} — ${study.sector}`;
        if (caseQuoteEl) caseQuoteEl.textContent = study.quote;
        if (caseAuthorEl) caseAuthorEl.textContent = study.author;
        if (caseMetricsEl) {
          caseMetricsEl.innerHTML = study.metrics.map(m => `
            <div>
              <div class="case-metric-number">${m.val}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">${m.label}</div>
            </div>
          `).join('');
        }
      });
    });

    // 3. Interactive Length & Bundle Calculator
    const billingToggleBtn = document.getElementById('billing-cycle-toggle');
    const teamSlider = document.getElementById('roi-team-slider');
    const teamCountOut = document.getElementById('roi-team-count');
    const hoursSavedOut = document.getElementById('roi-hours-saved');
    const dollarSavedOut = document.getElementById('roi-dollar-saved');
    const priceGrowthEl = document.getElementById('price-tier-growth');
    const priceScaleEl = document.getElementById('price-tier-scale');

    let isVipMember = true;

    function updatePricingAndRoi() {
      const lengthInches = teamSlider ? parseInt(teamSlider.value, 10) : 26;
      if (teamCountOut) teamCountOut.textContent = `${lengthInches}" Couture Length`;

      const bundlesNeeded = lengthInches <= 20 ? 3 : (lengthInches <= 28 ? 4 : 5);
      const gramsTotal = bundlesNeeded * 100;
      const densityRec = lengthInches <= 20 ? '180% Natural' : (lengthInches <= 28 ? '220% Royal' : '250% Red Carpet');

      if (hoursSavedOut) hoursSavedOut.textContent = `${bundlesNeeded} Bundles (${gramsTotal}g)`;
      if (dollarSavedOut) dollarSavedOut.textContent = `${densityRec}`;

      const closurePrice = isVipMember ? 420 : 495;
      const frontalPrice = isVipMember ? 680 : 795;
      if (priceGrowthEl) priceGrowthEl.textContent = `$${closurePrice}`;
      if (priceScaleEl) priceScaleEl.textContent = `$${frontalPrice}`;
      if (billingToggleBtn) {
        billingToggleBtn.textContent = isVipMember
          ? '♛ Royal Crown Club Pricing (15% Off) — Switch to Standard'
          : '○ Standard Atelier Pricing — Switch to Royal Crown Club (15% Off)';
      }
    }

    if (billingToggleBtn) {
      billingToggleBtn.addEventListener('click', () => {
        isVipMember = !isVipMember;
        updatePricingAndRoi();
      });
    }

    if (teamSlider) {
      teamSlider.addEventListener('input', updatePricingAndRoi);
    }

    updatePricingAndRoi();

    // 4. Interactive FAQ Accordion
    const faqItems = Array.from(document.querySelectorAll('.faq-item'));
    faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        faqItems.forEach(other => {
          other.classList.remove('is-open');
          const btn = other.querySelector('.faq-trigger');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // 5. Private Atelier Order & Custom Measurement Modal
    const modal = document.getElementById('demo-booking-modal');
    const openModalBtns = Array.from(document.querySelectorAll('[data-open-modal="demo"]'));
    const closeModalBtn = document.getElementById('modal-close-btn');
    const demoForm = document.getElementById('demo-booking-form');
    const formFeedback = document.getElementById('demo-form-feedback');

    function openModal() {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      const firstInput = modal.querySelector('input');
      if (firstInput) firstInput.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (demoForm) {
      demoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('demo-work-email');
        const teamInput = document.getElementById('demo-company-name');
        const emailVal = emailInput ? emailInput.value.trim() : '';
        const teamVal = teamInput ? teamInput.value.trim() : '';

        if (!emailVal || !emailVal.includes('@') || !teamVal) {
          if (formFeedback) {
            formFeedback.style.display = 'block';
            formFeedback.style.color = 'var(--accent-primary)';
            formFeedback.textContent = 'Please enter your name and email address to reserve your custom crown.';
          }
          return;
        }

        if (formFeedback) {
          formFeedback.style.display = 'block';
          formFeedback.style.color = 'var(--accent-emerald)';
          formFeedback.textContent = `♛ Thank you, ${teamVal}! Your Royal Headmistress private concierge reservation has been sent to ${emailVal}.`;
        }
        demoForm.reset();
      });
    }

    // 6. Interactive Royal Shopping Bag Drawer
    const cartDrawer = document.getElementById('royal-cart-drawer');
    const navBagBtn = document.getElementById('nav-bag-btn');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartSubtotalAmount = document.getElementById('cart-subtotal-amount');
    const addToBagBtns = Array.from(document.querySelectorAll('[data-add-to-bag]'));

    const bagItems = [
      { name: 'Sovereign 13×6 HD Frontal Wig (26")', price: 680, qty: 1 }
    ];

    function renderBag() {
      const totalCount = bagItems.reduce((acc, item) => acc + item.qty, 0);
      const totalAmount = bagItems.reduce((acc, item) => acc + item.price * item.qty, 0);

      if (cartCountBadge) cartCountBadge.textContent = String(totalCount);
      if (cartSubtotalAmount) cartSubtotalAmount.textContent = `$${totalAmount.toLocaleString()}`;

      if (!cartItemsList) return;
      if (bagItems.length === 0) {
        cartItemsList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Your Royal Shopping Bag is currently empty. Select a signature wig or raw bundle set to begin.</div>`;
        return;
      }

      cartItemsList.innerHTML = bagItems.map((item, idx) => `
        <div class="cart-item-row" data-cart-index="${idx}">
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-meta">QTY: ${item.qty} × $${item.price} — 100% RAW CUTICLE</div>
          </div>
          <button type="button" class="cart-item-remove" data-remove-bag-idx="${idx}" aria-label="Remove ${item.name}">REMOVE</button>
        </div>
      `).join('');

      const removeBtns = Array.from(cartItemsList.querySelectorAll('[data-remove-bag-idx]'));
      removeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-remove-bag-idx') || '0', 10);
          bagItems.splice(idx, 1);
          renderBag();
        });
      });
    }

    function openCartDrawer() {
      if (!cartDrawer) return;
      cartDrawer.classList.add('is-open');
      cartDrawer.setAttribute('aria-hidden', 'false');
    }

    function closeCartDrawer() {
      if (!cartDrawer) return;
      cartDrawer.classList.remove('is-open');
      cartDrawer.setAttribute('aria-hidden', 'true');
    }

    if (navBagBtn) navBagBtn.addEventListener('click', openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartDrawer) {
      cartDrawer.addEventListener('click', (e) => {
        if (e.target === cartDrawer) closeCartDrawer();
      });
    }

    addToBagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-add-to-bag') || 'Royal Couture Piece';
        const price = parseInt(btn.getAttribute('data-bag-price') || '490', 10);
        const existing = bagItems.find(item => item.name === name);
        if (existing) {
          existing.qty += 1;
        } else {
          bagItems.push({ name, price, qty: 1 });
        }
        renderBag();
        openCartDrawer();
      });
    });

    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener('click', () => {
        closeCartDrawer();
        openModal();
      });
    }

    renderBag();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractions);
  } else {
    initInteractions();
  }
})();

