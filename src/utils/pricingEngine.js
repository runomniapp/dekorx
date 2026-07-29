// Data-Driven Pricing Engine & Bill of Materials (BOM) Calculator

import { ALL_MODULES } from './moduleCatalog';

// Sahnede kullanılabilir tüm modüller kataloğun düzleştirilmiş halidir.
// Katalogdaki oda/bölüm hiyerarşisi de buradan yeniden yayınlanır.
export const AVAILABLE_MODULE_TYPES = ALL_MODULES;
export * from './moduleCatalog';

export const FLOOR_MATERIALS = [
  { id: 'parquet_oak', name: 'Doğal Meşe Parke', pricePerSqm: 1200, color: '#C59B67', texture: 'wood' },
  { id: 'marble_white', name: 'Calacatta Beyaz Mermer', pricePerSqm: 2800, color: '#F0F4F8', texture: 'marble' },
  { id: 'marble_black', name: 'Lauren Siyah Mermer', pricePerSqm: 3100, color: '#1A202C', texture: 'dark_marble' },
  { id: 'tile_hexagon', name: 'Altıgen Seramik Karo', pricePerSqm: 950, color: '#E2E8F0', texture: 'tile' },
  { id: 'microcement', name: 'Gri Mikrobeton', pricePerSqm: 1400, color: '#A0AEC0', texture: 'concrete' }
];

export const CABINET_DOOR_FINISHES = [
  { id: 'matte_lacquer', name: 'Mat Lake Kapak', multiplier: 1.0, color: '#F8F9FA' },
  { id: 'acrylic_gloss', name: 'Akrilik Yüksek Parlaklık', multiplier: 1.15, color: '#EDF2F7' },
  { id: 'natural_oak', name: 'Doğal Ahşap Meşe Kaplama', multiplier: 1.35, color: '#C59B67' },
  { id: 'fume_glass', name: 'Füme Cam & Alüminyum Çerçeve', multiplier: 1.55, color: '#2D3748' },
  { id: 'anthracite', name: 'Mat Antrasit Soft-Touch', multiplier: 1.10, color: '#1A202C' },
  { id: 'sage_green', name: 'Soft Ada Çayı Yeşili', multiplier: 1.20, color: '#8AA899' },
  { id: 'terracotta', name: 'Sıcak Terrakotta', multiplier: 1.25, color: '#DF6B4E' }
];

export const COUNTERTOP_MATERIALS = [
  { id: 'calacatta', name: 'Calacatta Kuvars Tezgah', pricePerMeter: 4200, color: '#F7FAFC' },
  { id: 'black_granite', name: 'Siyah Granit Tezgah', pricePerMeter: 4800, color: '#171923' },
  { id: 'oak_wood', name: 'Masif Meşe Ahşap Tezgah', pricePerMeter: 2900, color: '#D69E2E' }
];

export function calculateDataDrivenPricing({
  roomWidth = 4.0,
  roomLength = 3.5,
  selectedFloorId = 'parquet_oak',
  selectedDoorFinishId = 'matte_lacquer',
  selectedCountertopId = 'calacatta',
  placedModules = [],
  autoCountertopEnabled = true,
  includeLedLighting = true,
  includeAssembly = true
}) {
  const floorAreaSqm = parseFloat((roomWidth * roomLength).toFixed(2));
  const floorMaterial = FLOOR_MATERIALS.find((f) => f.id === selectedFloorId) || FLOOR_MATERIALS[0];
  const floorCost = Math.round(floorAreaSqm * floorMaterial.pricePerSqm);

  const globalDoorFinish = CABINET_DOOR_FINISHES.find((d) => d.id === selectedDoorFinishId) || CABINET_DOOR_FINISHES[0];
  const countertop = COUNTERTOP_MATERIALS.find((c) => c.id === selectedCountertopId) || COUNTERTOP_MATERIALS[0];

  let baseCabinetsCost = 0;
  let wallCabinetsCost = 0;
  let tallCabinetsCost = 0;
  let islandCabinetsCost = 0;
  let fixturesCost = 0;
  let totalCountertopLengthMeters = 0;
  let totalCabinetCount = placedModules.length;

  const itemizedList = [];

  placedModules.forEach((item, index) => {
    const modDef = AVAILABLE_MODULE_TYPES.find((m) => m.id === item.typeId) || AVAILABLE_MODULE_TYPES[0];
    const doorFinish = item.customDoorFinishId
      ? CABINET_DOOR_FINISHES.find((d) => d.id === item.customDoorFinishId) || globalDoorFinish
      : globalDoorFinish;

    const glassMultiplier = item.hasGlassDoor ? 1.25 : 1.0;
    const modulePrice = Math.round(modDef.basePrice * doorFinish.multiplier * glassMultiplier);

    const modWidth = Math.round((item.customWidth || modDef.width) * 100);
    const modHeight = Math.round((item.customHeight || modDef.height) * 100);
    const modDepth = Math.round((item.customDepth || modDef.depth) * 100);

    itemizedList.push({
      itemNumber: index + 1,
      id: item.id,
      name: modDef.name,
      category: modDef.category,
      dimensions: `${modWidth}x${modHeight}x${modDepth} cm`,
      finishName: doorFinish.name,
      hasGlass: item.hasGlassDoor,
      isOpenCorner: modDef.isOpenCorner,
      price: modulePrice,
      formattedPrice: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(modulePrice)
    });

    // Tezgah metrajı yalnızca üzerine tezgah basılan modüllerden toplanır
    const takesCountertop = modDef.countertop !== false;

    if (modDef.category === 'alt') {
      baseCabinetsCost += modulePrice;
      if (takesCountertop) totalCountertopLengthMeters += (item.customWidth || modDef.width);
    } else if (modDef.category === 'ust') {
      wallCabinetsCost += modulePrice;
    } else if (modDef.category === 'boy') {
      tallCabinetsCost += modulePrice;
    } else if (modDef.category === 'ada') {
      islandCabinetsCost += modulePrice;
      if (takesCountertop) totalCountertopLengthMeters += (item.customWidth || modDef.width);
    } else {
      // Vitrifiye & armatür / aksesuar kalemleri
      fixturesCost += modulePrice;
    }
  });

  const countertopCost = autoCountertopEnabled ? Math.round(totalCountertopLengthMeters * countertop.pricePerMeter) : 0;
  const softCloseHingesCost = totalCabinetCount * 450;
  const ledLightingCost = includeLedLighting ? Math.round(totalCountertopLengthMeters * 850) : 0;
  const accessoriesCost = softCloseHingesCost + ledLightingCost;

  const subtotal = floorCost + baseCabinetsCost + wallCabinetsCost + tallCabinetsCost
    + islandCabinetsCost + fixturesCost + countertopCost + accessoriesCost;
  const assemblyCost = includeAssembly ? Math.round(subtotal * 0.12) : 0;
  const grandTotal = subtotal + assemblyCost;

  return {
    floorAreaSqm,
    floorMaterial,
    floorCost,
    doorFinish: globalDoorFinish,
    countertop,
    countertopCost,
    totalCountertopLengthMeters: parseFloat(totalCountertopLengthMeters.toFixed(2)),
    totalCabinetCount,
    baseCabinetsCost,
    wallCabinetsCost,
    tallCabinetsCost,
    islandCabinetsCost,
    fixturesCost,
    accessoriesCost,
    assemblyCost,
    subtotal,
    grandTotal,
    itemizedList,
    formattedGrandTotal: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(grandTotal)
  };
}
