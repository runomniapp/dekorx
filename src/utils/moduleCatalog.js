// DEKORX MODÜL KATALOĞU
// Oda kategorisi -> bölüm -> modül hiyerarşisi. Her modül hem fiyatlama hem de
// 3D üretim için tek bir tanımdan beslenir.
//
// build.rows : modülün ön yüzü, ALTTAN YUKARIYA doğru satırlar. `w` ağırlıktır
//              (oranlar normalize edilir), `n` aynı satırdaki kapak/panel adedi.
// build.extras : gövdeye eklenen donanım / aksesuarlar.
// build.shape  : 'box' (varsayılan) | 'blind' | 'diagonal' | 'lcorner'
// build.fixture: gövde yerine özel bir 3D eleman üretilir (klozet, duşakabin...)
//
// category alanı mevcut fiyat motoru & yerleşim mantığı ile uyumludur:
// 'alt' | 'ust' | 'boy' | 'ada' | 'vitrifiye' | 'aksesuar'
// countertop:false olan alt modüllere otomatik tezgah basılmaz.

const D = {
  base: { depth: 0.6, height: 0.85 },
  wall: { depth: 0.35, height: 0.72 },
  tall: { depth: 0.6, height: 2.1 },
  wardrobe: { depth: 0.6, height: 2.2 },
  vanity: { depth: 0.5, height: 0.8 }
};

