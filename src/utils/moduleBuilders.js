import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETRİK 3D MODÜL ÜRETİCİSİ
// Katalogdaki `build` tanımını (satırlar + aksesuarlar + özel elemanlar) gerçek
// three.js geometrisine çevirir. Tüm modüller tabanı y=0'da, x/z merkezli üretilir.
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_T = 0.018;
const FRONT_GAP = 0.004;   // gövde ile kapak arasındaki boşluk
const FRONT_T = 0.022;     // kapak / çekmece kalınlığı
const REVEAL = 0.004;      // kapaklar arası derz

// ── Malzemeler ───────────────────────────────────────────────────────────────
export const createModuleMaterials = (doorColor, counterColor) => {
  const door = new THREE.Color(doorColor);
  const counter = new THREE.Color(counterColor || '#F7FAFC');

  // Kapak renginin koyu tonu: çerçeve, profil ve derinlik vurguları için
  const doorHSL = { h: 0, s: 0, l: 0 };
  door.getHSL(doorHSL);
  const doorDark = new THREE.Color().setHSL(doorHSL.h, doorHSL.s, Math.max(0.06, doorHSL.l * 0.55));

  return {
    door: new THREE.MeshStandardMaterial({ color: door, roughness: 0.42, metalness: 0.04 }),
    doorSoft: new THREE.MeshStandardMaterial({ color: door, roughness: 0.55 }),
    doorDark: new THREE.MeshStandardMaterial({ color: doorDark, roughness: 0.4, metalness: 0.2 }),
    carcass: new THREE.MeshStandardMaterial({ color: door, roughness: 0.5 }),
    inner: new THREE.MeshStandardMaterial({ color: 0xE7EBF0, roughness: 0.72 }),
    innerDark: new THREE.MeshStandardMaterial({ color: 0x2C333D, roughness: 0.66 }),
    counter: new THREE.MeshStandardMaterial({ color: counter, roughness: 0.22, metalness: 0.08 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.85, roughness: 0.15 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xC9CFD6, metalness: 0.95, roughness: 0.14 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8F99A6, metalness: 0.9, roughness: 0.26 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15181D, metalness: 0.5, roughness: 0.42 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0E1013, metalness: 0.35, roughness: 0.5 }),
    porcelain: new THREE.MeshStandardMaterial({ color: 0xFBFCFD, roughness: 0.14, metalness: 0.03 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xB07C4A, roughness: 0.62 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xB9BFC8, roughness: 0.92 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3E7D4F, roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x9FD3EA, transparent: true, opacity: 0.32, roughness: 0.08, transmission: 0.9, metalness: 0
    }),
    darkGlass: new THREE.MeshPhysicalMaterial({
      color: 0x0A0D11, metalness: 0.4, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.05
    }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xDCE6EE, metalness: 1, roughness: 0.045 }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x4FB6D8, transparent: true, opacity: 0.72, roughness: 0.05, transmission: 0.6
    }),
    led: new THREE.MeshStandardMaterial({
      color: 0xFFF3D0, emissive: 0xFFE9A8, emissiveIntensity: 1.1, roughness: 0.4
    }),
    display: new THREE.MeshStandardMaterial({
      color: 0x1B3A2E, emissive: 0x2BE08A, emissiveIntensity: 0.55, roughness: 0.3
    })
  };
};

// ── Küçük yardımcılar ────────────────────────────────────────────────────────
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(h, 0.001), Math.max(d, 0.001)), mat);
  m.position.set(x, y, z);
  return m;
};

const cyl = (rTop, rBot, h, mat, seg = 20) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);

// Yuvarlatılmış köşeli tezgah plakası; istenirse evye kesiti ile delinir.
// Geometri y=0'ın altına sarkar, mesh üst yüzeye yerleştirilir.
export const createSlabGeometry = (width, depth, thickness, cutout) => {
  const traceRoundedRect = (path, cx, cz, w, d, r) => {
    const hw = w / 2;
    const hd = d / 2;
    const rr = Math.min(r, hw, hd);
    path.moveTo(cx - hw + rr, cz - hd);
    path.lineTo(cx + hw - rr, cz - hd);
    path.quadraticCurveTo(cx + hw, cz - hd, cx + hw, cz - hd + rr);
    path.lineTo(cx + hw, cz + hd - rr);
    path.quadraticCurveTo(cx + hw, cz + hd, cx + hw - rr, cz + hd);
    path.lineTo(cx - hw + rr, cz + hd);
    path.quadraticCurveTo(cx - hw, cz + hd, cx - hw, cz + hd - rr);
    path.lineTo(cx - hw, cz - hd + rr);
    path.quadraticCurveTo(cx - hw, cz - hd, cx - hw + rr, cz - hd);
  };

  const shape = new THREE.Shape();
  traceRoundedRect(shape, 0, 0, width, depth, 0.014);

  if (cutout) {
    const hole = new THREE.Path();
    traceRoundedRect(hole, 0, cutout.z, cutout.w, cutout.d, 0.025);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 8 });
  geo.rotateX(Math.PI / 2);
  return geo;
};

// Evye ayak izinin tek kaynağı: çukur, tezgah kesiti ve batarya buradan türer.
export const getSinkLayout = (modWidth, modDepth, double = true) => {
  const sinkW = Math.min(modWidth * (double ? 0.8 : 0.62), modWidth - 0.1);
  const sinkD = Math.min(modDepth * 0.68, modDepth - 0.14);
  const rimW = 0.03;
  const cutW = sinkW - rimW * 2;
  const cutD = sinkD - rimW * 2;
  const dividerT = 0.022;
  const dividerX = double ? -cutW * 0.09 : -cutW / 2 - dividerT;

  return {
    sinkW, sinkD, rimW, cutW, cutD, dividerT, dividerX, double,
    centerZ: modDepth * 0.05,
    bowlDepth: 0.17,
    wallT: 0.012,
    leftBowlCenterX: double ? (-cutW / 2 + dividerX - dividerT / 2) / 2 : 0,
    rightBowlCenterX: double ? (dividerX + dividerT / 2 + cutW / 2) / 2 : 0
  };
};

const SINK_EXTRAS = ['sink_double', 'sink_single', 'undermount_basin', 'double_basin'];

export const moduleHasSink = (def) => {
  const extras = def?.build?.extras || [];
  return extras.some((e) => SINK_EXTRAS.includes(e));
};

// Otomatik tezgah üretici bu kesiti kullanarak plakayı deler.
export const getModuleSinkCutout = (def, w, d) => {
  const extras = def?.build?.extras || [];
  if (extras.includes('sink_double')) {
    const l = getSinkLayout(w, d, true);
    return { w: l.cutW, d: l.cutD, z: l.centerZ };
  }
  if (extras.includes('sink_single') || extras.includes('undermount_basin')) {
    const l = getSinkLayout(w, d, false);
    return { w: l.cutW, d: l.cutD, z: l.centerZ };
  }
  return null;
};

// Modülün üstüne otomatik tezgah basılıp basılmayacağı.
export const moduleTakesCountertop = (def) =>
  !!def && def.countertop !== false && (def.category === 'alt' || def.category === 'ada');

// ═════════════════════════════════════════════════════════════════════════════
// ÖN YÜZ SATIR ÜRETİCİLERİ
// Her üretici (w × h) boyutlu, kendi merkezinde bir grup döndürür.
// ═════════════════════════════════════════════════════════════════════════════

const addHandle = (g, mats, x, y, z, vertical = true, len = 0.14) => {
  const h = vertical
    ? box(0.022, len, 0.032, mats.brass, x, y, z)
    : box(len, 0.022, 0.032, mats.brass, x, y, z);
  g.add(h);
};

// Şaker / göbekli / kemerli kapak paneli detayı
const doorPanelDetail = (g, w, h, mats, style) => {
  const border = Math.min(w, h) * 0.13;
  if (style === 'arched_solid') {
    const halfW = (w - border * 2) / 2;
    const halfH = (h - border * 2) / 2;
    if (halfW <= 0.01 || halfH <= 0.01) return;
    const archH = Math.min(halfW, halfH * 0.8);
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, -halfH);
    shape.lineTo(halfW, -halfH);
    shape.lineTo(halfW, halfH - archH);
    shape.absellipse(0, halfH - archH, halfW, archH, 0, Math.PI, false, 0);
    shape.lineTo(-halfW, -halfH);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2, curveSegments: 28
    });
    const m = new THREE.Mesh(geo, mats.door);
    m.position.z = FRONT_T / 2;
    g.add(m);
    return;
  }
  // shaker: içeri göbek
  if (w - border * 2 > 0.02 && h - border * 2 > 0.02) {
    g.add(box(w - border * 2, h - border * 2, 0.012, mats.door, 0, 0, FRONT_T / 2 + 0.005));
  }
};

