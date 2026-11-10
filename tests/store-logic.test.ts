import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  ApexStore,
  extractSketchfabId,
  formatPriceWithRates,
  filterAndSortVehicles,
  getAdjacentFeaturedCarIds,
  FEATURED_3D_CARS,
  INITIAL_VEHICLES
} = require('../scripts/dealership-store.js');

test('formatPriceWithRates converts USD to NGN, GBP, and EUR accurately', () => {
  assert.equal(formatPriceWithRates(248000, 'USD'), '$248,000');
  assert.equal(formatPriceWithRates(248000, 'NGN'), '₦396,800,000');
  assert.equal(formatPriceWithRates(248000, 'GBP'), '£195,920');
  assert.equal(formatPriceWithRates(248000, 'EUR'), '€228,160');
});

test('extractSketchfabId parses raw IDs and full URLs', () => {
  assert.equal(extractSketchfabId('456b3d9d60b646369d76667848d6d027'), '456b3d9d60b646369d76667848d6d027');
  assert.equal(
    extractSketchfabId('https://sketchfab.com/models/fedadda2bb6c4bf481636121548c6a47/embed'),
    'fedadda2bb6c4bf481636121548c6a47'
  );
  assert.equal(extractSketchfabId(''), null);
});

test('filterAndSortVehicles filters by keyword, make, status, and sorts by price', () => {
  const porscheOnly = filterAndSortVehicles(INITIAL_VEHICLES, { keyword: 'Porsche' });
  assert.equal(porscheOnly.length, 1);
  assert.equal(porscheOnly[0].id, 'apex-car-01');

  const availableOnly = filterAndSortVehicles(INITIAL_VEHICLES, { status: 'available' });
  assert.equal(availableOnly.length, 6);

  const sortedAsc = filterAndSortVehicles(INITIAL_VEHICLES, { sortBy: 'price-asc' });
  assert.ok(sortedAsc[0].priceUSD <= sortedAsc[1].priceUSD);
});

test('all FEATURED_3D_CARS map to dedicated local .glb models and INITIAL_VEHICLES use local studio images', () => {
  assert.equal(FEATURED_3D_CARS.length, 4);
  const expectedGlbByCarId: Record<string, string> = {
    'porsche-gt3-rs-2024': './models/porsche_911.glb',
    'ferrari-roma-2023': './models/ferrari.glb',
    'mercedes-amg-g63-2024': './models/mercedes_g63.glb',
    'audi-rs6-avant-2024': './models/audi_rs6.glb'
  };
  for (const car of FEATURED_3D_CARS) {
    assert.equal(
      car.glbPath,
      expectedGlbByCarId[car.id],
      `Expected dedicated local .glb path for ${car.id}, got ${car.glbPath}`
    );
  }

  for (const v of INITIAL_VEHICLES) {
    assert.ok(Array.isArray(v.images) && v.images.length > 0);
    for (const img of v.images) {
      assert.ok(!img.includes('unsplash.com'), `Vehicle ${v.id} must not use external unsplash URL: ${img}`);
    }
  }
});

test('getAdjacentFeaturedCarIds cycles deterministically across all 4 3D showroom vehicles', () => {
  const step1 = getAdjacentFeaturedCarIds('ferrari-roma-2023');
  assert.equal(step1.prevId, 'porsche-gt3-rs-2024');
  assert.equal(step1.nextId, 'mercedes-amg-g63-2024');

  const step2 = getAdjacentFeaturedCarIds(step1.nextId);
  assert.equal(step2.currentId, 'mercedes-amg-g63-2024');
  assert.equal(step2.nextId, 'audi-rs6-avant-2024');

  const step3 = getAdjacentFeaturedCarIds(step2.nextId);
  assert.equal(step3.currentId, 'audi-rs6-avant-2024');
  assert.equal(step3.nextId, 'porsche-gt3-rs-2024');

  const step4 = getAdjacentFeaturedCarIds(step3.nextId);
  assert.equal(step4.currentId, 'porsche-gt3-rs-2024');
  assert.equal(step4.nextId, 'ferrari-roma-2023');
});

test('ApexStore CRUD and KPI calculations work deterministically', () => {
  ApexStore.resetSeedData();
  const initialKpis = ApexStore.getKPIs();
  assert.equal(initialKpis.total, 8);
  assert.equal(initialKpis.available, 6);

  const added = ApexStore.addVehicle({
    make: 'McLaren',
    model: '750S',
    year: 2025,
    priceUSD: 310000,
    status: 'available'
  });
  assert.equal(ApexStore.getVehicles().length, 9);

  ApexStore.toggleStatus(added.id, 'reserved');
  assert.equal(ApexStore.getVehicle(added.id).status, 'reserved');

  ApexStore.deleteVehicle(added.id);
  assert.equal(ApexStore.getVehicles().length, 8);
});

