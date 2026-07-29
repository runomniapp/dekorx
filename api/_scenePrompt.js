// Sahne manifestini ultra gerçekçi render promptuna çevirir.
// Amaç: modelin GEOMETRİYE DOKUNMAMASI, sadece malzeme/ışık/optik katmanını
// fotogerçek hale getirmesi. Bu yüzden prompt hem sayısal yerleşim listesini
// hem de sert "değiştirme" yasaklarını içerir.

const CATEGORY_LABELS = {
  alt: 'alt dolap (tezgah altı)',
  ust: 'duvara monte üst dolap',
  boy: 'boy / kolon dolap',
  ada: 'ada ünitesi',
  vitrifiye: 'vitrifiye / ıslak hacim elemanı',
  aksesuar: 'aksesuar / armatür'
};

const fmt = (n) => Math.round(n * 100);

const describeModules = (modules) =>
  modules
    .map((m, i) => {
      const rot = Math.round(((m.rotationY || 0) * 180) / Math.PI) % 360;
      const parts = [
        `${i + 1}. ${m.name}`,
        `tip: ${CATEGORY_LABELS[m.category] || m.category}`,
        `ölçü ${fmt(m.width)}×${fmt(m.height)}×${fmt(m.depth)} cm (G×Y×D)`,
        `konum X=${m.position[0].toFixed(2)}m Z=${m.position[2].toFixed(2)}m`,
        `taban yüksekliği ${fmt(m.position[1])} cm`,
        `dönüş ${rot}°`
      ];
      if (m.finishName) parts.push(`kapak: ${m.finishName}`);
      if (m.hasGlassDoor) parts.push('camlı kapak');
      return parts.join(' | ');
    })
    .join('\n');

export const buildRenderPrompt = (scene) => {
  const { room, modules = [], materials = {}, lighting = 'day', style = 'photoreal', aspectRatio } = scene;

  const lightingBrief =
    lighting === 'night'
      ? 'Gece sahnesi: sıcak 2700K gömme spotlar, tezgah altı LED şeritler, dolap içi vitrin aydınlatması, pencereden gelen mavi alacakaranlık dolgu ışığı, kontrollü sıcak-soğuk kontrast.'
      : 'Gündüz sahnesi: büyük bir pencereden gelen yumuşak difüz gün ışığı, nazik yönlü gölgeler, nötr 5600K beyaz dengesi, hafif ambient occlusion.';

  const styleBrief =
    style === 'sketch'
      ? 'Stil: temiz mimari eskiz / elle çizim hissi, ince kontur çizgileri, suluboya benzeri hafif renk yıkaması.'
      : 'Stil: ultra fotogerçekçi mimari iç mekân fotoğrafı. Tam kare 35 mm objektif hissi, f/8 derinlik, fiziksel doğru global illumination, gerçekçi mikro-pürüzlülük, malzemeye özgü anizotropik yansımalar, temiz beyaz dengesi, ticari mobilya kataloğu kalitesi. Grenli/yapay HDR görünüm yok.';

  return `Sen bir mimari görselleştirme uzmanısın. Sana verilen görüntü, bir 3D mutfak/mobilya planlayıcısından alınmış BASİT KÜTLE (blockout) render'ıdır. Görevin bu blockout'u, yerleşimi birebir koruyarak ultra gerçekçi bir fotoğrafa dönüştürmek.

MUTLAK KURALLAR — bunlara uymazsan çıktı reddedilir:
1. Kamera açısını, perspektifi ve kadrajı BİREBİR koru. Yeniden çerçeveleme, yakınlaştırma, döndürme yok.
2. Her modülün konumunu, genişlik/yükseklik/derinlik oranlarını ve birbirine göre hizasını koru. Dolap ekleme, çıkarma, kaydırma, yeniden boyutlandırma YAPMA.
3. Modül sayısı ve dizilimi girdideki ile aynı kalmalı. Aşağıdaki listede olmayan hiçbir mobilya, ada, sandalye, bitki, avize veya dekor nesnesi ekleme.
4. Oda kabuğunu koru: duvar konumları, zemin alanı, tavan yüksekliği aynı. Duvarlara pencere, kapı, kolon veya niş EKLEMEK kesinlikle yasak — duvarlar sağır kalmalı. Sahneyi aydınlatan ışık kaynağı kadrajın DIŞINDA kalmalı.
5. Görüntüye yazı, ölçü çizgisi, filigran, logo veya arayüz elemanı EKLEME. Girdideki ızgara/seçim çerçevesi gibi yardımcı çizgiler varsa onları temizle.
6. Çıktı en-boy oranı girdiyle aynı olmalı${aspectRatio ? ` (${aspectRatio})` : ''}. Kenarlardan kırpma veya tuval genişletme yok.

SADECE ŞUNLARI İYİLEŞTİR: malzeme dokuları ve gerçekçiliği, ışık ve gölge kalitesi, yansıma/kırılma, kenar pahları ve derz detayları, kulp ve menteşe metalik detayları, zemin dokusu, yüzey kusurlarının doğallığı, atmosferik derinlik.

ODA: ${fmt(room.width)} cm genişlik × ${fmt(room.length)} cm derinlik × ${fmt(room.height)} cm yükseklik (${(room.width * room.length).toFixed(1)} m²). Koordinat sistemi odanın merkezinde, X sağa, Z öne doğru artar.

MALZEMELER:
- Dolap kapakları: ${materials.doorFinish || 'mat lake beyaz'}
- Tezgah: ${materials.countertop || 'beyaz kuvars'}
- Zemin: ${materials.floor || 'doğal meşe parke'}
- Duvarlar: kırık beyaz mat boya
- Metal aksesuarlar: fırçalanmış pirinç kulplar

IŞIK: ${lightingBrief}

${styleBrief}

SAHNEDEKİ ${modules.length} MODÜL (yerleşim referansı — bu listeye harfiyen uy):
${describeModules(modules)}

Çıktı: tek bir ultra gerçekçi iç mekân fotoğrafı. Girdi geometrisine %100 sadık kal.`;
};