const rowDoor = (spec, ctx) => {
  const { w, h, mats, item } = ctx;
  const g = new THREE.Group();
  const n = Math.max(1, spec.n || 1);
  const leafW = (w - REVEAL * (n - 1)) / n;
  const style = item.doorStyle || 'shaker_raised';
  const handlePos = item.handlePosition || 'right';

  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + leafW / 2 + i * (leafW + REVEAL);
    const leaf = new THREE.Group();
    leaf.position.x = cx;
    leaf.add(box(leafW, h, FRONT_T, mats.door));
    doorPanelDetail(leaf, leafW, h, mats, style);

    // Kulp: çift kapakta derz tarafına, tekte seçilen tarafa.
    // Uzun kapaklarda ele gelen yüksekliğe (~zeminden 1 m) çekilir.
    const hy = h > 1.0 ? -h / 2 + Math.min(h * 0.72, 0.95) : 0;
    const handleLen = Math.min(h * 0.42, 0.16);
    if (n > 1) {
      const side = i < n / 2 ? 1 : -1;
      addHandle(leaf, mats, side * (leafW / 2 - 0.045), hy, FRONT_T / 2 + 0.02, true, handleLen);
    } else if (handlePos === 'center') {
      addHandle(leaf, mats, 0, hy, FRONT_T / 2 + 0.02, false, Math.min(leafW * 0.4, 0.18));
    } else {
      const side = handlePos === 'left' ? -1 : 1;
      addHandle(leaf, mats, side * (leafW / 2 - 0.045), hy, FRONT_T / 2 + 0.02, true, handleLen);
    }
    g.add(leaf);
  }
  return g;
};

const rowDrawer = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  g.add(box(w - REVEAL, h - REVEAL, FRONT_T, mats.door));
  // Hafif kanal + boydan boya bar kulp
  g.add(box((w - REVEAL) * 0.92, Math.max(h * 0.5, 0.02), 0.008, mats.door, 0, 0, FRONT_T / 2 + 0.004));
  const barLen = Math.min(w * 0.55, 0.42);
  const bar = cyl(0.009, 0.009, barLen, mats.brass, 16);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, h * 0.22, FRONT_T / 2 + 0.03);
  g.add(bar);
  [-1, 1].forEach((s) => g.add(box(0.014, 0.014, 0.03, mats.brass, s * barLen * 0.44, h * 0.22, FRONT_T / 2 + 0.015)));
  return g;
};

const rowGlass = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const n = Math.max(1, spec.n || 1);
  const leafW = (w - REVEAL * (n - 1)) / n;

  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + leafW / 2 + i * (leafW + REVEAL);
    const leaf = new THREE.Group();
    leaf.position.x = cx;

    const fr = Math.min(leafW, h) * 0.09;
    // Alüminyum/lake çerçeve: 4 kenar
    leaf.add(box(leafW, fr, 0.026, mats.doorDark, 0, h / 2 - fr / 2, 0));
    leaf.add(box(leafW, fr, 0.026, mats.doorDark, 0, -h / 2 + fr / 2, 0));
    leaf.add(box(fr, h, 0.026, mats.doorDark, -leafW / 2 + fr / 2, 0, 0));
    leaf.add(box(fr, h, 0.026, mats.doorDark, leafW / 2 - fr / 2, 0, 0));
    leaf.add(box(leafW - fr * 2, h - fr * 2, 0.006, mats.glass, 0, 0, 0));

    // Çıtalar
    leaf.add(box(0.013, h - fr * 2, 0.014, mats.doorDark, 0, 0, 0.006));
    [0.28, 0.62].forEach((t) =>
      leaf.add(box(leafW - fr * 2, 0.012, 0.014, mats.doorDark, 0, -h / 2 + h * t, 0.006))
    );
    addHandle(leaf, mats, (i < n / 2 ? 1 : -1) * (leafW / 2 - 0.04), 0, 0.028, true, Math.min(h * 0.4, 0.15));
    g.add(leaf);
  }
  return g;
};

const rowLift = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  g.add(box(w - REVEAL, h - REVEAL, FRONT_T, mats.door));
  doorPanelDetail(g, w - REVEAL, h - REVEAL, mats, 'shaker_raised');
  // Kalkar kapakta kulp alt kenarda
  const barLen = Math.min(w * 0.5, 0.4);
  const bar = cyl(0.009, 0.009, barLen, mats.brass, 16);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, -h / 2 + 0.035, FRONT_T / 2 + 0.028);
  g.add(bar);
  return g;
};

const rowFoldLift = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const leafH = (h - REVEAL) / 2;
  [-1, 1].forEach((s) => {
    const y = s * (leafH / 2 + REVEAL / 2);
    g.add(box(w - REVEAL, leafH - REVEAL * 0.5, FRONT_T, mats.door, 0, y, 0));
    // Katlanma derzi vurgusu
    g.add(box(w - REVEAL, 0.006, 0.006, mats.doorDark, 0, y - s * leafH / 2, FRONT_T / 2 + 0.003));
  });
  const barLen = Math.min(w * 0.5, 0.4);
  const bar = cyl(0.009, 0.009, barLen, mats.brass, 16);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, -h / 2 + 0.035, FRONT_T / 2 + 0.028);
  g.add(bar);
  return g;
};

const rowTambour = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const slat = 0.026;
  const count = Math.max(3, Math.floor(h / slat));
  for (let i = 0; i < count; i++) {
    const y = -h / 2 + slat / 2 + i * (h / count);
    const s = box(w - 0.01, h / count - 0.003, 0.014, i % 2 ? mats.doorDark : mats.door, 0, y, 0);
    g.add(s);
  }
  // Alt tutamak profili
  g.add(box(w - 0.01, 0.026, 0.026, mats.doorDark, 0, -h / 2 + 0.013, 0.008));
  return g;
};

const rowPanel = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  g.add(box(w - REVEAL, h - REVEAL, FRONT_T, mats.door));
  return g;
};

const rowOpen = (spec, ctx) => {
  const { w, h, mats, depth, frontOffsetZ = 0 } = ctx;
  const g = new THREE.Group();
  const innerD = depth - PANEL_T * 2;
  // Satır grubu ön yüze ötelenmiş durumda; açık göz elemanları gövde
  // koordinatlarına geri çekilmeli.
  const zBack = -depth / 2 + PANEL_T * 1.2 - frontOffsetZ;
  const zCenter = -frontOffsetZ;

  // Açık gözde kapak yok; koyu arkalık ve raflar görünür
  g.add(box(w, h, 0.006, mats.innerDark, 0, 0, zBack));

  const shelves = spec.shelves || 0;
  for (let i = 1; i <= shelves; i++) {
    const y = -h / 2 + (h * i) / (shelves + 1);
    g.add(box(w - 0.006, 0.018, innerD * 0.95, mats.inner, 0, y, zCenter));
  }
  return g;
};

const rowMirror = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const n = Math.max(1, spec.n || 1);
  const leafW = (w - REVEAL * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + leafW / 2 + i * (leafW + REVEAL);
    const leaf = new THREE.Group();
    leaf.position.x = cx;
    leaf.add(box(leafW, h, 0.018, mats.doorDark));
    leaf.add(box(leafW - 0.014, h - 0.014, 0.004, mats.mirror, 0, 0, 0.011));
    g.add(leaf);
  }
  return g;
};

const rowBasket = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  // Devrilir kapak: alt kenardan menteşeli, öne doğru eğik.
  // Menteşe pivotu satırın alt kenarında, kanat pivotun üstünde durur.
  const hinge = new THREE.Group();
  hinge.position.y = -h / 2;
  hinge.rotation.x = 0.28;

  const leaf = new THREE.Group();
  leaf.position.y = (h - REVEAL) / 2;
  leaf.add(box(w - REVEAL, h - REVEAL, FRONT_T, mats.door));
  doorPanelDetail(leaf, w - REVEAL, h - REVEAL, mats, 'shaker_raised');

  const barLen = Math.min(w * 0.4, 0.3);
  const bar = cyl(0.008, 0.008, barLen, mats.brass, 14);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, h * 0.28, FRONT_T / 2 + 0.026);
  leaf.add(bar);

  hinge.add(leaf);
  g.add(hinge);
  // Görünen tel sepet
  const basket = box((w - REVEAL) * 0.82, h * 0.6, 0.14, mats.chrome, 0, -h * 0.05, -0.1);
  g.add(basket);
  return g;
};

const rowCargo = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  g.add(box(w - REVEAL, h - REVEAL, FRONT_T, mats.door));
  const bar = cyl(0.009, 0.009, h * 0.6, mats.brass, 16);
  bar.position.set(0, 0, FRONT_T / 2 + 0.028);
  g.add(bar);
  // Teleskopik iskelet: iki dikey ray + yatay teller
  [-1, 1].forEach((s) => g.add(box(0.012, h * 0.9, 0.012, mats.chrome, s * (w * 0.3), 0, -0.12)));
  for (let i = 0; i < 3; i++) {
    g.add(box(w * 0.7, 0.008, 0.008, mats.chrome, 0, -h * 0.3 + i * h * 0.3, -0.12));
  }
  return g;
};

