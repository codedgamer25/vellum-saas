/**
 * Royal Headmistress — v3.0 React-Style Declarative Luxury Component Suite
 * Implements:
 *  1. window.RoyalLuxuryStore (Reactive State & Multi-Currency Engine: USD / NGN / GBP)
 *  2. <CurrencySwitcher /> (#currency-switcher-bar)
 *  3. <TiltedSpotlightCard /> ([data-tilt-card] 3D Perspective Tilt + Radial Champagne Glare)
 *  4. <MagneticButton /> ([data-magnetic] Cursor Attraction Physics)
 *  5. <WigQuickViewStudio /> (#royal-quickview-modal Live Lace Tint Shade & Spec Customizer)
 */

(function () {
  'use strict';

  const CURRENCY_RATES = {
    USD: { code: 'USD', symbol: '$', rate: 1 },
    NGN: { code: 'NGN', symbol: '₦', rate: 1600 },
    GBP: { code: 'GBP', symbol: '£', rate: 0.79 }
  };

  const QUICK_VIEW_CATALOG = {
    'hd-lace': {
      id: 'hd-lace',
      title: 'Sovereign 13×6 Swiss HD Frontal Wig',
      subtitle: '0.10mm Swiss HD Lace • Pre-Plucked Single Knots • 100% Raw Cuticle',
      basePriceUsd: 1250,
      image: './assets/atelier-hero.jpg'
    },
    'cambodian': {
      id: 'cambodian',
      title: 'Invisible 0.10mm Swiss HD Illusion Crown',
      subtitle: 'Hand-Ventilated Directional Baby Hairs • Glueless Melt Fit',
      basePriceUsd: 890,
      image: './assets/hd-lace-closeup.jpg'
    },
    'blonde': {
      id: 'blonde',
      title: 'Single-Donor Raw Couture 4-Bundle Set',
      subtitle: 'Unprocessed Temple Cuticle • Lifts Cleanly to #613 Blonde',
      basePriceUsd: 1420,
      image: './assets/raw-bundles.jpg'
    }
  };

  const SHADE_SWATCHES = [
    { id: 'shade-porcelain', name: 'Porcelain Ivory', hex: '#F3D6C6' },
    { id: 'shade-honey', name: 'Warm Honey', hex: '#D29B72' },
    { id: 'shade-caramel', name: 'Rich Caramel', hex: '#9C5E38' },
    { id: 'shade-espresso', name: 'Deep Espresso', hex: '#4E2B18' }
  ];

  const LENGTH_OPTIONS = [
    { id: 'qv-len-18', label: '18"', deltaUsd: 0 },
    { id: 'qv-len-22', label: '22"', deltaUsd: 60 },
    { id: 'qv-len-26', label: '26"', deltaUsd: 120 },
    { id: 'qv-len-30', label: '30"', deltaUsd: 180 },
    { id: 'qv-len-36', label: '36"', deltaUsd: 240 }
  ];

  const DENSITY_OPTIONS = [
    { id: 'qv-den-180', label: '180% Natural', deltaUsd: 0 },
    { id: 'qv-den-220', label: '220% Royal', deltaUsd: 50 },
    { id: 'qv-den-250', label: '250% Red Carpet', deltaUsd: 100 }
  ];

  // Reactive Store (React useState/useEffect inspired store)
  function createLuxuryStore(initialState) {
    let state = { ...initialState };
    const listeners = new Set();

    function getState() {
      return state;
    }

    function setState(updater) {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return { getState, setState, subscribe };
  }

  const store = createLuxuryStore({
    currency: 'USD',
    activeStudioTab: 'obsidian',
    quickViewOpen: false,
    activeProductKey: 'hd-lace',
    selectedShade: 'Warm Honey',
    selectedShadeHex: '#D29B72',
    selectedLength: '18"',
    selectedLengthDelta: 0,
    selectedDensity: '180% Natural',
    selectedDensityDelta: 0
  });

  window.RoyalLuxuryStore = store;

  function formatRoyalCurrency(usdAmount, currencyOverride) {
    const code = currencyOverride || store.getState().currency || 'USD';
    const cfg = CURRENCY_RATES[code] || CURRENCY_RATES.USD;
    const converted = Math.round(Number(usdAmount || 0) * cfg.rate);
    return `${cfg.symbol}${converted.toLocaleString('en-US')}`;
  }

  window.formatRoyalCurrency = formatRoyalCurrency;

  // 1. Mount <CurrencySwitcher /> & Synchronize All Page Prices
  function initCurrencySwitcher() {
    const currencyBtns = Array.from(document.querySelectorAll('#currency-switcher-bar [data-currency]'));

    function renderCurrencyDOM(state) {
      currencyBtns.forEach((btn) => {
        const code = btn.getAttribute('data-currency');
        const isActive = code === state.currency;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      // Update all [data-usd-price] elements across collection cards & badges
      const priceNodes = Array.from(document.querySelectorAll('[data-usd-price]'));
      priceNodes.forEach((node) => {
        const usd = parseFloat(node.getAttribute('data-usd-price') || '0');
        node.textContent = formatRoyalCurrency(usd, state.currency);
      });

      // Trigger Bundle Calculator & Royal Shopping Bag re-render
      if (typeof window.refreshRoyalPrices === 'function') {
        window.refreshRoyalPrices();
      }
    }

    currencyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-currency');
        if (code && CURRENCY_RATES[code]) {
          store.setState({ currency: code });
        }
      });
    });

    store.subscribe(renderCurrencyDOM);
    renderCurrencyDOM(store.getState());
  }

  // 2. Mount <TiltedSpotlightCard /> on all [data-tilt-card] elements
  function initTiltedSpotlightCards() {
    const cards = Array.from(document.querySelectorAll('[data-tilt-card]'));
    cards.forEach((card) => {
      let glare = card.querySelector('.tilt-spotlight-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-spotlight-glare';
        glare.setAttribute('aria-hidden', 'true');
        card.prepend(glare);
      }

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = Math.max(0, Math.min(1, x / Math.max(1, rect.width)));
        const pctY = Math.max(0, Math.min(1, y / Math.max(1, rect.height)));

        const rotateX = (0.5 - pctY) * 10; // -5deg to +5deg
        const rotateY = (pctX - 0.5) * 10; // -5deg to +5deg

        card.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        card.setAttribute('data-tilt-active', 'true');
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.setAttribute('data-tilt-active', 'false');
      });
    });
  }

  // 3. Mount <MagneticButton /> on [data-magnetic], .btn-primary, and .btn-gold
  function initMagneticButtons() {
    const magneticBtns = Array.from(document.querySelectorAll('[data-magnetic], .btn-primary, .btn-gold'));
    magneticBtns.forEach((btn) => {
      btn.setAttribute('data-magnetic', 'true');
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // 4. Mount <WigQuickViewStudio /> (#royal-quickview-modal)
  function initQuickViewStudio() {
    const modal = document.getElementById('royal-quickview-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('qv-close-btn');
    const previewImg = document.getElementById('qv-preview-image');
    const shadeBadge = document.getElementById('qv-shade-badge');
    const titleEl = document.getElementById('qv-product-title');
    const subtitleEl = document.getElementById('qv-product-subtitle');
    const livePriceEl = document.getElementById('qv-live-price');
    const addToBagBtn = document.getElementById('qv-add-to-bag-btn');

    const shadeBtns = Array.from(modal.querySelectorAll('#qv-shade-selector [data-shade]'));
    const lengthBtns = Array.from(modal.querySelectorAll('#qv-length-selector [data-length]'));
    const densityBtns = Array.from(modal.querySelectorAll('#qv-density-selector [data-density]'));
    const quickViewTriggers = Array.from(document.querySelectorAll('[data-quick-view]'));

    function computeActiveUsdTotal(state) {
      const product = QUICK_VIEW_CATALOG[state.activeProductKey] || QUICK_VIEW_CATALOG['hd-lace'];
      return product.basePriceUsd + state.selectedLengthDelta + state.selectedDensityDelta;
    }

    function renderQuickView(state) {
      const product = QUICK_VIEW_CATALOG[state.activeProductKey] || QUICK_VIEW_CATALOG['hd-lace'];
      const totalUsd = computeActiveUsdTotal(state);

      modal.classList.toggle('is-open', Boolean(state.quickViewOpen));
      modal.setAttribute('aria-hidden', state.quickViewOpen ? 'false' : 'true');

      if (previewImg && product.image) {
        previewImg.setAttribute('src', product.image);
        previewImg.setAttribute('alt', `${product.title} — ${state.selectedShade}`);
      }
      if (titleEl) titleEl.textContent = product.title;
      if (subtitleEl) subtitleEl.textContent = product.subtitle;
      if (shadeBadge) {
        shadeBadge.textContent = `♛ Lace Tint: ${state.selectedShade} • ${state.selectedLength} • ${state.selectedDensity}`;
      }
      if (livePriceEl) {
        livePriceEl.textContent = formatRoyalCurrency(totalUsd, state.currency);
        livePriceEl.setAttribute('data-usd-total', String(totalUsd));
      }

      shadeBtns.forEach((btn) => {
        const shade = btn.getAttribute('data-shade');
        const active = shade === state.selectedShade;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      lengthBtns.forEach((btn) => {
        const len = btn.getAttribute('data-length');
        const active = len === state.selectedLength;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      densityBtns.forEach((btn) => {
        const den = btn.getAttribute('data-density');
        const active = den === state.selectedDensity;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    quickViewTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const key = trigger.getAttribute('data-quick-view') || 'hd-lace';
        store.setState({
          quickViewOpen: true,
          activeProductKey: QUICK_VIEW_CATALOG[key] ? key : 'hd-lace',
          selectedShade: 'Warm Honey',
          selectedShadeHex: '#D29B72',
          selectedLength: '18"',
          selectedLengthDelta: 0,
          selectedDensity: '180% Natural',
          selectedDensityDelta: 0
        });
      });
    });

    shadeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const shade = btn.getAttribute('data-shade') || 'Warm Honey';
        const swatch = SHADE_SWATCHES.find((s) => s.name === shade);
        store.setState({
          selectedShade: shade,
          selectedShadeHex: swatch ? swatch.hex : '#D29B72'
        });
      });
    });

    lengthBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const len = btn.getAttribute('data-length') || '18"';
        const opt = LENGTH_OPTIONS.find((l) => l.label === len);
        const delta = opt ? opt.deltaUsd : parseInt(btn.getAttribute('data-price-delta') || '0', 10);
        store.setState({
          selectedLength: len,
          selectedLengthDelta: delta
        });
      });
    });

    densityBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const den = btn.getAttribute('data-density') || '180% Natural';
        const opt = DENSITY_OPTIONS.find((d) => d.label === den);
        const delta = opt ? opt.deltaUsd : parseInt(btn.getAttribute('data-price-delta') || '0', 10);
        store.setState({
          selectedDensity: den,
          selectedDensityDelta: delta
        });
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        store.setState({ quickViewOpen: false });
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        store.setState({ quickViewOpen: false });
      }
    });

    if (addToBagBtn) {
      addToBagBtn.addEventListener('click', () => {
        const st = store.getState();
        const product = QUICK_VIEW_CATALOG[st.activeProductKey] || QUICK_VIEW_CATALOG['hd-lace'];
        const totalUsd = computeActiveUsdTotal(st);
        const customName = `${product.title} (${st.selectedShade} • ${st.selectedLength} • ${st.selectedDensity})`;

        store.setState({ quickViewOpen: false });
        if (typeof window.addToRoyalBag === 'function') {
          window.addToRoyalBag(customName, totalUsd, true);
        }
      });
    }

    store.subscribe(renderQuickView);
    renderQuickView(store.getState());
  }

  const STUDIO_PRESETS = {
    'obsidian': {
      key: 'obsidian',
      eyebrow: 'STUDIO FINISH 01 // SIGNATURE SOVEREIGN CROWN',
      title: 'Noir Hollywood Wave — 28" Couture Unit',
      desc: 'Double-drawn from root to tip with 100% aligned single-donor cuticles and pre-plucked invisible single knots.',
      islandSpec: '13×6 SWISS HD FRONTAL • 220% DENSITY',
      usdPrice: 1250,
      imgAfter: './assets/atelier-hero.jpg',
      imgBefore: './assets/hd-lace-closeup.jpg',
      quickViewId: 'hd-lace'
    },
    'hd-lace': {
      key: 'hd-lace',
      eyebrow: 'STUDIO FINISH 02 // INVISIBLE SCALP ARCHITECTURE',
      title: '0.10mm Swiss HD Melt — Invisible Single-Knot Hairline',
      desc: 'Micro-ventilated single-strand knots with pre-plucked directional baby hairs that melt seamlessly into every skin complexion.',
      islandSpec: '0.10MM SWISS HD LACE • INVISIBLE SINGLE KNOTS',
      usdPrice: 320,
      imgAfter: './assets/hd-lace-closeup.jpg',
      imgBefore: './assets/atelier-hero.jpg',
      quickViewId: 'cambodian'
    },
    'cambodian': {
      key: 'cambodian',
      eyebrow: 'STUDIO FINISH 03 // UNPROCESSED TEMPLE ORIGIN',
      title: 'Raw Cambodian Bundles — 100% Unidirectional Cuticle',
      desc: 'Cut directly from a single healthy donor ponytail with intact unidirectional cuticles and triple-reinforced flat wefts.',
      islandSpec: '100% UNIDIRECTIONAL CUTICLE • TRIPLE WEFTED',
      usdPrice: 420,
      imgAfter: './assets/raw-bundles.jpg',
      imgBefore: './assets/hd-lace-closeup.jpg',
      quickViewId: 'blonde'
    },
    'blonde': {
      key: 'blonde',
      eyebrow: 'STUDIO FINISH 04 // HIGH-LIFT COLOR ALCHEMY',
      title: '613 Champagne Blonde — High-Lift Platinum Silk',
      desc: 'Single-session custom toned #613 champagne blonde crafted from raw virgin hair that retains full silk bounce and luster.',
      islandSpec: '#613 CHAMPAGNE LIFT • 250% RED CARPET DENSITY',
      usdPrice: 1380,
      imgAfter: './assets/raw-bundles.jpg',
      imgBefore: './assets/atelier-hero.jpg',
      quickViewId: 'blonde'
    }
  };

  // 5. Mount <AppleProBentoStudio /> (#apple-showcase)
  function initAppleProBentoStudio() {
    const showcase = document.getElementById('apple-showcase');
    if (!showcase) return;

    const segBtns = Array.from(showcase.querySelectorAll('.apple-seg-btn[data-studio-tab]'));
    const islandSpecEl = document.getElementById('apple-island-spec');
    const stagePriceEl = document.getElementById('apple-stage-price');
    const stageEyebrowEl = document.getElementById('apple-stage-eyebrow');
    const stageTitleEl = document.getElementById('apple-stage-title');
    const stageDescEl = document.getElementById('apple-stage-desc');
    const imgAfterEl = document.getElementById('apple-stage-img-after');
    const imgBeforeEl = document.getElementById('apple-stage-img-before');
    const addBtn = document.getElementById('apple-stage-add-btn');
    const customizeBtn = document.getElementById('apple-stage-customize-btn');

    const sliderContainer = document.getElementById('lace-xray-slider-container');
    const rangeInput = document.getElementById('lace-xray-range');
    const meltReadout = document.getElementById('xray-melt-readout');

    function renderAppleBentoStudio(state) {
      const tabKey = state.activeStudioTab || 'obsidian';
      const preset = STUDIO_PRESETS[tabKey] || STUDIO_PRESETS['obsidian'];

      segBtns.forEach((btn) => {
        const isCurrent = btn.getAttribute('data-studio-tab') === preset.key;
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });

      if (islandSpecEl) islandSpecEl.textContent = preset.islandSpec;
      if (stageEyebrowEl) stageEyebrowEl.textContent = preset.eyebrow;
      if (stageTitleEl) stageTitleEl.textContent = preset.title;
      if (stageDescEl) stageDescEl.textContent = preset.desc;

      if (stagePriceEl) {
        stagePriceEl.setAttribute('data-usd-price', String(preset.usdPrice));
        stagePriceEl.textContent = formatRoyalCurrency(preset.usdPrice, state.currency);
      }

      if (imgAfterEl && preset.imgAfter) {
        imgAfterEl.setAttribute('src', preset.imgAfter);
      }
      if (imgBeforeEl && preset.imgBefore) {
        imgBeforeEl.setAttribute('src', preset.imgBefore);
      }
    }

    segBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-studio-tab') || 'obsidian';
        if (STUDIO_PRESETS[key]) {
          store.setState({ activeStudioTab: key });
        }
      });
    });

    function handleXrayUpdate() {
      if (!rangeInput) return;
      const val = Math.max(0, Math.min(100, Number(rangeInput.value || 55)));
      if (sliderContainer) {
        sliderContainer.style.setProperty('--xray-pos', `${val}%`);
      }
      if (meltReadout) {
        meltReadout.textContent = `${val}% HD Melt Reveal`;
      }
    }

    if (rangeInput) {
      rangeInput.addEventListener('input', handleXrayUpdate);
      rangeInput.addEventListener('change', handleXrayUpdate);
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const st = store.getState();
        const preset = STUDIO_PRESETS[st.activeStudioTab || 'obsidian'] || STUDIO_PRESETS['obsidian'];
        if (typeof window.addToRoyalBag === 'function') {
          window.addToRoyalBag(preset.title, preset.usdPrice, true);
        }
      });
    }

    if (customizeBtn) {
      customizeBtn.addEventListener('click', () => {
        const st = store.getState();
        const preset = STUDIO_PRESETS[st.activeStudioTab || 'obsidian'] || STUDIO_PRESETS['obsidian'];
        store.setState({
          quickViewOpen: true,
          activeProductKey: QUICK_VIEW_CATALOG[preset.quickViewId] ? preset.quickViewId : 'hd-lace'
        });
      });
    }

    store.subscribe(renderAppleBentoStudio);
    renderAppleBentoStudio(store.getState());
  }

  function mountReactLuxurySuite() {
    initAppleProBentoStudio();
    initCurrencySwitcher();
    initTiltedSpotlightCards();
    initMagneticButtons();
    initQuickViewStudio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactLuxurySuite);
  } else {
    mountReactLuxurySuite();
  }
})();

