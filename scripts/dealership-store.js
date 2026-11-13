/**
 * Apex Auto Lounge - Reactive Store & Inventory State Manager
 * Key: localStorage['apex_dealership_inventory_v1']
 * Multi-Currency: USD, NGN, GBP, EUR
 */

(function (root) {
  'use strict';

  const STORAGE_KEY = 'apex_dealership_inventory_v1';
  const CURRENCY_KEY = 'apex_dealership_currency_v1';

  const CURRENCY_RATES = {
    USD: { symbol: '$', rate: 1, label: 'USD ($)', decimals: 0 },
    NGN: { symbol: '₦', rate: 1600, label: 'NGN (₦)', decimals: 0 },
    GBP: { symbol: '£', rate: 0.79, label: 'GBP (£)', decimals: 0 },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)', decimals: 0 }
  };

  const LOCAL_STUDIO_IMAGES = {
    ferrariEditorial: './src/assets/images/lifestyle_supercar_editorial_1794305857459.jpg',
    ferrariRender: './models/ferrari_render.png',
    porscheStudio: './src/assets/images/porsche_gt3rs_studio_1794305858079.jpg',
    mercedesStudio: './src/assets/images/mercedes_g63_studio_1794305857861.jpg',
    audiStudio: './src/assets/images/audi_rs6_studio_1794305860108.jpg',
    bmwStudio: './src/assets/images/bmw_m4_studio_1794532109025.jpg',
    rangeRoverStudio: './src/assets/images/range_rover_sv_studio_1794532110726.jpg',
    teslaStudio: './src/assets/images/tesla_plaid_studio_1794532111906.jpg',
    astonStudio: './src/assets/images/aston_dbx707_studio_1794532112528.jpg'
  };

  /**
   * Helper: extractSketchfabId(input)
   * If input is a URL or embed URL, extract the 32-character hex ID.
   * If it's already an ID, trim and return it.
   */
  function extractSketchfabId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/([a-f0-9]{32})/i);
    return match ? match[1].toLowerCase() : trimmed;
  }

  /**
   * Pure helper: formatPriceWithRates(usdAmount, curr)
   */
  function formatPriceWithRates(usdAmount, curr = 'USD') {
    const config = CURRENCY_RATES[curr] || CURRENCY_RATES.USD;
    const converted = Math.round(Number(usdAmount || 0) * config.rate);
    const formattedNumber = new Intl.NumberFormat('en-US').format(converted);
    return `${config.symbol}${formattedNumber}`;
  }

  /**
   * Pure helper: filterAndSortVehicles(vehicles, filters)
   */
  function filterAndSortVehicles(vehicles, filters = {}) {
    const keyword = (filters.keyword || '').trim().toLowerCase();
    const make = (filters.make || 'all').toLowerCase();
    const status = filters.status || 'all';
    const priceMax = filters.priceMax !== undefined ? Number(filters.priceMax) : Infinity;
    const sortBy = filters.sortBy || 'featured';

    return (vehicles || [])
      .filter((car) => {
        if (keyword) {
          const matches =
            car.make.toLowerCase().includes(keyword) ||
            car.model.toLowerCase().includes(keyword) ||
            String(car.year).includes(keyword) ||
            (car.vin && car.vin.toLowerCase().includes(keyword));
          if (!matches) return false;
        }
        if (make !== 'all' && car.make.toLowerCase() !== make) {
          return false;
        }
        if (status !== 'all' && car.status !== status) {
          return false;
        }
        if (car.priceUSD > priceMax) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
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

  const FEATURED_3D_CARS = [
    {
      id: 'porsche-gt3-rs-2024',
      make: 'Porsche',
      model: '911 GT3 RS',
      heroTitle: '911 GT3 RS',
      year: 2024,
      edition: 'Weissach Package',
      priceUSD: 248000,
      sketchfabId: '456b3d9d60b646369d76667848d6d027',
      localModelKey: 'porsche',
      glbPath: './models/porsche_911.glb',
      previewImg: LOCAL_STUDIO_IMAGES.porscheStudio,
      cutoutImg: LOCAL_STUDIO_IMAGES.ferrariRender,
      hp: 518,
      zeroToSixty: '3.0s',
      topSpeed: '184 MPH',
      engine: '4.0L Naturally Aspirated Boxer-6',
      color: 'Gentian Sapphire / Pyro Red',
      transmission: '7-Speed PDK',
      summary: 'Motorsport-bred active aerodynamics and lightweight carbon weave engineered for uncompromising track precision and street presence.'
    },
    {
      id: 'ferrari-roma-2023',
      make: 'Ferrari',
      model: 'Roma V8',
      heroTitle: 'FERRARI ROMA V8',
      year: 2023,
      edition: 'Atelier Tailor Made',
      priceUSD: 238000,
      sketchfabId: 'fedadda2bb6c4bf481636121548c6a47',
      localModelKey: 'ferrari',
      glbPath: './models/ferrari.glb',
      previewImg: LOCAL_STUDIO_IMAGES.ferrariEditorial,
      cutoutImg: LOCAL_STUDIO_IMAGES.ferrariRender,
      hp: 612,
      zeroToSixty: '3.2s',
      topSpeed: '199 MPH',
      engine: '3.9L Twin-Turbo V8',
      color: 'Rosso Corsa',
      transmission: '8-Speed F1 Dual-Clutch',
      summary: 'Brand-new Atelier grand touring architecture pairs 612 horsepower twin-turbocharged response with timeless Maranello sculpture.'
    },
    {
      id: 'mercedes-amg-g63-2024',
      make: 'Mercedes-Benz',
      model: 'Mercedes-AMG G63',
      heroTitle: 'AMG G63 EDITION',
      year: 2024,
      edition: 'Edition 55 Magno',
      priceUSD: 195000,
      sketchfabId: '27ec2645ed95471395370a6650b38296',
      localModelKey: 'mercedes',
      glbPath: './models/mercedes_g63.glb',
      previewImg: LOCAL_STUDIO_IMAGES.mercedesStudio,
      cutoutImg: LOCAL_STUDIO_IMAGES.ferrariRender,
      hp: 577,
      zeroToSixty: '4.5s',
      topSpeed: '149 MPH',
      engine: 'Handcrafted AMG 4.0L V8 Biturbo',
      color: 'Emerald Green Magno',
      transmission: 'AMG SPEEDSHIFT 9G',
      summary: 'Hand-assembled V8 biturbo authority wrapped in architectural G-Class bodywork with bespoke Nappa leather cabin appointments.'
    },
    {
      id: 'audi-rs6-avant-2024',
      make: 'Audi',
      model: 'RS6 Avant Performance',
      heroTitle: 'RS6 AVANT GT',
      year: 2024,
      edition: 'Carbon Dynamic Package',
      priceUSD: 142000,
      sketchfabId: 'b432bb3ad006442c88a915d6718dffef',
      localModelKey: 'audi',
      glbPath: './models/audi_rs6.glb',
      previewImg: LOCAL_STUDIO_IMAGES.audiStudio,
      cutoutImg: LOCAL_STUDIO_IMAGES.ferrariRender,
      hp: 621,
      zeroToSixty: '3.3s',
      topSpeed: '190 MPH',
      engine: '4.0L Twin-Turbo V8 MHEV',
      color: 'Solarbeam Gold Metallic',
      transmission: '8-Speed Tiptronic Quattro',
      summary: 'Widebody super-touring silhouette delivering 621 horsepower quattro composure, ceramic braking, and effortless transcontinental pace.'
    }
  ];

  const INITIAL_VEHICLES = [
    {
      id: 'apex-car-01',
      make: 'Porsche',
      model: '911 GT3 RS',
      year: 2024,
      priceUSD: 248000,
      mileage: 1850,
      status: 'available',
      featured: true,
      sketchfabId: '456b3d9d60b646369d76667848d6d027',
      bodyType: 'Coupe',
      transmission: 'PDK',
      fuelType: 'Gasoline',
      exteriorColor: 'Arctic Grey',
      interiorColor: 'Black Leather / Alcantara with Guards Red Stitching',
      engine: '4.0L Naturally Aspirated Boxer-6',
      horsepower: 518,
      vin: 'WP0AB2A97RS202401',
      images: [
        LOCAL_STUDIO_IMAGES.porscheStudio,
        LOCAL_STUDIO_IMAGES.ferrariEditorial,
        LOCAL_STUDIO_IMAGES.audiStudio
      ],
      description: 'The pinnacle of motorsport engineering for the road. Features DRS active aero, Weissach package carbon weave, magnesium lightweight wheels, and titanium roll cage.',
      features: [
        'Weissach Lightweight Package',
        'Porsche Ceramic Composite Brakes (PCCB)',
        'Front Axle Hydraulic Lift System',
        'Active DRS Rear Wing Aero',
        'Bose Surround Sound System',
        'Club Sport Interior with Carbon Buckets'
      ],
      createdAt: '2024-03-01T10:00:00Z'
    },
    {
      id: 'apex-car-02',
      make: 'Mercedes-Benz',
      model: 'Mercedes-AMG G63',
      year: 2024,
      priceUSD: 195000,
      mileage: 3200,
      status: 'available',
      featured: true,
      sketchfabId: '27ec2645ed95471395370a6650b38296',
      bodyType: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Obsidian Black',
      interiorColor: 'Exclusive Nappa Leather Bengal Red / Black',
      engine: '4.0L Bi-Turbo Handcrafted V8',
      horsepower: 577,
      vin: 'W1NYX7FJ8RX202402',
      images: [
        LOCAL_STUDIO_IMAGES.mercedesStudio,
        LOCAL_STUDIO_IMAGES.porscheStudio
      ],
      description: 'Iconic luxury off-road capability combined with hand-built AMG biturbo brutality. Equipped with AMG Night Package II and 22-inch forged cross-spoke wheels.',
      features: [
        'AMG Performance Dual Side-Exit Exhaust',
        'AMG Night Package II Obsidian Trim',
        'Burmester 3D Surround Sound',
        'Triple Differential Locks',
        '22-inch Forged Cross-Spoke Matte Black Wheels'
      ],
      createdAt: '2024-03-05T12:00:00Z'
    },
    {
      id: 'apex-car-03',
      make: 'BMW',
      model: 'M4 Competition xDrive',
      year: 2023,
      priceUSD: 89500,
      mileage: 8400,
      status: 'available',
      featured: false,
      bodyType: 'Coupe',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Isle of Man Green',
      interiorColor: 'Kyalami Orange / Black Extended Merino Leather',
      engine: '3.0L BMW M TwinPower Turbo Inline-6',
      horsepower: 503,
      vin: 'WBS43AY02PF202303',
      images: [
        LOCAL_STUDIO_IMAGES.bmwStudio,
        LOCAL_STUDIO_IMAGES.porscheStudio,
        LOCAL_STUDIO_IMAGES.audiStudio
      ],
      description: 'Precision German track weapon finished in rare Isle of Man Green metallic with high-contrast Kyalami Orange carbon bucket seating.',
      features: [
        'M Carbon Bucket Seats',
        'M Carbon Exterior Package',
        'M Drive Professional Track Telemetry',
        'Icon Adaptive LED Headlights with Laserlight',
        'Harman Kardon Surround Sound'
      ],
      createdAt: '2024-02-15T09:30:00Z'
    },
    {
      id: 'apex-car-04',
      make: 'Audi',
      model: 'RS6 Avant',
      year: 2024,
      priceUSD: 142000,
      mileage: 2100,
      status: 'reserved',
      featured: false,
      sketchfabId: 'b432bb3ad006442c88a915d6718dffef',
      bodyType: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Nardo Grey',
      interiorColor: 'Valcona Leather with Express Red Honeycomb Stitching',
      engine: '4.0L Twin-Turbocharged TFSI V8',
      horsepower: 621,
      vin: 'WAUZZZF28RN202404',
      images: [
        LOCAL_STUDIO_IMAGES.audiStudio,
        LOCAL_STUDIO_IMAGES.mercedesStudio
      ],
      description: 'The super-wagon benchmark. Blistering 621 hp bi-turbo V8 paired with quattro all-wheel drive, dynamic rear-wheel steering, and widebody stance.',
      features: [
        'RS Dynamic Package Plus',
        'Dynamic All-Wheel Steering',
        'Ceramic Brakes with Red Calipers',
        'Bang & Olufsen Advanced 3D Sound',
        'RS Sport Exhaust System with Black Tips'
      ],
      createdAt: '2024-03-10T14:15:00Z'
    },
    {
      id: 'apex-car-05',
      make: 'Range Rover',
      model: 'SV Long Wheelbase',
      year: 2024,
      priceUSD: 215000,
      mileage: 950,
      status: 'available',
      featured: true,
      bodyType: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Santorini Black',
      interiorColor: 'Caraway Semi-Aniline Leather with Satin White Ceramic Accents',
      engine: '4.4L Twin-Turbocharged V8',
      horsepower: 606,
      vin: 'SALWR2V44RA202405',
      images: [
        LOCAL_STUDIO_IMAGES.rangeRoverStudio,
        LOCAL_STUDIO_IMAGES.mercedesStudio,
        LOCAL_STUDIO_IMAGES.astonStudio
      ],
      description: 'First-class luxury travel redefined by Special Vehicle Operations. Includes rear executive seating with deployable ceramic tables and refrigerated console.',
      features: [
        'SV Signature Executive Rear Suite',
        'Meridian Signature Sound System (35 Speakers)',
        'Electronic Air Suspension with Dynamic Response Pro',
        'Deployable Rear Club Table in White Ceramic',
        'Refrigerated Chiller Compartment'
      ],
      createdAt: '2024-03-12T16:45:00Z'
    },
    {
      id: 'apex-car-06',
      make: 'Ferrari',
      model: 'Roma',
      year: 2023,
      priceUSD: 238000,
      mileage: 4100,
      status: 'available',
      featured: false,
      sketchfabId: 'fedadda2bb6c4bf481636121548c6a47',
      bodyType: 'Coupe',
      transmission: 'PDK',
      fuelType: 'Gasoline',
      exteriorColor: 'Rosso Corsa',
      interiorColor: 'Cuoio Full Leather with Charcoal Stitching',
      engine: '3.9L Twin-Turbocharged 90° V8',
      horsepower: 612,
      vin: 'ZFF89VHA4P0202306',
      images: [
        LOCAL_STUDIO_IMAGES.ferrariEditorial,
        LOCAL_STUDIO_IMAGES.porscheStudio
      ],
      description: 'La Nuova Dolce Vita. Timeless Maranello grand touring silhouette housing an award-winning twin-turbo V8 and dual-cockpit digital interior.',
      features: [
        'Carbon Ceramic Brake System with Yellow Calipers',
        'Scuderia Ferrari Carbon Shields',
        'Magneride Dual-Mode Suspension',
        'Passenger Interactive Display',
        'Carbon Fiber Steering Wheel + LEDs'
      ],
      createdAt: '2024-02-20T11:00:00Z'
    },
    {
      id: 'apex-car-07',
      make: 'Tesla',
      model: 'Model S Plaid',
      year: 2024,
      priceUSD: 94500,
      mileage: 6200,
      status: 'sold',
      featured: false,
      bodyType: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Electric',
      exteriorColor: 'Deep Blue Metallic',
      interiorColor: 'All Black Premium Interior with Carbon Fiber Decor',
      engine: 'Tri-Motor All-Wheel Drive Electric Platform',
      horsepower: 1020,
      vin: '5YJSA1E67RF202407',
      images: [
        LOCAL_STUDIO_IMAGES.teslaStudio,
        LOCAL_STUDIO_IMAGES.audiStudio
      ],
      description: '0 to 60 mph in 1.99 seconds. The world’s quickest production acceleration with carbon-sleeved rotors and torque vectoring.',
      features: [
        'Tri-Motor Plaid Powertrain (1,020 hp)',
        'Full Self-Driving Capability Package',
        '21-inch Arachnid Wheels',
        'Yoke Steering Control',
        '22-Speaker 960W Audio with Active Noise Reduction'
      ],
      createdAt: '2024-01-18T15:20:00Z'
    },
    {
      id: 'apex-car-08',
      make: 'Aston Martin',
      model: 'DBX707',
      year: 2023,
      priceUSD: 208000,
      mileage: 5500,
      status: 'available',
      featured: false,
      bodyType: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Apex Silver',
      interiorColor: 'Inspire Sport Duotone Obsidian Black / Ivory',
      engine: '4.0L Twin-Turbocharged V8 (707 PS)',
      horsepower: 697,
      vin: 'SCFRMAAW0PG202308',
      images: [
        LOCAL_STUDIO_IMAGES.astonStudio,
        LOCAL_STUDIO_IMAGES.rangeRoverStudio,
        LOCAL_STUDIO_IMAGES.ferrariEditorial
      ],
      description: 'The pinnacle of performance SUVs. 697 hp of British muscularity paired with race-derived wet-clutch transmission and carbon ceramic anchors.',
      features: [
        'Standard Carbon Ceramic Brakes (420mm front)',
        '23-inch Forged Textured Black Alloy Wheels',
        'Sports Exhaust with Active Quad Tailpipes',
        'Carbon Fiber Upper Exterior Package',
        'Panoramic Glass Roof with Alcantara Blind'
      ],
      createdAt: '2024-02-28T13:40:00Z'
    }
  ];

  function sanitizeVehicleImages(vehicles) {
    const legacyPhotoIds = new Set(['apex-car-03', 'apex-car-05', 'apex-car-07', 'apex-car-08']);
    const legacyReuseSet = new Set([
      LOCAL_STUDIO_IMAGES.audiStudio,
      LOCAL_STUDIO_IMAGES.mercedesStudio,
      LOCAL_STUDIO_IMAGES.ferrariEditorial
    ]);
    return vehicles.map((v, idx) => {
      const seedMatch = INITIAL_VEHICLES.find((s) => s.id === v.id) || INITIAL_VEHICLES[idx % INITIAL_VEHICLES.length];
      const hasExternalUrl = Array.isArray(v.images) && v.images.some((u) => typeof u === 'string' && u.includes('unsplash.com'));
      const usesStaleSharedPhoto =
        legacyPhotoIds.has(v.id) &&
        Array.isArray(v.images) &&
        v.images.length > 0 &&
        legacyReuseSet.has(v.images[0]);
      if (!Array.isArray(v.images) || v.images.length === 0 || hasExternalUrl || usesStaleSharedPhoto) {
        return Object.assign({}, v, { images: [...seedMatch.images] });
      }
      return v;
    });
  }

  class Store {
    constructor() {
      this.listeners = new Set();
      this.currency = this._loadCurrency();
      this.vehicles = this._loadVehicles();
    }

    _loadCurrency() {
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(CURRENCY_KEY);
          if (stored && CURRENCY_RATES[stored]) return stored;
        }
      } catch (e) {
        console.warn('Unable to access localStorage for currency:', e);
      }
      return 'USD';
    }

    _loadVehicles() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return sanitizeVehicleImages(parsed);
            }
          }
        }
      } catch (e) {
        console.warn('Unable to read inventory from localStorage, falling back to seed:', e);
      }
      return this._saveSeed(INITIAL_VEHICLES);
    }

    _saveSeed(seedList) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seedList));
        }
      } catch (e) {
        console.warn('Failed saving seed inventory to localStorage:', e);
      }
      return JSON.parse(JSON.stringify(seedList));
    }

    _persist() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.vehicles));
        }
      } catch (e) {
        console.error('Failed to persist inventory to localStorage:', e);
      }
      this._notify();
    }

    _notify() {
      for (const listener of this.listeners) {
        try {
          listener({ vehicles: this.vehicles, currency: this.currency });
        } catch (err) {
          console.error('ApexStore subscriber error:', err);
        }
      }
    }

    subscribe(fn) {
      if (typeof fn === 'function') {
        this.listeners.add(fn);
        fn({ vehicles: this.vehicles, currency: this.currency });
      }
      return () => this.listeners.delete(fn);
    }

    getCurrency() {
      return this.currency;
    }

    setCurrency(curr) {
      if (CURRENCY_RATES[curr]) {
        this.currency = curr;
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(CURRENCY_KEY, curr);
          }
        } catch (e) {
          console.warn('Failed to store currency in localStorage:', e);
        }
        this._notify();
      }
    }

    getCurrencyRates() {
      return CURRENCY_RATES;
    }

    formatPrice(usdAmount, currencyOverride) {
      const curr = currencyOverride || this.currency;
      return formatPriceWithRates(usdAmount, curr);
    }

    extractSketchfabId(input) {
      return extractSketchfabId(input);
    }

    filterAndSortVehicles(filters) {
      return filterAndSortVehicles(this.vehicles, filters);
    }

    getVehicles() {
      return [...this.vehicles];
    }

    getVehicle(id) {
      return this.vehicles.find((v) => v.id === id) || null;
    }

    addVehicle(vehicleData) {
      const rawSketchfab = vehicleData.sketchfabId !== undefined ? vehicleData.sketchfabId : vehicleData.sketchfab;
      const parsedSketchfabId = extractSketchfabId(rawSketchfab);

      const rawImg = vehicleData.image && !String(vehicleData.image).includes('unsplash.com')
        ? vehicleData.image
        : LOCAL_STUDIO_IMAGES.porscheStudio;

      const newVehicle = {
        id: `apex-car-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        make: String(vehicleData.make || 'Custom').trim(),
        model: String(vehicleData.model || 'Exotic').trim(),
        year: Number(vehicleData.year) || new Date().getFullYear(),
        priceUSD: Number(vehicleData.priceUSD) || 0,
        mileage: Number(vehicleData.mileage) || 0,
        status: ['available', 'reserved', 'sold'].includes(vehicleData.status) ? vehicleData.status : 'available',
        featured: Boolean(vehicleData.featured),
        sketchfabId: parsedSketchfabId || null,
        bodyType: vehicleData.bodyType || 'Coupe',
        transmission: vehicleData.transmission || 'Automatic',
        fuelType: vehicleData.fuelType || 'Gasoline',
        exteriorColor: String(vehicleData.exteriorColor || 'Titanium Grey').trim(),
        interiorColor: String(vehicleData.interiorColor || 'Black Leather').trim(),
        engine: String(vehicleData.engine || 'High Output V8').trim(),
        horsepower: Number(vehicleData.horsepower) || 500,
        vin: String(vehicleData.vin || `VIN${Date.now()}`).trim().toUpperCase(),
        images: Array.isArray(vehicleData.images) && vehicleData.images.length > 0
          ? vehicleData.images
          : [rawImg],
        description: String(vehicleData.description || 'Pristine showroom condition with complete documentation.').trim(),
        features: Array.isArray(vehicleData.features) && vehicleData.features.length > 0
          ? vehicleData.features
          : ['Sport Exhaust', 'Ceramic Brakes', 'Premium Audio System', 'Sport Heated Seats'],
        createdAt: new Date().toISOString()
      };

      this.vehicles.unshift(newVehicle);
      this._persist();
      return newVehicle;
    }

    updateVehicle(id, patchData) {
      const idx = this.vehicles.findIndex((v) => v.id === id);
      if (idx === -1) return null;

      const current = this.vehicles[idx];
      let updatedSketchfabId = current.sketchfabId;
      if (patchData.sketchfabId !== undefined) {
        updatedSketchfabId = extractSketchfabId(patchData.sketchfabId);
      } else if (patchData.sketchfab !== undefined) {
        updatedSketchfabId = extractSketchfabId(patchData.sketchfab);
      }

      const updated = {
        ...current,
        ...patchData,
        id: current.id,
        sketchfabId: updatedSketchfabId,
        priceUSD: patchData.priceUSD !== undefined ? Number(patchData.priceUSD) : current.priceUSD,
        mileage: patchData.mileage !== undefined ? Number(patchData.mileage) : current.mileage,
        year: patchData.year !== undefined ? Number(patchData.year) : current.year,
        horsepower: patchData.horsepower !== undefined ? Number(patchData.horsepower) : current.horsepower
      };

      if (patchData.image && (!patchData.images || patchData.images.length === 0)) {
        updated.images = [patchData.image, ...(current.images?.slice(1) || [])];
      }

      this.vehicles[idx] = updated;
      this._persist();
      return updated;
    }

    deleteVehicle(id) {
      const initialLength = this.vehicles.length;
      this.vehicles = this.vehicles.filter((v) => v.id !== id);
      if (this.vehicles.length !== initialLength) {
        this._persist();
        return true;
      }
      return false;
    }

    toggleStatus(id, newStatus) {
      if (!['available', 'reserved', 'sold'].includes(newStatus)) {
        console.error('Invalid status for toggleStatus:', newStatus);
        return null;
      }
      return this.updateVehicle(id, { status: newStatus });
    }

    resetSeedData() {
      this.vehicles = this._saveSeed(INITIAL_VEHICLES);
      this._notify();
      return this.vehicles;
    }

    getKPIs() {
      const total = this.vehicles.length;
      const available = this.vehicles.filter((v) => v.status === 'available').length;
      const reserved = this.vehicles.filter((v) => v.status === 'reserved').length;
      const sold = this.vehicles.filter((v) => v.status === 'sold').length;
      const totalValueUSD = this.vehicles.reduce((sum, v) => sum + (Number(v.priceUSD) || 0), 0);

      return {
        total,
        available,
        reserved,
        sold,
        totalValueUSD,
        totalValueFormatted: this.formatPrice(totalValueUSD)
      };
    }

    getFeatured3DCars() {
      return [...FEATURED_3D_CARS];
    }

    getFeatured3DCar(id) {
      return FEATURED_3D_CARS.find((c) => c.id === id) || FEATURED_3D_CARS[0];
    }

    getStudioImages() {
      return Object.assign({}, LOCAL_STUDIO_IMAGES);
    }
  }

  /**
   * Pure helper: getAdjacentFeaturedCarIds(currentCarId)
   * Returns deterministic { currentId, prevId, nextId } for 3D viewer vehicle cycling.
   */
  function getAdjacentFeaturedCarIds(currentCarId) {
    const order = [
      'ferrari-roma-2023',
      'mercedes-amg-g63-2024',
      'audi-rs6-avant-2024',
      'porsche-gt3-rs-2024'
    ];
    const idx = order.indexOf(currentCarId);
    const safeIdx = idx === -1 ? 0 : idx;
    const prevIdx = (safeIdx - 1 + order.length) % order.length;
    const nextIdx = (safeIdx + 1) % order.length;
    return {
      currentId: order[safeIdx],
      prevId: order[prevIdx],
      nextId: order[nextIdx]
    };
  }

  const storeInstance = new Store();
  if (root) {
    root.ApexStore = storeInstance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ApexStore: storeInstance,
      Store,
      extractSketchfabId,
      formatPriceWithRates,
      filterAndSortVehicles,
      getAdjacentFeaturedCarIds,
      FEATURED_3D_CARS,
      INITIAL_VEHICLES
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);

