import React, { useState } from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { X, Download, Sparkles, AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// AI ile Çiz sonucu: solda 3D blockout, sağda fotogerçek çıktı.
export const AiRenderModal = () => {
  const {
    isAiRenderModalOpen,
    setIsAiRenderModalOpen,
    aiRender,
    triggerAiGeneration,
    isAiGenerating
  } = useStudio3D();
  const { showToast } = useApp();
  const [compare, setCompare] = useState('result');

  if (!isAiRenderModalOpen) return null;

  const { status, sourceImage, resultImage, model, provider, usage, error, code, attempts } = aiRender;
  const costLabel = typeof usage?.cost === 'number' ? `$${usage.cost.toFixed(3)}` : null;
  const shown = compare === 'source' ? sourceImage : resultImage || sourceImage;

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `dekorx-ai-render-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('AI render indirildi 🖼️');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Başlık */}
        <div className="p-4 bg-[#121212] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className={`w-5 h-5 text-[#FAD02C] ${status === 'loading' ? 'animate-spin' : ''}`} />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight">AI ile Çiz — Fotogerçek Render</p>
              <p className="text-[10px] text-gray-400 truncate">
                {status === 'loading' && 'Sahne verisi ve blockout görsel modele gönderildi…'}
                {status === 'done' && `${model}${provider ? ` · ${provider}` : ''}${costLabel ? ` · ${costLabel}` : ''}`}
                {status === 'error' && 'Render üretilemedi'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAiRenderModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Görsel alanı */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
            {shown && (
              <img
                src={shown}
                alt={compare === 'source' ? '3D blockout görüntüsü' : 'AI fotogerçek render'}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  status === 'loading' ? 'opacity-35' : 'opacity-100'
                }`}
              />
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full border-2 border-white/25 border-t-[#FAD02C] animate-spin" />
                <p className="text-xs font-bold">Ultra gerçekçi render üretiliyor…</p>
                <p className="text-[10px] text-white/60">Bu 10–30 saniye sürebilir</p>
              </div>
            )}

            {status === 'done' && (
              <div className="absolute top-3 left-3 flex gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                {[['result', 'AI Render'], ['source', '3D Blockout']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCompare(key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      compare === key ? 'bg-[#FAD02C] text-black' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hata paneli */}
          {status === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-extrabold text-xs">Render alınamadı</span>
                {code && <span className="text-[10px] font-mono bg-red-100 px-1.5 py-0.5 rounded">{code}</span>}
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">{error}</p>

              {(code === 'BILLING_REQUIRED' || code === 'CREDITS_DEPLETED') && (
                <a
                  href="https://ai.studio/projects"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-900 underline"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  AI Studio → Billing → kredi yükle
                </a>
              )}

              {attempts?.length > 0 && (
                <details className="text-[10px] text-red-700">
                  <summary className="cursor-pointer font-bold">Denenen modeller</summary>
                  <ul className="pt-1 space-y-0.5 font-mono">
                    {attempts.map((a) => (
                      <li key={a.model}>{a.model} → HTTP {a.status} / {a.code}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {status === 'done' && (
            <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-2xl p-3">
              Yerleşim, kamera açısı ve modül dizilimi 3D sahneden korunur; malzeme, ışık ve
              yansımalar fotogerçek hale getirilir. Ölçüler cm hassasiyetinde <strong>garanti
              değildir</strong> — teklif ve imalat için 3D sahnedeki değerler geçerlidir.
            </p>
          )}
        </div>

        {/* Alt aksiyonlar */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            onClick={triggerAiGeneration}
            disabled={isAiGenerating}
            className="h-12 px-4 rounded-2xl bg-white border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
            Yeniden Çiz
          </button>

          <button
            onClick={handleDownload}
            disabled={!resultImage}
            className="flex-1 h-12 px-4 rounded-2xl bg-[#FAD02C] hover:bg-[#e0b822] text-black text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-[#FAD02C]"
          >
            <Download className="w-4 h-4" />
            AI Render İndir (.PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
