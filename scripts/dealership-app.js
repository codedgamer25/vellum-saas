/**
 * Apex Auto Lounge - Editorial Gallery & 3D Depth-of-Field Dealership Application
 * Inspired by @uiuxzaid Interactive Concept Video:
 * - Bold geometric uppercase product titles + thin 200/300 uppercase editorial headers + colossal watermarks
 * - 3-Car Depth-of-Field 3D Hero Stage (Sharp 3D center car + blurred prev/next 3D car previews)
 * - "MORE THAN ENGINEERING, IT'S A LIFESTYLE" 2-column split section with interactive detail thumbnails
 * - "FEATURED COLLECTION" stadium/arch-framed 3-column showcase over colossal warm watermark
 * - Full searchable multi-currency Showroom Inventory + PIN-protected Owner Admin Console (PIN: 2026)
 */

(function (window, document) {
  'use strict';

  const STORE = window.ApexStore;
  if (!STORE) {
    console.error('ApexStore not found. Ensure dealership-store.js is loaded prior to dealership-app.js');
    return;
  }

  const STUDIO_IMAGES = STORE.getStudioImages ? STORE.getStudioImages() : {
    ferrariEditorial: './src/assets/images/lifestyle_supercar_editorial_1794305857459.jpg',
    ferrariRender: './models/ferrari_render.png',
    porscheStudio: './src/assets/images/porsche_gt3rs_studio_1794305858079.jpg',
    mercedesStudio: './src/assets/images/mercedes_g63_studio_1794305857861.jpg',
    audiStudio: './src/assets/images/audi_rs6_studio_1794305860108.jpg'
  };

  // Studio Paint Finish Swatches (Repaints the active 3D vehicle in-place without switching cars)
  const MARCO_PEREZ_TRIADS = {
    'midnight-coral': {
      id: 'midnight-coral',
      name: 'Rosso Corsa Crimson',
      fullName: 'Rosso Corsa Crimson',
      carId: 'ferrari-roma-2023',
      watermark: 'ROMA V8',
      popColor: '#D41118',
      baseDark: '#00243A',
      baseSoft: '#B6DFED',
      hueFilter: 'hue-rotate(0deg) saturate(1.05)',
      tagline: 'Soft blue & midnight navy. Add coral orange, now it feels like a brand.'
    },
    'raven-poppy': {
      id: 'raven-poppy',
      name: 'Gentian Sapphire Blue',
      fullName: 'Gentian Sapphire Blue',
      carId: 'porsche-gt3-rs-2024',
      watermark: '911 GT3 RS',
      popColor: '#2563EB',
      baseDark: '#0B0D12',
      baseSoft: '#8BB4D0',
      hueFilter: 'hue-rotate(215deg) saturate(1.35) brightness(0.95)',
      tagline: 'Raven black & powder blue. Add Sapphire blue, now it is impossible to ignore.'
    },
    'pine-butter': {
      id: 'pine-butter',
      name: 'Verde Emerald Metallic',
      fullName: 'Verde Emerald Metallic',
      carId: 'mercedes-amg-g63-2024',
      watermark: 'AMG G63',
      popColor: '#059669',
      baseDark: '#1A3528',
      baseSoft: '#4A121A',
      hueFilter: 'hue-rotate(130deg) saturate(1.35) brightness(0.95)',
      tagline: 'Pale pine & racing emerald. Crafted for unmistakable gallery presence.'
    },
    'obsidian-gold': {
      id: 'obsidian-gold',
      name: 'Solarbeam Amber Gold',
      fullName: 'Solarbeam Amber Gold',
      carId: 'audi-rs6-avant-2024',
      watermark: 'RS6 AVANT',
      popColor: '#D97706',
      baseDark: '#0A0A0C',
      baseSoft: '#1A1A24',
      hueFilter: 'hue-rotate(38deg) saturate(1.4) brightness(0.98)',
      tagline: 'The smallest color can make the biggest difference.'
    }
  };

  const HERO_CAR_ORDER = [
    'ferrari-roma-2023',
    'porsche-gt3-rs-2024',
    'mercedes-amg-g63-2024',
    'audi-rs6-avant-2024'
  ];

  const LIFESTYLE_GALLERY_ITEMS = [
    {
      id: 'life-01',
      thumb: STUDIO_IMAGES.ferrariEditorial,
      main: STUDIO_IMAGES.ferrariEditorial,
      inset: STUDIO_IMAGES.porscheStudio,
      caption: 'Atelier Maranello — Bespoke Rosso Corsa Tailor Made Specification',
      carId: 'apex-car-06'
    },
    {
      id: 'life-02',
      thumb: STUDIO_IMAGES.porscheStudio,
      main: STUDIO_IMAGES.porscheStudio,
      inset: STUDIO_IMAGES.audiStudio,
      caption: 'Weissach Track Aerodynamics — Magnesium Forged Centre-Lock Architecture',
      carId: 'apex-car-01'
    },
    {
      id: 'life-03',
      thumb: STUDIO_IMAGES.mercedesStudio,
      main: STUDIO_IMAGES.mercedesStudio,
      inset: STUDIO_IMAGES.ferrariEditorial,
      caption: 'Edition 55 Magno — Handcrafted Biturbo V8 Sanctuary',
      carId: 'apex-car-02'
    }
  ];

  // App State
  const state = {
    view: 'public', // 'public' | 'admin'
    isAdmin: false,
    filters: {
      keyword: '',
      make: 'all',
      status: 'all',
      priceMax: 300000,
      sortBy: 'featured'
    },
    activeDetailVehicleId: null,
    editingVehicleId: null,
    active3DCarId: 'ferrari-roma-2023',
    activeTriadId: 'midnight-coral',
    activeSpec: 'TRACK',
    activeColorHex: '#D41118',
    activeLifestyleIdx: 0,
    isHudCollapsed: false,
    heroViewer: null,
    fadeOutTimerId: null,
    fadeInCleanupTimerId: null
  };

  function showToast(message, type = 'info') {
    let container = document.getElementById('royal-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'royal-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `royal-toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '•';
    toast.innerHTML = `<span class="toast-indicator">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  function getFilteredVehicles() {
    return STORE.filterAndSortVehicles(state.filters);
  }

  // Render Minimalist 3-Zone Top Bar (Following @uiuxzaid Video & Top Bar Contract)
  function renderHeader() {
    const header = document.getElementById('app-header');
    if (!header) return;

    const currentCurrency = STORE.getCurrency();
    const currencies = ['USD', 'NGN', 'GBP', 'EUR'];

    header.innerHTML = `
      <div class="header-container">
        <!-- Zone 1: Single-line Brand Wordmark -->
        <a href="#" class="brand-wordmark" id="nav-brand-home">Apex.</a>

        <!-- Zone 2: 4 Concise Uppercase Nav Links -->
        <nav class="gallery-nav-links" aria-label="Primary Navigation">
          <a href="#hero-stage-viewport" class="gallery-nav-item active">HOME</a>
          <a href="#lifestyle-section" class="gallery-nav-item">LIFESTYLE</a>
          <a href="#featured-collection-section" class="gallery-nav-item">COLLECTION</a>
          <a href="#catalog" class="gallery-nav-item">SHOWROOM</a>
        </nav>

        <!-- Zone 3: Currency & Owner Action -->
        <div class="nav-actions">
          <div class="currency-selector-group" id="header-currency-switcher" role="group" aria-label="Currency Selector">
            ${currencies
              .map(
                (c) => `
              <button type="button" class="currency-pill ${c === currentCurrency ? 'active' : ''}" data-currency="${c}">
                ${c}
              </button>
            `
              )
              .join('')}
          </div>

          <button type="button" class="btn-mode-toggle ${state.view === 'admin' ? 'is-admin-active' : ''}" id="btn-header-admin-mode">
            ${state.view === 'admin' ? 'Exit Admin' : 'Owner Admin'}
          </button>
        </div>
      </div>
    `;

    header.querySelectorAll('.currency-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const curr = e.currentTarget.getAttribute('data-currency');
        STORE.setCurrency(curr);
      });
    });

    const brandHome = header.querySelector('#nav-brand-home');
    if (brandHome) {
      brandHome.addEventListener('click', (e) => {
        e.preventDefault();
        state.view = 'public';
        renderApp();
      });
    }

    const modeBtn = header.querySelector('#btn-header-admin-mode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        if (state.view === 'admin') {
          state.view = 'public';
          renderApp();
          showToast('Switched to Public Gallery View');
        } else if (state.isAdmin) {
          state.view = 'admin';
          renderApp();
        } else {
          openPinModal();
        }
      });
    }
  }

  // Featured 3D Cars Metadata Mapping for Hero Stage Atmosphere
  const HERO_ATMOSPHERE_CONFIG = {
    'porsche-gt3-rs-2024': {
      watermark: '911 GT3 RS',
      heroHeadline: 'PORSCHE 911 GT3 RS',
      auraName: 'Gentian Sapphire Blue',
      accentColor: '#2563EB',
      colorTheme: 'raven-poppy',
      triadId: 'raven-poppy',
      modelKey: 'porsche',
      renderThumb: './models/render_porsche.png',
      prevCarId: 'audi-rs6-avant-2024',
      nextCarId: 'ferrari-roma-2023',
      nextCarName: 'Ferrari Roma V8',
      nextCarThumb: './models/render_ferrari.png',
      flankHue: 'saturate(1.08)'
    },
    'ferrari-roma-2023': {
      watermark: 'ROMA V8',
      heroHeadline: 'FERRARI ROMA V8',
      auraName: 'Rosso Corsa Crimson',
      accentColor: '#D41118',
      colorTheme: 'midnight-coral',
      triadId: 'midnight-coral',
      modelKey: 'ferrari',
      renderThumb: './models/render_ferrari.png',
      prevCarId: 'porsche-gt3-rs-2024',
      nextCarId: 'mercedes-amg-g63-2024',
      nextCarName: 'Mercedes-AMG G63',
      nextCarThumb: './models/render_mercedes.png',
      flankHue: 'saturate(1.08)'
    },
    'mercedes-amg-g63-2024': {
      watermark: 'AMG G63',
      heroHeadline: 'AMG G63 EDITION',
      auraName: 'Verde Emerald Metallic',
      accentColor: '#059669',
      colorTheme: 'pine-butter',
      triadId: 'pine-butter',
      modelKey: 'mercedes',
      renderThumb: './models/render_mercedes.png',
      prevCarId: 'ferrari-roma-2023',
      nextCarId: 'audi-rs6-avant-2024',
      nextCarName: 'Audi RS6 Avant',
      nextCarThumb: './models/render_audi.png',
      flankHue: 'saturate(1.08)'
    },
    'audi-rs6-avant-2024': {
      watermark: 'RS6 AVANT',
      heroHeadline: 'AUDI RS6 AVANT',
      auraName: 'Solarbeam Amber Gold',
      accentColor: '#D97706',
      colorTheme: 'obsidian-gold',
      triadId: 'obsidian-gold',
      modelKey: 'audi',
      renderThumb: './models/render_audi.png',
      prevCarId: 'mercedes-amg-g63-2024',
      nextCarId: 'porsche-gt3-rs-2024',
      nextCarName: 'Porsche 911 GT3 RS',
      nextCarThumb: './models/render_porsche.png',
      flankHue: 'saturate(1.08)'
    }
  };

  function renderPublicView() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const filtered = getFilteredVehicles();
    const allVehicles = STORE.getVehicles();
    const makes = ['all', 'Porsche', 'Mercedes-Benz', 'BMW', 'Audi', 'Range Rover', 'Ferrari', 'Tesla', 'Aston Martin'];
    const currencies = ['USD', 'NGN', 'GBP', 'EUR'];
    const currentCurrency = STORE.getCurrency();

    const currentTriad = MARCO_PEREZ_TRIADS[state.activeTriadId] || MARCO_PEREZ_TRIADS['midnight-coral'];
    const currentCar = STORE.getFeatured3DCar(state.active3DCarId) || STORE.getFeatured3DCar(currentTriad.carId);
    const currentAtmosphere = HERO_ATMOSPHERE_CONFIG[currentCar.id] || HERO_ATMOSPHERE_CONFIG['ferrari-roma-2023'];
    const prevCar = STORE.getFeatured3DCar(currentAtmosphere.prevCarId);
    const nextCar = STORE.getFeatured3DCar(currentAtmosphere.nextCarId);
    const prevAtm = HERO_ATMOSPHERE_CONFIG[prevCar.id] || HERO_ATMOSPHERE_CONFIG['audi-rs6-avant-2024'];
    const nextAtm = HERO_ATMOSPHERE_CONFIG[nextCar.id] || HERO_ATMOSPHERE_CONFIG['mercedes-amg-g63-2024'];

    const activeLife = LIFESTYLE_GALLERY_ITEMS[state.activeLifestyleIdx] || LIFESTYLE_GALLERY_ITEMS[0];
    const lifestyleCar = STORE.getVehicle(activeLife.carId) || allVehicles[0];

    // Curated 3 Flagships for the Arch-Framed "FEATURED COLLECTION" section using high-resolution studio photographs
    const featuredArchCars = [
      {
        car: allVehicles.find((v) => v.id === 'apex-car-01') || allVehicles[0],
        archPhoto: STUDIO_IMAGES.porscheStudio,
        displayTitle: 'PORSCHE 911 GT3 RS'
      },
      {
        car: allVehicles.find((v) => v.id === 'apex-car-06') || allVehicles[1],
        archPhoto: STUDIO_IMAGES.ferrariEditorial,
        displayTitle: 'FERRARI ROMA V8'
      },
      {
        car: allVehicles.find((v) => v.id === 'apex-car-02') || allVehicles[2],
        archPhoto: STUDIO_IMAGES.mercedesStudio,
        displayTitle: 'MERCEDES-AMG G63'
      }
    ].filter((item) => Boolean(item.car));

    main.innerHTML = `
      <!-- =====================================================================
           SECTION 1: @uiuxzaid Gallery-White 3-Car Depth-of-Field 3D Hero Stage
           ===================================================================== -->
      <section class="hero-stage-viewport" id="hero-stage-viewport" data-hero-theme="${currentCar.id}">
        <div class="hero-stage-card" id="hero-stage-card" data-hero-theme="${currentCar.id}" data-color-theme="${currentTriad.id}">
          <!-- Colossal Typographic Background Watermark (JACKET / ROMA V8 equivalent) -->
          <div class="hero-watermark-text" id="hero-watermark" aria-hidden="true">
            ${currentAtmosphere.watermark}
          </div>

          <!-- 3-Car Depth-of-Field Stage: Blurred Prev 3D Car + Sharp Center 3D GLB Car + Blurred Next 3D Car -->
          <div class="hero-depth-carousel-stage">
            <!-- Left Flanking Blurred 3D Car Preview (Depth-of-Field Previous) -->
            <button
              type="button"
              class="hero-flank-car hero-flank-prev"
              id="hero-flank-prev-btn"
              data-car="${prevCar.id}"
              aria-label="Previous 3D Model: ${prevCar.make} ${prevCar.model}"
              title="Inspect Previous: ${prevCar.make} ${prevCar.model}"
            >
              <img
                id="prev-vehicle-thumb"
                src="${prevAtm.renderThumb}"
                alt="${prevCar.make} ${prevCar.model}"
                class="hero-flank-car-img"
                style="filter: blur(4px) ${prevAtm.flankHue};"
                referrerPolicy="no-referrer"
              />
              <span class="hero-flank-shadow" aria-hidden="true"></span>
            </button>

            <!-- Center Interactive Local Three.js 3D Model Stage Canvas -->
            <div class="hero-3d-stage-viewport" id="hero-3d-stage-container" data-testid="hero-3d-stage">
              <canvas id="hero-3d-canvas" class="hero-3d-canvas"></canvas>
              <div class="hero-3d-instant-fallback" id="hero-3d-instant-fallback">
                <img
                  id="hero-3d-fallback-img"
                  class="hero-3d-car-img"
                  src="${currentAtmosphere.renderThumb}"
                  alt="${currentCar.make} ${currentCar.model} 3D Showcase"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <!-- Right Flanking Blurred 3D Car Preview (Depth-of-Field Next) -->
            <button
              type="button"
              class="hero-flank-car hero-flank-next"
              id="hero-flank-next-btn"
              data-car="${nextCar.id}"
              aria-label="Next 3D Model: ${nextCar.make} ${nextCar.model}"
              title="Inspect Next: ${nextCar.make} ${nextCar.model}"
            >
              <img
                id="next-vehicle-thumb"
                src="${nextAtm.renderThumb}"
                alt="${nextCar.make} ${nextCar.model}"
                class="hero-flank-car-img"
                style="filter: blur(4px) ${nextAtm.flankHue};"
                referrerPolicy="no-referrer"
              />
              <span class="hero-flank-shadow" aria-hidden="true"></span>
              <span class="sr-only" id="next-vehicle-name">${currentAtmosphere.nextCarName}</span>
            </button>
          </div>

          <!-- Foreground Editorial Overlay Content -->
          <div class="hero-card-content">
            <!-- Middle Row: Left Bold Title, Copy, Circular Arrow Buttons & Explore Pill -->
            <div class="hero-card-middle">
              <div class="hero-left-editorial">
                <h1 class="hero-headline" id="hero-main-title">
                  <span class="theme-accent-text" id="hero-accent-text">${currentAtmosphere.heroHeadline}</span>
                </h1>
                <p class="hero-editorial-desc" id="hero-editorial-summary">
                  ${currentCar.summary}
                </p>

                <!-- Circular 1px Outline Arrow Buttons (← / →) matching @uiuxzaid Video -->
                <div class="hero-carousel-arrows" role="group" aria-label="Cycle 3D Vehicles">
                  <button
                    type="button"
                    class="hero-circle-arrow-btn"
                    id="hero-prev-vehicle-btn"
                    data-prev-car="${currentAtmosphere.prevCarId}"
                    aria-label="Previous Vehicle"
                    title="Previous Vehicle"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    class="hero-circle-arrow-btn"
                    id="hero-next-vehicle-btn"
                    data-next-car="${currentAtmosphere.nextCarId}"
                    aria-label="Next Vehicle"
                    title="Next Vehicle"
                  >
                    →
                  </button>
                </div>

                <!-- Explore More Pill with Leading Architectural Line + Dossier / WhatsApp -->
                <div class="hero-explore-row">
                  <a href="#featured-collection-section" class="btn-explore-line-pill" id="hero-explore-more-btn">
                    <span class="explore-lead-line" aria-hidden="true"></span>
                    <span class="explore-pill-box">Explore More</span>
                  </a>

                  <button
                    type="button"
                    class="btn-hero-secondary-pill"
                    id="hero-inspect-dossier"
                    data-id="apex-car-06"
                  >
                    Inspect Dossier
                  </button>

                  <a
                    href="https://wa.me/15550192834?text=Hi%20Apex%20Auto%20Lounge%2C%20I%20am%20inquiring%20about%20the%20featured%203D%20Showroom%20motorcar."
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-hero-whatsapp-link"
                    id="hero-whatsapp-reserve"
                  >
                    Reserve via WhatsApp ↗
                  </a>
                </div>
              </div>
            </div>

            <!-- Minimalist Zen Color Swatch Dock (Always Zen View, Swatches Only without Color Names) -->
            <footer class="hero-card-bottom-bar is-zen-always" id="hero-bottom-dock">
              <div class="hero-stage-bottom-island hero-swatches-only-dock">
                <div class="sr-only" aria-hidden="true">
                  <span id="island-car-name">${currentCar.year} ${currentCar.make} ${currentCar.model}</span>
                  <strong id="island-hp">${currentCar.hp} HP</strong>
                  <strong id="island-acceleration">${currentCar.zeroToSixty}</strong>
                  <strong id="island-topspeed">${currentCar.topSpeed}</strong>
                  <span id="island-price">${STORE.formatPrice(currentCar.priceUSD)}</span>
                </div>

                <!-- Pure Circular Color Swatches (No Color Names Displayed) -->
                <div class="triad-swatch-group swatch-only-group" role="group" aria-label="3D Paint Finishes">
                  ${Object.values(MARCO_PEREZ_TRIADS)
                    .map(
                      (triad) => `
                    <button
                      type="button"
                      class="triad-pill swatch-only-btn ${state.activeTriadId === triad.id ? 'active' : ''}"
                      data-triad="${triad.id}"
                      data-car="${triad.carId}"
                      data-color="${triad.popColor}"
                      aria-label="${triad.name}"
                    >
                      <span class="triad-pop-dot" style="background-color: ${triad.popColor};"></span>
                    </button>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </section>

      <!-- =====================================================================
           SECTION 2: Editorial Lifestyle Split ("MORE THAN ENGINEERING, IT'S A LIFESTYLE")
           Matches Frame 00:09–00:11 of the @uiuxzaid Reference Video
           ===================================================================== -->
      <section class="editorial-lifestyle-section" id="lifestyle-section">
        <div class="editorial-lifestyle-grid">
          <!-- Left Column: Thin Uppercase Display Header, Copy, Price + Pill CTA, 3 Rounded-Square Thumbs -->
          <div class="lifestyle-left-col">
            <h2 class="editorial-thin-heading">
              MORE THAN<br>ENGINEERING, IT'S<br>A LIFESTYLE
            </h2>
            <p class="editorial-body-copy">
              Crafted from lightweight carbon-titanium composites and hand-stitched full-grain aniline hides, every motorcar in our private Beverly Hills sanctuary blends wind-tunnel aerodynamics with timeless grand touring poise.
            </p>

            <div class="lifestyle-price-cta-row">
              <span class="lifestyle-price-tag" id="lifestyle-price">${STORE.formatPrice(lifestyleCar ? lifestyleCar.priceUSD : 238000)}</span>
              <button
                type="button"
                class="btn-outline-pill"
                id="btn-lifestyle-acquire"
                data-id="${lifestyleCar ? lifestyleCar.id : 'apex-car-06'}"
              >
                Acquire Now
              </button>
            </div>

            <!-- 3 Rounded-Square Detail Thumbnails -->
            <div class="lifestyle-thumbs-row" role="group" aria-label="Lifestyle Detail Perspectives">
              ${LIFESTYLE_GALLERY_ITEMS.map(
                (item, idx) => `
                <button
                  type="button"
                  class="lifestyle-thumb-btn ${idx === state.activeLifestyleIdx ? 'active' : ''}"
                  data-lifestyle-idx="${idx}"
                  aria-label="Select editorial perspective ${idx + 1}"
                >
                  <img
                    src="${item.thumb}"
                    alt="${item.caption}"
                    class="lifestyle-thumb-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </button>
              `
              ).join('')}
            </div>
          </div>

          <!-- Right Column: Stadium / Arch-Framed Editorial Portrait + Overlapping Circular Inset -->
          <div class="lifestyle-right-col">
            <div class="lifestyle-arch-showcase">
              <div class="lifestyle-main-capsule">
                <img
                  id="lifestyle-main-img"
                  src="${activeLife.main}"
                  alt="${activeLife.caption}"
                  class="lifestyle-main-photo"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              <!-- Overlapping Circular Inset Detail Frame (Matches @uiuxzaid Video Frame 00:10) -->
              <div class="lifestyle-circle-inset">
                <img
                  id="lifestyle-inset-img"
                  src="${activeLife.inset}"
                  alt="Atelier Craftsmanship Detail"
                  class="lifestyle-inset-photo"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <p class="lifestyle-caption-note" id="lifestyle-caption-text">${activeLife.caption}</p>
          </div>
        </div>
      </section>

      <!-- =====================================================================
           SECTION 3: Arch-Framed "FEATURED COLLECTION" over Colossal Warm Watermark
           Matches Frame 00:12–00:15 of the @uiuxzaid Reference Video
           ===================================================================== -->
      <section class="featured-collection-section" id="featured-collection-section">
        <!-- Colossal Warm Peach/Sand Background Watermark -->
        <div class="featured-collection-watermark" id="featured-watermark" aria-hidden="true">FEATURE</div>

        <div class="featured-collection-inner">
          <!-- Header Row: Left Thin Uppercase Title + Swirl, Right Description + Explore All Pill -->
          <div class="featured-collection-header">
            <div class="featured-header-left">
              <h2 class="editorial-thin-heading" id="featured-collection-heading">
                FEATURED<br>COLLECTION
              </h2>
              <svg class="editorial-swirl-svg" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M4 12C12 10 22 18 25 24C28 30 37 28 34 18C31 9 21 12 23 25C25 36 31 41 33 46M26 40L33 46L39 39" stroke="#111115" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="featured-header-right">
              <p class="editorial-body-copy">
                Discover our curated range of exotic motorcars designed for ultimate aerodynamic poise, velocity, and bespoke grand touring elegance.
              </p>
              <a href="#catalog" class="btn-outline-pill" id="btn-featured-explore-all">Explore All</a>
            </div>
          </div>

          <!-- 3-Column Stadium / Arch-Framed Collection Grid -->
          <div class="featured-arch-grid" id="featured-arch-grid">
            ${featuredArchCars
              .map(
                ({ car, archPhoto, displayTitle }, idx) => `
              <article class="featured-arch-card ${idx === 1 ? 'is-center-arch' : ''}" data-id="${car.id}" data-arch-idx="${idx}">
                <button
                  type="button"
                  class="featured-arch-frame-btn btn-open-detail"
                  data-id="${car.id}"
                  aria-label="Inspect ${car.year} ${car.make} ${car.model}"
                >
                  <div class="featured-arch-capsule arch-tint-${idx + 1}">
                    <img
                      src="${car.images && car.images[0] ? car.images[0] : archPhoto}"
                      alt="${car.year} ${car.make} ${car.model}"
                      class="featured-arch-img"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span class="featured-arch-hover-pill" aria-hidden="true">Inspect Dossier ↗</span>
                  </div>
                </button>
                <div class="featured-arch-meta">
                  <div class="featured-arch-meta-top">
                    <h3 class="featured-arch-title">${displayTitle}</h3>
                    <span class="featured-arch-spec-tag">${car.horsepower} HP</span>
                  </div>
                  <div class="featured-arch-price">Price : ${STORE.formatPrice(car.priceUSD)}</div>
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        </div>
      </section>

      <!-- =====================================================================
           SECTION 4: Full Interactive Showroom Inventory & Filter Bar
           ===================================================================== -->
      <section class="catalog-filter-wrapper" id="showroom-inventory-controls">
        <div class="catalog-utility-bar">
          <div class="catalog-heading-wrap">
            <h2 class="catalog-section-title">SHOWROOM INVENTORY</h2>
            <span class="catalog-vehicle-count">${filtered.length} Motorcars Available</span>
          </div>

          <div class="catalog-utility-actions">
            <div class="currency-selector-group" id="currency-switcher" role="group" aria-label="Currency Selector">
              ${currencies
                .map(
                  (c) => `
                <button type="button" class="currency-pill ${c === currentCurrency ? 'active' : ''}" data-currency="${c}">
                  ${c === 'USD' ? '$ USD' : c === 'NGN' ? '₦ NGN' : c === 'GBP' ? '£ GBP' : '€ EUR'}
                </button>
              `
                )
                .join('')}
            </div>

            <button type="button" class="btn-mode-toggle ${state.view === 'admin' ? 'is-admin-active' : ''}" id="btn-toggle-mode">
              ${state.view === 'admin' ? 'Exit Admin View' : 'Owner Admin'}
            </button>
          </div>
        </div>

        <div class="filter-bar-container" id="filter-bar">
          <div class="filter-input-wrapper">
            <label for="filter-keyword" class="sr-only">Search inventory</label>
            <input
              type="text"
              class="filter-input"
              id="filter-keyword"
              placeholder="Search make, model, year, VIN..."
              value="${state.filters.keyword}"
            />
          </div>

          <div>
            <label for="filter-make" class="sr-only">Filter by Make</label>
            <select class="filter-select" id="filter-make" aria-label="Filter by Make">
              ${makes
                .map(
                  (m) =>
                    `<option value="${m}" ${state.filters.make.toLowerCase() === m.toLowerCase() ? 'selected' : ''}>
                      ${m === 'all' ? 'All Makes' : m}
                    </option>`
                )
                .join('')}
            </select>
          </div>

          <div>
            <label for="filter-status" class="sr-only">Filter by Status</label>
            <select class="filter-select" id="filter-status" aria-label="Filter by Status">
              <option value="all" ${state.filters.status === 'all' ? 'selected' : ''}>All Status</option>
              <option value="available" ${state.filters.status === 'available' ? 'selected' : ''}>Available Only</option>
              <option value="reserved" ${state.filters.status === 'reserved' ? 'selected' : ''}>Reserved</option>
              <option value="sold" ${state.filters.status === 'sold' ? 'selected' : ''}>Sold Archive</option>
            </select>
          </div>

          <div>
            <label for="filter-sort" class="sr-only">Sort Vehicles</label>
            <select class="filter-select" id="filter-sort" aria-label="Sort Vehicles">
              <option value="featured" ${state.filters.sortBy === 'featured' ? 'selected' : ''}>Featured First</option>
              <option value="price-asc" ${state.filters.sortBy === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${state.filters.sortBy === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="year-desc" ${state.filters.sortBy === 'year-desc' ? 'selected' : ''}>Year: Newest</option>
              <option value="mileage-asc" ${state.filters.sortBy === 'mileage-asc' ? 'selected' : ''}>Mileage: Lowest</option>
            </select>
          </div>

          <div class="filter-reset-col">
            <button type="button" class="btn-secondary" id="btn-reset-filters">
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <div class="catalog-meta-bar">
        <div>
          Showing <span class="meta-count-badge" id="catalog-count">${filtered.length}</span> verified motorcars in gallery
        </div>
        <div class="catalog-rate-note">
          <span>Active Currency:</span>
          <strong>${STORE.getCurrency()}</strong>
        </div>
      </div>

      <!-- Vehicle Card Grid -->
      <section class="catalog-section" id="catalog">
        <div class="car-grid" id="car-catalog-grid">
          ${
            filtered.length > 0
              ? filtered
                  .map((car) => {
                    const statusClass =
                      car.status === 'available'
                        ? 'badge-available'
                        : car.status === 'reserved'
                        ? 'badge-reserved'
                        : 'badge-sold';
                    const statusLabel =
                      car.status === 'available'
                        ? 'Available'
                        : car.status === 'reserved'
                        ? 'Reserved'
                        : 'Sold';

                    const primaryImage =
                      car.images && car.images[0]
                        ? car.images[0]
                        : STUDIO_IMAGES.porscheStudio;

                    const formattedPrice = STORE.formatPrice(car.priceUSD);
                    const whatsappMsg = encodeURIComponent(
                      `Hi Apex Auto Lounge, I am inquiring about the ${car.year} ${car.make} ${car.model} (${formattedPrice}, VIN: ${car.vin}). Is it available for private inspection?`
                    );

                    return `
              <article class="car-card" data-id="${car.id}">
                <div class="car-card-media">
                  <span class="car-card-badge ${statusClass}">${statusLabel}</span>
                  ${car.sketchfabId ? '<span class="badge-3d-showcase">3D SHOWROOM</span>' : ''}
                  <img
                    src="${primaryImage}"
                    alt="${car.year} ${car.make} ${car.model}"
                    class="car-card-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div class="car-card-body">
                  <div class="car-card-header">
                    <div class="car-card-year">${car.year} · ${car.bodyType || 'Coupe'} · ${car.exteriorColor}</div>
                    <h3 class="car-card-title">${car.make} ${car.model}</h3>
                  </div>

                  <div class="car-card-specs">
                    <span>${new Intl.NumberFormat().format(car.mileage)} mi</span>
                    <span aria-hidden="true">·</span>
                    <span>${car.transmission}</span>
                    <span aria-hidden="true">·</span>
                    <span>${car.horsepower} HP</span>
                  </div>

                  <div class="car-card-price-row">
                    <div>
                      <div class="price-label">Price</div>
                      <div class="price-value">${formattedPrice}</div>
                    </div>
                    <div class="car-vin-short">
                      VIN ${car.vin.slice(-6)}
                    </div>
                  </div>

                  <div class="car-card-actions">
                    <button type="button" class="btn-card-specs btn-open-detail" data-id="${car.id}">
                      Specs & Gallery
                    </button>
                    ${
                      car.sketchfabId
                        ? `<button type="button" class="btn-card-specs btn-open-3d" data-id="${car.id}" title="Launch Interactive 3D Model">
                            3D Model
                          </button>`
                        : ''
                    }
                    <a
                      href="https://wa.me/15550192834?text=${whatsappMsg}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn-card-whatsapp"
                    >
                      Inquire
                    </a>
                  </div>
                </div>
              </article>
            `;
                  })
                  .join('')
              : `
            <div class="catalog-empty-state">
              <h3>No Matching Exotic Vehicles Found</h3>
              <p>
                Try adjusting your search criteria or resetting filters to view our full collection.
              </p>
              <button type="button" class="btn-outline-pill" id="btn-clear-empty-filter">
                Reset All Filters
              </button>
            </div>
          `
          }
        </div>
      </section>
    `;

    // Wire Filter Event Listeners
    const kwInput = main.querySelector('#filter-keyword');
    if (kwInput) {
      kwInput.addEventListener('input', (e) => {
        state.filters.keyword = e.target.value;
        renderPublicView();
        const reFocused = document.getElementById('filter-keyword');
        if (reFocused) {
          reFocused.focus();
          reFocused.setSelectionRange(reFocused.value.length, reFocused.value.length);
        }
      });
    }

    main.querySelector('#filter-make')?.addEventListener('change', (e) => {
      state.filters.make = e.target.value;
      renderPublicView();
    });

    main.querySelector('#filter-status')?.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      renderPublicView();
    });

    main.querySelector('#filter-sort')?.addEventListener('change', (e) => {
      state.filters.sortBy = e.target.value;
      renderPublicView();
    });

    main.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      state.filters = { keyword: '', make: 'all', status: 'all', priceMax: 300000, sortBy: 'featured' };
      renderPublicView();
      showToast('Filters reset to show all inventory');
    });

    main.querySelector('#btn-clear-empty-filter')?.addEventListener('click', () => {
      state.filters = { keyword: '', make: 'all', status: 'all', priceMax: 300000, sortBy: 'featured' };
      renderPublicView();
    });

    // Currency Switchers
    main.querySelectorAll('.currency-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const curr = e.currentTarget.getAttribute('data-currency');
        STORE.setCurrency(curr);
      });
    });

    // Mode Toggle Button
    main.querySelector('#btn-toggle-mode')?.addEventListener('click', () => {
      if (state.view === 'admin') {
        state.view = 'public';
        renderApp();
      } else if (state.isAdmin) {
        state.view = 'admin';
        renderApp();
      } else {
        openPinModal();
      }
    });

    // Lifestyle Split Interactive Thumbnails & Acquire Button (GSAP Crossfade + Scale Timeline)
    main.querySelectorAll('.lifestyle-thumb-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.getAttribute('data-lifestyle-idx') || 0);
        state.activeLifestyleIdx = idx;
        const item = LIFESTYLE_GALLERY_ITEMS[idx] || LIFESTYLE_GALLERY_ITEMS[0];
        const car = STORE.getVehicle(item.carId);

        main.querySelectorAll('.lifestyle-thumb-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const mainCapsule = main.querySelector('.lifestyle-main-capsule');
        const circleInset = main.querySelector('.lifestyle-circle-inset');
        const mainImg = main.querySelector('#lifestyle-main-img');
        const insetImg = main.querySelector('#lifestyle-inset-img');
        const capEl = main.querySelector('#lifestyle-caption-text');
        const priceEl = main.querySelector('#lifestyle-price');
        const acqBtn = main.querySelector('#btn-lifestyle-acquire');

        const swapContent = () => {
          if (mainImg) {
            mainImg.src = item.main;
            mainImg.alt = item.caption;
          }
          if (insetImg) {
            insetImg.src = item.inset;
          }
          if (capEl) {
            capEl.textContent = item.caption;
          }
          if (priceEl && car) {
            priceEl.textContent = STORE.formatPrice(car.priceUSD);
          }
          if (acqBtn && car) {
            acqBtn.setAttribute('data-id', car.id);
          }
        };

        if (window.gsap) {
          const tl = window.gsap.timeline();
          tl.to([mainCapsule, circleInset, priceEl].filter(Boolean), {
            opacity: 0.25,
            scale: 0.96,
            y: 6,
            duration: 0.14,
            ease: 'power2.in',
            onComplete: swapContent
          }).to([mainCapsule, circleInset, priceEl].filter(Boolean), {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.38,
            stagger: 0.04,
            ease: 'expo.out',
            clearProps: 'scale'
          });
        } else {
          if (mainCapsule) mainCapsule.classList.add('is-swapping');
          if (circleInset) circleInset.classList.add('is-swapping');
          if (priceEl) priceEl.classList.add('is-swapping');
          window.setTimeout(() => {
            swapContent();
            if (mainCapsule) mainCapsule.classList.remove('is-swapping');
            if (circleInset) circleInset.classList.remove('is-swapping');
            if (priceEl) priceEl.classList.remove('is-swapping');
          }, 120);
        }
      });
    });

    main.querySelector('#btn-lifestyle-acquire')?.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id') || 'apex-car-06';
      openVehicleModal(id, 'photo');
    });

    // Modal Open Buttons (Catalog + Featured Collection Arches)
    main.querySelectorAll('.btn-open-detail').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openVehicleModal(id, 'photo');
      });
    });

    main.querySelectorAll('.btn-open-3d').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openVehicleModal(id, '3d');
      });
    });

    // Collapsible Bottom Dock Toggle
    main.querySelector('#btn-toggle-hero-dock')?.addEventListener('click', () => {
      state.isHudCollapsed = !state.isHudCollapsed;
      const dock = main.querySelector('#hero-bottom-dock');
      const btn = main.querySelector('#btn-toggle-hero-dock');
      if (dock) dock.classList.toggle('is-collapsed', state.isHudCollapsed);
      if (btn) {
        btn.setAttribute('aria-expanded', String(!state.isHudCollapsed));
        btn.textContent = state.isHudCollapsed ? '▴ Show 3D Controls & Finishes' : '▾ Hide Controls (Zen 3D View)';
      }
    });

    // Initialize Local Three.js 3D Viewer inside Hero Stage
    function initHero3DViewer() {
      const container = main.querySelector('#hero-3d-stage-container');
      if (!container) return;

      if (window.Apex3DViewer) {
        if (state.heroViewer) {
          try {
            state.heroViewer.destroy();
          } catch (e) {}
        }
        const initialAtm = HERO_ATMOSPHERE_CONFIG[state.active3DCarId] || HERO_ATMOSPHERE_CONFIG['ferrari-roma-2023'];
        state.heroViewer = new window.Apex3DViewer('hero-3d-stage-container', {
          initialModel: initialAtm.modelKey,
          initialColor: state.activeColorHex || initialAtm.accentColor,
          autoRotate: true,
          autoRotateSpeed: 0.75
        });
      }
    }

    // Wire Hero 3D Stage & Depth-of-Field Carousel Controls with #main-content Fade-Out/Fade-In Transition
    function applyHeroVehicleState(carId, targetHex = null, targetTheme = null, direction = null) {
      state.active3DCarId = carId;
      const car = STORE.getFeatured3DCar(carId);
      if (!car) return;

      const atmosphere = HERO_ATMOSPHERE_CONFIG[carId] || HERO_ATMOSPHERE_CONFIG['ferrari-roma-2023'];
      const appliedColor = targetHex || atmosphere.accentColor;
      const appliedTheme = targetTheme || atmosphere.colorTheme;
      state.activeColorHex = appliedColor;
      state.activeTriadId = targetTheme || atmosphere.triadId;

      const heroViewport = main.querySelector('#hero-stage-viewport');
      if (heroViewport) heroViewport.setAttribute('data-hero-theme', carId);

      const heroCard = main.querySelector('#hero-stage-card');
      if (heroCard) {
        heroCard.setAttribute('data-hero-theme', carId);
        heroCard.setAttribute('data-color-theme', appliedTheme);
      }

      // Update Colossal Typographic Watermark & Left Bold Editorial Headline
      const watermarkEl = main.querySelector('#hero-watermark');
      if (watermarkEl) watermarkEl.textContent = atmosphere.watermark;

      const accentTextEl = main.querySelector('#hero-accent-text');
      if (accentTextEl) accentTextEl.textContent = atmosphere.heroHeadline;

      const summaryEl = main.querySelector('#hero-editorial-summary');
      if (summaryEl && car.summary) summaryEl.textContent = car.summary;

      // Update Segmented Switcher Buttons
      main.querySelectorAll('.apple-switcher-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-car') === carId);
      });

      // Update Active Paint Swatch Pill (only highlight the active color swatch)
      main.querySelectorAll('.triad-pill').forEach((pill) => {
        const triadId = pill.getAttribute('data-triad');
        pill.classList.toggle('active', triadId === state.activeTriadId);
      });

      // Update Pagination Dots
      main.querySelectorAll('.pagination-dot').forEach((pDot) => {
        pDot.classList.toggle('active', pDot.getAttribute('data-car') === carId);
      });

      // Update Flanking Blurred Prev / Next 3D Car Previews & Arrow Buttons
      const prevCarObj = STORE.getFeatured3DCar(atmosphere.prevCarId);
      const nextCarObj = STORE.getFeatured3DCar(atmosphere.nextCarId);
      const prevAtmObj = HERO_ATMOSPHERE_CONFIG[prevCarObj.id] || HERO_ATMOSPHERE_CONFIG['audi-rs6-avant-2024'];
      const nextAtmObj = HERO_ATMOSPHERE_CONFIG[nextCarObj.id] || HERO_ATMOSPHERE_CONFIG['mercedes-amg-g63-2024'];

      const prevBtn = main.querySelector('#hero-prev-vehicle-btn');
      if (prevBtn) prevBtn.setAttribute('data-prev-car', atmosphere.prevCarId);

      const nextBtn = main.querySelector('#hero-next-vehicle-btn');
      if (nextBtn) nextBtn.setAttribute('data-next-car', atmosphere.nextCarId);

      const flankPrevBtn = main.querySelector('#hero-flank-prev-btn');
      if (flankPrevBtn) {
        flankPrevBtn.setAttribute('data-car', prevCarObj.id);
        flankPrevBtn.setAttribute('aria-label', `Previous 3D Model: ${prevCarObj.make} ${prevCarObj.model}`);
      }
      const prevThumb = main.querySelector('#prev-vehicle-thumb');
      if (prevThumb) {
        prevThumb.setAttribute('src', prevAtmObj.renderThumb);
        prevThumb.setAttribute('alt', `${prevCarObj.make} ${prevCarObj.model}`);
        prevThumb.style.filter = `blur(4px) ${prevAtmObj.flankHue}`;
      }

      const flankNextBtn = main.querySelector('#hero-flank-next-btn');
      if (flankNextBtn) {
        flankNextBtn.setAttribute('data-car', nextCarObj.id);
        flankNextBtn.setAttribute('aria-label', `Next 3D Model: ${nextCarObj.make} ${nextCarObj.model}`);
      }
      const nextThumb = main.querySelector('#next-vehicle-thumb');
      if (nextThumb) {
        nextThumb.setAttribute('src', nextAtmObj.renderThumb);
        nextThumb.setAttribute('alt', atmosphere.nextCarName);
        nextThumb.style.filter = `blur(4px) ${nextAtmObj.flankHue}`;
      }
      const nextCardName = main.querySelector('#next-vehicle-name');
      if (nextCardName) {
        nextCardName.textContent = atmosphere.nextCarName;
      }

      // Update Bottom Dock Telemetry & Price
      const nameEl = main.querySelector('#island-car-name');
      if (nameEl) nameEl.textContent = `${car.year} ${car.make} ${car.model}`;

      const hpEl = main.querySelector('#island-hp');
      if (hpEl) hpEl.textContent = `${car.hp} HP`;

      const accelEl = main.querySelector('#island-acceleration');
      if (accelEl) accelEl.textContent = car.zeroToSixty;

      const topSpeedEl = main.querySelector('#island-topspeed');
      if (topSpeedEl) topSpeedEl.textContent = car.topSpeed;

      const priceEl = main.querySelector('#island-price');
      if (priceEl) priceEl.textContent = STORE.formatPrice(car.priceUSD);

      // Update WhatsApp & Dossier Links
      const waBtn = main.querySelector('#hero-whatsapp-reserve');
      if (waBtn) {
        const encoded = encodeURIComponent(
          `Hi Apex Auto Lounge, I am inquiring about the ${car.year} ${car.make} ${car.model} featured on the 3D Showroom (${STORE.formatPrice(car.priceUSD)}). Is it available for private acquisition?`
        );
        waBtn.setAttribute('href', `https://wa.me/15550192834?text=${encoded}`);
      }

      const dossierBtn = main.querySelector('#hero-inspect-dossier');
      if (dossierBtn) {
        const catalogVehicle =
          STORE.getVehicles().find(
            (v) =>
              v.make.toLowerCase() === car.make.toLowerCase() &&
              v.model.toLowerCase().includes(car.model.toLowerCase().split(' ')[0])
          ) || STORE.getVehicles()[0];
        if (catalogVehicle) {
          dossierBtn.setAttribute('data-id', catalogVehicle.id);
        }
      }

      // Update Three.js 3D Model & Paint Color with directional turntable entrance sweep
      if (window.Apex3DViewer) {
        if (typeof window.Apex3DViewer.loadModel === 'function') {
          window.Apex3DViewer.loadModel(atmosphere.modelKey, appliedColor, direction);
        }
        if (typeof window.Apex3DViewer.changeCarColor === 'function') {
          window.Apex3DViewer.changeCarColor(appliedColor);
        }
      }
    }

    function updateHero3DStage(carId, targetHex = null, targetTheme = null, options = {}) {
      const skipTransition = Boolean(options && options.skipTransition);
      const direction = (options && options.direction) || 'next';
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (state.fadeOutTimerId) {
        clearTimeout(state.fadeOutTimerId);
        state.fadeOutTimerId = null;
      }
      if (state.fadeInCleanupTimerId) {
        clearTimeout(state.fadeInCleanupTimerId);
        state.fadeInCleanupTimerId = null;
      }

      const heroCard = main.querySelector('#hero-stage-card');

      if (skipTransition || prefersReducedMotion) {
        main.classList.remove('is-vehicle-cycling', 'is-vehicle-fade-out', 'is-vehicle-fade-in');
        main.setAttribute('data-transition-state', 'idle');
        main.removeAttribute('data-carousel-dir');
        if (heroCard) heroCard.removeAttribute('data-carousel-dir');
        applyHeroVehicleState(carId, targetHex, targetTheme, null);
        return;
      }

      // Phase 1: Promote GPU layer & trigger directional diagonal depth-of-field choreography
      main.setAttribute('data-carousel-dir', direction);
      if (heroCard) heroCard.setAttribute('data-carousel-dir', direction);
      main.classList.remove('is-vehicle-fade-in');
      main.classList.add('is-vehicle-cycling', 'is-vehicle-fade-out');
      main.setAttribute('data-transition-state', 'fade-out');

      // Apply vehicle metadata & cached 3D model swap with turntable spin sweep
      applyHeroVehicleState(carId, targetHex, targetTheme, direction);

      // Phase 2: At the fade-out trough (130ms), glide elements smoothly along the diagonal axis into target slots
      state.fadeOutTimerId = window.setTimeout(() => {
        state.fadeOutTimerId = null;
        main.classList.remove('is-vehicle-fade-out');
        main.classList.add('is-vehicle-fade-in');
        main.setAttribute('data-transition-state', 'fade-in');

        if (window.gsap) {
          const dirSign = direction === 'prev' ? -1 : 1;
          const watermarkEl = main.querySelector('#hero-watermark');
          const stageViewport = main.querySelector('#hero-3d-stage-container');
          const flankPrev = main.querySelector('#hero-flank-prev-btn');
          const flankNext = main.querySelector('#hero-flank-next-btn');
          const editorialNodes = main.querySelectorAll(
            '#hero-main-title, #hero-editorial-summary, .hero-carousel-arrows, .hero-explore-row'
          );

          if (watermarkEl) {
            window.gsap.fromTo(
              watermarkEl,
              { xPercent: -50 + dirSign * 7, opacity: 0.35, scale: 0.96 },
              { xPercent: -50, opacity: 1, scale: 1, duration: 0.55, ease: 'expo.out', overwrite: 'auto' }
            );
          }
          if (stageViewport) {
            window.gsap.fromTo(
              stageViewport,
              { x: dirSign * 42, y: dirSign * 22, scale: 0.93 },
              { x: 0, y: 0, scale: 1, duration: 0.52, ease: 'expo.out', overwrite: 'auto', clearProps: 'transform' }
            );
          }
          if (flankPrev && flankNext) {
            window.gsap.fromTo(
              [flankPrev, flankNext],
              { x: -dirSign * 34, y: -dirSign * 18, scale: 0.84, opacity: 0.38 },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 0.85,
                duration: 0.56,
                stagger: 0.05,
                ease: 'expo.out',
                overwrite: 'auto',
                clearProps: 'transform,opacity'
              }
            );
          }
          if (editorialNodes.length) {
            window.gsap.fromTo(
              editorialNodes,
              { y: 18, opacity: 0.2 },
              {
                y: 0,
                opacity: 1,
                duration: 0.44,
                stagger: 0.045,
                ease: 'power3.out',
                overwrite: 'auto',
                clearProps: 'transform,opacity'
              }
            );
          }
        }

        // Phase 3: Release temporary GPU layer promotion once fade-in settles
        state.fadeInCleanupTimerId = window.setTimeout(() => {
          state.fadeInCleanupTimerId = null;
          main.classList.remove('is-vehicle-cycling', 'is-vehicle-fade-in');
          main.setAttribute('data-transition-state', 'idle');
        }, 280);
      }, 130);
    }

    // Switcher & Triad Listeners
    main.querySelectorAll('.apple-switcher-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const carId = e.currentTarget.getAttribute('data-car');
        const currentAtm = HERO_ATMOSPHERE_CONFIG[state.active3DCarId];
        const dir = currentAtm && currentAtm.prevCarId === carId ? 'prev' : 'next';
        updateHero3DStage(carId, null, null, { direction: dir });
      });
    });

    main.querySelectorAll('.triad-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const triadId = e.currentTarget.getAttribute('data-triad');
        const colorHex = e.currentTarget.getAttribute('data-color');
        const triad = MARCO_PEREZ_TRIADS[triadId];
        if (!triad && !colorHex) return;

        const appliedColor = colorHex || triad.popColor;
        state.activeColorHex = appliedColor;
        if (triadId) state.activeTriadId = triadId;

        // Highlight only the clicked color swatch without changing the active car
        main.querySelectorAll('.triad-pill').forEach((p) => {
          p.classList.toggle('active', p === e.currentTarget);
        });

        const heroCard = main.querySelector('#hero-stage-card');
        if (heroCard && triadId) {
          heroCard.setAttribute('data-color-theme', triadId);
        }

        if (window.gsap) {
          window.gsap.fromTo(
            e.currentTarget,
            { scale: 0.86 },
            { scale: 1.12, duration: 0.32, ease: 'back.out(2)', overwrite: 'auto' }
          );
        }

        // Repaint the currently active 3D vehicle in-place without switching vehicles
        if (window.Apex3DViewer && typeof window.Apex3DViewer.changeCarColor === 'function') {
          window.Apex3DViewer.changeCarColor(appliedColor);
        }
      });
    });

    main.querySelectorAll('.pagination-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const carId = e.currentTarget.getAttribute('data-car');
        updateHero3DStage(carId, null, null, { direction: 'next' });
      });
    });

    // Circular Arrow Buttons & Flanking Blurred 3D Car Click Listeners
    main.querySelector('#hero-prev-vehicle-btn')?.addEventListener('click', (e) => {
      const prevId = e.currentTarget.getAttribute('data-prev-car');
      if (prevId) updateHero3DStage(prevId, null, null, { direction: 'prev' });
    });

    main.querySelector('#hero-next-vehicle-btn')?.addEventListener('click', (e) => {
      const nextId = e.currentTarget.getAttribute('data-next-car');
      if (nextId) updateHero3DStage(nextId, null, null, { direction: 'next' });
    });

    main.querySelector('#hero-flank-prev-btn')?.addEventListener('click', (e) => {
      const carId = e.currentTarget.getAttribute('data-car');
      if (carId) updateHero3DStage(carId, null, null, { direction: 'prev' });
    });

    main.querySelector('#hero-flank-next-btn')?.addEventListener('click', (e) => {
      const carId = e.currentTarget.getAttribute('data-car');
      if (carId) updateHero3DStage(carId, null, null, { direction: 'next' });
    });

    main.querySelector('#hero-inspect-dossier')?.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id') || 'apex-car-01';
      openVehicleModal(id, '3d');
    });

    // =========================================================================
    // GSAP + ScrollTrigger + Lenis Inertial Smooth Scroll & @uiuxzaid Video Choreography
    // =========================================================================
    function initLenisAndGsapChoreography() {
      const revealTargets = [
        ...main.querySelectorAll(
          '.editorial-lifestyle-section, .featured-collection-section, .catalog-filter-wrapper, .car-card'
        ),
        ...document.querySelectorAll('.site-footer')
      ];

      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        revealTargets.forEach((el) => el.classList.add('is-in-view'));
        return;
      }

      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      if (gsap && ScrollTrigger && !state.hasRegisteredScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        state.hasRegisteredScrollTrigger = true;
      }

      // Initialize Lenis Smooth Inertial Scroll Singleton synced with GSAP Ticker & ScrollTrigger
      if (typeof window.Lenis === 'function' && !state.lenis) {
        try {
          state.lenis = new window.Lenis({
            lerp: 0.09,
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.0
          });

          if (ScrollTrigger) {
            state.lenis.on('scroll', ScrollTrigger.update);
          }

          if (gsap && gsap.ticker) {
            gsap.ticker.add((time) => {
              state.lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
          } else {
            const rafLoop = (time) => {
              state.lenis.raf(time);
              requestAnimationFrame(rafLoop);
            };
            requestAnimationFrame(rafLoop);
          }
        } catch (err) {
          console.warn('Lenis initialization fallback:', err);
        }
      }

      window.ApexMotion = {
        lenis: state.lenis || null,
        gsap: gsap || null,
        ScrollTrigger: ScrollTrigger || null
      };

      // Smooth Anchor Navigation via Lenis
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        if (anchor.dataset.lenisBound === 'true') return;
        anchor.dataset.lenisBound = 'true';
        anchor.addEventListener('click', (ev) => {
          const href = anchor.getAttribute('href');
          if (!href || href === '#') return;
          const targetEl = document.querySelector(href);
          if (targetEl && state.lenis) {
            ev.preventDefault();
            state.lenis.scrollTo(targetEl, { offset: -24, duration: 1.15 });
          }
        });
      });

      // Fallback IntersectionObserver so .is-in-view class is always kept in sync
      if (state.editorialScrollObserver) {
        state.editorialScrollObserver.disconnect();
      }
      if (typeof IntersectionObserver !== 'undefined') {
        state.editorialScrollObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-in-view');
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );
        revealTargets.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.94) {
            el.classList.add('is-in-view');
          }
          state.editorialScrollObserver.observe(el);
        });
      } else {
        revealTargets.forEach((el) => el.classList.add('is-in-view'));
      }

      if (!gsap || !ScrollTrigger) return;

      // Clean up any previous ScrollTriggers created on earlier public view re-renders
      if (Array.isArray(state.gsapTriggers)) {
        state.gsapTriggers.forEach((st) => {
          try {
            st.kill();
          } catch (e) {}
        });
      }
      state.gsapTriggers = [];

      // 1. Hero Watermark Horizontal Scroll Parallax Scrub
      const heroWatermark = main.querySelector('#hero-watermark');
      const heroSection = main.querySelector('#hero-stage-viewport');
      if (heroWatermark && heroSection) {
        const stHero = ScrollTrigger.create({
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onUpdate: (self) => {
            heroWatermark.style.setProperty('--watermark-scroll-x', `${(self.progress * -95).toFixed(1)}px`);
          }
        });
        state.gsapTriggers.push(stHero);
      }

      // 2. Section 2 ("MORE THAN ENGINEERING, IT'S A LIFESTYLE") GSAP ScrollTrigger Choreography
      const lifestyleSec = main.querySelector('#lifestyle-section');
      if (lifestyleSec) {
        const lifeLeftItems = lifestyleSec.querySelectorAll(
          '.editorial-thin-heading, .editorial-body-copy, .lifestyle-price-cta-row, .lifestyle-thumbs-row'
        );
        const lifeCapsule = lifestyleSec.querySelector('.lifestyle-main-capsule');
        const lifeCapsuleImg = lifestyleSec.querySelector('.lifestyle-main-photo');
        const lifeCircle = lifestyleSec.querySelector('.lifestyle-circle-inset');

        const lifeTl = gsap.timeline({
          scrollTrigger: {
            trigger: lifestyleSec,
            start: 'top 82%',
            toggleActions: 'play none none none',
            onEnter: () => lifestyleSec.classList.add('is-in-view')
          }
        });

        lifeTl
          .fromTo(
            lifeLeftItems,
            { y: 36, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.78, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity' },
            0
          )
          .fromTo(
            lifeCapsule,
            {
              y: 52,
              opacity: 0,
              scale: 0.93,
              clipPath: 'inset(32% 0% 0% 0% round 999px)'
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              clipPath: 'inset(0% 0% 0% 0% round 999px)',
              duration: 1.0,
              ease: 'expo.out',
              clearProps: 'clipPath,transform,opacity'
            },
            0.08
          )
          .fromTo(
            lifeCapsuleImg,
            { scale: 1.22, yPercent: 8 },
            { scale: 1, yPercent: 0, duration: 1.15, ease: 'expo.out', clearProps: 'transform' },
            0.08
          )
          .fromTo(
            lifeCircle,
            { x: -34, scale: 0.68, rotation: -10, opacity: 0 },
            {
              x: 0,
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.85,
              ease: 'back.out(1.7)',
              clearProps: 'x,scale,rotation,opacity'
            },
            0.24
          );

        if (lifeTl.scrollTrigger) state.gsapTriggers.push(lifeTl.scrollTrigger);
      }

      // 3. Section 3 ("FEATURED COLLECTION") — Exact @uiuxzaid Video Reveal & Arch Unmask Wave
      const featuredSec = main.querySelector('#featured-collection-section');
      if (featuredSec) {
        const featWatermark = featuredSec.querySelector('#featured-watermark');
        const featHeading = featuredSec.querySelector('.featured-header-left');
        const featSwirlPath = featuredSec.querySelector('.editorial-swirl-svg path');
        const featRight = featuredSec.querySelector('.featured-header-right');
        const archCards = Array.from(featuredSec.querySelectorAll('.featured-arch-card'));
        const archCapsules = archCards.map((c) => c.querySelector('.featured-arch-capsule')).filter(Boolean);
        const archImgs = archCards.map((c) => c.querySelector('.featured-arch-img')).filter(Boolean);
        const archMetas = archCards.map((c) => c.querySelector('.featured-arch-meta')).filter(Boolean);

        // Colossal Warm "FEATURE" Watermark Horizontal Scrub + Differential Arch Scroll Parallax
        const stFeatureScrub = ScrollTrigger.create({
          trigger: featuredSec,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.65,
          onUpdate: (self) => {
            if (featWatermark) {
              const shift = (0.5 - self.progress) * 145;
              featWatermark.style.setProperty('--feature-scroll-x', `${shift.toFixed(1)}px`);
            }
            // Subtle differential vertical parallax on the center vs outer arches during Lenis scroll
            const centerLift = (0.5 - self.progress) * 22;
            archCards.forEach((card, i) => {
              const offset = i === 1 ? -centerLift : centerLift * 0.45;
              card.style.setProperty('--arch-scroll-y', `${offset.toFixed(1)}px`);
            });
          }
        });
        state.gsapTriggers.push(stFeatureScrub);

        // Main Featured Collection Entrance Timeline (Header + Swirl Draw + 3 Stadium Arch Unmask Wave)
        const featTl = gsap.timeline({
          scrollTrigger: {
            trigger: featuredSec,
            start: 'top 80%',
            toggleActions: 'play none none none',
            onEnter: () => featuredSec.classList.add('is-in-view')
          }
        });

        featTl
          .fromTo(
            featHeading,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.78, ease: 'power3.out', clearProps: 'transform,opacity' },
            0
          )
          .fromTo(
            featSwirlPath,
            { strokeDashoffset: 180 },
            { strokeDashoffset: 0, duration: 0.95, ease: 'power2.inOut' },
            0.16
          )
          .fromTo(
            featRight,
            { y: 32, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.78, ease: 'power3.out', clearProps: 'transform,opacity' },
            0.12
          )
          .fromTo(
            archCards,
            { y: 68, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.95,
              stagger: 0.14,
              ease: 'expo.out',
              clearProps: 'transform,opacity'
            },
            0.18
          )
          .fromTo(
            archCapsules,
            {
              clipPath: 'inset(42% 0% 0% 0% round 999px)',
              scale: 0.92
            },
            {
              clipPath: 'inset(0% 0% 0% 0% round 999px)',
              scale: 1,
              duration: 1.05,
              stagger: 0.14,
              ease: 'expo.out',
              clearProps: 'clipPath,scale'
            },
            0.18
          )
          .fromTo(
            archImgs,
            { scale: 1.24, yPercent: 10 },
            {
              scale: 1,
              yPercent: 0,
              duration: 1.18,
              stagger: 0.14,
              ease: 'expo.out',
              clearProps: 'transform'
            },
            0.18
          )
          .fromTo(
            archMetas,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              stagger: 0.14,
              ease: 'power3.out',
              clearProps: 'transform,opacity'
            },
            0.42
          );

        if (featTl.scrollTrigger) state.gsapTriggers.push(featTl.scrollTrigger);

        // Interactive GSAP Magnetic Arch Hover + Dynamic "FEATURE" Watermark Tinting
        const watermarkTints = [
          'rgba(186, 170, 220, 0.30)', // Arch 1 Lavender
          'rgba(235, 178, 152, 0.30)', // Arch 2 Warm Peach
          'rgba(162, 200, 230, 0.30)'  // Arch 3 Sky Glacier
        ];

        archCards.forEach((card, idx) => {
          const capsule = card.querySelector('.featured-arch-capsule');
          const img = card.querySelector('.featured-arch-img');
          const hoverPill = card.querySelector('.featured-arch-hover-pill');

          card.addEventListener('mouseenter', () => {
            if (capsule) {
              gsap.to(capsule, { y: -10, scale: 1.018, duration: 0.42, ease: 'power3.out', overwrite: 'auto' });
            }
            if (img) {
              gsap.to(img, { scale: 1.08, duration: 0.48, ease: 'power3.out', overwrite: 'auto' });
            }
            if (hoverPill) {
              gsap.to(hoverPill, { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out', overwrite: 'auto' });
            }
            if (featWatermark) {
              featWatermark.style.color = watermarkTints[idx] || watermarkTints[1];
            }
          });

          card.addEventListener(
            'mousemove',
            (ev) => {
              if (!capsule || !img) return;
              const rect = capsule.getBoundingClientRect();
              const rx = (ev.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
              const ry = (ev.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
              gsap.to(img, {
                x: rx * 14,
                y: ry * 10,
                scale: 1.08,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
              });
            },
            { passive: true }
          );

          card.addEventListener('mouseleave', () => {
            if (capsule) {
              gsap.to(capsule, { y: 0, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
            }
            if (img) {
              gsap.to(img, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
            }
            if (hoverPill) {
              gsap.to(hoverPill, { y: 10, opacity: 0, duration: 0.26, ease: 'power2.in', overwrite: 'auto' });
            }
            if (featWatermark) {
              featWatermark.style.color = 'rgba(235, 178, 152, 0.22)';
            }
          });
        });
      }

      if (ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
        ScrollTrigger.refresh();
      }
    }

    initHero3DViewer();
    if (state.active3DCarId) {
      updateHero3DStage(state.active3DCarId, state.activeColorHex, state.activeTriadId, { skipTransition: true });
    }
    initLenisAndGsapChoreography();
  }

  // Render Admin Owner Panel
  function renderAdminView() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const kpis = STORE.getKPIs();
    const vehicles = STORE.getVehicles();

    main.innerHTML = `
      <section class="admin-section">
        <div class="admin-header-bar">
          <div>
            <h1 class="admin-header-title">
              Dealership Operations Console
              <span class="admin-header-badge">Live Owner Mode</span>
            </h1>
            <p class="admin-header-subtitle">
              Manage inventory, update instantaneous sales status, and adjust vehicle specifications.
            </p>
          </div>

          <div class="admin-actions-group">
            <button type="button" class="btn-gold-primary" id="btn-admin-add-car">
              + Add New Vehicle
            </button>
            <button type="button" class="btn-secondary" id="btn-admin-reset-demo">
              Reset Demo Seed
            </button>
            <button type="button" class="btn-secondary" id="btn-admin-exit">
              Exit to Catalog
            </button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Total Units</div>
            <div class="kpi-value gold" id="kpi-total-units">${kpis.total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Available in Stock</div>
            <div class="kpi-value emerald" id="kpi-avail-units">${kpis.available}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Sale Reserved</div>
            <div class="kpi-value amber" id="kpi-res-units">${kpis.reserved}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Sold Units</div>
            <div class="kpi-value slate" id="kpi-sold-units">${kpis.sold}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Inventory Value (${STORE.getCurrency()})</div>
            <div class="kpi-value gold" id="kpi-total-val">
              ${kpis.totalValueFormatted}
            </div>
          </div>
        </div>

        <div class="admin-table-container">
          <table class="admin-table" id="admin-inventory-table">
            <thead>
              <tr>
                <th>Vehicle Details</th>
                <th>Price (${STORE.getCurrency()})</th>
                <th>Mileage</th>
                <th>1-Click Status Toggle</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles
                .map((car) => {
                  const img = (car.images && car.images[0]) || STUDIO_IMAGES.porscheStudio;
                  return `
                  <tr data-id="${car.id}">
                    <td>
                      <div class="admin-vehicle-cell">
                        <img src="${img}" alt="${car.make} ${car.model}" class="admin-thumb" referrerPolicy="no-referrer" />
                        <div>
                          <div class="admin-car-title">${car.year} ${car.make} ${car.model}</div>
                          <div class="admin-car-vin">VIN: ${car.vin} · ${car.exteriorColor}</div>
                        </div>
                      </div>
                    </td>
                    <td class="admin-price-cell">
                      ${STORE.formatPrice(car.priceUSD)}
                    </td>
                    <td class="admin-mileage-cell">
                      ${new Intl.NumberFormat().format(car.mileage)} mi
                    </td>
                    <td>
                      <div class="status-pill-group" role="group" aria-label="Status Toggle for ${car.make} ${car.model}">
                        <button
                          type="button"
                          class="status-toggle-pill btn-toggle-status ${car.status === 'available' ? 'active-avail' : ''}"
                          data-id="${car.id}"
                          data-status="available"
                        >
                          Available
                        </button>
                        <button
                          type="button"
                          class="status-toggle-pill btn-toggle-status ${car.status === 'reserved' ? 'active-res' : ''}"
                          data-id="${car.id}"
                          data-status="reserved"
                        >
                          Reserved
                        </button>
                        <button
                          type="button"
                          class="status-toggle-pill btn-toggle-status ${car.status === 'sold' ? 'active-sold' : ''}"
                          data-id="${car.id}"
                          data-status="sold"
                        >
                          Sold
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="admin-action-btn-group" style="justify-content: flex-end;">
                        <button type="button" class="btn-icon btn-admin-edit" data-id="${car.id}" aria-label="Edit ${car.make} ${car.model}">
                          Edit
                        </button>
                        <button type="button" class="btn-icon danger btn-admin-delete" data-id="${car.id}" aria-label="Delete ${car.make} ${car.model}">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    main.querySelector('#btn-admin-add-car')?.addEventListener('click', () => {
      openAdminCarModal(null);
    });

    main.querySelector('#btn-admin-reset-demo')?.addEventListener('click', () => {
      STORE.resetSeedData();
      showToast('Demo inventory restored to factory seeds', 'success');
      renderAdminView();
    });

    main.querySelector('#btn-admin-exit')?.addEventListener('click', () => {
      state.view = 'public';
      renderApp();
      showToast('Returned to Public Catalog');
    });

    main.querySelectorAll('.btn-toggle-status').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const nextStatus = e.currentTarget.getAttribute('data-status');
        const updated = STORE.toggleStatus(id, nextStatus);
        if (updated) {
          showToast(`Status updated to "${nextStatus.toUpperCase()}" for ${updated.model}`, 'success');
          renderAdminView();
        }
      });
    });

    main.querySelectorAll('.btn-admin-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openAdminCarModal(id);
      });
    });

    main.querySelectorAll('.btn-admin-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const car = STORE.getVehicle(id);
        const name = car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle';
        STORE.deleteVehicle(id);
        showToast(`Deleted ${name} from inventory`, 'success');
        renderAdminView();
      });
    });
  }

  // Render Dark Rounded-Top Contrast Footer (Matching Frame 00:16 of @uiuxzaid Video)
  function renderFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) return;

    footer.innerHTML = `
      <div class="footer-container">
        <!-- Col 1: Brand & Social Circle Icons -->
        <div>
          <div class="footer-brand-title">APEX.</div>
          <p class="footer-text">
            Beverly Hills’ premier private automobile gallery. Curating rare-specification Porsches, Maranello V8s, and bespoke executive transport.
          </p>
          <div class="footer-social-circles" aria-label="Official Social Channels">
            <a href="https://instagram.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="footer-social-circle" aria-label="Instagram">IG</a>
            <a href="https://tiktok.com/@apexauto" target="_blank" rel="noopener noreferrer" class="footer-social-circle" aria-label="TikTok">TK</a>
            <a href="https://facebook.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="footer-social-circle" aria-label="Facebook">FB</a>
          </div>
        </div>

        <!-- Col 2: COMPANY -->
        <div>
          <h4 class="footer-col-title">COMPANY</h4>
          <ul class="footer-link-list">
            <li><a href="#hero-stage-viewport">Home</a></li>
            <li><a href="#lifestyle-section">Atelier Philosophy</a></li>
            <li><a href="#featured-collection-section">Featured Collection</a></li>
            <li><a href="#catalog">Showroom Inventory</a></li>
          </ul>
        </div>

        <!-- Col 3: FAQ & SERVICES -->
        <div>
          <h4 class="footer-col-title">FAQ</h4>
          <ul class="footer-link-list">
            <li><a href="#catalog">Private Acquisition</a></li>
            <li><a href="#catalog">Global Enclosed Delivery</a></li>
            <li><a href="#catalog">Provenance Verification</a></li>
            <li><a href="#catalog">Multi-Currency Wire</a></li>
          </ul>
        </div>

        <!-- Col 4: RESOURCES & CONCIERGE -->
        <div>
          <h4 class="footer-col-title">RESOURCES</h4>
          <ul class="footer-link-list">
            <li><a href="#hero-stage-viewport">3D Configurator Guide</a></li>
            <li><a href="https://wa.me/15550192834" target="_blank" rel="noopener noreferrer">WhatsApp Concierge</a></li>
            <li><a href="#catalog">742 Evergreen Motorway, BH</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-bar">
        <div>
          Copyright © ${new Date().getFullYear()} Apex Auto Lounge. All rights reserved.
        </div>
        <div class="footer-legal-links">
          <a href="#catalog">Privacy Policy</a>
          <a href="#catalog">Consignment Terms</a>
          <a href="#catalog">Global Delivery</a>
        </div>
      </div>
    `;
  }

  // Admin PIN Gate Modal
  function openPinModal() {
    let overlay = document.getElementById('pin-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pin-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-window pin-modal-window">
          <button type="button" class="modal-close-btn" id="btn-close-pin-modal" aria-label="Close modal">✕</button>
          <h2 class="modal-heading">Owner Access Verification</h2>
          <p class="modal-subtext">
            Enter the 4-digit showroom authorization passcode to unlock the management portal.
          </p>
          <label for="admin-pin-input" class="sr-only">4-Digit Showroom PIN</label>
          <input type="password" id="admin-pin-input" class="pin-input" maxlength="4" placeholder="••••" autocomplete="off" />
          <div>
            <span class="pin-demo-badge">Demo Showroom PIN: <strong>2026</strong></span>
          </div>
          <button type="button" class="btn-gold-primary" id="btn-submit-pin" style="width: 100%; justify-content: center;">
            Authorize Access
          </button>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#btn-close-pin-modal')?.addEventListener('click', () => {
        overlay.classList.remove('is-active');
      });

      overlay.querySelector('#btn-submit-pin')?.addEventListener('click', verifyPin);
      overlay.querySelector('#admin-pin-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') verifyPin();
      });
    }

    const pinInput = overlay.querySelector('#admin-pin-input');
    if (pinInput) pinInput.value = '';
    overlay.classList.add('is-active');
    setTimeout(() => pinInput?.focus(), 120);

    function verifyPin() {
      const pin = overlay.querySelector('#admin-pin-input')?.value;
      if (pin === '2026') {
        state.isAdmin = true;
        state.view = 'admin';
        overlay.classList.remove('is-active');
        showToast('Showroom Owner Mode Authenticated', 'success');
        renderApp();
      } else {
        showToast('Invalid passcode. Use demo PIN: 2026', 'error');
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    }
  }

  // Vehicle Detail Modal
  function openVehicleModal(carId, defaultTab = 'photo') {
    const car = STORE.getVehicle(carId);
    if (!car) return;

    let overlay = document.getElementById('vehicle-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'vehicle-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const formattedPrice = STORE.formatPrice(car.priceUSD);
    const images = car.images && car.images.length > 0 ? car.images : [STUDIO_IMAGES.porscheStudio];
    const activeImg = images[0];

    const statusBadgeClass =
      car.status === 'available'
        ? 'badge-available'
        : car.status === 'reserved'
        ? 'badge-reserved'
        : 'badge-sold';

    const whatsappMsg = encodeURIComponent(
      `Hello Apex Auto Lounge, I am inquiring about the ${car.year} ${car.make} ${car.model} (${formattedPrice}, VIN: ${car.vin}). I would like to schedule a viewing.`
    );

    const has3D = Boolean(car.sketchfabId);
    const startWith3D = defaultTab === '3d' && has3D;

    overlay.innerHTML = `
      <div class="modal-window" style="max-width: 960px;">
        <button type="button" class="modal-close-btn" id="btn-close-vehicle-modal" aria-label="Close modal">✕</button>

        <div class="detail-modal-layout">
          <div class="media-tabs-bar">
            <button class="media-tab-btn ${!startWith3D ? 'active' : ''}" id="tab-media-photo" type="button">
              4K Studio Gallery
            </button>
            <button class="media-tab-btn ${startWith3D ? 'active' : ''}" id="tab-media-3d" type="button" ${has3D ? '' : 'style="display:none;"'}>
              Interactive 3D 360° (Sketchfab)
            </button>
          </div>

          <div class="detail-modal-gallery" id="media-viewer-photo" style="${startWith3D ? 'display: none;' : ''}">
            <img src="${activeImg}" alt="${car.make} ${car.model}" class="detail-main-img" id="detail-main-display" referrerPolicy="no-referrer" />
            ${
              images.length > 1
                ? `
              <div class="detail-thumbnails-strip">
                ${images
                  .map(
                    (img, idx) => `
                  <img src="${img}" alt="Thumbnail ${idx + 1}" class="detail-thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}" referrerPolicy="no-referrer" />
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>

          <div id="media-viewer-3d" style="${!startWith3D ? 'display: none;' : ''}">
            ${
              has3D
                ? `
              <div class="sketchfab-embed-wrapper">
                <iframe title="${car.year} ${car.make} ${car.model} 3D Model"
                  class="sketchfab-iframe"
                  frameborder="0"
                  allowfullscreen
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  src="https://sketchfab.com/models/${car.sketchfabId}/embed?autostart=1&camera=0&preload=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_stop=0">
                </iframe>
                <div class="sketchfab-controls-hint">
                  <span>Left-Click: Orbit 360°</span>
                  <span>Right-Click: Pan</span>
                  <span>Scroll: Zoom In / Out</span>
                </div>
              </div>
            `
                : ''
            }
          </div>

          <div class="detail-modal-body">
            <div class="detail-title-row">
              <div>
                <span class="car-card-badge ${statusBadgeClass}" style="position: static; display: inline-block; margin-bottom: 0.5rem;">
                  ${car.status.toUpperCase()}
                </span>
                <h2 class="detail-car-name">${car.year} ${car.make} ${car.model}</h2>
                <div class="detail-vin-line">
                  VIN: <span>${car.vin}</span>
                </div>
              </div>

              <div>
                <div class="detail-price-kicker">Showroom Price</div>
                <div class="detail-car-price">${formattedPrice}</div>
              </div>
            </div>

            <p class="detail-car-description">
              ${car.description}
            </p>

            <h4 class="detail-section-subtitle">Technical Specifications</h4>
            <div class="specs-grid">
              <div class="spec-cell">
                <span class="spec-cell-label">Engine & Powertrain</span>
                <span class="spec-cell-value">${car.engine}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-cell-label">Horsepower</span>
                <span class="spec-cell-value">${car.horsepower} HP</span>
              </div>
              <div class="spec-cell">
                <span class="spec-cell-label">Transmission</span>
                <span class="spec-cell-value">${car.transmission}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-cell-label">Odometer Mileage</span>
                <span class="spec-cell-value">${new Intl.NumberFormat().format(car.mileage)} miles</span>
              </div>
              <div class="spec-cell">
                <span class="spec-cell-label">Exterior Finish</span>
                <span class="spec-cell-value">${car.exteriorColor}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-cell-label">Interior Cabin</span>
                <span class="spec-cell-value">${car.interiorColor}</span>
              </div>
            </div>

            <h4 class="detail-section-subtitle">Installed Factory Options & Packages</h4>
            <div class="features-list">
              ${(car.features || [])
                .map(
                  (f) => `
                <div class="feature-item">
                  <span class="feature-item-icon">✓</span>
                  <span>${f}</span>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="detail-modal-cta-row">
              <a
                href="https://wa.me/15550192834?text=${whatsappMsg}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-gold-primary"
                style="flex: 1; justify-content: center;"
              >
                Inquire on WhatsApp
              </a>
              <a
                href="tel:+18005552739"
                class="btn-secondary"
                style="flex: 1; text-align: center; justify-content: center; display: inline-flex; align-items: center;"
              >
                Call Showroom (+1 800 555-APEX)
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.classList.add('is-active');

    overlay.querySelector('#btn-close-vehicle-modal')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
      const iframe = overlay.querySelector('.sketchfab-iframe');
      if (iframe) iframe.src = 'about:blank';
    });

    const tabPhoto = overlay.querySelector('#tab-media-photo');
    const tab3D = overlay.querySelector('#tab-media-3d');
    const viewPhoto = overlay.querySelector('#media-viewer-photo');
    const view3D = overlay.querySelector('#media-viewer-3d');

    tabPhoto?.addEventListener('click', () => {
      tabPhoto.classList.add('active');
      tab3D?.classList.remove('active');
      if (viewPhoto) viewPhoto.style.display = '';
      if (view3D) view3D.style.display = 'none';
    });

    tab3D?.addEventListener('click', () => {
      tab3D.classList.add('active');
      tabPhoto?.classList.remove('active');
      if (viewPhoto) viewPhoto.style.display = 'none';
      if (view3D) view3D.style.display = '';
    });

    overlay.querySelectorAll('.detail-thumb-item').forEach((thumb) => {
      thumb.addEventListener('click', (e) => {
        overlay.querySelectorAll('.detail-thumb-item').forEach((t) => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mainImg = overlay.querySelector('#detail-main-display');
        if (mainImg) mainImg.src = e.currentTarget.getAttribute('data-src');
      });
    });
  }

  // Admin Add / Edit Vehicle Modal
  function openAdminCarModal(carId) {
    const isEdit = Boolean(carId);
    const car = isEdit ? STORE.getVehicle(carId) : null;

    let overlay = document.getElementById('admin-car-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'admin-car-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const defaultImg = (car && car.images && car.images[0]) || STUDIO_IMAGES.porscheStudio;

    overlay.innerHTML = `
      <div class="modal-window" style="max-width: 800px;">
        <button type="button" class="modal-close-btn" id="btn-close-admin-car-modal" aria-label="Close modal">✕</button>

        <div class="admin-modal-header">
          <h2>${isEdit ? 'Edit Vehicle Specifications' : 'Register New Exotic Vehicle'}</h2>
          <p>Provide complete mechanical and visual information to display to prospective buyers.</p>
        </div>

        <form id="admin-car-form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Manufacturer / Make</label>
            <input type="text" name="make" class="form-input" required value="${car ? car.make : ''}" placeholder="e.g. Porsche" />
          </div>

          <div class="form-group">
            <label class="form-label">Model Designation</label>
            <input type="text" name="model" class="form-input" required value="${car ? car.model : ''}" placeholder="e.g. 911 GT3 RS" />
          </div>

          <div class="form-group">
            <label class="form-label">Model Year</label>
            <input type="number" name="year" class="form-input" required value="${car ? car.year : 2024}" min="1970" max="2026" />
          </div>

          <div class="form-group">
            <label class="form-label">Price (USD $)</label>
            <input type="number" name="priceUSD" class="form-input" required value="${car ? car.priceUSD : 150000}" min="1000" />
          </div>

          <div class="form-group">
            <label class="form-label">Mileage (Odometer)</label>
            <input type="number" name="mileage" class="form-input" required value="${car ? car.mileage : 1200}" min="0" />
          </div>

          <div class="form-group">
            <label class="form-label">Horsepower (HP)</label>
            <input type="number" name="horsepower" class="form-input" required value="${car ? car.horsepower : 500}" min="100" />
          </div>

          <div class="form-group">
            <label class="form-label">Body Style</label>
            <select name="bodyType" class="form-select">
              <option value="Coupe" ${car && car.bodyType === 'Coupe' ? 'selected' : ''}>Coupe</option>
              <option value="SUV" ${car && car.bodyType === 'SUV' ? 'selected' : ''}>SUV</option>
              <option value="Sedan" ${car && car.bodyType === 'Sedan' ? 'selected' : ''}>Sedan</option>
              <option value="Convertible" ${car && car.bodyType === 'Convertible' ? 'selected' : ''}>Convertible</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Transmission</label>
            <select name="transmission" class="form-select">
              <option value="Automatic" ${car && car.transmission === 'Automatic' ? 'selected' : ''}>Automatic</option>
              <option value="PDK" ${car && car.transmission === 'PDK' ? 'selected' : ''}>PDK / Dual-Clutch</option>
              <option value="Manual" ${car && car.transmission === 'Manual' ? 'selected' : ''}>Manual</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-select">
              <option value="available" ${car && car.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="reserved" ${car && car.status === 'reserved' ? 'selected' : ''}>Reserved</option>
              <option value="sold" ${car && car.status === 'sold' ? 'selected' : ''}>Sold</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Exterior Color</label>
            <input type="text" name="exteriorColor" class="form-input" required value="${car ? car.exteriorColor : 'Arctic Grey'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Interior Color</label>
            <input type="text" name="interiorColor" class="form-input" required value="${car ? car.interiorColor : 'Black Leather / Alcantara'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Engine Designation</label>
            <input type="text" name="engine" class="form-input" required value="${car ? car.engine : '4.0L Twin-Turbo V8'}" />
          </div>

          <div class="form-group col-span-2">
            <label class="form-label">Vehicle Identification Number (VIN)</label>
            <input type="text" name="vin" class="form-input" required value="${car ? car.vin : `VIN${Date.now().toString().slice(-8)}`}" />
          </div>

          <div class="form-group col-span-2">
            <label class="form-label">Primary Image URL</label>
            <input type="text" name="image" class="form-input" required value="${defaultImg}" />
          </div>

          <div class="form-group col-span-2">
            <label class="form-label" for="car-sketchfab">Sketchfab 3D Model URL or ID (Optional)</label>
            <input type="text" id="car-sketchfab" name="sketchfab" class="form-input" value="${car && car.sketchfabId ? car.sketchfabId : ''}" placeholder="e.g. 456b3d9d60b646369d76667848d6d027" />
          </div>

          <div class="form-group col-span-2">
            <label class="form-label">Vehicle Overview & Description</label>
            <textarea name="description" class="form-textarea" rows="3">${car ? car.description : 'Exceptional condition with verified provenance and full factory warranty.'}</textarea>
          </div>

          <div class="form-footer-actions">
            <button type="button" class="btn-secondary" id="btn-cancel-admin-car">Cancel</button>
            <button type="submit" class="btn-gold-primary">
              ${isEdit ? 'Save Changes' : 'Publish Vehicle to Showroom'}
            </button>
          </div>
        </form>
      </div>
    `;

    overlay.classList.add('is-active');

    overlay.querySelector('#btn-close-admin-car-modal')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
    });

    overlay.querySelector('#btn-cancel-admin-car')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
    });

    const form = overlay.querySelector('#admin-car-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        make: fd.get('make'),
        model: fd.get('model'),
        year: Number(fd.get('year')),
        priceUSD: Number(fd.get('priceUSD')),
        mileage: Number(fd.get('mileage')),
        horsepower: Number(fd.get('horsepower')),
        bodyType: fd.get('bodyType'),
        transmission: fd.get('transmission'),
        status: fd.get('status'),
        exteriorColor: fd.get('exteriorColor'),
        interiorColor: fd.get('interiorColor'),
        engine: fd.get('engine'),
        vin: fd.get('vin'),
        sketchfabId: fd.get('sketchfab') ? String(fd.get('sketchfab')).trim() : null,
        image: fd.get('image'),
        description: fd.get('description')
      };

      if (isEdit) {
        STORE.updateVehicle(carId, payload);
        showToast(`Updated specs for ${payload.make} ${payload.model}`, 'success');
      } else {
        STORE.addVehicle(payload);
        showToast(`Added ${payload.make} ${payload.model} to showroom`, 'success');
      }

      overlay.classList.remove('is-active');
      renderAdminView();
    });
  }

  function renderApp() {
    renderHeader();
    if (state.view === 'admin' && state.isAdmin) {
      renderAdminView();
    } else {
      renderPublicView();
    }
    renderFooter();
  }

  document.addEventListener('DOMContentLoaded', () => {
    STORE.subscribe(() => {
      renderApp();
    });
    renderApp();
  });
})(window, document);
