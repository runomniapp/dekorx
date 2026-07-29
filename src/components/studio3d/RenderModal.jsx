import React, { useEffect, useState } from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { X, Download, Share2, Sparkles } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

export const RenderModal = () => {
  const {
    isRenderModalOpen,
    setIsRenderModalOpen,
    captureSceneImage,
    selectedDoorFinish,
    selectedCountertop,
    selectedFloorMaterial,
    pricingBreakdown
  } = useStudio3D();
  const { showToast } = useApp();

  const [snapshot, setSnapshot] = useState(null);
  const [captureFailed, setCaptureFailed] = useState(false);

  // Grab the live WebGL frame each time the modal opens
  useEffect(() => {
    if (!isRenderModalOpen) {
      setSnapshot(null);
      setCaptureFailed(false);
      return;
    }

    const shot = captureSceneImage(2);
    if (shot?.dataUrl) {
      setSnapshot(shot);
      setCaptureFailed(false);
    } else {
      setCaptureFailed(true);
    }
  }, [isRenderModalOpen, captureSceneImage]);

  if (!isRenderModalOpen) return null;

  const handleDownload = () => {
    if (!snapshot?.dataUrl) {
      showToast('Render alınamadı, lütfen tekrar deneyin.');
      return;
    }

    const link = document.createElement('a');
    link.href = snapshot.dataUrl;
    link.download = `dekorx-render-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    showToast('HD Render dosyanız indirildi! 📸');
    setTimeout(() => setIsRenderModalOpen(false), 900);
  };

  const handleShare = async () => {
    // Share the actual PNG when the platform supports file sharing
    if (snapshot?.dataUrl && navigator.canShare) {
      try {
        const blob = await (await fetch(snapshot.dataUrl)).blob();
        const file = new File([blob], 'dekorx-render.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'DekorX 3D Tasarımım' });
          return;
        }
      } catch (e) {
        // fall through to link sharing
      }
    }

    if (navigator.share) {
      navigator.share({
        title: 'DekorX 3D Modüler Tasarımım',
        text: 'Kendi hazırladığım 3D mobilya projesini inceleyin!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Bağlantı panoya kopyalandı 🔗');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#121212] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FAD02C]" />
            <span className="font-bold text-base">3D Anlık Render Snapshot</span>
          </div>
          <button
            onClick={() => setIsRenderModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Scene Snapshot */}
        <div className="p-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-gray-900 aspect-video">
            {snapshot?.dataUrl ? (
              <img
                src={snapshot.dataUrl}
                alt="3D sahne render görüntüsü"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/60 px-6 text-center">
                {captureFailed
                  ? 'Sahne görüntüsü alınamadı. Modalı kapatıp tekrar deneyin.'
                  : 'Sahne yakalanıyor…'}
              </div>
            )}
            {snapshot && (
              <>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white font-semibold border border-white/20">
                  {snapshot.width} × {snapshot.height} PNG
                </div>
                <div className="absolute bottom-3 right-3 bg-[#FAD02C] text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                  DekorX Verified
                </div>
              </>
            )}
          </div>

          {/* Specs Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-200">
            <div>
              <span className="text-gray-400 font-medium block">Kapak Kaplaması:</span>
              <span className="font-bold text-gray-900">{selectedDoorFinish?.name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Tezgah:</span>
              <span className="font-bold text-gray-900">{selectedCountertop?.name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Zemin:</span>
              <span className="font-bold text-gray-900">{selectedFloorMaterial?.name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Toplam Modül:</span>
              <span className="font-bold text-gray-900">{pricingBreakdown?.totalCabinetCount} adet</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={handleShare}
            className="h-12 px-4 rounded-2xl bg-white border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <Share2 className="w-4 h-4" />
            Paylaş
          </button>

          <TouchButton
            variant="yellow"
            fullWidth
            size="md"
            icon={Download}
            onClick={handleDownload}
          >
            HD Render İndir (.PNG)
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
