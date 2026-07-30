// GÖRSEL KAYDETME / PAYLAŞMA
//
// Mobil tarayıcılar (özellikle iOS Safari) büyük `data:` URL'lerinde <a download>
// niteliğini yok sayar; bağlantıya tıklanır, hiçbir şey inmez. Bu yüzden:
//   1. data URL → Blob → object URL'e çevrilir,
//   2. mümkünse Web Share API ile dosya olarak paylaşılır (iOS'te "Fotoğraflara
//      Kaydet" seçeneğini verir),
//   3. olmazsa object URL ile klasik indirmeye, en son da yeni sekmede açmaya düşer.
//
// Dosya, görsel hazır olur olmaz ÖNCEDEN üretilmelidir: Safari, `await`
// sonrasında kullanıcı hareketini (gesture) geçersiz sayıp paylaşımı reddeder.

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const extFromMime = (mime) => {
  if (!mime) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return 'png';
};

// data URL'i paylaşılabilir/indirilebilir bir pakete çevirir.
export const prepareImageFile = async (dataUrl, baseName = 'dekorx-render') => {
  if (!dataUrl) return null;

  const blob = await (await fetch(dataUrl)).blob();
  const name = `${baseName}-${Date.now()}.${extFromMime(blob.type)}`;
  const objectUrl = URL.createObjectURL(blob);

  let file = null;
  try {
    file = new File([blob], name, { type: blob.type || 'image/png' });
  } catch {
    // File yapıcısı yoksa yalnızca indirme yolu kullanılır
  }

  return { blob, file, objectUrl, name };
};

export const releaseImageFile = (payload) => {
  if (payload?.objectUrl) URL.revokeObjectURL(payload.objectUrl);
};

// 'shared' | 'cancelled' | 'downloaded' | 'opened' | 'failed'
export const saveImageFile = async (payload) => {
  if (!payload) return 'failed';
  const { file, objectUrl, name } = payload;

  // 1) Native paylaşım sayfası: mobilde en güvenilir kaydetme yolu
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
      // paylaşım reddedildi → indirmeye düş
    }
  }

  // 2) Klasik indirme
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // 3) iOS'te download niteliği yok sayılır: kullanıcı basılı tutup
    // "Fotoğraflara Ekle" yapabilsin diye görseli yeni sekmede açarız
    if (isIOS()) {
      window.open(objectUrl, '_blank');
      return 'opened';
    }
    return 'downloaded';
  } catch {
    return 'failed';
  }
};