const rowSlideDoor = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const n = Math.max(2, spec.n || 2);
  // Sürme kapaklar bindirmeli çalışır: panel genişliği bölme genişliğinden fazla
  const leafW = (w / n) * 1.06;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + leafW / 2 + i * ((w - leafW) / (n - 1));
    const z = (i % 2) * 0.026;
    const leaf = new THREE.Group();
    leaf.position.set(cx, 0, z);
    leaf.add(box(leafW, h, 0.02, mats.doorDark));
    leaf.add(box(leafW - 0.03, h - 0.03, 0.008, mats.door, 0, 0, 0.012));
    // Dikey profil kulp
    leaf.add(box(0.026, h - 0.04, 0.03, mats.chrome, leafW / 2 - 0.03, 0, 0.02));
    g.add(leaf);
  }
  // Üst & alt ray
  g.add(box(w, 0.024, 0.075, mats.doorDark, 0, h / 2 + 0.012, 0.026));
  g.add(box(w, 0.018, 0.075, mats.doorDark, 0, -h / 2 - 0.009, 0.026));
  return g;
};

const rowAccordion = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const n = Math.max(2, spec.n || 4);
  const leafW = w / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + leafW / 2 + i * leafW;
    const leaf = box(leafW - 0.004, h, FRONT_T, mats.door, cx, 0, 0);
    leaf.rotation.y = (i % 2 ? 1 : -1) * 0.14;
    g.add(leaf);
  }
  addHandle(g, mats, w / 2 - 0.05, 0, FRONT_T / 2 + 0.03, true, Math.min(h * 0.3, 0.2));
  return g;
};

// Ankastre cihaz yüzü (fırın / mikrodalga)
const appliancePanel = (w, h, kind, mats) => {
  const g = new THREE.Group();
  const bw = w * 0.94;
  const isMicro = kind === 'microwave';

  g.add(box(bw, h, 0.032, mats.steel));

  if (isMicro) {
    const panelW = bw * 0.26;
    const panelX = bw / 2 - panelW / 2;
    g.add(box(panelW, h * 0.88, 0.012, mats.dark, panelX, 0, 0.022));
    g.add(box(panelW * 0.7, h * 0.14, 0.006, mats.display, panelX, h * 0.28, 0.03));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        g.add(box(panelW * 0.26, h * 0.07, 0.005, mats.steel,
          panelX + (c - 0.5) * panelW * 0.38, h * (0.05 - r * 0.14), 0.03));
      }
    }
    const winW = bw - panelW - bw * 0.1;
    g.add(box(winW, h * 0.76, 0.01, mats.darkGlass, -bw / 2 + bw * 0.05 + winW / 2, 0, 0.023));
    const pull = cyl(0.009, 0.009, h * 0.7, mats.steel, 16);
    pull.position.set(panelX - panelW / 2 - 0.022, 0, 0.05);
    g.add(pull);
  } else {
    const stripH = h * 0.18;
    const stripY = h / 2 - stripH / 2;
    g.add(box(bw, stripH, 0.014, mats.dark, 0, stripY, 0.023));
    g.add(box(bw * 0.3, stripH * 0.42, 0.006, mats.display, 0, stripY, 0.032));
    [-1, 1].forEach((s) => {
      const k = cyl(stripH * 0.26, stripH * 0.26, 0.016, mats.steel, 20);
      k.rotation.x = Math.PI / 2;
      k.position.set(s * bw * 0.34, stripY, 0.034);
      g.add(k);
    });
    const doorH = h - stripH;
    const doorY = -stripH / 2;
    g.add(box(bw * 0.86, doorH * 0.72, 0.01, mats.darkGlass, 0, doorY - doorH * 0.04, 0.023));
    const barY = doorY + doorH * 0.42;
    const bar = cyl(0.012, 0.012, bw * 0.9, mats.steel, 20);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, barY, 0.058);
    g.add(bar);
    [-1, 1].forEach((s) => g.add(box(0.016, 0.016, 0.042, mats.steel, s * bw * 0.4, barY, 0.037)));
  }
  return g;
};

const rowOven = (spec, ctx) => appliancePanel(ctx.w, ctx.h, 'oven', ctx.mats);
const rowMicrowave = (spec, ctx) => appliancePanel(ctx.w, ctx.h, 'microwave', ctx.mats);

const rowDishwasher = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  // Yarı ankastre: üstte paslanmaz kumanda bandı, altta lake panel
  const stripH = Math.min(h * 0.14, 0.1);
  g.add(box(w - REVEAL, stripH, 0.024, mats.steel, 0, h / 2 - stripH / 2, 0.006));
  g.add(box(w * 0.24, stripH * 0.36, 0.006, mats.display, -w * 0.24, h / 2 - stripH / 2, 0.02));
  g.add(box(w - REVEAL, h - stripH - REVEAL, FRONT_T, mats.door, 0, -stripH / 2, 0));
  const bar = cyl(0.011, 0.011, w * 0.8, mats.chrome, 18);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, h / 2 - stripH - 0.03, FRONT_T / 2 + 0.032);
  g.add(bar);
  [-1, 1].forEach((s) => g.add(box(0.016, 0.016, 0.036, mats.chrome, s * w * 0.36, h / 2 - stripH - 0.03, FRONT_T / 2 + 0.016)));
  return g;
};

const rowFridge = (spec, ctx) => {
  const { w, h, mats } = ctx;
  const g = new THREE.Group();
  const split = h > 1.2 ? 0.68 : 1;   // boy dolapta buzluk ayrımı
  const upperH = h * split;
  g.add(box(w - REVEAL, upperH - REVEAL, 0.03, mats.steel, 0, h / 2 - upperH / 2, 0));
  if (split < 1) {
    const lowerH = h - upperH;
    g.add(box(w - REVEAL, lowerH - REVEAL, 0.03, mats.steel, 0, -h / 2 + lowerH / 2, 0));
  }
  // Dikey boydan boya kulp
  const handle = cyl(0.013, 0.013, upperH * 0.8, mats.chrome, 18);
  handle.position.set(w / 2 - 0.06, h / 2 - upperH / 2, 0.05);
  g.add(handle);
  g.add(box(0.018, 0.018, 0.04, mats.chrome, w / 2 - 0.06, h / 2 - upperH * 0.12, 0.028));
  g.add(box(0.018, 0.018, 0.04, mats.chrome, w / 2 - 0.06, h / 2 - upperH * 0.88, 0.028));
  if (h > 1.2) g.add(box(w * 0.28, 0.055, 0.008, mats.display, -w * 0.2, h * 0.28, 0.02));
  return g;
};

const machineFront = (w, h, mats, isDryer) => {
  const g = new THREE.Group();
  g.add(box(w - REVEAL, h - REVEAL, 0.03, mats.porcelain));
  const panelH = Math.min(h * 0.22, 0.14);
  g.add(box(w - REVEAL, panelH, 0.01, isDryer ? mats.steel : mats.dark, 0, h / 2 - panelH / 2, 0.018));
  g.add(box(w * 0.3, panelH * 0.34, 0.005, mats.display, w * 0.14, h / 2 - panelH / 2, 0.026));
  const knob = cyl(panelH * 0.3, panelH * 0.3, 0.018, mats.steel, 20);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(-w * 0.3, h / 2 - panelH / 2, 0.026);
  g.add(knob);
  // Yuvarlak kapak: dış çerçeve + koyu cam
  const r = Math.min(w, h - panelH) * 0.36;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 12, 32), mats.steel);
  ring.position.set(0, -panelH / 2, 0.02);
  g.add(ring);
  const glass = cyl(r * 0.95, r * 0.95, 0.02, mats.darkGlass, 32);
  glass.rotation.x = Math.PI / 2;
  glass.position.set(0, -panelH / 2, 0.024);
  g.add(glass);
  return g;
};

const rowWasher = (spec, ctx) => machineFront(ctx.w, ctx.h, ctx.mats, false);
const rowDryer = (spec, ctx) => machineFront(ctx.w, ctx.h, ctx.mats, true);

const ROW_BUILDERS = {
  door: rowDoor,
  drawer: rowDrawer,
  glass: rowGlass,
  lift: rowLift,
  foldlift: rowFoldLift,
  tambour: rowTambour,
  panel: rowPanel,
  open: rowOpen,
  mirror: rowMirror,
  basket: rowBasket,
  cargo: rowCargo,
  slidedoor: rowSlideDoor,
  accordion: rowAccordion,
  oven: rowOven,
  microwave: rowMicrowave,
  dishwasher: rowDishwasher,
  fridge: rowFridge,
  washer: rowWasher,
  dryer: rowDryer
};

// ═════════════════════════════════════════════════════════════════════════════
// GÖVDE (CARCASS)
// ═════════════════════════════════════════════════════════════════════════════

