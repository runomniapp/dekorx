import React, { useState } from 'react';
import { Download, MessageCircle, Send, CheckCircle2, FileText } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';
import { generateArchitecturalPDFProposal } from '../../utils/pdfGenerator';
import { useStudio3D } from '../../context/Studio3DContext';

export const StepContact = ({ quoteData, setQuoteData, onSubmit }) => {
  const [submitted, setSubmitted] = useState(false);
  const { pricingBreakdown } = useStudio3D();

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setQuoteData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleDownloadPDF = (e) => {
    e.preventDefault();
    if (!quoteData.name || !quoteData.phone) {
      alert('Lütfen ad soyad ve telefon numaranızı giriniz.');
      return;
    }

    let snapshotUrl = null;
    const canvasEl = document.querySelector('canvas');
    if (canvasEl) {
      try {
        snapshotUrl = canvasEl.toDataURL('image/png');
      } catch (err) {
        console.error('Canvas snapshot error:', err);
      }
    }

    generateArchitecturalPDFProposal({
      clientName: quoteData.name,
      clientPhone: quoteData.phone,
      clientAddress: `${quoteData.city || 'İstanbul'} - ${quoteData.notes || ''}`,
      pricingBreakdown,
      renderSnapshotUrl: snapshotUrl
    });

    setSubmitted(true);
  };

  const handleWhatsAppSend = () => {
    const msg = `Merhaba DekorX,%0A%0AProje Teklifi Almak İstiyorum.%0A*Müşteri:* ${quoteData.name}%0A*Telefon:* ${quoteData.phone}%0A*Şehir:* ${quoteData.city || 'İstanbul'}%0A*Mekan Tipi:* ${quoteData.roomType}%0A*Seçilen Stil:* ${quoteData.style}%0A*Tahmini Bütçe:* ${quoteData.budget}%0A*Anlık 3D Tasarım Tutarı:* ${pricingBreakdown.formattedGrandTotal}`;
    window.open(`https://wa.me/905001234567?text=${msg}`, '_blank');
  };

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-white">Teklifiniz & PDF Raporunuz Hazır!</h3>
        <p className="text-sm text-gray-300 max-w-md mx-auto">
          3D Tasarım görseliniz, tüm modül detaylarınız ve toplam bütçe dökümünüz PDF dosyası olarak bilgisayarınıza indirildi.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={handleDownloadPDF}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20"
          >
            <Download className="w-4 h-4 text-[#FAD02C]" />
            <span>PDF'yi Tekrar İndir</span>
          </button>
          <button
            onClick={handleWhatsAppSend}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp ile Mimara Gönder</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleDownloadPDF} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">Adınız Soyadınız *</label>
        <input
          type="text"
          required
          placeholder="Ahmet Yılmaz"
          value={quoteData.name || ''}
          onChange={(e) => setQuoteData({ ...quoteData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#FAD02C] outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-300 mb-1.5">Telefon Numarası *</label>
        <input
          type="tel"
          required
          placeholder="(5XX) XXX-XX-XX"
          value={quoteData.phone || ''}
          onChange={handlePhoneChange}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#FAD02C] outline-none font-bold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1.5">Şehir</label>
          <input
            type="text"
            placeholder="İstanbul"
            value={quoteData.city || ''}
            onChange={(e) => setQuoteData({ ...quoteData, city: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#FAD02C] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1.5">İlçe / Adres</label>
          <input
            type="text"
            placeholder="Kadıköy"
            value={quoteData.notes || ''}
            onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#FAD02C] outline-none"
          />
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
        <div>
          <div className="text-gray-400 font-semibold">Anlık 3D İmalat Teklif Tutarı</div>
          <div className="text-lg font-black text-[#FAD02C]">{pricingBreakdown.formattedGrandTotal}</div>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          {pricingBreakdown.totalCabinetCount} Modül + 3D Render
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#FAD02C] hover:bg-[#e0b822] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
        >
          <FileText className="w-4 h-4" />
          <span>Nihai Tasarımı & PDF Teklifini İndir</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsAppSend}
          className="w-full py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp ile Mimara Anında Gönder</span>
        </button>
      </div>
    </form>
  );
};
