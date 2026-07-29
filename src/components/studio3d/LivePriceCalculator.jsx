import React from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { FileText, Download, X, Layers, CheckCircle2 } from 'lucide-react';
import { generateArchitecturalPDFProposal } from '../../utils/pdfGenerator';
import { useApp } from '../../context/AppContext';

export const LivePriceCalculator = () => {
  const {
    pricingBreakdown,
    isBOMModalOpen,
    setIsBOMModalOpen,
    triggerRender
  } = useStudio3D();

  const { showToast } = useApp();

  const handleDownloadPDF = () => {
    // Capture 3D Canvas Snapshot URL
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
      clientName: 'Müşteri Özel Tasarımı',
      pricingBreakdown,
      renderSnapshotUrl: snapshotUrl
    });

    showToast('PDF İmalat Teklif Belgesi Hazırlandı! 📄');
  };

  return (
    <>
      {/* Floating Price Summary Card - Mobile & Desktop Responsive */}
      <div className="bg-[#121820]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-3.5 sm:p-4 text-white shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAD02C]/20 border border-[#FAD02C]/40 flex items-center justify-center text-[#FAD02C]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              Anlık Tahmini İmalat Tutarı
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#FAD02C] tracking-tight">
              {pricingBreakdown.formattedGrandTotal}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsBOMModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/10"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Metraj & Detay</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#FAD02C] hover:bg-[#e0b822] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>PDF Teklifi İndir</span>
          </button>
        </div>
      </div>

      {/* Bill of Materials (BOM) Modal */}
      {isBOMModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121820] text-white w-full max-w-2xl rounded-3xl border border-white/20 p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FAD02C]" />
                  <span>Detaylı Metraj ve İmalat Listesi</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Toplam {pricingBreakdown.totalCabinetCount} Modül • {pricingBreakdown.floorAreaSqm} m² Zemin
                </p>
              </div>
              <button
                onClick={() => setIsBOMModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Itemized List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar mb-4">
              {pricingBreakdown.itemizedList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-[#FAD02C]">#{item.itemNumber}</span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-gray-400 text-[11px]">
                      Ölçü: {item.dimensions} • Kapak: {item.finishName} {item.isOpenCorner && '• 📐 Kapaksız L Köşe'}
                    </div>
                  </div>
                  <div className="font-extrabold text-[#FAD02C] text-sm">
                    {item.formattedPrice}
                  </div>
                </div>
              ))}

              {/* Accessories & Assembly Rows */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Zemin Kaplaması ({pricingBreakdown.floorMaterial.name}):</span>
                  <span className="font-bold">₺{pricingBreakdown.floorCost.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tezgah İmalatı ({pricingBreakdown.totalCountertopLengthMeters}m):</span>
                  <span className="font-bold">₺{pricingBreakdown.countertopCost.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blum Frenli Ray/Menteşe & LED Aydınlatma:</span>
                  <span className="font-bold">₺{pricingBreakdown.accessoriesCost.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montaj, Nakliye & İşçilik (%12):</span>
                  <span className="font-bold">₺{pricingBreakdown.assemblyCost.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">GENEL TOPLAM</div>
                <div className="text-2xl font-black text-[#FAD02C]">
                  {pricingBreakdown.formattedGrandTotal}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsBOMModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs"
                >
                  Kapat
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2.5 rounded-2xl bg-[#FAD02C] text-black font-extrabold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
