import React from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { Sun, Moon, Sparkles, Camera, RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ObjectControls = () => {
  const {
    lightingMode,
    setLightingMode,
    triggerAiGeneration,
    isAiGenerating,
    triggerRender,
    resetDesignState
  } = useStudio3D();

  const { showToast } = useApp();

  const handleReset = () => {
    if (window.confirm('Tüm tasarımı sıfırlayıp yeni bir projeye başlamak istediğinize emin misiniz?')) {
      resetDesignState();
      showToast('Tasarım sıfırlandı ve varsayılan projeye dönüldü 🔄');
    }
  };

  // Zoom In/Out controls via Canvas Camera dispatch
  const handleZoomIn = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.dispatchEvent(new CustomEvent('studio-camera-zoom-in'));
    }
    showToast('Kamera Yakınlaştırıldı 🔍');
  };

  const handleZoomOut = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.dispatchEvent(new CustomEvent('studio-camera-zoom-out'));
    }
    showToast('Kamera Uzaklaştırıldı 🔍');
  };

  const handleResetCamera = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.dispatchEvent(new CustomEvent('studio-camera-reset'));
    }
    showToast('Kamera Açısı Sıfırlandı 🎯');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#121820]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-2.5 sm:p-3 text-white shadow-2xl">
      {/* Left Action Buttons: Reset Project & Day/Night Mode */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={handleReset}
          className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 hover:bg-red-500/20 text-gray-200 hover:text-red-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10 active:scale-95"
          title="Tasarımı Sıfırla"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Sıfırla</span>
        </button>

        <button
          onClick={() => {
            const nextMode = lightingMode === 'day' ? 'night' : 'day';
            setLightingMode(nextMode);
            showToast(nextMode === 'day' ? 'Gündüz Işık Modu ☀️' : 'Gece Işık Modu 🌙');
          }}
          className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10 active:scale-95"
        >
          {lightingMode === 'day' ? (
            <>
              <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span className="hidden sm:inline">Gündüz</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">Gece</span>
            </>
          )}
        </button>
      </div>

      {/* Middle Action Buttons: ZOOM IN (+), ZOOM OUT (-), RESET CAMERA */}
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#FAD02C] hover:text-black flex items-center justify-center font-bold transition-all active:scale-95 text-white"
          title="Yakınlaştır (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#FAD02C] hover:text-black flex items-center justify-center font-bold transition-all active:scale-95 text-white"
          title="Uzaklaştır (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#FAD02C] hover:text-black flex items-center justify-center font-bold transition-all active:scale-95 text-white"
          title="Kamerayı Sıfırla"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Right Action Buttons: AI Concept Generation & Render Image Download */}
      <div className="flex items-center gap-2">
        <button
          onClick={triggerAiGeneration}
          disabled={isAiGenerating}
          className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 text-yellow-300 ${isAiGenerating ? 'animate-spin' : ''}`} />
          <span>{isAiGenerating ? 'AI Üretiyor...' : 'AI Renk Öner'}</span>
        </button>

        <button
          onClick={triggerRender}
          className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#FAD02C] hover:bg-[#e0b822] text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">4K Render İndir</span>
          <span className="sm:hidden">Render</span>
        </button>
      </div>
    </div>
  );
};