const buildBoxCarcass = (w, h, d, mats, withTop) => {
  const g = new THREE.Group();
  g.add(box(PANEL_T, h, d, mats.carcass, -w / 2 + PANEL_T / 2, h / 2, 0));
  g.add(box(PANEL_T, h, d, mats.carcass, w / 2 - PANEL_T / 2, h / 2, 0));
  g.add(box(w, h, PANEL_T * 0.6, mats.inner, 0, h / 2, -d / 2 + PANEL_T * 0.3));
  g.add(box(w, PANEL_T, d, mats.inner, 0, PANEL_T / 2, 0));
  if (withTop) g.add(box(w, PANEL_T, d, mats.inner, 0, h - PANEL_T / 2, 0));
  return g;
};

// Açılı (diyagonal) köşe gövdesi: ön köşe pahlanmış beşgen kesit
const buildDiagonalCarcass = (w, h, d, mats) => {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2 + d * 0.32);
  shape.lineTo(-w / 2 + w * 0.32, d / 2);
  shape.lineTo(-w / 2, d / 2);
  shape.lineTo(-w / 2, -d / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mats.carcass);
  mesh.rotation.y = 0;
  g.add(mesh);
  return g;
};

// L köşe gövdesi: arka bacak tam genişlik, sol bacak tam derinlik
const buildLCarcass = (w, h, d, mats) => {
  const g = new THREE.Group();
  const legD = d * 0.6;
  const legW = w * 0.6;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2 + legD);
  shape.lineTo(-w / 2 + legW, -d / 2 + legD);
  shape.lineTo(-w / 2 + legW, d / 2);
  shape.lineTo(-w / 2, d / 2);
  shape.lineTo(-w / 2, -d / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, mats.carcass));
  return g;
};

// ═════════════════════════════════════════════════════════════════════════════
// AKSESUARLAR (EXTRAS)
// ═════════════════════════════════════════════════════════════════════════════

const buildSink = (g, w, h, d, mats, double) => {
  const layout = getSinkLayout(w, d, double);
  const { sinkW, sinkD, cutW, cutD, wallT, dividerT, dividerX, bowlDepth, centerZ } = layout;
  const deckY = h + 0.06;
  const floorY = deckY - bowlDepth;

  const rim = new THREE.Mesh(createSlabGeometry(sinkW, sinkD, 0.007, { w: cutW, d: cutD, z: 0 }), mats.dark);
  rim.position.set(0, deckY + 0.007, centerZ);
  g.add(rim);

  const wallY = deckY - bowlDepth / 2;
  [
    [cutW + wallT * 2, bowlDepth, wallT, 0, wallY, centerZ - cutD / 2 - wallT / 2],
    [cutW + wallT * 2, bowlDepth, wallT, 0, wallY, centerZ + cutD / 2 + wallT / 2],
    [wallT, bowlDepth, cutD, -cutW / 2 - wallT / 2, wallY, centerZ],
    [wallT, bowlDepth, cutD, cutW / 2 + wallT / 2, wallY, centerZ],
    [cutW + wallT * 2, wallT, cutD + wallT * 2, 0, floorY - wallT / 2, centerZ]
  ].forEach((a) => g.add(box(a[0], a[1], a[2], mats.innerDark, a[3], a[4], a[5])));

  if (double) {
    const dh = bowlDepth - 0.018;
    g.add(box(dividerT, dh, cutD, mats.innerDark, dividerX, deckY - 0.018 - dh / 2, centerZ));
  }

  const drains = double ? [layout.leftBowlCenterX, layout.rightBowlCenterX] : [0];
  drains.forEach((x) => {
    const dm = cyl(0.038, 0.038, 0.006, mats.brass, 28);
    dm.position.set(x, floorY + 0.003, centerZ);
    g.add(dm);
    const dh = cyl(0.019, 0.019, 0.008, mats.innerDark, 20);
    dh.position.set(x, floorY + 0.005, centerZ);
    g.add(dh);
  });

  return { layout, deckY };
};

// Kuğu boyunlu batarya
const buildFaucet = (mats, tall = false) => {
  const g = new THREE.Group();
  const scale = tall ? 0.78 : 1;
  const reach = 0.18 * scale;
  const columnTop = 0.145 * scale;
  const apex = (tall ? 0.28 : 0.325) * scale;

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x14161A, metalness: 0.6, roughness: 0.32, clearcoat: 0.65, clearcoatRoughness: 0.22
  });

  const base = cyl(0.038, 0.043, 0.014, bodyMat, 32);
  base.position.y = 0.007;
  g.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0375, 0.0035, 12, 32), mats.brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.014;
  g.add(ring);

  const col = cyl(0.021, 0.027, columnTop, bodyMat, 32);
  col.position.y = columnTop / 2;
  g.add(col);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, columnTop - 0.03, 0),
    new THREE.Vector3(0, apex * 0.7, 0.002),
    new THREE.Vector3(0, apex - 0.028, 0.022),
    new THREE.Vector3(0, apex, 0.075),
    new THREE.Vector3(0, apex, reach * 0.68),
    new THREE.Vector3(0, apex - 0.03, reach),
    new THREE.Vector3(0, apex - 0.075, reach)
  ], false, 'centripetal');
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0145, 16, false), bodyMat));

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.0155, 0.0035, 12, 24), mats.brass);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, apex - 0.078, reach);
  g.add(collar);
  const aer = cyl(0.0165, 0.019, 0.024, bodyMat, 24);
  aer.position.set(0, apex - 0.09, reach);
  g.add(aer);

  const lever = new THREE.Group();
  lever.position.set(0.019, columnTop - 0.022, 0);
  lever.rotation.z = 0.38;
  lever.add(new THREE.Mesh(new THREE.SphereGeometry(0.0155, 20, 16), bodyMat));
  const arm = cyl(0.0075, 0.0095, 0.072, bodyMat, 20);
  arm.rotation.z = Math.PI / 2;
  arm.position.x = 0.04;
  lever.add(arm);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 16, 12), mats.brass);
  cap.position.x = 0.076;
  lever.add(cap);
  g.add(lever);

  return g;
};

const buildVesselBasin = (mats, radius) => {
  const g = new THREE.Group();
  const h = radius * 0.62;
  const outer = cyl(radius, radius * 0.78, h, mats.porcelain, 40);
  outer.position.y = h / 2;
  g.add(outer);
  const inner = cyl(radius * 0.9, radius * 0.66, h * 0.9, mats.inner, 40);
  inner.position.y = h / 2 + h * 0.1;
  g.add(inner);
  const drain = cyl(radius * 0.12, radius * 0.12, 0.006, mats.chrome, 20);
  drain.position.y = h * 0.14;
  g.add(drain);
  return g;
};

const buildHangers = (mats, w, y, count = 5) => {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / count;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0035, 8, 16, Math.PI * 1.4), mats.chrome);
    hook.position.set(x, y - 0.012, 0);
    g.add(hook);
    // Omuz askısı: iki eğik çubuk
    [-1, 1].forEach((s) => {
      const bar = cyl(0.004, 0.004, 0.17, mats.chrome, 8);
      bar.rotation.z = s * 1.15;
      bar.position.set(x + s * 0.07, y - 0.09, 0);
      g.add(bar);
    });
    g.add(box(0.17, 0.005, 0.01, mats.chrome, x, y - 0.16, 0));
  }
  return g;
};