export const MODULE_ROOMS = [
  // ═══════════════════════════════════════════════ 1. MUTFAK
  {
    id: 'mutfak',
    name: 'Mutfak',
    icon: '🍳',
    sections: [
      {
        id: 'mutfak_alt',
        name: 'Alt Dolaplar',
        icon: '🗄️',
        modules: [
          {
            id: 'mut_alt_1kapak',
            name: 'Alt 1 Kapaklı Modül',
            width: 0.45, ...D.base, basePrice: 3400, icon: '🚪',
            build: { rows: [{ t: 'door', n: 1, w: 1 }] }
          },
          {
            id: 'mut_alt_2kapak',
            name: 'Alt 2 Kapaklı Modül',
            width: 0.8, ...D.base, basePrice: 4800, icon: '🚪',
            build: { rows: [{ t: 'door', n: 2, w: 1 }] }
          },
          {
            id: 'mut_alt_1cek_1kapak',
            name: 'Alt 1 Çekmece + 1 Kapaklı',
            width: 0.6, ...D.base, basePrice: 5200, icon: '🗃️',
            build: { rows: [{ t: 'door', n: 1, w: 0.74 }, { t: 'drawer', w: 0.26 }] }
          },
          {
            id: 'mut_alt_2cek_tencere',
            name: 'Alt 2 Çekmeceli Derin Tencere',
            width: 0.6, ...D.base, basePrice: 6400, icon: '🍲',
            build: { rows: [{ t: 'drawer', w: 0.55 }, { t: 'drawer', w: 0.45 }] }
          },
          {
            id: 'mut_alt_3cek',
            name: 'Alt 3 Çekmeceli Modül',
            width: 0.6, ...D.base, basePrice: 7100, icon: '🥄',
            build: { rows: [{ t: 'drawer', w: 0.42 }, { t: 'drawer', w: 0.42 }, { t: 'drawer', w: 0.16 }] }
          },
          {
            id: 'mut_alt_4cek',
            name: 'Alt 4 Çekmeceli Eşit Modül',
            width: 0.6, ...D.base, basePrice: 7600, icon: '📇',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }, { t: 'drawer' }, { t: 'drawer' }] }
          },
          {
            id: 'mut_alt_evye',
            name: 'Alt Evye Modülü (Taban Korumalı)',
            width: 0.9, ...D.base, basePrice: 7800, icon: '🚰',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['sink_double', 'faucet', 'alu_tray'] }
          },
          {
            id: 'mut_alt_firin_ocak',
            name: 'Alt Ankastre Fırın / Ocak Modülü',
            width: 0.6, ...D.base, basePrice: 9600, icon: '🔥',
            build: { rows: [{ t: 'oven', w: 0.76 }, { t: 'drawer', w: 0.24 }], extras: ['hob'] }
          },
          {
            id: 'mut_alt_cargo',
            name: 'Alt Teleskopik Şişelik / Yağlık',
            width: 0.2, ...D.base, basePrice: 3900, icon: '🍾',
            build: { rows: [{ t: 'cargo', w: 1 }] }
          },
          {
            id: 'mut_alt_kor_kose',
            name: 'Alt Kör Köşe Modülü',
            width: 0.9, ...D.base, basePrice: 6900, icon: '📐',
            build: { shape: 'blind', rows: [{ t: 'door', n: 1, w: 1 }] }
          },
          {
            id: 'mut_alt_donel_kose',
            name: 'Alt Dönel Mekanizmalı Köşe',
            width: 0.9, depth: 0.9, height: 0.85, basePrice: 11200, icon: '🌀',
            build: { shape: 'lcorner', rows: [{ t: 'door', n: 1, w: 1 }], extras: ['carousel'] }
          },
          {
            id: 'mut_alt_diagonal_kose',
            name: 'Alt Diyagonal (Açılı) Köşe',
            width: 0.9, depth: 0.9, height: 0.85, basePrice: 9800, icon: '🔺',
            build: { shape: 'diagonal', rows: [{ t: 'door', n: 1, w: 1 }] }
          },
          {
            id: 'mut_alt_bulasik_panel',
            name: 'Alt Bulaşık Makinesi Kapak Paneli',
            width: 0.6, ...D.base, basePrice: 4300, icon: '🫧',
            build: { rows: [{ t: 'dishwasher', w: 1 }] }
          },
          {
            id: 'mut_alt_buzdolabi',
            name: 'Alt Tezgâh Altı Buzdolabı Kabini',
            width: 0.6, ...D.base, basePrice: 5600, icon: '🧊',
            build: { rows: [{ t: 'fridge', w: 1 }] }
          }
        ]
      },
      {
        id: 'mutfak_ust',
        name: 'Üst Dolaplar',
        icon: '🖼️',
        modules: [
          {
            id: 'mut_ust_1kapak',
            name: 'Üst 1 Kapaklı Modül',
            width: 0.4, ...D.wall, basePrice: 2700, icon: '🗳️',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['shelves2'] }
          },
          {
            id: 'mut_ust_2kapak',
            name: 'Üst 2 Kapaklı Modül',
            width: 0.8, ...D.wall, basePrice: 3900, icon: '🗳️',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['shelves2'] }
          },
          {
            id: 'mut_ust_kalkar',
            name: 'Üst Kalkar Tek Kapaklı (Aventos HK)',
            width: 0.6, depth: 0.35, height: 0.45, basePrice: 4600, icon: '⬆️',
            build: { rows: [{ t: 'lift', w: 1 }], extras: ['piston'] }
          },
          {
            id: 'mut_ust_cift_kalkar',
            name: 'Üst Çift Kalkar Katlanır (Aventos HF)',
            width: 0.9, ...D.wall, basePrice: 6200, icon: '↕️',
            build: { rows: [{ t: 'foldlift', w: 1 }], extras: ['piston'] }
          },
          {
            id: 'mut_ust_camli',
            name: 'Üst Camlı / Alüminyum Çerçeveli',
            width: 0.8, ...D.wall, basePrice: 5400, hasGlassDoor: true, icon: '🪟',
            build: { rows: [{ t: 'glass', n: 2, w: 1 }], extras: ['shelves2'] }
          },
          {
            id: 'mut_ust_bulasiklik',
            name: 'Üst Bulaşıklık / Tabaklıklı Modül',
            width: 0.8, ...D.wall, basePrice: 5100, icon: '🍽️',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['plate_rack'] }
          },
          {
            id: 'mut_ust_davlumbaz',
            name: 'Üst Aspiratör / Davlumbaz Kabini',
            width: 0.6, depth: 0.35, height: 0.42, basePrice: 6800, icon: '💨',
            defaultY: 1.55,
            build: { rows: [{ t: 'panel', w: 1 }], extras: ['hood'] }
          },
          {
            id: 'mut_ust_mikrodalga',
            name: 'Üst Mikrodalga Dolap Modülü',
            width: 0.6, depth: 0.4, height: 0.4, basePrice: 7400, icon: '📻',
            build: { rows: [{ t: 'microwave', w: 1 }] }
          },
          {
            id: 'mut_ust_duz_kose',
            name: 'Üst Düz Köşe Modülü',
            width: 0.6, ...D.wall, basePrice: 4200, icon: '📏',
            build: { shape: 'blind', rows: [{ t: 'door', n: 1, w: 1 }] }
          },
          {
            id: 'mut_ust_l_kose',
            name: 'Üst L-Köşe Modülü',
            width: 0.6, depth: 0.6, height: 0.72, basePrice: 5800, icon: '📐',
            build: { shape: 'lcorner', rows: [{ t: 'door', n: 1, w: 1 }], extras: ['shelves2'] }
          },
          {
            id: 'mut_ust_acik_saraplik',
            name: 'Üst Açık Raflı / Şaraplık Modülü',
            width: 0.6, ...D.wall, basePrice: 4400, icon: '🍷',
            build: { rows: [{ t: 'open', shelves: 1, w: 0.55 }, { t: 'open', w: 0.45 }], extras: ['wine_rack'] }
          },
          {
            id: 'mut_tezgah_panjur',
            name: 'Tezgâh Üstü Panjur Kapaklı Kiler',
            width: 0.6, depth: 0.3, height: 0.55, basePrice: 5200, icon: '🎞️',
            category: 'ust', defaultY: 0.92,
            build: { rows: [{ t: 'tambour', w: 1 }], extras: ['shelves1'] }
          }
        ]
      },
      {
        id: 'mutfak_boy',
        name: 'Boy / Kiler',
        icon: '🕋',
        modules: [
          {
            id: 'mut_boy_kiler',
            name: 'Boy Kiler Modülü (Tandem Sepetli)',
            width: 0.6, ...D.tall, basePrice: 12400, icon: '🧺',
            build: { rows: [{ t: 'door', n: 1, w: 0.55 }, { t: 'door', n: 1, w: 0.45 }], extras: ['tandem_baskets'] }
          },
          {
            id: 'mut_boy_firin_mikro',
            name: 'Boy Ankastre Fırın + Mikrodalga',
            width: 0.6, ...D.tall, basePrice: 17400, icon: '🎛️',
            build: {
              rows: [
                { t: 'door', n: 1, w: 0.25 },
                { t: 'oven', w: 0.28 },
                { t: 'microwave', w: 0.19 },
                { t: 'door', n: 1, w: 0.28 }
              ]
            }
          },
          {
            id: 'mut_boy_buzdolabi',
            name: 'Boy Ankastre Buzdolabı Kabini',
            width: 0.7, depth: 0.65, height: 2.1, basePrice: 15800, icon: '🧊',
            build: { rows: [{ t: 'fridge', w: 1 }] }
          },
          {
            id: 'mut_boy_supurgelik',
            name: 'Boy Süpürgelik & Temizlik Kabini',
            width: 0.5, ...D.tall, basePrice: 9800, icon: '🧹',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['broom_rack'] }
          },
          {
            id: 'mut_boy_kahve',
            name: 'Boy Kahve Köşesi / Açık Raflı',
            width: 0.6, ...D.tall, basePrice: 13200, icon: '☕',
            build: {
              rows: [
                { t: 'door', n: 1, w: 0.36 },
                { t: 'open', shelves: 1, w: 0.3 },
                { t: 'door', n: 1, w: 0.34 }
              ],
              extras: ['led_strip']
            }
          }
        ]
      },
      {
        id: 'mutfak_ada',
        name: 'Ada & Armatür',
        icon: '🏝️',
        modules: [
          {
            id: 'mut_ada_cekmeceli',
            name: 'Ada Altı Çekmeceli / Raflı Modül',
            width: 1.8, depth: 0.9, height: 0.9, basePrice: 18500, category: 'ada', icon: '🏝️',
            build: { rows: [{ t: 'drawer', w: 0.5 }, { t: 'drawer', w: 0.5 }], columns: 3 }
          },
          {
            id: 'mut_ada_bar',
            name: 'Ada Barlı Oturma Ünitesi',
            width: 2.0, depth: 1.0, height: 0.9, basePrice: 24600, category: 'ada', icon: '🍸',
            build: { rows: [{ t: 'door', n: 3, w: 1 }], extras: ['bar_overhang', 'bar_stools'] }
          },
          {
            id: 'mut_tezgah_evye',
            name: 'Tezgâh Üstü Evye (Çift Gözlü)',
            width: 0.86, depth: 0.5, height: 0.22, basePrice: 6200,
            category: 'aksesuar', defaultY: 0.91, countertop: false, icon: '🪣',
            build: { fixture: 'counter_sink' }
          },
          {
            id: 'mut_armatur',
            name: 'Evyeli Batarya / Armatür',
            width: 0.12, depth: 0.24, height: 0.42, basePrice: 3800,
            category: 'aksesuar', defaultY: 0.91, countertop: false, icon: '🚿',
            build: { fixture: 'faucet_only' }
          },
          {
            id: 'mut_ada_sarkit',
            name: 'Ada Üstü Asma Şaraplık Sarkıt',
            width: 1.4, depth: 0.5, height: 0.5, basePrice: 11400,
            category: 'aksesuar', defaultY: 1.9, countertop: false, icon: '🍾',
            build: { fixture: 'pendant_rack' }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 2. GARDIROP
  {
    id: 'gardirop',
    name: 'Gardırop',
    icon: '👔',
    sections: [
      {
        id: 'gardirop_govde',
        name: 'Gövde & Dış Modüller',
        icon: '🚪',
        modules: [
          {
            id: 'gar_1kapak',
            name: 'Gardırop 1 Kapaklı Menteşeli',
            width: 0.5, ...D.wardrobe, basePrice: 8200, category: 'boy', icon: '🚪',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['rail_high', 'shelves2'] }
          },
          {
            id: 'gar_2kapak',
            name: 'Gardırop 2 Kapaklı Menteşeli',
            width: 1.0, ...D.wardrobe, basePrice: 14600, category: 'boy', icon: '🚪',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['rail_high', 'shelves2'] }
          },
          {
            id: 'gar_3kapak',
            name: 'Gardırop 3 Kapaklı Menteşeli',
            width: 1.5, ...D.wardrobe, basePrice: 20800, category: 'boy', icon: '🚪',
            build: { rows: [{ t: 'door', n: 3, w: 1 }], extras: ['rail_high', 'shelves2'] }
          },
          {
            id: 'gar_surme_2',
            name: 'Gardırop 2 Panelli Sürme Kapaklı',
            width: 1.6, depth: 0.65, height: 2.4, basePrice: 24200, category: 'boy', icon: '↔️',
            build: { rows: [{ t: 'slidedoor', n: 2, w: 1 }], extras: ['rail_high'] }
          },
          {
            id: 'gar_surme_3',
            name: 'Gardırop 3 Panelli Sürme Kapaklı',
            width: 2.4, depth: 0.65, height: 2.4, basePrice: 33600, category: 'boy', icon: '↔️',
            build: { rows: [{ t: 'slidedoor', n: 3, w: 1 }], extras: ['rail_high'] }
          },
          {
            id: 'gar_l_kose',
            name: 'Gardırop L-Köşe Dolap Gövdesi',
            width: 1.0, depth: 1.0, height: 2.2, basePrice: 19400, category: 'boy', icon: '📐',
            build: { shape: 'lcorner', rows: [{ t: 'door', n: 1, w: 1 }], extras: ['rail_high'] }
          },
          {
            id: 'gar_akordeon',
            name: 'Gardırop Akordeon Katlanır Kapaklı',
            width: 1.0, ...D.wardrobe, basePrice: 17800, category: 'boy', icon: '🪗',
            build: { rows: [{ t: 'accordion', n: 4, w: 1 }], extras: ['rail_high'] }
          }
        ]
      },
      {
        id: 'gardirop_ic',
        name: 'İç Bölme & Aksesuar',
        icon: '🧷',
        modules: [
          {
            id: 'gar_uzun_askilik',
            name: 'Uzun Elbise Askılık Modülü',
            width: 1.0, ...D.wardrobe, basePrice: 6400, category: 'boy', icon: '🧥',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['rail_high', 'hangers'] }
          },
          {
            id: 'gar_cift_askilik',
            name: 'Çift Kat Kısa Askılık Modülü',
            width: 1.0, ...D.wardrobe, basePrice: 7600, category: 'boy', icon: '👕',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['rail_double', 'hangers'] }
          },
          {
            id: 'gar_asansor_askilik',
            name: 'Asansörlü Askılık Modülü',
            width: 1.0, ...D.wardrobe, basePrice: 12800, category: 'boy', icon: '🛗',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['lift_rail', 'hangers'] }
          },
          {
            id: 'gar_cekmece_blok',
            name: 'Çekmeceli İç Blok Modülü (3’lü)',
            width: 0.6, depth: 0.55, height: 0.7, basePrice: 6800, category: 'alt', countertop: false, icon: '🗃️',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }, { t: 'drawer' }] }
          },
          {
            id: 'gar_pantolonluk',
            name: 'Pantolonluk Aksesuar Modülü',
            width: 0.6, depth: 0.55, height: 0.6, basePrice: 5400, category: 'alt', countertop: false, icon: '👖',
            defaultY: 0.9,
            build: { rows: [{ t: 'open', w: 1 }], extras: ['pants_rails'] }
          },
          {
            id: 'gar_kravatlik',
            name: 'Kravatlık / Takı Çekmecesi',
            width: 0.6, depth: 0.5, height: 0.16, basePrice: 4200, category: 'alt', countertop: false, icon: '👔',
            defaultY: 0.75,
            build: { rows: [{ t: 'open', w: 1 }], extras: ['velvet_tray'] }
          },
          {
            id: 'gar_ayakkabilik_ic',
            name: 'Ayakkabılık Raflı İç Modül',
            width: 0.8, depth: 0.4, height: 1.1, basePrice: 6200, category: 'alt', countertop: false, icon: '👟',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['shoe_slope'] }
          },
          {
            id: 'gar_cam_led_sergileme',
            name: 'Cam Kapaklı & LED Sergileme Modülü',
            width: 0.8, depth: 0.5, height: 1.2, basePrice: 11600, category: 'boy', hasGlassDoor: true, icon: '💡',
            defaultY: 0.9,
            build: { rows: [{ t: 'glass', n: 2, w: 1 }], extras: ['shelves2', 'led_strip'] }
          },
          {
            id: 'gar_tepe_yukluk',
            name: 'Tepe Yüklük / Sezonluk Depolama',
            width: 1.0, depth: 0.6, height: 0.5, basePrice: 6900, category: 'ust', defaultY: 2.2, icon: '📦',
            build: { rows: [{ t: 'door', n: 2, w: 1 }] }
          },
          {
            id: 'gar_kasa',
            name: 'Gizli Bölme / Çelik Kasa Kabini',
            width: 0.5, depth: 0.5, height: 0.5, basePrice: 14200, category: 'alt', countertop: false, icon: '🔐',
            defaultY: 0.8,
            build: { rows: [{ t: 'open', w: 1 }], extras: ['safe'] }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 3. BANYO
  {
    id: 'banyo',
    name: 'Banyo',
    icon: '🛁',
    sections: [
      {
        id: 'banyo_alt',
        name: 'Lavabo Üniteleri',
        icon: '🚰',
        modules: [
          {
            id: 'ban_alt_canak_1cek',
            name: 'Çanak Lavabo 1 Çekmeceli',
            width: 0.6, ...D.vanity, basePrice: 7400, icon: '🥣',
            build: { rows: [{ t: 'drawer', w: 1 }], extras: ['vessel_basin', 'faucet_tall'] }
          },
          {
            id: 'ban_alt_canak_2cek',
            name: 'Çanak Lavabo 2 Çekmeceli',
            width: 0.8, ...D.vanity, basePrice: 9200, icon: '🥣',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }], extras: ['vessel_basin', 'faucet_tall'] }
          },
          {
            id: 'ban_alt_gomme_lavabo',
            name: 'Tezgah Altı / Gömme Lavabo Modülü',
            width: 0.8, ...D.vanity, basePrice: 9800, icon: '🛀',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['undermount_basin', 'faucet'] }
          },
          {
            id: 'ban_alt_cift_lavabo',
            name: 'Çift Lavabolu (Double Vanity)',
            width: 1.4, ...D.vanity, basePrice: 16400, icon: '👥',
            build: { rows: [{ t: 'drawer', w: 0.5 }, { t: 'drawer', w: 0.5 }], columns: 2, extras: ['double_basin', 'faucet'] }
          },
          {
            id: 'ban_klozet_gomme',
            name: 'Gömme Rezervuarlı Klozet',
            width: 0.4, depth: 0.62, height: 1.0, basePrice: 12800,
            category: 'vitrifiye', countertop: false, icon: '🚽',
            build: { fixture: 'toilet_wall' }
          },
          {
            id: 'ban_klozet_rezervuar',
            name: 'Rezervuarlı Klozet',
            width: 0.4, depth: 0.68, height: 0.78, basePrice: 6400,
            category: 'vitrifiye', countertop: false, icon: '🚽',
            build: { fixture: 'toilet_tank' }
          },
          {
            id: 'ban_alt_kirli_sepet',
            name: 'Kirli Çamaşır Sepetli Modül',
            width: 0.4, ...D.vanity, basePrice: 5600, countertop: false, icon: '🧺',
            build: { rows: [{ t: 'basket', w: 1 }] }
          },
          {
            id: 'ban_alt_asma',
            name: 'Asma Minimalist Modül',
            width: 0.9, depth: 0.45, height: 0.4, basePrice: 8800,
            category: 'ust', defaultY: 0.42, icon: '🪞',
            build: { rows: [{ t: 'drawer', w: 1 }], extras: ['undermount_basin', 'faucet'] }
          }
        ]
      },
      {
        id: 'banyo_ust',
        name: 'Aynalı Üst Üniteler',
        icon: '🪞',
        modules: [
          {
            id: 'ban_ust_ayna_1',
            name: 'Tek Kapaklı Aynalı Flotal Dolap',
            width: 0.5, depth: 0.15, height: 0.7, basePrice: 5200,
            category: 'ust', defaultY: 1.45, icon: '🪞',
            build: { rows: [{ t: 'mirror', n: 1, w: 1 }] }
          },
          {
            id: 'ban_ust_ayna_2',
            name: 'Çift Kapaklı Aynalı Flotal Dolap',
            width: 0.8, depth: 0.15, height: 0.7, basePrice: 6900,
            category: 'ust', defaultY: 1.45, icon: '🪞',
            build: { rows: [{ t: 'mirror', n: 2, w: 1 }] }
          },
          {
            id: 'ban_ust_led_ayna',
            name: 'LED Aydınlatmalı Düz Ayna Paneli',
            width: 0.9, depth: 0.04, height: 0.8, basePrice: 4800,
            category: 'aksesuar', defaultY: 1.4, countertop: false, icon: '💡',
            build: { fixture: 'mirror_panel' }
          },
          {
            id: 'ban_ust_ayna_raf',
            name: 'Yan Açık Raflı Ayna Ünitesi',
            width: 1.0, depth: 0.18, height: 0.75, basePrice: 7600,
            category: 'ust', defaultY: 1.45, icon: '🗄️',
            build: { rows: [{ t: 'mirror', n: 1, w: 1 }], sideOpen: true, extras: ['shelves2'] }
          }
        ]
      },
      {
        id: 'banyo_boy',
        name: 'Boy Dolapları',
        icon: '🧴',
        modules: [
          {
            id: 'ban_boy_havluluk',
            name: 'Boy Havluluk & Deterjanlık',
            width: 0.4, depth: 0.4, height: 2.0, basePrice: 8600, category: 'boy', icon: '🧻',
            build: { rows: [{ t: 'door', n: 1, w: 0.62 }, { t: 'open', shelves: 1, w: 0.38 }] }
          },
          {
            id: 'ban_boy_camasir_kurutma',
            name: 'Çamaşır + Kurutma Entegre Kabin',
            width: 0.7, depth: 0.65, height: 2.0, basePrice: 14800, category: 'boy', icon: '🌀',
            build: { rows: [{ t: 'washer', w: 0.4 }, { t: 'dryer', w: 0.4 }, { t: 'door', n: 1, w: 0.2 }] }
          },
          {
            id: 'ban_boy_kirli_gizli',
            name: 'Kirli Sepetli + Gizli Bölmeli Boy',
            width: 0.5, depth: 0.5, height: 2.0, basePrice: 10400, category: 'boy', icon: '🧺',
            build: { rows: [{ t: 'basket', w: 0.32 }, { t: 'door', n: 1, w: 0.68 }] }
          }
        ]
      },
      {
        id: 'banyo_islak',
        name: 'Islak Hacim & Vitrifiye',
        icon: '🚿',
        modules: [
          {
            id: 'ban_dusakabin',
            name: 'Duşakabin (Siyah Profilli Köşe)',
            width: 0.9, depth: 0.9, height: 2.0, basePrice: 18600,
            category: 'vitrifiye', countertop: false, icon: '🚿',
            build: { fixture: 'shower' }
          },
          {
            id: 'ban_kuvet',
            name: 'Küvet Ünitesi (Akrilik Ön Panelli)',
            width: 1.7, depth: 0.75, height: 0.56, basePrice: 21400,
            category: 'vitrifiye', countertop: false, icon: '🛁',
            build: { fixture: 'bathtub' }
          },
          {
            id: 'ban_jakuzi',
            name: 'Jakuzi & Ahşap Deck Ünitesi',
            width: 1.8, depth: 1.8, height: 0.6, basePrice: 68400,
            category: 'vitrifiye', countertop: false, icon: '🫧',
            build: { fixture: 'jacuzzi' }
          },
          {
            id: 'ban_rezervuar_depo',
            name: 'Gömme Rezervuar Üstü Ahşap Depolama',
            width: 0.9, depth: 0.25, height: 0.55, basePrice: 6800,
            category: 'ust', defaultY: 1.05, icon: '🪵',
            build: { rows: [{ t: 'open', shelves: 1, w: 1 }] }
          },
          {
            id: 'ban_tezgah',
            name: 'Banyo Tezgâhı (Mermer / Masif)',
            width: 1.2, depth: 0.5, height: 0.05, basePrice: 7200,
            category: 'aksesuar', defaultY: 0.8, countertop: false, icon: '🧱',
            build: { fixture: 'counter_slab' }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 4. BALKON
  {
    id: 'balkon',
    name: 'Balkon',
    icon: '🌿',
    sections: [
      {
        id: 'balkon_depolama',
        name: 'Depolama & Çamaşır',
        icon: '🌀',
        modules: [
          {
            id: 'bal_camasir_alt',
            name: 'Çamaşır Makinesi Alt Dolap Kabini',
            width: 0.65, depth: 0.65, height: 0.9, basePrice: 6800, countertop: false, icon: '🌀',
            build: { rows: [{ t: 'washer', w: 1 }] }
          },
          {
            id: 'bal_kurutma_boy',
            name: 'Kurutma & Çamaşır Üst Üste Boy Kabin',
            width: 0.68, depth: 0.68, height: 2.0, basePrice: 13400, category: 'boy', icon: '🧺',
            build: { rows: [{ t: 'washer', w: 0.42 }, { t: 'dryer', w: 0.42 }, { t: 'door', n: 1, w: 0.16 }] }
          },
          {
            id: 'bal_kombi_kabin',
            name: 'Kombi & Tesisat Gizleme Kabini',
            width: 0.75, depth: 0.4, height: 0.95, basePrice: 7200,
            category: 'ust', defaultY: 1.35, icon: '🔧',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['vent_slots'] }
          },
          {
            id: 'bal_supurgelik_boy',
            name: 'Süpürgelik & Temizlik Boy Dolabı',
            width: 0.5, depth: 0.5, height: 2.0, basePrice: 8400, category: 'boy', icon: '🧹',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['broom_rack'] }
          },
          {
            id: 'bal_erzak_panjur',
            name: 'Erzak & Kiler Modülü (Panjur Kapak)',
            width: 0.8, depth: 0.4, height: 2.0, basePrice: 11800, category: 'boy', icon: '🎞️',
            build: { rows: [{ t: 'tambour', w: 1 }], extras: ['shelves3'] }
          }
        ]
      },
      {
        id: 'balkon_keyif',
        name: 'Mutfak & Oturma',
        icon: '🔥',
        modules: [
          {
            id: 'bal_barbeku_tezgah',
            name: 'Barbekü Yanı Tezgâh & Depolama',
            width: 1.2, depth: 0.6, height: 0.9, basePrice: 14600, icon: '🍖',
            build: { rows: [{ t: 'drawer', w: 0.35 }, { t: 'door', n: 2, w: 0.65 }] }
          },
          {
            id: 'bal_mini_evye',
            name: 'Mini Tezgâh Altı Evyeli Modül',
            width: 0.6, depth: 0.55, height: 0.9, basePrice: 8900, icon: '🚰',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['sink_single', 'faucet'] }
          },
          {
            id: 'bal_sandikli_bench',
            name: 'Sandıklı Oturma Bench Modülü',
            width: 1.2, depth: 0.45, height: 0.45, basePrice: 9400,
            category: 'aksesuar', countertop: false, icon: '🪑',
            build: { fixture: 'bench' }
          },
          {
            id: 'bal_katlanir_masa',
            name: 'Duvara Katlanır Masa Modülü',
            width: 0.9, depth: 0.5, height: 0.08, basePrice: 5800,
            category: 'aksesuar', defaultY: 0.74, countertop: false, icon: '🪵',
            build: { fixture: 'folding_table' }
          },
          {
            id: 'bal_bitki_panel',
            name: 'Dikey Bitki / Çiçeklik Ahşap Panel',
            width: 1.0, depth: 0.18, height: 1.8, basePrice: 7600,
            category: 'aksesuar', countertop: false, icon: '🪴',
            build: { fixture: 'plant_panel' }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 5. TUVALET
  {
    id: 'tuvalet',
    name: 'Tuvalet',
    icon: '🚽',
    sections: [
      {
        id: 'tuvalet_kompakt',
        name: 'Kompakt Modüller',
        icon: '🧼',
        modules: [
          {
            id: 'tuv_mini_lavabo',
            name: 'Mini Çanak Lavabo Altı Modülü',
            width: 0.45, depth: 0.35, height: 0.75, basePrice: 5400, icon: '🥣',
            build: { rows: [{ t: 'door', n: 1, w: 1 }], extras: ['vessel_basin_small', 'faucet_tall'] }
          },
          {
            id: 'tuv_kose_lavabo',
            name: 'Köşe Lavabo Altı Modülü',
            width: 0.45, depth: 0.45, height: 0.75, basePrice: 6200, icon: '📐',
            build: { shape: 'diagonal', rows: [{ t: 'door', n: 1, w: 1 }], extras: ['vessel_basin_small', 'faucet_tall'] }
          },
          {
            id: 'tuv_rezervuar_arkasi',
            name: 'Rezervuar Arkası Gizli Depolama',
            width: 0.6, depth: 0.25, height: 1.05, basePrice: 6600, countertop: false, icon: '🫥',
            build: { rows: [{ t: 'panel', w: 0.55 }, { t: 'open', shelves: 1, w: 0.45 }] }
          },
          {
            id: 'tuv_ayna_dolap',
            name: 'Ayna Arkası Sığ Kapaklı Dolap',
            width: 0.5, depth: 0.13, height: 0.7, basePrice: 4900,
            category: 'ust', defaultY: 1.4, icon: '🪞',
            build: { rows: [{ t: 'mirror', n: 1, w: 1 }] }
          },
          {
            id: 'tuv_havluluk_panel',
            name: 'Havlu & Kâğıtlık Sergileme Paneli',
            width: 0.4, depth: 0.14, height: 0.9, basePrice: 3800,
            category: 'ust', defaultY: 1.0, icon: '🧻',
            build: { rows: [{ t: 'open', shelves: 2, w: 1 }], extras: ['towel_bar'] }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 6. GİYİNME ODASI
  {
    id: 'giyinme',
    name: 'Giyinme Odası',
    icon: '🧳',
    sections: [
      {
        id: 'giyinme_acik',
        name: 'Açık Dikme Sistemleri',
        icon: '🧥',
        modules: [
          {
            id: 'giy_dikey_askilik',
            name: 'Açık Dikey Panelli Askılık',
            width: 1.0, depth: 0.6, height: 2.2, basePrice: 9800, category: 'boy', icon: '🧥',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['rail_high', 'hangers', 'shelves1'] }
          },
          {
            id: 'giy_cift_gomleklik',
            name: 'Açık Çift Kat Gömleklik',
            width: 1.0, depth: 0.6, height: 2.2, basePrice: 10600, category: 'boy', icon: '👕',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['rail_double', 'hangers'] }
          },
          {
            id: 'giy_led_raf',
            name: 'LED Şeritli Açık Raf Ünitesi',
            width: 1.0, depth: 0.4, height: 2.2, basePrice: 11200, category: 'boy', icon: '💡',
            build: { rows: [{ t: 'open', shelves: 4, w: 1 }], extras: ['led_strip'] }
          },
          {
            id: 'giy_kose_askilik',
            name: 'Köşe Açık Askılık Ünitesi',
            width: 1.0, depth: 1.0, height: 2.2, basePrice: 13800, category: 'boy', icon: '📐',
            build: { shape: 'lcorner', rows: [{ t: 'open', w: 1 }], extras: ['rail_high', 'hangers'] }
          }
        ]
      },
      {
        id: 'giyinme_ada',
        name: 'Ada & Çekmece Üniteleri',
        icon: '💎',
        modules: [
          {
            id: 'giy_ada_cam_taki',
            name: 'Ada Cam Üst Panelli Takı Modülü',
            width: 1.2, depth: 0.7, height: 0.9, basePrice: 18900, category: 'ada', countertop: false, icon: '💎',
            build: { rows: [{ t: 'drawer', w: 0.5 }, { t: 'drawer', w: 0.5 }], columns: 2, extras: ['jewel_glass_top', 'led_strip'] }
          },
          {
            id: 'giy_ada_cift_cekmece',
            name: 'Ada Çift Taraflı Çekmece Ünitesi',
            width: 1.4, depth: 0.8, height: 0.9, basePrice: 22400, category: 'ada', icon: '🗄️',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }, { t: 'drawer' }], columns: 2, doubleSided: true }
          },
          {
            id: 'giy_corap_cekmece',
            name: 'Bölmeli Çorap & İç Çamaşırı Çekmecesi',
            width: 0.8, depth: 0.55, height: 0.5, basePrice: 7400, countertop: false, icon: '🧦',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }], extras: ['divider_tray'] }
          },
          {
            id: 'giy_esarp_cekmece',
            name: 'Raylı Eşarp / Kravat Çekmecesi',
            width: 0.6, depth: 0.5, height: 0.35, basePrice: 5900, countertop: false, icon: '🧣',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }], extras: ['velvet_tray'] }
          }
        ]
      },
      {
        id: 'giyinme_sergileme',
        name: 'Sergileme Elemanları',
        icon: '👠',
        modules: [
          {
            id: 'giy_cam_ayakkabilik',
            name: 'LED Cam Kapaklı Ayakkabılık',
            width: 1.0, depth: 0.4, height: 2.0, basePrice: 16800,
            category: 'boy', hasGlassDoor: true, icon: '👠',
            build: { rows: [{ t: 'glass', n: 2, w: 1 }], extras: ['shoe_slope', 'led_strip'] }
          },
          {
            id: 'giy_egimli_ayakkabi',
            name: 'Eğimli Raflı Ayakkabı Sergileme',
            width: 1.0, depth: 0.4, height: 1.2, basePrice: 8600, countertop: false, icon: '👟',
            build: { rows: [{ t: 'open', w: 1 }], extras: ['shoe_slope'] }
          },
          {
            id: 'giy_canta_raf',
            name: 'Çanta Sergileme Açık Raf Modülü',
            width: 0.9, depth: 0.4, height: 1.6, basePrice: 9200, category: 'boy', icon: '👜',
            build: { rows: [{ t: 'open', shelves: 3, w: 1 }], extras: ['led_strip'] }
          },
          {
            id: 'giy_puf_bench',
            name: 'Puf / Oturma Benci (Çekmeceli)',
            width: 1.0, depth: 0.45, height: 0.45, basePrice: 8900,
            category: 'aksesuar', countertop: false, icon: '🪑',
            build: { fixture: 'bench', drawer: true }
          },
          {
            id: 'giy_boy_ayna_taki',
            name: 'Boy Aynalı Gizli Döner Takı Kabini',
            width: 0.7, depth: 0.32, height: 2.0, basePrice: 15400, category: 'boy', icon: '🪞',
            build: { rows: [{ t: 'mirror', n: 1, w: 1 }], extras: ['velvet_tray'] }
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════ 7. VESTİYER
  {
    id: 'vestiyer',
    name: 'Vestiyer',
    icon: '🎩',
    sections: [
      {
        id: 'vestiyer_alt',
        name: 'Alt & Giriş Üniteleri',
        icon: '👞',
        modules: [
          {
            id: 'ves_dusen_ayakkabilik',
            name: 'Düşer Kapaklı Ayakkabılık Alt Modülü',
            width: 0.8, depth: 0.3, height: 0.9, basePrice: 7200, countertop: false, icon: '👞',
            build: { rows: [{ t: 'basket', w: 0.34 }, { t: 'basket', w: 0.33 }, { t: 'basket', w: 0.33 }] }
          },
          {
            id: 'ves_cekmeceli_alt',
            name: 'Çekmeceli Anahtarlık Alt Modülü',
            width: 0.8, depth: 0.35, height: 0.6, basePrice: 6400, icon: '🔑',
            build: { rows: [{ t: 'drawer' }, { t: 'drawer' }] }
          },
          {
            id: 'ves_minderli_bench',
            name: 'Minderli Oturma Benci',
            width: 1.0, depth: 0.4, height: 0.45, basePrice: 8200,
            category: 'aksesuar', countertop: false, icon: '🪑',
            build: { fixture: 'bench', cushion: true, shoeNiche: true }
          }
        ]
      },
      {
        id: 'vestiyer_panel',
        name: 'Panel & Askı Sistemleri',
        icon: '🪝',
        modules: [
          {
            id: 'ves_lazer_panel',
            name: 'Lazer Kesim Ahşap Askılık Paneli',
            width: 1.0, depth: 0.06, height: 1.8, basePrice: 8600,
            category: 'aksesuar', defaultY: 0.6, countertop: false, icon: '🪵',
            build: { fixture: 'hook_panel', pattern: 'laser' }
          },
          {
            id: 'ves_kapitone_pano',
            name: 'Kapitone Döşemeli Arka Pano',
            width: 1.0, depth: 0.09, height: 1.4, basePrice: 9800,
            category: 'aksesuar', defaultY: 0.6, countertop: false, icon: '🛋️',
            build: { fixture: 'hook_panel', pattern: 'tufted' }
          },
          {
            id: 'ves_aynali_pano',
            name: 'Aynalı Arka Pano Modülü',
            width: 0.7, depth: 0.05, height: 1.6, basePrice: 6900,
            category: 'aksesuar', defaultY: 0.5, countertop: false, icon: '🪞',
            build: { fixture: 'mirror_panel' }
          }
        ]
      },
      {
        id: 'vestiyer_boy',
        name: 'Boy & Depolama',
        icon: '🧥',
        modules: [
          {
            id: 'ves_boy_palto',
            name: 'Menteşeli Kaban / Palto Boy Askılık',
            width: 0.8, depth: 0.6, height: 2.1, basePrice: 13600, category: 'boy', icon: '🧥',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['rail_high', 'hangers'] }
          },
          {
            id: 'ves_surme_portmanto',
            name: 'Sürme Kapaklı Portmanto Gövdesi',
            width: 1.4, depth: 0.6, height: 2.1, basePrice: 19800, category: 'boy', icon: '↔️',
            build: { rows: [{ t: 'slidedoor', n: 2, w: 1 }], extras: ['rail_high'] }
          },
          {
            id: 'ves_yukluk_ust',
            name: 'Yüklük / Sezonluk Üst Modül',
            width: 0.8, depth: 0.6, height: 0.5, basePrice: 6200,
            category: 'ust', defaultY: 2.1, icon: '📦',
            build: { rows: [{ t: 'door', n: 2, w: 1 }] }
          },
          {
            id: 'ves_bavul_alt',
            name: 'Bavul & Robot Süpürge Gizli Kabin',
            width: 0.8, depth: 0.6, height: 0.45, basePrice: 6800, countertop: false, icon: '🧳',
            build: { rows: [{ t: 'door', n: 2, w: 1 }], extras: ['robot_niche'] }
          }
        ]
      }
    ]
  }
];

// Katalog verisini üretim & fiyatlama tarafının beklediği düz listeye indirger.
const normalizeModule = (mod, room, section) => ({
  hasGlassDoor: false,
  isOpenCorner: false,
  countertop: true,
  color: '#E2E8F0',
  ...mod,
  roomId: room.id,
  roomName: room.name,
  sectionId: section.id,
  sectionName: section.name,
  // Fiyat & yerleşim mantığı 'alt' varsayılanı üzerinden çalışır.
  category: mod.category || 'alt',
  build: mod.build || { rows: [{ t: 'door', n: 1, w: 1 }] }
});

export const ALL_MODULES = MODULE_ROOMS.flatMap((room) =>
  room.sections.flatMap((section) => section.modules.map((mod) => normalizeModule(mod, room, section)))
);

export const getModuleDef = (typeId) => ALL_MODULES.find((m) => m.id === typeId);

export const getRoom = (roomId) => MODULE_ROOMS.find((r) => r.id === roomId);

export const countRoomModules = (room) =>
  room.sections.reduce((sum, s) => sum + s.modules.length, 0);

// Bir modülün sahnedeki varsayılan taban yüksekliği (metre).
export const getDefaultY = (def) => {
  if (!def) return 0;
  if (typeof def.defaultY === 'number') return def.defaultY;
  return def.category === 'ust' ? 1.4 : 0;
};
