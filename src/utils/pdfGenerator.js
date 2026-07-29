// Professional Printable Architectural Proposal & PDF Report Generator

export function generateArchitecturalPDFProposal({
  clientName = 'Değerli Müşterimiz',
  clientPhone = '',
  clientAddress = '',
  pricingBreakdown,
  renderSnapshotUrl = null
}) {
  const proposalDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const proposalId = `DKX-TEK-${Math.floor(100000 + Math.random() * 900000)}`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen PDF çıktısı almak için tarayıcı açılır pencerelerine (pop-up) izin veriniz.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>DekorX - Mimari İmalat Teklifi #${proposalId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    body {
      background-color: #ffffff;
      color: #1a202c;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #FAD02C;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .logo-title {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }

    .logo-subtitle {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .meta-box {
      text-align: right;
    }

    .meta-id {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }

    .meta-date {
      font-size: 12px;
      color: #6b7280;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      border-left: 4px solid #FAD02C;
      padding-left: 10px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .info-label {
      color: #64748b;
      font-weight: 600;
    }

    .info-val {
      font-weight: 700;
      color: #0f172a;
    }

    .snapshot-container {
      margin-bottom: 25px;
      text-align: center;
      background: #0f172a;
      border-radius: 16px;
      padding: 15px;
    }

    .snapshot-img {
      max-width: 100%;
      max-height: 340px;
      border-radius: 10px;
      object-fit: contain;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }

    th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .totals-card {
      background: #0f172a;
      color: #ffffff;
      border-radius: 16px;
      padding: 20px;
      margin-top: 20px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: 22px;
      font-weight: 800;
      color: #FAD02C;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #FAD02C;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-title">DEKORX</div>
      <div class="logo-subtitle">MİMARİ TASARIM & ÖZEL İMALAT TEKLİFİ</div>
    </div>
    <div class="meta-box">
      <div class="meta-id">${proposalId}</div>
      <div class="meta-date">Tarih: ${proposalDate}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <div class="section-title">Müşteri Bilgileri</div>
      <div class="info-row"><span class="info-label">Adı Soyadı:</span><span class="info-val">${clientName}</span></div>
      <div class="info-row"><span class="info-label">Telefon:</span><span class="info-val">${clientPhone || 'Belirtilmedi'}</span></div>
      <div class="info-row"><span class="info-label">Adres / Şehir:</span><span class="info-val">${clientAddress || 'İstanbul'}</span></div>
    </div>

    <div class="info-card">
      <div class="section-title">Proje & Mekan Detayları</div>
      <div class="info-row"><span class="info-label">Mekan Alanı:</span><span class="info-val">${pricingBreakdown.floorAreaSqm} m²</span></div>
      <div class="info-row"><span class="info-label">Zemin Kaplaması:</span><span class="info-val">${pricingBreakdown.floorMaterial.name}</span></div>
      <div class="info-row"><span class="info-label">Kapak Rengi/Lake:</span><span class="info-val">${pricingBreakdown.doorFinish.name}</span></div>
      <div class="info-row"><span class="info-label">Tezgah Malzemesi:</span><span class="info-val">${pricingBreakdown.countertop.name} (${pricingBreakdown.totalCountertopLengthMeters} metre)</span></div>
    </div>
  </div>

  ${
    renderSnapshotUrl
      ? `
  <div class="section-title">3D Görsel Tasarım Render Çıktısı</div>
  <div class="snapshot-container">
    <img src="${renderSnapshotUrl}" class="snapshot-img" alt="3D Görsel Render" />
  </div>
  `
      : ''
  }

  <div class="section-title">Detaylı Modül ve Ürün Fiyat Listesi</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Modül Adı</th>
        <th>Ölçüler (G x Y x D)</th>
        <th>Kapak & Malzeme</th>
        <th>Özellik</th>
        <th style="text-align: right;">Birim Fiyat</th>
      </tr>
    </thead>
    <tbody>
      ${pricingBreakdown.itemizedList
        .map(
          (item) => `
        <tr>
          <td><b>${item.itemNumber}</b></td>
          <td><b>${item.name}</b></td>
          <td>${item.dimensions}</td>
          <td>${item.finishName}</td>
          <td>${item.isOpenCorner ? '📐 Kapaksız L Köşe' : item.hasGlass ? '🖼️ Camlı Kapak' : '🗳️ Standart Kapak'}</td>
          <td style="text-align: right; font-weight: 700;">${item.formattedPrice}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals-card">
    <div class="section-title" style="color: #FAD02C; border-color: #FAD02C;">Maliyet & Genel Toplam Özeti</div>
    <div class="totals-row"><span>Zemin Kaplama Toplamı:</span><span>₺${pricingBreakdown.floorCost.toLocaleString('tr-TR')}</span></div>
    <div class="totals-row"><span>Dolap Modülleri Toplamı (${pricingBreakdown.totalCabinetCount} Adet):</span><span>₺${(pricingBreakdown.baseCabinetsCost + pricingBreakdown.wallCabinetsCost + pricingBreakdown.tallCabinetsCost + pricingBreakdown.islandCabinetsCost).toLocaleString('tr-TR')}</span></div>
    <div class="totals-row"><span>Otomatik Tezgah İmalatı (${pricingBreakdown.totalCountertopLengthMeters}m):</span><span>₺${pricingBreakdown.countertopCost.toLocaleString('tr-TR')}</span></div>
    <div class="totals-row"><span>Blum Frenli Aksesuar & LED Aydınlatma:</span><span>₺${pricingBreakdown.accessoriesCost.toLocaleString('tr-TR')}</span></div>
    <div class="totals-row"><span>Nakliye, Montaj & İşçilik (%12):</span><span>₺${pricingBreakdown.assemblyCost.toLocaleString('tr-TR')}</span></div>

    <div class="grand-total">
      <span>GENEL TOPLAM (KDV Dahil):</span>
      <span>${pricingBreakdown.formattedGrandTotal}</span>
    </div>
  </div>

  <div class="footer">
    DekorX İç Mimarlık ve Mobilya San. Tic. A.Ş. • Bu teklif belgesi 30 gün boyunca geçerlidir. • WhatsApp: 0500 123 45 67
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