const applyExtras = (group, def, item, ctx) => {
  const { w, h, d, mats } = ctx;
  const extras = def.build.extras || [];
  const innerD = d - PANEL_T * 2;

  const addShelves = (n) => {
    for (let i = 1; i <= n; i++) {
      const y = (h * i) / (n + 1);
      group.add(box(w - PANEL_T * 2 - 0.004, 0.018, innerD * 0.94, mats.inner, 0, y, 0.01));
    }
  };

  extras.forEach((extra) => {
    switch (extra) {
      case 'sink_double': {
        const { layout, deckY } = buildSink(group, w, h, d, mats, true);
        const f = buildFaucet(mats);
        f.position.set(layout.rightBowlCenterX, deckY, layout.centerZ - layout.cutD / 2 - 0.055);
        group.add(f);
        break;
      }
      case 'sink_single': {
        const { layout, deckY } = buildSink(group, w, h, d, mats, false);
        const f = buildFaucet(mats);
        f.position.set(0, deckY, layout.centerZ - layout.cutD / 2 - 0.055);
        group.add(f);
        break;
      }
      case 'undermount_basin': {
        buildSink(group, w, h, d, mats, false);
        break;
      }
      case 'double_basin': {
        // İki ayrı gömme çanak: modül genişliğini iki eşit bölgeye ayır
        [-1, 1].forEach((s) => {
          const sub = new THREE.Group();
          sub.position.x = s * w * 0.25;
          buildSink(sub, w * 0.46, h, d, mats, false);
          group.add(sub);
        });
        break;
      }
      case 'faucet': {
        const f = buildFaucet(mats);
        f.position.set(0, h + 0.06, -d * 0.28);
        group.add(f);
        break;
      }
      case 'faucet_tall': {
        const f = buildFaucet(mats, true);
        f.position.set(0, h + 0.02, -d * 0.3);
        group.add(f);
        break;
      }
      case 'vessel_basin':
      case 'vessel_basin_small': {
        const r = Math.min(w, d) * (extra === 'vessel_basin' ? 0.28 : 0.24);
        const basin = buildVesselBasin(mats, r);
        basin.position.set(0, h + 0.04, d * 0.04);
        group.add(basin);
        // Çanak lavabonun oturduğu ince tezgah
        const slab = new THREE.Mesh(createSlabGeometry(w + 0.02, d + 0.02, 0.04, null), mats.counter);
        slab.position.y = h + 0.04;
        group.add(slab);
        break;
      }
      case 'alu_tray':
        group.add(box(w - PANEL_T * 2 - 0.01, 0.008, innerD * 0.9, mats.steel, 0, PANEL_T + 0.006, 0));
        break;
      case 'hob': {
        // Cam seramik ocak + 4 göz + düğmeler
        const hobW = Math.min(w * 0.92, 0.58);
        const hobD = Math.min(d * 0.82, 0.5);
        const y = h + 0.062;
        group.add(box(hobW, 0.012, hobD, mats.black, 0, y, -d * 0.02));
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
          const r = i < 2 ? hobW * 0.13 : hobW * 0.1;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.005, 8, 28), mats.steel);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(sx * hobW * 0.24, y + 0.008, -d * 0.02 + sz * hobD * 0.22);
          group.add(ring);
        });
        for (let i = 0; i < 4; i++) {
          const k = cyl(0.014, 0.014, 0.01, mats.steel, 16);
          k.position.set(-hobW * 0.3 + i * hobW * 0.2, y + 0.012, -d * 0.02 + hobD * 0.42);
          group.add(k);
        }
        break;
      }
      case 'hood': {
        // Eğik yüzeyli davlumbaz + baca
        const hoodW = w * 0.98;
        const shell = box(hoodW, 0.06, d * 0.95, mats.steel, 0, 0.03, 0);
        group.add(shell);
        const angled = box(hoodW, 0.16, 0.02, mats.steel, 0, 0.11, d * 0.42);
        angled.rotation.x = -0.42;
        group.add(angled);
        group.add(box(hoodW * 0.9, 0.01, d * 0.7, mats.chrome, 0, 0.004, 0));
        group.add(box(hoodW * 0.42, h - 0.06, d * 0.42, mats.steel, 0, 0.06 + (h - 0.06) / 2, -d * 0.2));
        group.add(box(hoodW * 0.5, 0.02, 0.01, mats.display, 0, 0.02, d * 0.47));
        break;
      }
      case 'plate_rack': {
        // Tabaklık: dikey tel bölmeler
        const y = h * 0.5;
        for (let i = 0; i < 8; i++) {
          group.add(box(0.006, 0.09, innerD * 0.8, mats.chrome, -w / 2 + 0.06 + i * ((w - 0.12) / 7), y, 0));
        }
        group.add(box(w - 0.08, 0.006, innerD * 0.8, mats.chrome, 0, y - 0.05, 0));
        addShelves(1);
        break;
      }
      case 'wine_rack': {
        // Çapraz kafes şaraplık
        const cell = w / 3;
        for (let i = 0; i < 3; i++) {
          [-1, 1].forEach((s) => {
            const bar = box(0.012, cell * 1.34, innerD * 0.8, mats.wood, -w / 2 + cell / 2 + i * cell, h * 0.24, 0.01);
            bar.rotation.z = s * Math.PI / 4;
            group.add(bar);
          });
        }
        break;
      }
      case 'shelves1': addShelves(1); break;
      case 'shelves2': addShelves(2); break;
      case 'shelves3': addShelves(3); break;
      case 'shelves4': addShelves(4); break;
      case 'piston': {
        [-1, 1].forEach((s) => {
          const p = cyl(0.008, 0.008, h * 0.6, mats.steel, 10);
          p.rotation.x = 0.4;
          p.position.set(s * (w / 2 - 0.03), h * 0.6, 0);
          group.add(p);
        });
        break;
      }
      case 'carousel': {
        [0.3, 0.68].forEach((t) => {
          const plate = cyl(Math.min(w, d) * 0.36, Math.min(w, d) * 0.36, 0.014, mats.chrome, 32);
          plate.position.set(-w * 0.05, h * t, -d * 0.05);
          group.add(plate);
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(Math.min(w, d) * 0.36, 0.008, 8, 32), mats.chrome
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(-w * 0.05, h * t + 0.05, -d * 0.05);
          group.add(ring);
        });
        const post = cyl(0.014, 0.014, h * 0.9, mats.chrome, 12);
        post.position.set(-w * 0.05, h * 0.48, -d * 0.05);
        group.add(post);
        break;
      }
      case 'tandem_baskets': {
        for (let i = 0; i < 4; i++) {
          const y = h * (0.14 + i * 0.2);
          group.add(box(w - 0.1, 0.006, innerD * 0.8, mats.chrome, 0, y, 0.01));
          group.add(box(w - 0.1, 0.11, 0.006, mats.chrome, 0, y + 0.055, innerD * 0.4));
        }
        break;
      }
      case 'broom_rack': {
        const rail = box(w - 0.08, 0.02, 0.03, mats.chrome, 0, h * 0.82, -innerD * 0.2);
        group.add(rail);
        [-1, 1].forEach((s) => {
          const stick = cyl(0.012, 0.012, h * 0.7, mats.wood, 10);
          stick.position.set(s * w * 0.22, h * 0.45, -innerD * 0.18);
          group.add(stick);
        });
        addShelves(1);
        break;
      }
      case 'led_strip': {
        group.add(box(w - 0.06, 0.008, 0.02, mats.led, 0, h - 0.03, d / 2 - 0.03));
        break;
      }
      case 'rail_high': {
        const y = h - 0.28;
        const rail = cyl(0.014, 0.014, w - PANEL_T * 2, mats.chrome, 16);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, y, 0);
        group.add(rail);
        break;
      }
      case 'rail_double': {
        [h * 0.52, h - 0.28].forEach((y) => {
          const rail = cyl(0.014, 0.014, w - PANEL_T * 2, mats.chrome, 16);
          rail.rotation.z = Math.PI / 2;
          rail.position.set(0, y, 0);
          group.add(rail);
        });
        group.add(box(w - PANEL_T * 2, 0.018, innerD * 0.92, mats.inner, 0, h * 0.52 - 0.02, 0));
        break;
      }
      case 'lift_rail': {
        const y = h * 0.62;
        const rail = cyl(0.014, 0.014, w - PANEL_T * 2 - 0.06, mats.chrome, 16);
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, y, 0.03);
        group.add(rail);
        // Aktivatörlü indirme kolu
        [-1, 1].forEach((s) => {
          const arm = cyl(0.01, 0.01, 0.34, mats.chrome, 10);
          arm.rotation.z = s * 0.5;
          arm.position.set(s * (w * 0.26), y + 0.16, 0.03);
          group.add(arm);
        });
        const pull = cyl(0.009, 0.009, w * 0.5, mats.chrome, 12);
        pull.rotation.z = Math.PI / 2;
        pull.position.set(0, y - 0.06, d / 2 - 0.06);
        group.add(pull);
        break;
      }
      case 'hangers': {
        group.add(buildHangers(mats, w - 0.12, h - 0.28, Math.max(3, Math.round(w / 0.16))));
        break;
      }
      case 'pants_rails': {
        for (let i = 0; i < 4; i++) {
          const y = h * (0.2 + i * 0.2);
          const rod = cyl(0.008, 0.008, innerD * 0.86, mats.chrome, 10);
          rod.rotation.x = Math.PI / 2;
          rod.position.set(-w * 0.2 + i * w * 0.13, y, 0);
          group.add(rod);
          group.add(box(0.06, 0.004, innerD * 0.6, mats.fabric, -w * 0.2 + i * w * 0.13, y - 0.02, 0.02));
        }
        break;
      }
      case 'velvet_tray': {
        const velvet = new THREE.MeshStandardMaterial({ color: 0x2B2036, roughness: 0.95 });
        group.add(box(w - 0.05, 0.01, innerD * 0.9, velvet, 0, h - 0.03, 0));
        for (let i = 1; i < 5; i++) {
          group.add(box(0.006, 0.02, innerD * 0.9, mats.inner, -w / 2 + (w * i) / 5, h - 0.02, 0));
        }
        break;
      }
      case 'divider_tray': {
        for (let i = 1; i < 4; i++) {
          group.add(box(0.006, 0.06, innerD * 0.9, mats.inner, -w / 2 + (w * i) / 4, h - 0.06, 0));
        }
        group.add(box(w - 0.05, 0.006, innerD * 0.9, mats.inner, 0, h - 0.09, 0));
        break;
      }
      case 'shoe_slope': {
        const n = Math.max(2, Math.floor(h / 0.28));
        for (let i = 0; i < n; i++) {
          const y = 0.1 + (h - 0.16) * (i / n);
          const shelf = box(w - PANEL_T * 2 - 0.01, 0.016, innerD * 0.9, mats.inner, 0, y, 0);
          shelf.rotation.x = -0.3;
          group.add(shelf);
          group.add(box(w - PANEL_T * 2 - 0.02, 0.02, 0.012, mats.doorDark, 0, y - 0.02, innerD * 0.4));
        }
        break;
      }
      case 'jewel_glass_top': {
        group.add(box(w - 0.04, 0.014, d - 0.04, mats.glass, 0, h + 0.008, 0));
        group.add(box(w - 0.02, 0.012, d - 0.02, mats.doorDark, 0, h - 0.004, 0));
        const velvet = new THREE.MeshStandardMaterial({ color: 0x2B2036, roughness: 0.95 });
        group.add(box(w - 0.09, 0.006, d - 0.09, velvet, 0, h - 0.014, 0));
        break;
      }
      case 'safe': {
        const sw = Math.min(w - 0.08, 0.4);
        group.add(box(sw, Math.min(h - 0.08, 0.34), d * 0.6, mats.dark, 0, h * 0.5, 0));
        const dial = cyl(0.045, 0.045, 0.02, mats.steel, 24);
        dial.rotation.x = Math.PI / 2;
        dial.position.set(0, h * 0.5, d * 0.3 + 0.012);
        group.add(dial);
        group.add(box(0.06, 0.012, 0.02, mats.steel, sw * 0.3, h * 0.5, d * 0.3 + 0.012));
        break;
      }
      case 'bar_overhang': {
        // Bara doğru uzayan tezgah + ayak paneli
        group.add(box(w + 0.06, 0.05, d * 0.62, mats.counter, 0, h + 0.055, d * 0.52));
        group.add(box(w * 0.9, 0.06, 0.02, mats.doorDark, 0, h * 0.55, d / 2 + 0.01));
        break;
      }
      case 'bar_stools': {
        [-1, 1].forEach((s) => {
          const stool = new THREE.Group();
          stool.position.set(s * w * 0.24, 0, d * 0.78);
          const seat = cyl(0.15, 0.15, 0.05, mats.doorDark, 24);
          seat.position.y = 0.66;
          stool.add(seat);
          const post = cyl(0.028, 0.038, 0.64, mats.chrome, 16);
          post.position.y = 0.32;
          stool.add(post);
          const foot = cyl(0.17, 0.17, 0.02, mats.chrome, 24);
          foot.position.y = 0.01;
          stool.add(foot);
          group.add(stool);
        });
        break;
      }
      case 'towel_bar': {
        const barY = h * 0.45;
        const bar = cyl(0.011, 0.011, w - 0.08, mats.chrome, 14);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, barY, d / 2 + 0.03);
        group.add(bar);
        const towelH = Math.min(h * 0.32, 0.3);
        group.add(box(w * 0.34, towelH, 0.03, mats.fabric, -w * 0.2, barY - towelH / 2 - 0.01, d / 2 + 0.03));
        break;
      }
      case 'vent_slots': {
        for (let i = 0; i < 5; i++) {
          group.add(box(w * 0.5, 0.008, 0.012, mats.doorDark, 0, h * 0.2 + i * 0.03, d / 2 + FRONT_T + 0.01));
        }
        break;
      }
      case 'robot_niche': {
        group.add(box(w * 0.42, 0.1, d * 0.7, mats.innerDark, w * 0.24, 0.05, 0.02));
        const robot = cyl(0.16, 0.16, 0.07, mats.dark, 28);
        robot.position.set(w * 0.24, 0.05, d * 0.06);
        group.add(robot);
        group.add(box(0.05, 0.012, 0.05, mats.display, w * 0.24, 0.09, d * 0.06));
        break;
      }
      default:
        break;
    }
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// ÖZEL ELEMANLAR (FIXTURES)
// ═════════════════════════════════════════════════════════════════════════════

