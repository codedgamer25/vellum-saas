/**
 * Apex Auto Lounge - Dealership Application Core Logic
 * Components: Navbar, HeroFilterBar, PublicCatalog, VehicleDetailModal, AdminOwnerPanel, AdminVehicleModal, ContactFooter
 */

(function (window, document) {
  'use strict';

  const STORE = window.ApexStore;
  if (!STORE) {
    console.error('ApexStore not found. Ensure dealership-store.js is loaded prior to dealership-app.js');
    return;
  }

  // Marco Perez 2-Base + 1-Pop Color Triads
  const MARCO_PEREZ_TRIADS = {
    'midnight-coral': {
      id: 'midnight-coral',
      name: 'Midnight & Coral',
      fullName: 'Midnight Navy & Coral Orange',
      carId: 'ferrari-roma-2023',
      watermark: 'ROMA V8',
      popColor: '#FD6E6E',
      baseDark: '#00243A',
      baseSoft: '#B6DFED',
      tagline: 'Soft blue & midnight navy. Add coral orange, now it feels like a brand.'
    },
    'raven-poppy': {
      id: 'raven-poppy',
      name: 'Raven & Poppy',
      fullName: 'Raven Black & Poppy Red',
      carId: 'porsche-gt3-rs-2024',
      watermark: '911 GT3 RS',
      popColor: '#FF3B30',
      baseDark: '#0B0D12',
      baseSoft: '#8BB4D0',
      tagline: 'Raven black & powder blue. Add Poppy red, now it is impossible to ignore.'
    },
    'pine-butter': {
      id: 'pine-butter',
      name: 'Pine & Butter',
      fullName: 'Pale Pine & Butter Yellow',
      carId: 'mercedes-amg-g63-2024',
      watermark: 'AMG G63',
      popColor: '#FCE788',
      baseDark: '#1A3528',
      baseSoft: '#4A121A',
      tagline: 'Pale pine & deep burgundy. Add butter yellow, now look at the packaging.'
    },
    'obsidian-gold': {
      id: 'obsidian-gold',
      name: 'Obsidian & Gold',
      fullName: 'Obsidian Black & Champagne Gold',
      carId: 'audi-rs6-avant-2024',
      watermark: 'RS6 AVANT',
      popColor: '#D4AF37',
      baseDark: '#0A0A0C',
      baseSoft: '#1A1A24',
      tagline: 'The smallest color can make the biggest difference.'
    }
  };

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
    activeColorHex: '#FD6E6E',
    heroViewer: null
  };

  // Toast Notification Helper (Sonner style)
  function showToast(message, type = 'info') {
    let container = document.getElementById('royal-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'royal-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `royal-toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '✦';
    toast.innerHTML = `<span style="font-weight: 700; color: var(--color-gold);">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // Filter and Sort Vehicles
  function getFilteredVehicles() {
    const all = STORE.getVehicles();
    return all.filter((car) => {
      // Keyword filter
      if (state.filters.keyword) {
        const q = state.filters.keyword.toLowerCase();
        const matches =
          car.make.toLowerCase().includes(q) ||
          car.model.toLowerCase().includes(q) ||
          String(car.year).includes(q) ||
          (car.vin && car.vin.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Make filter
      if (state.filters.make !== 'all') {
        if (car.make.toLowerCase() !== state.filters.make.toLowerCase()) return false;
      }

      // Status filter
      if (state.filters.status !== 'all') {
        if (car.status !== state.filters.status) return false;
      }

      // Price filter
      if (car.priceUSD > state.filters.priceMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (state.filters.sortBy) {
        case 'price-asc':
          return a.priceUSD - b.priceUSD;
        case 'price-desc':
          return b.priceUSD - a.priceUSD;
        case 'year-desc':
          return b.year - a.year;
        case 'mileage-asc':
          return a.mileage - b.mileage;
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });
  }

  // Render Header
  function renderHeader() {
    const header = document.getElementById('app-header');
    if (!header) return;

    const currentCurrency = STORE.getCurrency();
    const currencies = ['USD', 'NGN', 'GBP', 'EUR'];

    header.innerHTML = `
      <div class="header-container">
        <a href="#" class="brand-wrapper" id="nav-brand-home">
          <div class="brand-logo">
            <span class="brand-icon">✦</span> APEX AUTO LOUNGE
          </div>
          <div class="brand-subtitle">PREMIER EXOTIC & LUXURY SHOWROOM</div>
        </a>

        <div class="nav-actions">
          <!-- Currency Switcher -->
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

          <!-- Mode Switcher -->
          <button type="button" class="btn-mode-toggle ${state.view === 'admin' ? 'is-admin-active' : ''}" id="btn-toggle-mode">
            ${state.view === 'admin' ? '✕ Exit Admin View' : '🔒 Owner Admin'}
          </button>
        </div>
      </div>
    `;

    // Attach listeners
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

    const modeBtn = header.querySelector('#btn-toggle-mode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        if (state.view === 'admin') {
          state.view = 'public';
          renderApp();
          showToast('Switched to Public Catalog View');
        } else {
          if (state.isAdmin) {
            state.view = 'admin';
            renderApp();
          } else {
            openPinModal();
          }
        }
      });
    }
  }

  // Render Hero & Public Catalog
  function renderPublicView() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const filtered = getFilteredVehicles();
    const makes = ['all', 'Porsche', 'Mercedes-Benz', 'BMW', 'Audi', 'Range Rover', 'Ferrari', 'Tesla', 'Aston Martin'];

    const currentTriad = MARCO_PEREZ_TRIADS[state.activeTriadId] || MARCO_PEREZ_TRIADS['midnight-coral'];
    const currentCar = STORE.getFeatured3DCar(state.active3DCarId) || STORE.getFeatured3DCar(currentTriad.carId);

    main.innerHTML = `
      <!-- Hero Stage — Pinterest Inspired Luxury Rounded 3D Showroom Card -->
      <section class="hero-stage-viewport" id="hero-stage-viewport" data-hero-theme="${currentCar.id}">
        <div class="hero-stage-card" id="hero-stage-card" data-hero-theme="${currentCar.id}" data-color-theme="${currentTriad.id}">
          <!-- Colossal Typographic Background Watermark -->
          <div class="hero-watermark-text" id="hero-watermark" aria-hidden="true">
            ${currentTriad.watermark}
          </div>

          <!-- Local Three.js 3D Model Stage Canvas & Instant High-Res Visual Fallback -->
          <div class="hero-3d-stage-viewport" id="hero-3d-stage-container">
            <canvas id="hero-3d-canvas" class="hero-3d-canvas"></canvas>
            <div class="hero-3d-instant-fallback" id="hero-3d-instant-fallback">
              <img 
                id="hero-3d-fallback-img" 
                class="hero-3d-car-img" 
                src="./models/ferrari_render.png" 
                alt="Apex Auto Lounge Curated Hypercar" 
                loading="eager"
              />
            </div>
          </div>

          <!-- Glassmorphic Card Foreground Overlay Content -->
          <div class="hero-card-content">
            <!-- Top Row: Badge & Segmented Car Switcher -->
            <header class="hero-card-top-row">
              <div class="hero-curated-badge">
                <span>✦</span> 2024 CURATED HYPERCAR SERIES
              </div>

              <!-- Segmented Control Car Switcher -->
              <div class="hero-car-switcher" id="hero-car-switcher" role="tablist" aria-label="3D Hero Car Switcher">
                <button type="button" class="apple-switcher-btn ${currentCar.id === 'porsche-gt3-rs-2024' ? 'active' : ''}" id="switcher-porsche" data-car="porsche-gt3-rs-2024">
                  Porsche 911 GT3 RS
                </button>
                <button type="button" class="apple-switcher-btn ${currentCar.id === 'ferrari-roma-2023' ? 'active' : ''}" id="switcher-ferrari" data-car="ferrari-roma-2023">
                  Ferrari Roma V8
                </button>
                <button type="button" class="apple-switcher-btn ${currentCar.id === 'mercedes-amg-g63-2024' ? 'active' : ''}" id="switcher-amg" data-car="mercedes-amg-g63-2024">
                  Mercedes-AMG G63
                </button>
                <button type="button" class="apple-switcher-btn ${currentCar.id === 'audi-rs6-avant-2024' ? 'active' : ''}" id="switcher-audi" data-car="audi-rs6-avant-2024">
                  Audi RS6 Avant
                </button>
              </div>

              <div class="hero-top-delivery-badge" style="display: none;">
                <span>✦</span> IMMEDIATE DELIVERY
              </div>
            </header>

            <!-- Mid Row: Editorial Headline/CTA on Left, Spec/Color Selectors on Right -->
            <div class="hero-card-middle">
              <!-- Left Editorial Column -->
              <div class="hero-left-editorial">
                <h1 class="hero-headline">
                  Designed for <br><span class="theme-accent-text" id="hero-accent-text">Velocity.</span>
                </h1>
                <p class="hero-editorial-desc">
                  Direct access to authenticated, low-mileage exotic supercars and executive transport. Available for immediate private acquisition.
                </p>
                <div class="hero-cta-group">
                  <a 
                    href="https://wa.me/15550192834?text=Hi%20Apex%20Auto%20Lounge%2C%20I%20am%20inquiring%20about%20the%202024%20Porsche%20911%20GT3%20RS%20featured%20on%20the%203D%20Showroom."
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-hero-primary-pill hero-action-whatsapp"
                    id="hero-whatsapp-reserve"
                  >
                    <span>💬</span> Reserve via WhatsApp
                  </a>
                  <button 
                    type="button" 
                    class="btn-hero-secondary-pill hero-action-dossier" 
                    id="hero-inspect-dossier"
                    data-id="apex-car-01"
                  >
                    <span>📄</span> Inspect Dossier
                  </button>
                </div>

                <!-- Social Links at Bottom-Left (Instagram, TikTok, Facebook) -->
                <div class="hero-social-links" aria-label="Social Channels">
                  <a href="https://instagram.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="hero-social-icon" title="Instagram @apexautolounge" aria-label="Instagram">
                    <span>📷</span>
                  </a>
                  <a href="https://tiktok.com/@apexauto" target="_blank" rel="noopener noreferrer" class="hero-social-icon" title="TikTok @apexauto" aria-label="TikTok">
                    <span>🎵</span>
                  </a>
                  <a href="https://facebook.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="hero-social-icon" title="Facebook /apexautolounge" aria-label="Facebook">
                    <span>🌐</span>
                  </a>
                </div>
              </div>

              <!-- Right Selectors Column (SELECT SPEC & SELECT COLOR & Next Vehicle) -->
              <div class="hero-right-selectors">
                <!-- Select Spec Block -->
                <div class="selector-panel-block">
                  <span class="selector-label">SELECT SPEC</span>
                  <div class="spec-pills-row" role="radiogroup" aria-label="Select Specification">
                    <button type="button" class="spec-pill-btn ${state.activeSpec === 'TRACK' ? 'active' : ''}" data-spec="TRACK">TRACK</button>
                    <button type="button" class="spec-pill-btn ${state.activeSpec === 'SPORT' ? 'active' : ''}" data-spec="SPORT">SPORT</button>
                    <button type="button" class="spec-pill-btn ${state.activeSpec === 'TOURING' ? 'active' : ''}" data-spec="TOURING">TOURING</button>
                    <button type="button" class="spec-pill-btn ${state.activeSpec === 'BESPOKE' ? 'active' : ''}" data-spec="BESPOKE">BESPOKE</button>
                  </div>
                </div>

                <!-- Marco Perez Color Triads Block (2-Base + 1-Pop Principle) -->
                <div class="selector-panel-block">
                  <div style="display: flex; justify-content: space-between; width: 100%; gap: 1rem;">
                    <span class="selector-label">COLOR TRIAD (MARCO PEREZ)</span>
                    <span class="aura-car-name" id="aura-car-name" style="font-family: var(--font-mono); font-size: 0.72rem; color: #FFFFFF; opacity: 0.85;">Midnight &amp; Coral</span>
                  </div>
                  <div class="triad-swatch-group" role="group" aria-label="Marco Perez Color Triads">
                    ${Object.values(MARCO_PEREZ_TRIADS).map(triad => `
                      <button 
                        type="button" 
                        class="triad-pill ${state.activeTriadId === triad.id ? 'active' : ''}" 
                        data-triad="${triad.id}" 
                        data-car="${triad.carId}" 
                        data-color="${triad.popColor}" 
                        title="${triad.fullName}: &quot;${triad.tagline}&quot;"
                        aria-label="${triad.name}"
                      >
                        <div class="triad-base-bar" title="Base Colors: ${triad.baseDark} &amp; ${triad.baseSoft}">
                          <div class="triad-base-half" style="background-color: ${triad.baseDark};"></div>
                          <div class="triad-base-half" style="background-color: ${triad.baseSoft};"></div>
                        </div>
                        <div class="triad-pop-dot" style="background-color: ${triad.popColor}; box-shadow: 0 0 10px ${triad.popColor};" title="Accent Pop: ${triad.popColor}"></div>
                        <span class="triad-name">${triad.name}</span>
                      </button>
                    `).join('')}
                  </div>

                  <!-- Backward-compatible aura dots (hidden visually or synchronized) -->
                  <div class="color-swatches-row" style="display: none;" role="group" aria-label="Paint Color Swatches">
                    <button 
                      type="button" 
                      class="color-swatch-circle aura-swatch-dot" 
                      data-car="porsche-gt3-rs-2024"
                      data-theme="raven-poppy" 
                      data-color="#FF3B30" 
                      data-aura="Raven Black &amp; Poppy Red"
                      style="--swatch-color: #FF3B30;" 
                      title="Raven &amp; Poppy"
                      aria-label="Raven &amp; Poppy"
                    ></button>
                    <button 
                      type="button" 
                      class="color-swatch-circle aura-swatch-dot active" 
                      data-car="ferrari-roma-2023"
                      data-theme="midnight-coral" 
                      data-color="#FD6E6E" 
                      data-aura="Midnight Navy &amp; Coral Orange"
                      style="--swatch-color: #FD6E6E;" 
                      title="Midnight &amp; Coral"
                      aria-label="Midnight &amp; Coral"
                    ></button>
                    <button 
                      type="button" 
                      class="color-swatch-circle aura-swatch-dot" 
                      data-car="mercedes-amg-g63-2024"
                      data-theme="pine-butter" 
                      data-color="#FCE788" 
                      data-aura="Pale Pine &amp; Butter Yellow"
                      style="--swatch-color: #FCE788;" 
                      title="Pine &amp; Butter"
                      aria-label="Pine &amp; Butter"
                    ></button>
                    <button 
                      type="button" 
                      class="color-swatch-circle aura-swatch-dot" 
                      data-car="audi-rs6-avant-2024"
                      data-theme="obsidian-gold" 
                      data-color="#D4AF37" 
                      data-aura="Obsidian Black &amp; Champagne Gold"
                      style="--swatch-color: #D4AF37;" 
                      title="Obsidian &amp; Gold"
                      aria-label="Obsidian &amp; Gold"
                    ></button>
                  </div>
                </div>

                <!-- Next Vehicle Teaser Card -->
                <div class="hero-next-vehicle-card" id="hero-next-vehicle-btn" role="button" tabindex="0" title="Switch to Next Vehicle">
                  <div class="next-card-thumb-wrap">
                    <img 
                      id="next-vehicle-thumb"
                      class="next-card-thumb" 
                      src="https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=300&q=80" 
                      alt="Next Vehicle" 
                    />
                  </div>
                  <div class="next-card-meta">
                    <span class="next-card-kicker">Next Vehicle →</span>
                    <span class="next-card-name" id="next-vehicle-name">Ferrari Roma V8</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Row: Dynamic Island Capsule, 4-Dot Pagination, Gesture Prompt -->
            <footer class="hero-card-bottom-bar">
              <div class="hero-stage-bottom-island">
                <div class="island-pill-left">
                  <span class="island-car-badge" id="island-car-name">2024 Porsche 911 GT3 RS</span>
                  <span class="island-divider"></span>
                  <div class="telemetry-metrics">
                    <span class="metric-item"><strong id="island-hp">518 HP</strong></span>
                    <span class="metric-item">0-60: <strong id="island-acceleration">3.0s</strong></span>
                    <span class="metric-item">V-Max: <strong id="island-topspeed">184 MPH</strong></span>
                  </div>
                </div>

                <!-- 4-Dot Pagination Indicator -->
                <div class="hero-model-pagination" role="group" aria-label="Model Pagination">
                  <button type="button" class="pagination-dot active" data-car="porsche-gt3-rs-2024" aria-label="Slide 1"></button>
                  <button type="button" class="pagination-dot" data-car="ferrari-roma-2023" aria-label="Slide 2"></button>
                  <button type="button" class="pagination-dot" data-car="mercedes-amg-g63-2024" aria-label="Slide 3"></button>
                  <button type="button" class="pagination-dot" data-car="audi-rs6-avant-2024" aria-label="Slide 4"></button>
                </div>

                <div class="island-pill-right" id="island-price">
                  ${STORE.formatPrice(248000)}
                </div>
              </div>

              <!-- Footer Prompt & Scroll Cue -->
              <div class="hero-stage-footer-row">
                <div class="hero-stage-prompt">
                  <span>🖱️ HOLD & DRAG TO ORBIT 360°</span>
                  <span class="prompt-sep">•</span>
                  <span>🔍 PINCH TO ZOOM</span>
                </div>

                <a href="#catalog" class="hero-stage-scroll-cue" id="hero-scroll-cue">
                  <span>EXPLORE SHOWROOM INVENTORY</span>
                  <span class="scroll-arrow">↓</span>
                </a>
              </div>
            </footer>
          </div>
        </div>
      </section>

      <!-- Multi-Criteria Filter Bar (Positioned gracefully below hero) -->
      <section class="catalog-filter-wrapper" style="max-width: 1440px; margin: 2rem auto 0 auto; padding: 0 1.5rem;">
        <div class="filter-bar-container" id="filter-bar">
          <div class="filter-input-wrapper">
            <span class="filter-icon">🔍</span>
            <input 
              type="text" 
              class="filter-input" 
              id="filter-keyword" 
              placeholder="Search make, model, year, VIN..." 
              value="${state.filters.keyword}"
            />
          </div>

          <div>
            <select class="filter-select" id="filter-make">
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
            <select class="filter-select" id="filter-status">
              <option value="all" ${state.filters.status === 'all' ? 'selected' : ''}>All Status</option>
              <option value="available" ${state.filters.status === 'available' ? 'selected' : ''}>Available Only</option>
              <option value="reserved" ${state.filters.status === 'reserved' ? 'selected' : ''}>Reserved</option>
              <option value="sold" ${state.filters.status === 'sold' ? 'selected' : ''}>Sold Archive</option>
            </select>
          </div>

          <div>
            <select class="filter-select" id="filter-sort">
              <option value="featured" ${state.filters.sortBy === 'featured' ? 'selected' : ''}>Featured First</option>
              <option value="price-asc" ${state.filters.sortBy === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${state.filters.sortBy === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="year-desc" ${state.filters.sortBy === 'year-desc' ? 'selected' : ''}>Year: Newest</option>
              <option value="mileage-asc" ${state.filters.sortBy === 'mileage-asc' ? 'selected' : ''}>Mileage: Lowest</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; justify-content: flex-end;">
            <button type="button" class="btn-secondary" id="btn-reset-filters" style="width: 100%; text-align: center;">
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Meta Bar -->
      <div class="catalog-meta-bar">
        <div>
          Showing <span class="meta-count-badge" id="catalog-count">${filtered.length}</span> verified vehicles in showroom
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--color-text-low);">Live Rates Active:</span>
          <span style="color: var(--color-gold); font-weight: 600;">${STORE.getCurrency()}</span>
        </div>
      </div>

      <!-- Vehicle Card Grid (Anchored with id="catalog") -->
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
                        : 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80';

                    const formattedPrice = STORE.formatPrice(car.priceUSD);
                    const whatsappMsg = encodeURIComponent(
                      `Hi Apex Auto Lounge, I am inquiring about the ${car.year} ${car.make} ${car.model} (${formattedPrice}, VIN: ${car.vin}). Is it available for private inspection?`
                    );

                    return `
              <article class="car-card" data-id="${car.id}">
                <div class="car-card-media">
                  <span class="car-card-badge ${statusClass}">${statusLabel}</span>
                  ${car.sketchfabId ? '<span class="badge-3d-showcase">✦ 3D VIRTUAL SHOWROOM</span>' : ''}
                  ${car.featured ? '<span class="featured-pill">★ Featured</span>' : ''}
                  <img src="${primaryImage}" alt="${car.year} ${car.make} ${car.model}" class="car-card-img" loading="lazy" />
                </div>
                <div class="car-card-body">
                  <div class="car-card-header">
                    <span class="car-card-year">${car.year} • ${car.bodyType || 'Coupe'}</span>
                    <h3 class="car-card-title">${car.make} ${car.model}</h3>
                  </div>

                  <div class="car-card-specs">
                    <span class="spec-chip">⏱ ${new Intl.NumberFormat().format(car.mileage)} mi</span>
                    <span class="spec-chip">⚙ ${car.transmission}</span>
                    <span class="spec-chip">⚡ ${car.horsepower} HP</span>
                    <span class="spec-chip">🎨 ${car.exteriorColor}</span>
                  </div>

                  <div class="car-card-price-row">
                    <div>
                      <div class="price-label">Price</div>
                      <div class="price-value">${formattedPrice}</div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--color-text-low);">
                      VIN: ${car.vin.slice(-6)}
                    </div>
                  </div>

                  <div class="car-card-actions">
                    <button type="button" class="btn-card-specs btn-open-detail" data-id="${car.id}">
                      Specs & Gallery
                    </button>
                    ${
                      car.sketchfabId
                        ? `<button type="button" class="btn-card-specs btn-open-3d" data-id="${car.id}" title="Launch Interactive 3D Model">
                            🕹️ 3D Model
                          </button>`
                        : ''
                    }
                    <a 
                      href="https://wa.me/15550192834?text=${whatsappMsg}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="btn-card-whatsapp"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            `;
                  })
                  .join('')
              : `
            <div class="catalog-empty-state">
              <div class="empty-state-icon">🏎</div>
              <h3 style="font-family: var(--font-headline); font-size: 1.25rem; margin-bottom: 0.5rem;">No Matching Exotic Vehicles Found</h3>
              <p style="color: var(--color-text-mid); max-width: 480px; margin: 0 auto 1.5rem auto;">
                Try adjusting your search criteria or resetting filters to view our full collection.
              </p>
              <button type="button" class="btn-gold-primary" id="btn-clear-empty-filter">
                Reset All Filters
              </button>
            </div>
          `
          }
        </div>
      </section>
    `;

    // Filter event listeners
    const kwInput = main.querySelector('#filter-keyword');
    if (kwInput) {
      kwInput.addEventListener('input', (e) => {
        state.filters.keyword = e.target.value;
        renderPublicView();
        // keep focus in input
        const reFocused = document.getElementById('filter-keyword');
        if (reFocused) {
          reFocused.focus();
          reFocused.setSelectionRange(reFocused.value.length, reFocused.value.length);
        }
      });
    }

    const makeSelect = main.querySelector('#filter-make');
    if (makeSelect) {
      makeSelect.addEventListener('change', (e) => {
        state.filters.make = e.target.value;
        renderPublicView();
      });
    }

    const statusSelect = main.querySelector('#filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderPublicView();
      });
    }

    const sortSelect = main.querySelector('#filter-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        renderPublicView();
      });
    }

    const resetBtn = main.querySelector('#btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.filters = { keyword: '', make: 'all', status: 'all', priceMax: 300000, sortBy: 'featured' };
        renderPublicView();
        showToast('Filters reset to show all inventory');
      });
    }

    const clearEmpty = main.querySelector('#btn-clear-empty-filter');
    if (clearEmpty) {
      clearEmpty.addEventListener('click', () => {
        state.filters = { keyword: '', make: 'all', status: 'all', priceMax: 300000, sortBy: 'featured' };
        renderPublicView();
      });
    }

    // Modal open buttons
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

    // Initialize Local Three.js 3D Viewer inside Hero Stage
    function initHero3DViewer() {
      const container = main.querySelector('#hero-3d-stage-container');
      if (!container) return;

      if (window.Apex3DViewer) {
        if (state.heroViewer) {
          try { state.heroViewer.destroy(); } catch (e) {}
        }
        state.heroViewer = new window.Apex3DViewer('hero-3d-stage-container', {
          initialModel: 'ferrari',
          initialColor: state.activeColorHex || '#6BA4D9',
          autoRotate: true,
          autoRotateSpeed: 0.8
        });
      }
    }

    // Featured 3D Cars Metadata Mapping for Hero Stage Atmosphere
    const HERO_ATMOSPHERE_CONFIG = {
      'porsche-gt3-rs-2024': {
        watermark: '911 GT3 RS',
        auraName: 'Raven & Poppy',
        accentColor: '#FF3B30',
        colorTheme: 'raven-poppy',
        triadId: 'raven-poppy',
        modelKey: 'porsche',
        nextCarId: 'ferrari-roma-2023',
        nextCarName: 'Ferrari Roma V8',
        nextCarThumb: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=300&q=80'
      },
      'ferrari-roma-2023': {
        watermark: 'ROMA V8',
        auraName: 'Midnight & Coral',
        accentColor: '#FD6E6E',
        colorTheme: 'midnight-coral',
        triadId: 'midnight-coral',
        modelKey: 'ferrari',
        nextCarId: 'mercedes-amg-g63-2024',
        nextCarName: 'Mercedes-AMG G63',
        nextCarThumb: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=300&q=80'
      },
      'mercedes-amg-g63-2024': {
        watermark: 'AMG G63',
        auraName: 'Pine & Butter',
        accentColor: '#FCE788',
        colorTheme: 'pine-butter',
        triadId: 'pine-butter',
        modelKey: 'bmw',
        nextCarId: 'audi-rs6-avant-2024',
        nextCarName: 'Audi RS6 Avant',
        nextCarThumb: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=300&q=80'
      },
      'audi-rs6-avant-2024': {
        watermark: 'RS6 AVANT',
        auraName: 'Obsidian & Gold',
        accentColor: '#D4AF37',
        colorTheme: 'obsidian-gold',
        triadId: 'obsidian-gold',
        modelKey: 'ferrari',
        nextCarId: 'porsche-gt3-rs-2024',
        nextCarName: 'Porsche 911 GT3 RS',
        nextCarThumb: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80'
      }
    };

    // Wire Hero 3D Stage Keynote Controls
    function updateHero3DStage(carId, targetHex = null, targetTheme = null) {
      state.active3DCarId = carId;
      const car = STORE.getFeatured3DCar(carId);
      if (!car) return;

      const atmosphere = HERO_ATMOSPHERE_CONFIG[carId] || {
        watermark: car.model.toUpperCase(),
        auraName: 'Midnight & Coral',
        accentColor: '#FD6E6E',
        colorTheme: 'midnight-coral',
        triadId: 'midnight-coral',
        modelKey: 'ferrari',
        nextCarId: 'porsche-gt3-rs-2024',
        nextCarName: 'Porsche 911 GT3 RS',
        nextCarThumb: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80'
      };

      const appliedColor = targetHex || atmosphere.accentColor;
      const appliedTheme = targetTheme || atmosphere.colorTheme;
      state.activeColorHex = appliedColor;
      state.activeTriadId = targetTheme || atmosphere.triadId;

      // 1. Dynamic Atmosphere Theme & Background Gradient Melt on Card Container
      const heroViewport = main.querySelector('#hero-stage-viewport');
      if (heroViewport) {
        heroViewport.setAttribute('data-hero-theme', carId);
      }
      const heroCard = main.querySelector('#hero-stage-card');
      if (heroCard) {
        heroCard.setAttribute('data-hero-theme', carId);
        heroCard.setAttribute('data-color-theme', appliedTheme);
      }

      // 2. Update Colossal Typographic Watermark
      const watermarkEl = main.querySelector('#hero-watermark');
      if (watermarkEl) {
        watermarkEl.textContent = atmosphere.watermark;
      }

      // 3. Update Apple Segmented Switcher Buttons
      main.querySelectorAll('.apple-switcher-btn').forEach((btn) => {
        if (btn.getAttribute('data-car') === carId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // 4. Update Marco Perez Triad Pills
      main.querySelectorAll('.triad-pill').forEach((pill) => {
        const triadId = pill.getAttribute('data-triad');
        const pillCar = pill.getAttribute('data-car');
        if (triadId === state.activeTriadId || pillCar === carId || triadId === appliedTheme) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });

      // Update Legacy / Hidden Aura Color Dots / Swatches
      main.querySelectorAll('.color-swatch-circle, .aura-swatch-dot').forEach((dot) => {
        if (dot.getAttribute('data-car') === carId || dot.getAttribute('data-theme') === appliedTheme) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      const auraNameEl = main.querySelector('#aura-car-name');
      if (auraNameEl) {
        const currentTriad = MARCO_PEREZ_TRIADS[state.activeTriadId];
        auraNameEl.textContent = currentTriad ? currentTriad.name : atmosphere.auraName;
      }

      // 5. Update Model Pagination Dots
      main.querySelectorAll('.pagination-dot').forEach((pDot) => {
        if (pDot.getAttribute('data-car') === carId) {
          pDot.classList.add('active');
        } else {
          pDot.classList.remove('active');
        }
      });

      // 6. Update Next Vehicle Teaser Card
      const nextCardThumb = main.querySelector('#next-vehicle-thumb');
      if (nextCardThumb) {
        nextCardThumb.setAttribute('src', atmosphere.nextCarThumb);
        nextCardThumb.setAttribute('alt', atmosphere.nextCarName);
      }
      const nextCardName = main.querySelector('#next-vehicle-name');
      if (nextCardName) {
        nextCardName.textContent = atmosphere.nextCarName;
      }
      const nextVehicleBtn = main.querySelector('#hero-next-vehicle-btn');
      if (nextVehicleBtn) {
        nextVehicleBtn.setAttribute('data-next-car', atmosphere.nextCarId);
      }

      // 7. Update Dynamic Island Telemetry & Price Pill
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

      // 8. Update WhatsApp VIP Reservation Link
      const waBtn = main.querySelector('#hero-whatsapp-reserve');
      if (waBtn) {
        const encoded = encodeURIComponent(
          `Hi Apex Auto Lounge, I am inquiring about the ${car.year} ${car.make} ${car.model} featured on the 3D Showroom (${STORE.formatPrice(car.priceUSD)}). Is it available for private acquisition?`
        );
        waBtn.setAttribute('href', `https://wa.me/15550192834?text=${encoded}`);
      }

      // 9. Update Technical Dossier Button target vehicle ID
      const dossierBtn = main.querySelector('#hero-inspect-dossier');
      if (dossierBtn) {
        const catalogVehicle = STORE.getVehicles().find(
          (v) => v.make.toLowerCase() === car.make.toLowerCase() && v.model.toLowerCase().includes(car.model.toLowerCase().split(' ')[0])
        ) || STORE.getVehicles()[0];
        if (catalogVehicle) {
          dossierBtn.setAttribute('data-id', catalogVehicle.id);
        }
      }

      // 10. Direct Local Three.js 3D Viewer Update (via instance and global API)
      if (window.Apex3DViewer) {
        if (typeof window.Apex3DViewer.loadModel === 'function') {
          window.Apex3DViewer.loadModel(atmosphere.modelKey, appliedColor);
        }
        if (typeof window.Apex3DViewer.changeCarColor === 'function') {
          window.Apex3DViewer.changeCarColor(appliedColor);
        }
      } else if (state.heroViewer) {
        if (state.heroViewer.currentModelKey !== atmosphere.modelKey) {
          state.heroViewer.loadModel(atmosphere.modelKey, appliedColor);
        } else {
          state.heroViewer.changeCarColor(appliedColor);
        }
      }
    }

    // Attach Switcher Listeners
    main.querySelectorAll('.apple-switcher-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const carId = e.currentTarget.getAttribute('data-car');
        updateHero3DStage(carId);
      });
    });

    // Attach Marco Perez Triad Pill Listeners
    main.querySelectorAll('.triad-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const triadId = e.currentTarget.getAttribute('data-triad');
        const triad = MARCO_PEREZ_TRIADS[triadId];
        if (!triad) return;

        updateHero3DStage(triad.carId, triad.popColor, triad.id);
        showToast(`✦ ${triad.fullName}: "${triad.tagline}"`, 'info');
      });
    });

    // Attach Color Swatch Listeners (Instant Paint & Gradient Morph backward compatibility)
    main.querySelectorAll('.color-swatch-circle, .aura-swatch-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const carId = e.currentTarget.getAttribute('data-car') || state.active3DCarId;
        const color = e.currentTarget.getAttribute('data-color');
        const theme = e.currentTarget.getAttribute('data-theme');
        updateHero3DStage(carId, color, theme);
      });
    });

    // Attach Spec Pill Buttons Listeners
    main.querySelectorAll('.spec-pill-btn').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        main.querySelectorAll('.spec-pill-btn').forEach((p) => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.activeSpec = e.currentTarget.getAttribute('data-spec');
        showToast(`Spec switched to ${state.activeSpec}`, 'info');
      });
    });

    // Attach Pagination Dots Listeners
    main.querySelectorAll('.pagination-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const carId = e.currentTarget.getAttribute('data-car');
        updateHero3DStage(carId);
      });
    });

    // Attach Next Vehicle Teaser Card Listener
    const nextVehicleBtn = main.querySelector('#hero-next-vehicle-btn');
    if (nextVehicleBtn) {
      nextVehicleBtn.addEventListener('click', (e) => {
        const nextId = e.currentTarget.getAttribute('data-next-car');
        if (nextId) updateHero3DStage(nextId);
      });
      nextVehicleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const nextId = e.currentTarget.getAttribute('data-next-car');
          if (nextId) updateHero3DStage(nextId);
        }
      });
    }

    // Attach Dossier Button Listener
    const dossierBtn = main.querySelector('#hero-inspect-dossier');
    if (dossierBtn) {
      dossierBtn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id') || 'apex-car-01';
        openVehicleModal(id, '3d');
      });
    }

    // Initialize Local 3D Viewer & Synchronize Stage State
    initHero3DViewer();
    if (state.active3DCarId) {
      updateHero3DStage(state.active3DCarId);
    }
  }

  // Render Admin Owner Panel
  function renderAdminView() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const kpis = STORE.getKPIs();
    const vehicles = STORE.getVehicles();

    main.innerHTML = `
      <section class="admin-section">
        <!-- Admin Header Bar -->
        <div class="admin-header-bar">
          <div>
            <h1 class="admin-header-title">
              Dealership Operations Console
              <span class="admin-header-badge">● Live Owner Mode</span>
            </h1>
            <p style="color: var(--color-text-mid); font-size: 0.9rem; margin-top: 4px;">
              Manage inventory, update instantaneous sales status, and adjust vehicle specifications.
            </p>
          </div>

          <div class="admin-actions-group">
            <button type="button" class="btn-gold-primary" id="btn-admin-add-car">
              + Add New Vehicle
            </button>
            <button type="button" class="btn-secondary" id="btn-admin-reset-demo">
              ↻ Reset Demo Seed
            </button>
            <button type="button" class="btn-secondary" id="btn-admin-exit">
              Exit to Catalog
            </button>
          </div>
        </div>

        <!-- KPI Stat Cards -->
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
            <div class="kpi-value gold" id="kpi-total-val" style="font-size: 1.45rem;">
              ${kpis.totalValueFormatted}
            </div>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="admin-table-container">
          <table class="admin-table" id="admin-inventory-table">
            <thead>
              <tr>
                <th>Vehicle Details</th>
                <th>Price (USD)</th>
                <th>Mileage</th>
                <th>1-Click Status Toggle</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles
                .map((car) => {
                  const img = (car.images && car.images[0]) || '';
                  return `
                  <tr data-id="${car.id}">
                    <td>
                      <div class="admin-vehicle-cell">
                        <img src="${img}" alt="${car.make} ${car.model}" class="admin-thumb" />
                        <div>
                          <div class="admin-car-title">${car.year} ${car.make} ${car.model}</div>
                          <div class="admin-car-vin">VIN: ${car.vin} • ${car.exteriorColor}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-family: var(--font-headline); font-weight: 700; color: var(--color-gold);">
                      ${STORE.formatPrice(car.priceUSD)}
                    </td>
                    <td style="color: var(--color-text-mid); font-family: var(--font-headline);">
                      ${new Intl.NumberFormat().format(car.mileage)} mi
                    </td>
                    <td>
                      <div class="status-pill-group" role="group" aria-label="Status Toggle">
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
                        <button type="button" class="btn-icon btn-admin-edit" data-id="${car.id}" title="Edit Vehicle Specs">
                          ✎
                        </button>
                        <button type="button" class="btn-icon danger btn-admin-delete" data-id="${car.id}" title="Delete Vehicle">
                          🗑
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

    // Admin listeners
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

    // 1-Click Status Toggles
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

    // Edit Car
    main.querySelectorAll('.btn-admin-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openAdminCarModal(id);
      });
    });

    // Delete Car
    main.querySelectorAll('.btn-admin-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const car = STORE.getVehicle(id);
        const name = car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle';
        if (confirm(`Are you sure you want to remove ${name} from inventory?`)) {
          STORE.deleteVehicle(id);
          showToast(`Deleted ${name} from inventory`, 'success');
          renderAdminView();
        }
      });
    });
  }

  // Render Footer
  function renderFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) return;

    footer.innerHTML = `
      <div class="footer-container">
        <!-- Col 1 -->
        <div>
          <div class="brand-logo" style="margin-bottom: 0.75rem;">
            <span class="brand-icon">✦</span> APEX AUTO LOUNGE
          </div>
          <p class="footer-text" style="margin-bottom: 1.25rem;">
            Beverly Hills’ premier private automobile lounge. Specializing in rare specification Porsches, AMGs, and modern hypercars.
          </p>
          <div style="color: var(--color-gold); font-family: var(--font-headline); font-size: 0.85rem; font-weight: 600;">
            Direct Hotline: +1 (800) 555-APEX
          </div>
        </div>

        <!-- Col 2: Showroom Hours -->
        <div>
          <h4 class="footer-col-title">Showroom Hours</h4>
          <p class="footer-text" style="margin-bottom: 0.5rem;">
            <strong style="color: var(--color-text-high);">Mon – Fri:</strong> 9:00 AM – 8:00 PM PST<br>
            <strong style="color: var(--color-text-high);">Saturday:</strong> 10:00 AM – 7:00 PM PST<br>
            <strong style="color: var(--color-text-high);">Sunday:</strong> Private Appointment Only
          </p>
          <p class="footer-text" style="font-size: 0.8rem; color: var(--color-text-low);">
            742 Evergreen Motorway, Beverly Hills, CA 90210
          </p>
        </div>

        <!-- Col 3: Verified Socials -->
        <div>
          <h4 class="footer-col-title">Official Socials</h4>
          <ul class="footer-social-list">
            <li>
              <a href="https://instagram.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="footer-social-link">
                <span>📸</span> <span>Instagram: @apexautolounge</span>
              </a>
            </li>
            <li>
              <a href="https://tiktok.com/@apexauto" target="_blank" rel="noopener noreferrer" class="footer-social-link">
                <span>⚡</span> <span>TikTok: @apexauto</span>
              </a>
            </li>
            <li>
              <a href="https://facebook.com/apexautolounge" target="_blank" rel="noopener noreferrer" class="footer-social-link">
                <span>👥</span> <span>Facebook: /apexautolounge</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Col 4: Private Consultation Form -->
        <div>
          <h4 class="footer-col-title">Private Concierge</h4>
          <p class="footer-text" style="margin-bottom: 0.75rem;">
            Request discreet procurement of rare vehicles or private consignments.
          </p>
          <a 
            href="https://wa.me/15550192834?text=Hello%20Apex%20Auto%20Lounge%2C%20I%20would%20like%20to%20schedule%20a%20private%20concierge%20consultation." 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-gold-primary" 
            style="width: 100%; justify-content: center;"
          >
            WhatsApp Concierge Desk
          </a>
        </div>
      </div>

      <div class="footer-bottom-bar">
        <div>
          © ${new Date().getFullYear()} Apex Auto Lounge Inc. All Rights Reserved. Fully Licensed Exotic Motorcar Dealer.
        </div>
        <div style="display: flex; gap: 1.5rem;">
          <a href="#" style="color: var(--color-text-low);">Privacy Policy</a>
          <a href="#" style="color: var(--color-text-low);">Consignment Terms</a>
          <a href="#" style="color: var(--color-text-low);">Global Delivery</a>
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
          <button type="button" class="modal-close-btn" id="btn-close-pin-modal">✕</button>
          <div class="pin-icon-wrap">🔒</div>
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.5rem;">Owner Access Verification</h2>
          <p style="color: var(--color-text-mid); font-size: 0.85rem;">
            Enter the 4-digit showroom authorization passcode to unlock the management portal.
          </p>
          
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
    setTimeout(() => pinInput?.focus(), 150);

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
    const images = (car.images && car.images.length > 0) ? car.images : ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80'];
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
        <button type="button" class="modal-close-btn" id="btn-close-vehicle-modal">✕</button>

        <div class="detail-modal-layout">
          <!-- Media Mode Tab Bar -->
          <div class="media-tabs-bar">
            <button class="media-tab-btn ${!startWith3D ? 'active' : ''}" id="tab-media-photo" type="button">
              📸 4K Studio Gallery
            </button>
            <button class="media-tab-btn ${startWith3D ? 'active' : ''}" id="tab-media-3d" type="button" ${has3D ? '' : 'style="display:none;"'}>
              🕹️ Interactive 3D 360° (Sketchfab)
            </button>
          </div>

          <!-- Photo Studio Gallery Viewer -->
          <div class="detail-modal-gallery" id="media-viewer-photo" style="${startWith3D ? 'display: none;' : ''}">
            <img src="${activeImg}" alt="${car.make} ${car.model}" class="detail-main-img" id="detail-main-display" />
            
            ${
              images.length > 1
                ? `
              <div class="detail-thumbnails-strip">
                ${images
                  .map(
                    (img, idx) => `
                  <img src="${img}" alt="Thumbnail ${idx + 1}" class="detail-thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}" />
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>

          <!-- Sketchfab 3D Viewer -->
          <div id="media-viewer-3d" style="${!startWith3D ? 'display: none;' : ''}">
            ${
              has3D
                ? `
              <div class="sketchfab-embed-wrapper">
                <iframe title="${car.year} ${car.make} ${car.model} 3D Model"
                  class="sketchfab-iframe"
                  frameborder="0"
                  allowfullscreen
                  mozallowfullscreen="true"
                  webkitallowfullscreen="true"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  xr-spatial-tracking
                  execution-while-out-of-viewport
                  execution-while-not-rendered
                  web-share
                  src="https://sketchfab.com/models/${car.sketchfabId}/embed?autostart=1&camera=0&preload=1&ui_theme=dark&ui_infos=0&ui_controls=1&ui_stop=0">
                </iframe>
                <div class="sketchfab-controls-hint">
                  <span>🖱️ Left-Click: Orbit 360°</span>
                  <span>🖐️ Right-Click: Pan</span>
                  <span>🔍 Scroll: Zoom In / Out</span>
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
                <div style="color: var(--color-text-mid); font-size: 0.85rem; margin-top: 4px;">
                  VIN: <span style="font-family: var(--font-headline); color: var(--color-gold);">${car.vin}</span>
                </div>
              </div>

              <div>
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-low); text-align: right;">Showroom Price</div>
                <div class="detail-car-price">${formattedPrice}</div>
              </div>
            </div>

            <!-- Description -->
            <p style="color: var(--color-text-mid); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem;">
              ${car.description}
            </p>

            <!-- Specs Grid -->
            <h4 style="font-family: var(--font-headline); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-gold); margin-bottom: 0.75rem;">
              Technical Specifications
            </h4>
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

            <!-- Features Checklist -->
            <h4 style="font-family: var(--font-headline); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-gold); margin-bottom: 0.75rem;">
              Installed Factory Options & Packages
            </h4>
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

            <!-- Direct CTAs -->
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
                📞 Call Showroom (+1 800 555-APEX)
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.classList.add('is-active');

    // Close listener
    overlay.querySelector('#btn-close-vehicle-modal')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
    });

    // Tab switcher listeners
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

    // Thumbnail swap
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

    const defaultImg =
      (car && car.images && car.images[0]) ||
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80';

    overlay.innerHTML = `
      <div class="modal-window" style="max-width: 800px;">
        <button type="button" class="modal-close-btn" id="btn-close-admin-car-modal">✕</button>

        <div style="padding: 1.5rem 2rem 0.5rem 2rem; border-bottom: 1px solid var(--color-border);">
          <h2 style="font-family: var(--font-display); font-size: 1.5rem;">
            ${isEdit ? 'Edit Vehicle Specifications' : 'Register New Exotic Vehicle'}
          </h2>
          <p style="color: var(--color-text-mid); font-size: 0.85rem;">
            Provide complete mechanical and visual information to display to prospective buyers.
          </p>
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
            <input type="url" name="image" class="form-input" required value="${defaultImg}" />
          </div>

          <div class="form-group col-span-2">
            <label class="form-label" for="car-sketchfab">Sketchfab 3D Model URL or ID (Optional)</label>
            <input type="text" id="car-sketchfab" name="sketchfab" class="form-input" value="${car && car.sketchfabId ? car.sketchfabId : ''}" placeholder="e.g. 456b3d9d60b646369d76667848d6d027 or https://sketchfab.com/3d-models/..." />
            <small class="form-hint" style="display: block; margin-top: 4px; font-size: 0.75rem; color: var(--color-text-low);">Paste any car link or embed ID from Sketchfab.com to enable 360° virtual inspection in the showroom.</small>
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

    // Close actions
    overlay.querySelector('#btn-close-admin-car-modal')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
    });

    overlay.querySelector('#btn-cancel-admin-car')?.addEventListener('click', () => {
      overlay.classList.remove('is-active');
    });

    // Form submission
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

  // Master Render Loop
  function renderApp() {
    renderHeader();
    if (state.view === 'admin' && state.isAdmin) {
      renderAdminView();
    } else {
      renderPublicView();
    }
    renderFooter();
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    // Subscribe to store updates
    STORE.subscribe(() => {
      renderApp();
    });

    renderApp();
  });
})(window, document);