const FIXTURES = {
  // Tezgah üstü çift gözlü evye (bağımsız aksesuar)
  counter_sink: (w, h, d, mats) => {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(
      createSlabGeometry(w, d, 0.01, { w: w - 0.07, d: d - 0.07, z: 0 }), mats.dark
    );
    rim.position.y = h;
    g.add(rim);
    const cutW = w - 0.07;
    const cutD = d - 0.07;
    const depth = h - 0.02;
    [
      [cutW + 0.024, depth, 0.012, 0, h - depth / 2, -cutD / 2 - 0.006],
      [cutW + 0.024, depth, 0.012, 0, h - depth / 2, cutD / 2 + 0.006],
      [0.012, depth, cutD, -cutW / 2 - 0.006, h - depth / 2, 0],
      [0.012, depth, cutD, cutW / 2 + 0.006, h - depth / 2, 0],
      [cutW + 0.024, 0.012, cutD + 0.024, 0, h - depth - 0.006, 0]
    ].forEach((a) => g.add(box(a[0], a[1], a[2], mats.innerDark, a[3], a[4], a[5])));
    g.add(box(0.022, depth - 0.02, cutD, mats.innerDark, -cutW * 0.06, h - 0.02 - (depth - 0.02) / 2, 0));
    // Damlalık kanalları
    for (let i = 0; i < 4; i++) {
      g.add(box(cutW * 0.3, 0.004, 0.01, mats.dark, cutW * 0.32, h + 0.003, -cutD * 0.3 + i * 0.045));
    }
    [-cutW * 0.28, cutW * 0.24].forEach((x) => {
      const drain = cyl(0.036, 0.036, 0.006, mats.brass, 24);
      drain.position.set(x, h - depth + 0.004, 0);
      g.add(drain);
    });
    return g;
  },

  faucet_only: (w, h, d, mats) => buildFaucet(mats),

  // Ada üstü asma şaraplık + sarkıt aydınlatma
  pendant_rack: (w, h, d, mats) => {
    const g = new THREE.Group();
    g.add(box(w, 0.06, d, mats.wood, 0, h - 0.03, 0));
    [-1, 1].forEach((s) => g.add(box(0.05, h - 0.06, d, mats.wood, s * (w / 2 - 0.025), (h - 0.06) / 2, 0)));
    // Şarap kadehi rayları
    for (let i = 0; i < 4; i++) {
      g.add(box(w - 0.12, 0.012, 0.012, mats.chrome, 0, h - 0.1, -d / 2 + 0.08 + i * ((d - 0.16) / 3)));
    }
    // Sarkıt lambalar
    [-1, 1].forEach((s) => {
      const cord = cyl(0.004, 0.004, 0.26, mats.dark, 8);
      cord.position.set(s * w * 0.24, h - 0.19, 0);
      g.add(cord);
      const shade = cyl(0.055, 0.11, 0.14, mats.dark, 24);
      shade.position.set(s * w * 0.24, h - 0.39, 0);
      g.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), mats.led);
      bulb.position.set(s * w * 0.24, h - 0.45, 0);
      g.add(bulb);
    });
    return g;
  },

  mirror_panel: (w, h, d, mats) => {
    const g = new THREE.Group();
    g.add(box(w, h, Math.max(d, 0.02), mats.doorDark, 0, h / 2, 0));
    g.add(box(w - 0.06, h - 0.06, 0.006, mats.mirror, 0, h / 2, Math.max(d, 0.02) / 2 + 0.004));
    // Çevresel LED hüzme
    [[w - 0.02, 0.014, 0, h - 0.014], [w - 0.02, 0.014, 0, 0.014],
     [0.014, h - 0.02, -(w / 2 - 0.008), h / 2], [0.014, h - 0.02, w / 2 - 0.008, h / 2]]
      .forEach(([bw, bh, x, y]) => g.add(box(bw, bh, 0.008, mats.led, x, y, Math.max(d, 0.02) / 2 + 0.002)));
    return g;
  },

  counter_slab: (w, h, d, mats) => {
    const g = new THREE.Group();
    const slab = new THREE.Mesh(createSlabGeometry(w, d, Math.max(h, 0.03), null), mats.counter);
    slab.position.y = Math.max(h, 0.03);
    g.add(slab);
    return g;
  },

  // Gömme rezervuarlı asma klozet
  toilet_wall: (w, h, d, mats) => {
    const g = new THREE.Group();
    // Rezervuar gizleme paneli
    g.add(box(w + 0.12, h, 0.16, mats.door, 0, h / 2, -d / 2 + 0.08));
    g.add(box(w + 0.12, 0.04, 0.2, mats.counter, 0, h, -d / 2 + 0.1));
    // Sifon paneli
    g.add(box(0.22, 0.14, 0.014, mats.porcelain, 0, h - 0.16, -d / 2 + 0.17));
    [-1, 1].forEach((s) => g.add(box(0.09, 0.11, 0.008, mats.chrome, s * 0.055, h - 0.16, -d / 2 + 0.18)));

    const bowlY = 0.42;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.185, 28, 20), mats.porcelain);
    bowl.scale.set(1, 0.62, 1.32);
    bowl.position.set(0, bowlY, -d / 2 + 0.16 + d * 0.34);
    g.add(bowl);
    g.add(box(w, 0.24, 0.2, mats.porcelain, 0, bowlY + 0.02, -d / 2 + 0.2));
    // Klozet kapağı
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mats.porcelain);
    seat.scale.set(1, 0.16, 1.34);
    seat.position.set(0, bowlY + 0.11, -d / 2 + 0.16 + d * 0.34);
    g.add(seat);
    return g;
  },

  // Rezervuarlı (ayaklı) klozet
  toilet_tank: (w, h, d, mats) => {
    const g = new THREE.Group();
    g.add(box(w, 0.42, 0.2, mats.porcelain, 0, 0.21, -d / 2 + 0.1));   // rezervuar
    g.add(box(w + 0.02, 0.03, 0.22, mats.porcelain, 0, 0.435, -d / 2 + 0.1));
    const btn = cyl(0.032, 0.032, 0.016, mats.chrome, 20);
    btn.position.set(0, 0.45, -d / 2 + 0.1);
    g.add(btn);
    // Ayak
    const pedestal = cyl(0.1, 0.14, 0.4, mats.porcelain, 24);
    pedestal.position.set(0, 0.2, d * 0.06);
    g.add(pedestal);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 28, 20), mats.porcelain);
    bowl.scale.set(1, 0.6, 1.25);
    bowl.position.set(0, 0.44, d * 0.08);
    g.add(bowl);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.185, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mats.porcelain);
    seat.scale.set(1, 0.16, 1.28);
    seat.position.set(0, 0.55, d * 0.08);
    g.add(seat);
    return g;
  },

  // Sürgülü cam siyah profilli köşe duşakabin
  shower: (w, h, d, mats) => {
    const g = new THREE.Group();
    // Duş teknesi
    g.add(box(w, 0.06, d, mats.porcelain, 0, 0.03, 0));
    g.add(box(w - 0.05, 0.02, d - 0.05, mats.inner, 0, 0.065, 0));
    const drain = cyl(0.05, 0.05, 0.008, mats.chrome, 24);
    drain.position.set(0, 0.075, 0);
    g.add(drain);

    const profile = mats.black;
    // Ön ve sağ cam paneller + siyah profiller
    const panelH = h - 0.08;
    g.add(box(w, panelH, 0.012, mats.glass, 0, 0.06 + panelH / 2, d / 2 - 0.01));
    g.add(box(0.012, panelH, d, mats.glass, w / 2 - 0.01, 0.06 + panelH / 2, 0));
    g.add(box(w, 0.04, 0.032, profile, 0, h - 0.02, d / 2 - 0.01));
    g.add(box(0.032, 0.04, d, profile, w / 2 - 0.01, h - 0.02, 0));
    g.add(box(0.034, panelH, 0.034, profile, -w / 2 + 0.017, 0.06 + panelH / 2, d / 2 - 0.01));
    g.add(box(0.034, panelH, 0.034, profile, w / 2 - 0.017, 0.06 + panelH / 2, d / 2 - 0.017));
    g.add(box(0.034, panelH, 0.034, profile, w / 2 - 0.017, 0.06 + panelH / 2, -d / 2 + 0.017));
    // Sürgü kulbu
    g.add(box(0.026, 0.32, 0.026, profile, w * 0.14, h * 0.55, d / 2 + 0.012));

    // Tepe duş + el duşu + batarya
    const arm = cyl(0.014, 0.014, 0.26, mats.black, 12);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, h - 0.22, -d / 2 + 0.14);
    g.add(arm);
    const head = cyl(0.11, 0.11, 0.02, mats.black, 28);
    head.position.set(0, h - 0.23, -d / 2 + 0.27);
    g.add(head);
    g.add(box(0.07, 0.24, 0.05, mats.black, -w * 0.28, 1.05, -d / 2 + 0.05));
    const riser = cyl(0.012, 0.012, 0.7, mats.black, 12);
    riser.position.set(-w * 0.28, 1.4, -d / 2 + 0.045);
    g.add(riser);
    return g;
  },

  // Ahşap/akrilik ön panelli küvet
  bathtub: (w, h, d, mats) => {
    const g = new THREE.Group();
    g.add(box(w, h, d, mats.porcelain, 0, h / 2, 0));
    // Ön panel ahşap kaplama
    g.add(box(w, h - 0.04, 0.02, mats.wood, 0, (h - 0.04) / 2, d / 2 + 0.011));
    // İç hacim + su yüzeyi
    g.add(box(w - 0.12, h - 0.08, d - 0.12, mats.inner, 0, h / 2 + 0.04, 0));
    g.add(box(w - 0.14, 0.01, d - 0.14, mats.water, 0, h - 0.09, 0));
    // Kenar bordür
    g.add(box(w + 0.02, 0.035, d + 0.02, mats.porcelain, 0, h - 0.017, 0));
    g.add(box(w - 0.1, 0.02, d - 0.1, mats.inner, 0, h - 0.03, 0));
    // Duvara monte batarya
    const spout = cyl(0.016, 0.016, 0.16, mats.chrome, 12);
    spout.rotation.x = Math.PI / 2;
    spout.position.set(-w * 0.36, h + 0.16, -d * 0.3);
    g.add(spout);
    g.add(box(0.05, 0.2, 0.05, mats.chrome, -w * 0.36, h + 0.14, -d * 0.42));
    return g;
  },

  // Jakuzi + ahşap deck kaplama
  jacuzzi: (w, h, d, mats) => {
    const g = new THREE.Group();
    g.add(box(w, h, d, mats.wood, 0, h / 2, 0));
    // Deck tahtaları
    const planks = 9;
    for (let i = 0; i < planks; i++) {
      const pd = d / planks;
      const p = box(w - 0.02, 0.012, pd - 0.008, mats.wood, 0, h + 0.006, -d / 2 + pd / 2 + i * pd);
      g.add(p);
    }
    const tubR = Math.min(w, d) * 0.32;
    const tub = cyl(tubR, tubR * 0.92, h * 0.9, mats.porcelain, 40);
    tub.position.y = h * 0.55;
    g.add(tub);
    const water = cyl(tubR * 0.94, tubR * 0.94, 0.02, mats.water, 40);
    water.position.y = h * 0.94;
    g.add(water);
    // Jet ağızları
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const jet = cyl(0.022, 0.022, 0.014, mats.chrome, 14);
      jet.rotation.x = Math.PI / 2;
      jet.rotation.z = a;
      jet.position.set(Math.cos(a) * tubR * 0.9, h * 0.6, Math.sin(a) * tubR * 0.9);
      g.add(jet);
    }
    const panel = box(0.16, 0.1, 0.014, mats.dark, 0, h + 0.05, -d * 0.42);
    g.add(panel);
    g.add(box(0.12, 0.05, 0.006, mats.display, 0, h + 0.05, -d * 0.42 + 0.01));
    return g;
  },

  // Sandıklı / minderli oturma benci
  bench: (w, h, d, mats, build) => {
    const g = new THREE.Group();
    const seatT = 0.05;
    const bodyH = h - seatT;
    g.add(box(w, bodyH, d, mats.door, 0, bodyH / 2, 0));
    g.add(box(w + 0.03, seatT, d + 0.03, mats.wood, 0, bodyH + seatT / 2, 0));
    if (build?.cushion) {
      const cushion = box(w - 0.05, 0.07, d - 0.05, mats.fabric, 0, h + 0.035, 0);
      g.add(cushion);
      for (let i = 1; i < 4; i++) {
        g.add(box(0.006, 0.07, d - 0.05, mats.fabric, -w / 2 + (w * i) / 4, h + 0.035, 0));
      }
    }
    if (build?.drawer) {
      g.add(box(w * 0.9, bodyH * 0.5, FRONT_T, mats.doorDark, 0, bodyH * 0.32, d / 2 + 0.012));
      const bar = cyl(0.009, 0.009, w * 0.4, mats.brass, 14);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, bodyH * 0.32, d / 2 + 0.04);
      g.add(bar);
    }
    if (build?.shoeNiche) {
      g.add(box(w - 0.06, bodyH * 0.55, d * 0.9, mats.innerDark, 0, bodyH * 0.3, 0.02));
      g.add(box(w - 0.1, 0.016, d * 0.8, mats.inner, 0, bodyH * 0.34, 0.02));
    }
    return g;
  },

  // Duvara katlanır masa
  folding_table: (w, h, d, mats) => {
    const g = new THREE.Group();
    const t = Math.max(h, 0.035);
    g.add(box(w, t, d, mats.wood, 0, t / 2, 0));
    // Duvar bağlantı profili
    g.add(box(w, 0.06, 0.03, mats.doorDark, 0, -0.02, -d / 2 + 0.015));
    // Katlanır konsollar
    [-1, 1].forEach((s) => {
      const bracket = box(0.03, 0.3, 0.03, mats.steel, s * w * 0.3, -0.16, -d * 0.2);
      bracket.rotation.x = -0.9;
      g.add(bracket);
      g.add(box(0.024, 0.24, 0.024, mats.steel, s * w * 0.3, -0.12, -d / 2 + 0.05));
    });
    return g;
  },

  // Dikey bitki / çiçeklik paneli
  plant_panel: (w, h, d, mats) => {
    const g = new THREE.Group();
    // Ahşap çıtalar
    const slats = Math.max(5, Math.round(w / 0.1));
    for (let i = 0; i < slats; i++) {
      g.add(box(w / slats - 0.012, h, Math.max(d * 0.4, 0.02), mats.wood, -w / 2 + (w / slats) * (i + 0.5), h / 2, -d / 2 + d * 0.2));
    }
    g.add(box(w, 0.05, d * 0.5, mats.wood, 0, h - 0.025, -d / 2 + d * 0.25));
    // Saksılar + yeşillik
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const y = h * (0.22 + r * 0.28);
      g.add(box(w - 0.08, 0.024, d * 0.8, mats.wood, 0, y - 0.06, d * 0.1));
      const pots = Math.max(2, Math.round(w / 0.34));
      for (let p = 0; p < pots; p++) {
        const x = -w / 2 + (w * (p + 0.5)) / pots;
        const pot = cyl(0.055, 0.042, 0.1, mats.doorDark, 18);
        pot.position.set(x, y, d * 0.12);
        g.add(pot);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), mats.leaf);
        leaf.scale.set(1, 0.8, 1);
        leaf.position.set(x, y + 0.1, d * 0.12);
        g.add(leaf);
      }
    }
    return g;
  },

  // Vestiyer arka panosu: lazer kesim veya kapitone
  hook_panel: (w, h, d, mats, build) => {
    const g = new THREE.Group();
    const t = Math.max(d, 0.03);
    const tufted = build?.pattern === 'tufted';
    g.add(box(w, h, t, tufted ? mats.fabric : mats.wood, 0, h / 2, 0));

    if (tufted) {
      // Kapitone: eşkenar dörtgen dikiş düğmeleri
      const cols = Math.max(3, Math.round(w / 0.22));
      const rows = Math.max(3, Math.round(h / 0.22));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offset = r % 2 ? 0.5 : 0;
          const x = -w / 2 + (w * (c + 0.5 + offset)) / cols;
          if (Math.abs(x) > w / 2 - 0.03) continue;
          const y = (h * (r + 0.5)) / rows;
          const btn = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), mats.doorDark);
          btn.scale.set(1, 1, 0.5);
          btn.position.set(x, y, t / 2);
          g.add(btn);
          const pad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mats.fabric);
          pad.scale.set(1, 1, 0.2);
          pad.position.set(x, y, t / 2 - 0.006);
          g.add(pad);
        }
      }
    } else {
      // Lazer kesim geometrik desen
      const cols = Math.max(4, Math.round(w / 0.13));
      const rows = Math.max(6, Math.round(h / 0.13));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = -w / 2 + (w * (c + 0.5)) / cols;
          const y = (h * (r + 0.5)) / rows;
          const cut = box(w / cols * 0.42, h / rows * 0.42, 0.006, mats.doorDark, x, y, t / 2);
          cut.rotation.z = Math.PI / 4;
          g.add(cut);
        }
      }
    }

    // Askı kancaları
    const hooks = Math.max(3, Math.round(w / 0.22));
    for (let i = 0; i < hooks; i++) {
      const x = -w / 2 + (w * (i + 0.5)) / hooks;
      const y = h * 0.78;
      const base = cyl(0.016, 0.016, 0.02, mats.brass, 14);
      base.rotation.x = Math.PI / 2;
      base.position.set(x, y, t / 2 + 0.01);
      g.add(base);
      const arm = cyl(0.008, 0.008, 0.07, mats.brass, 10);
      arm.rotation.x = Math.PI / 2.6;
      arm.position.set(x, y - 0.015, t / 2 + 0.045);
      g.add(arm);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), mats.brass);
      tip.position.set(x, y - 0.045, t / 2 + 0.07);
      g.add(tip);
    }
    return g;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ANA ÜRETİCİ
// ═════════════════════════════════════════════════════════════════════════════

const buildFront = (rows, ctx, frontW, frontZ, xOffset = 0, rotY = 0) => {
  const g = new THREE.Group();
  const totalW = rows.reduce((s, r) => s + (r.w ?? 1), 0) || 1;
  let acc = 0;

  rows.forEach((row) => {
    const weight = row.w ?? 1;
    const rowH = (ctx.h - PANEL_T) * (weight / totalW);
    const yc = PANEL_T + acc + rowH / 2;
    acc += rowH;

    const builder = ROW_BUILDERS[row.t] || rowPanel;
    const sub = builder(row, { ...ctx, w: frontW, h: rowH, frontOffsetZ: frontZ });
    sub.position.set(xOffset, yc, frontZ);
    sub.rotation.y = rotY;
    g.add(sub);
  });

  return g;
};

export const buildModuleGroup = ({ def, item, mats }) => {
  const group = new THREE.Group();
  const w = item.customWidth || def.width;
  const h = item.customHeight || def.height;
  const d = item.customDepth || def.depth;
  const build = def.build || {};
  const ctx = { w, h, d, depth: d, mats, item, def };

  // ── Özel eleman (klozet, duşakabin, bench, panel...)
  if (build.fixture) {
    const fixture = FIXTURES[build.fixture];
    if (fixture) {
      group.add(fixture(w, h, d, mats, build));
      group.traverse((c) => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
      });
      return group;
    }
  }

  const shape = build.shape || 'box';
  const rows = build.rows || [{ t: 'door', n: 1, w: 1 }];
  const withTop = def.category !== 'alt' && def.category !== 'ada';

  // ── Gövde
  if (shape === 'diagonal') {
    group.add(buildDiagonalCarcass(w, h, d, mats));
  } else if (shape === 'lcorner') {
    group.add(buildLCarcass(w, h, d, mats));
  } else {
    group.add(buildBoxCarcass(w, h, d, mats, withTop));
  }

  // ── Ön yüz
  const frontZ = d / 2 + FRONT_GAP + FRONT_T / 2;

  if (shape === 'diagonal') {
    // Pahlı yüz (0.5w, -0.18d) → (-0.18w, 0.5d) arasında uzanır.
    // Kapak bu yüzün orta noktasına, dış normal yönünde oturur.
    const theta = Math.atan2(d, w);
    const faceW = 0.68 * Math.hypot(w, d);
    const nx = Math.sin(theta);
    const nz = Math.cos(theta);
    const off = FRONT_GAP + FRONT_T / 2;
    group.add(buildFront(
      rows, ctx, faceW - REVEAL,
      0.16 * d + nz * off,
      0.16 * w + nx * off,
      theta
    ));
  } else if (shape === 'lcorner') {
    const legD = d * 0.6;
    const legW = w * 0.6;
    const faceW = w - legW;
    const faceZ = -d / 2 + legD + FRONT_GAP + FRONT_T / 2;
    group.add(buildFront(rows, ctx, faceW - REVEAL, faceZ, -w / 2 + legW + faceW / 2));
    // Açık L köşe rafları
    if (rows.some((r) => r.t === 'open')) {
      [0.35, 0.68].forEach((t) => {
        group.add(box(legW - 0.02, 0.018, d - 0.03, mats.inner, -w / 2 + legW / 2, h * t, 0));
      });
    }
  } else if (shape === 'blind') {
    // Kör köşe: kapak %62, kalan sabit kör panel
    const doorW = w * 0.62;
    const blindW = w - doorW;
    group.add(buildFront(rows, ctx, doorW - REVEAL, frontZ, -w / 2 + doorW / 2));
    group.add(box(blindW - REVEAL, h - PANEL_T, FRONT_T, mats.door, w / 2 - blindW / 2, h / 2 + PANEL_T / 2, frontZ));
  } else {
    const columns = Math.max(1, build.columns || 1);
    const colW = w / columns;
    for (let c = 0; c < columns; c++) {
      const xOffset = -w / 2 + colW / 2 + c * colW;
      group.add(buildFront(rows, ctx, colW - REVEAL, frontZ, xOffset));
      if (build.doubleSided) {
        const back = buildFront(rows, ctx, colW - REVEAL, -frontZ, xOffset, Math.PI);
        group.add(back);
      }
    }
  }

  // ── Aksesuarlar
  applyExtras(group, def, item, ctx);

  // ── Süpürgelik (alt & boy modüllerde)
  if (h > 0.5 && def.category !== 'ust' && def.category !== 'aksesuar') {
    group.add(box(w - 0.04, PANEL_T, 0.02, mats.doorDark, 0, PANEL_T / 2, d / 2 - 0.03));
  }

  group.traverse((c) => {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });

  return group;
};
