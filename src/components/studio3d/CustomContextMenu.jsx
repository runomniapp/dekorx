import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useStudio3D, DOOR_MODEL_STYLES } from '../../context/Studio3DContext';
import { CABINET_DOOR_FINISHES, AVAILABLE_MODULE_TYPES } from '../../utils/pricingEngine';
import {
  RotateCw,
  Trash2,
  Copy,
  Layers,
  Palette,
  SlidersHorizontal,
  ArrowUp,
  Maximize2,
  X,
  Check,
  LayoutGrid,
  AlignLeft,
  AlignRight,
  AlignCenter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CustomContextMenu = () => {
  const {
    contextMenu,
    setContextMenu,
    placedModules,
    rotateModule,
    removeModule,
    duplicateModule,
    toggleGlassDoor,
    changeModuleType,
    changeModuleDimensions,
    setIndividualDoorFinish,
    setModuleHandlePosition,
    setModuleDoorStyle,
    applyFinishToAll,
    elevateModule
  } = useStudio3D();

  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'type' | 'size' | 'color' | 'door_style' | 'handle'

  const menuRef = useRef(null);
  // Menü ölçülene kadar gizli tutulur, sonra ekran içine sığacak şekilde konumlanır
  const [layout, setLayout] = useState({ left: 0, top: 0, maxHeight: 0, ready: false });

  // Yeni modülde menü ana sekmeye dönsün
  useEffect(() => {
    if (contextMenu) setActiveTab('menu');
  }, [contextMenu?.moduleId]);

  // Esc ile kapat
  useEffect(() => {
    if (!contextMenu) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setContextMenu(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contextMenu, setContextMenu]);

  // Menüyü her zaman görünür alanın içine sıkıştır (mobilde ekran dışına taşmasın)
  useLayoutEffect(() => {
    if (!contextMenu) {
      setLayout((l) => (l.ready ? { ...l, ready: false } : l));
      return undefined;
    }

    const place = () => {
      const el = menuRef.current;
      if (!el) return;

      const MARGIN = 10;
      const vw = window.visualViewport?.width || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      const maxHeight = Math.max(200, vh - MARGIN * 2);

      const rect = el.getBoundingClientRect();
      const w = rect.width || 288;
      const h = Math.min(rect.height || 320, maxHeight);

      // Sağa/aşağı sığmıyorsa dokunma noktasının diğer tarafına aç, sonra kırp
      let left = contextMenu.x;
      if (left + w + MARGIN > vw) left = contextMenu.x - w;
      left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - w - MARGIN));

      let top = contextMenu.y;
      if (top + h + MARGIN > vh) top = contextMenu.y - h;
      top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - h - MARGIN));

      setLayout({ left, top, maxHeight, ready: true });
    };

    place();
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
    };
    // activeTab menü yüksekliğini değiştirir, yeniden konumlanmalı
  }, [contextMenu, activeTab]);

  if (!contextMenu) return null;

  const targetModule = placedModules.find((m) => m.id === contextMenu.moduleId);
  if (!targetModule) return null;

  const currentDef = AVAILABLE_MODULE_TYPES.find((d) => d.id === targetModule.typeId);
  const modWidthCm = Math.round((targetModule.customWidth || currentDef?.width || 0.6) * 100);
  const modHeightCm = Math.round((targetModule.customHeight || currentDef?.height || 0.85) * 100);
  const modDepthCm = Math.round((targetModule.customDepth || currentDef?.depth || 0.6) * 100);

  return (
    <>
      {/* Boş bir yere dokunmak menüyü kapatır */}
      <div
        className="fixed inset-0 z-40"
        onPointerDown={() => setContextMenu(null)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
      />

      <div
        ref={menuRef}
        style={{
          left: `${layout.left}px`,
          top: `${layout.top}px`,
          maxHeight: layout.maxHeight ? `${layout.maxHeight}px` : undefined,
          visibility: layout.ready ? 'visible' : 'hidden'
        }}
        className="fixed z-50 w-72 max-w-[calc(100vw-20px)] bg-[#121212] text-white rounded-3xl shadow-2xl border border-white/20 p-3 text-xs animate-in zoom-in-95 duration-150 select-none pointer-events-auto flex flex-col overflow-hidden"
      >
      {/* Header title */}
      <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between font-bold text-gray-400 shrink-0">
        <span className="truncate">Modül #{targetModule.id}</span>
        <button
          onClick={() => setContextMenu(null)}
          aria-label="Menüyü kapat"
          className="w-7 h-7 -mr-1 rounded-lg hover:bg-white/10 hover:text-white flex items-center justify-center shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Actions Menu */}
      {activeTab === 'menu' && (
        <div className="py-1 space-y-0.5 flex-1 overflow-y-auto no-scrollbar">
          {/* Rotate 90 */}
          <button
            onClick={() => {
              rotateModule(targetModule.id);
              showToast('Modül 90° döndürüldü 🔄');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left font-semibold text-gray-200"
          >
            <RotateCw className="w-4 h-4 text-[#FAD02C]" />
            <span>90° Döndür</span>
          </button>

          {/* Custom Width, Height & Depth Dimensions */}
          <button
            onClick={() => setActiveTab('size')}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-left font-semibold text-gray-200"
          >
            <div className="flex items-center gap-2.5">
              <Maximize2 className="w-4 h-4 text-[#FAD02C]" />
              <span>Genişlik, Yükseklik & Derinlik</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold">
              {modWidthCm}x{modHeightCm}x{modDepthCm}
            </span>
          </button>

          {/* Door Style Model Picker (Referans Resimler) */}
          <button
            onClick={() => setActiveTab('door_style')}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-left font-semibold text-gray-200"
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-emerald-400" />
              <span>3D Kapak Modeli Seçin</span>
            </div>
          </button>

          {/* Handle Position Picker */}
          <button
            onClick={() => setActiveTab('handle')}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-left font-semibold text-gray-200"
          >
            <div className="flex items-center gap-2.5">
              <AlignRight className="w-4 h-4 text-amber-400" />
              <span>Kulp Konumu (Sağ / Sol)</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              {targetModule.handlePosition || 'Sağ'}
            </span>
          </button>

          {/* Switch Module Type */}
          <button
            onClick={() => setActiveTab('type')}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-left font-semibold text-gray-200"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <span>Modül Türünü Değiştir</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold truncate max-w-[70px]">
              {currentDef?.name}
            </span>
          </button>

          {/* Color & Material Coating */}
          <button
            onClick={() => setActiveTab('color')}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-left font-semibold text-gray-200"
          >
            <div className="flex items-center gap-2.5">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Renk / Kaplama Malzemesi</span>
            </div>
          </button>

          {/* Toggle Glass/Solid Door */}
          <button
            onClick={() => {
              toggleGlassDoor(targetModule.id);
              showToast(targetModule.hasGlassDoor ? 'Camsız kapak seçildi' : 'Camlı kapak aktif edildi 🖼️');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left font-semibold text-gray-200"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>{targetModule.hasGlassDoor ? 'Camsız Kapak Yap' : 'Camlı Kapak Yap'}</span>
          </button>

          {/* Elevate Y Position */}
          <button
            onClick={() => {
              elevateModule(targetModule.id);
              showToast('Yüksekliği değiştirildi ⬆️');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left font-semibold text-gray-200 border-t border-white/10"
          >
            <ArrowUp className="w-4 h-4 text-sky-400" />
            <span>Yükseklik Değiştir (Y)</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => {
              duplicateModule(targetModule.id);
              showToast('Modül çoğaltıldı 📋');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left font-semibold text-gray-200"
          >
            <Copy className="w-4 h-4 text-amber-400" />
            <span>Modülü Çoğalt</span>
          </button>

          {/* Delete (Klavyeden Delete Tuşu Desteği) */}
          <button
            onClick={() => {
              removeModule(targetModule.id);
              showToast('Modül silindi (Delete) 🗑️');
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center justify-between text-left font-semibold"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4" />
              <span>Sil (Delete Tuşu)</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] bg-red-500/20 text-red-300 rounded font-mono">DEL</kbd>
          </button>
        </div>
      )}

      {/* Sub-View: 3D Door Model Style Picker (Resimlerdeki Kapak Modelleri) */}
      {activeTab === 'door_style' && (
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>Kapak Tasarım Modelini Seçin</span>
            <button onClick={() => setActiveTab('menu')} className="text-white hover:underline">
              Geri
            </button>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto no-scrollbar">
            {DOOR_MODEL_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setModuleDoorStyle(targetModule.id, style.id);
                  showToast(`${style.name} 3D modele uygulandı! 🏛️`);
                  setContextMenu(null);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  targetModule.doorStyle === style.id
                    ? 'border-[#FAD02C] bg-white/20 text-white'
                    : 'border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{style.icon}</span>
                  <span className="font-bold text-[11px]">{style.name}</span>
                </div>
                {targetModule.doorStyle === style.id && <Check className="w-4 h-4 text-[#FAD02C]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-View: Handle Position Picker (Sağ / Sol Kulp) */}
      {activeTab === 'handle' && (
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>Kulp Konumunu Seçin</span>
            <button onClick={() => setActiveTab('menu')} className="text-white hover:underline">
              Geri
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              onClick={() => {
                setModuleHandlePosition(targetModule.id, 'left');
                showToast('Kulp Sol Tarafa Alındı ⬅️');
                setContextMenu(null);
              }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                targetModule.handlePosition === 'left'
                  ? 'border-[#FAD02C] bg-[#FAD02C]/20 text-[#FAD02C]'
                  : 'border-white/10 hover:bg-white/10 text-gray-300'
              }`}
            >
              <AlignLeft className="w-5 h-5" />
              <span>Sol Kulp</span>
            </button>

            <button
              onClick={() => {
                setModuleHandlePosition(targetModule.id, 'right');
                showToast('Kulp Sağ Tarafa Alındı ➡️');
                setContextMenu(null);
              }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                targetModule.handlePosition === 'right' || !targetModule.handlePosition
                  ? 'border-[#FAD02C] bg-[#FAD02C]/20 text-[#FAD02C]'
                  : 'border-white/10 hover:bg-white/10 text-gray-300'
              }`}
            >
              <AlignRight className="w-5 h-5" />
              <span>Sağ Kulp</span>
            </button>

            <button
              onClick={() => {
                setModuleHandlePosition(targetModule.id, 'center');
                showToast('Orta / Çift Kulp Takıldı ↔️');
                setContextMenu(null);
              }}
              className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                targetModule.handlePosition === 'center'
                  ? 'border-[#FAD02C] bg-[#FAD02C]/20 text-[#FAD02C]'
                  : 'border-white/10 hover:bg-white/10 text-gray-300'
              }`}
            >
              <AlignCenter className="w-5 h-5" />
              <span>Çift Kulp</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-View: Custom Width, Height & Depth Sliders & Direct Inputs */}
      {activeTab === 'size' && (
        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>Ölçü Değerlerini Girin (cm)</span>
            <button onClick={() => setActiveTab('menu')} className="text-white hover:underline font-bold">
              Geri
            </button>
          </div>

          <div className="space-y-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                <span className="text-gray-300">Genişlik (G)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="15"
                    max="240"
                    value={modWidthCm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) changeModuleDimensions(targetModule.id, val / 100, undefined, undefined);
                    }}
                    className="w-14 h-6 px-1.5 rounded-md bg-[#121212] border border-[#FAD02C] text-[#FAD02C] text-right font-extrabold text-xs outline-none"
                  />
                  <span className="text-gray-400">cm</span>
                </div>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="1"
                value={modWidthCm}
                onChange={(e) => changeModuleDimensions(targetModule.id, Number(e.target.value) / 100, undefined, undefined)}
                className="w-full accent-[#FAD02C] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                <span className="text-gray-300">Yükseklik (Y)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="30"
                    max="260"
                    value={modHeightCm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) changeModuleDimensions(targetModule.id, undefined, val / 100, undefined);
                    }}
                    className="w-14 h-6 px-1.5 rounded-md bg-[#121212] border border-[#FAD02C] text-[#FAD02C] text-right font-extrabold text-xs outline-none"
                  />
                  <span className="text-gray-400">cm</span>
                </div>
              </div>
              <input
                type="range"
                min="30"
                max="260"
                step="1"
                value={modHeightCm}
                onChange={(e) => changeModuleDimensions(targetModule.id, undefined, Number(e.target.value) / 100, undefined)}
                className="w-full accent-[#FAD02C] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                <span className="text-gray-300">Derinlik (D)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={modDepthCm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) changeModuleDimensions(targetModule.id, undefined, undefined, val / 100);
                    }}
                    className="w-14 h-6 px-1.5 rounded-md bg-[#121212] border border-[#FAD02C] text-[#FAD02C] text-right font-extrabold text-xs outline-none"
                  />
                  <span className="text-gray-400">cm</span>
                </div>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="1"
                value={modDepthCm}
                onChange={(e) => changeModuleDimensions(targetModule.id, undefined, undefined, Number(e.target.value) / 100)}
                className="w-full accent-[#FAD02C] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-View: Module Type Switcher */}
      {activeTab === 'type' && (
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>Yeni Tür Seçin</span>
            <button onClick={() => setActiveTab('menu')} className="text-white hover:underline">
              Geri
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
            {AVAILABLE_MODULE_TYPES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  changeModuleType(targetModule.id, mod.id);
                  showToast(`Modül ${mod.name} yapıldı! 📦`);
                  setContextMenu(null);
                }}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                  targetModule.typeId === mod.id
                    ? 'border-[#FAD02C] bg-white/20 text-white'
                    : 'border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{mod.icon}</span>
                  <span className="font-bold text-[11px]">{mod.name}</span>
                </div>
                {targetModule.typeId === mod.id && <Check className="w-3.5 h-3.5 text-[#FAD02C]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-View: Individual vs All Color Swatches Picker */}
      {activeTab === 'color' && (
        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
            <span>Kapak Rengi Seçin</span>
            <button onClick={() => setActiveTab('menu')} className="text-white hover:underline">
              Geri
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {CABINET_DOOR_FINISHES.map((finish) => (
              <div
                key={finish.id}
                className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/40"
                    style={{ backgroundColor: finish.color }}
                  />
                  <span className="font-semibold text-[11px] text-gray-200">{finish.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIndividualDoorFinish(targetModule.id, finish.id);
                      showToast(`Sadece bu modül ${finish.name} yapıldı!`);
                      setContextMenu(null);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[9px] font-bold text-white"
                  >
                    Bu Modül
                  </button>
                  <button
                    onClick={() => {
                      applyFinishToAll(finish.id);
                      showToast(`Tüm dolaplar ${finish.name} yapıldı! ✨`);
                      setContextMenu(null);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[#FAD02C] text-black text-[9px] font-bold"
                  >
                    Tüm Dolaplar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Mobilde net bir çıkış: menüyü kapat */}
        <button
          onClick={() => setContextMenu(null)}
          className="mt-2 shrink-0 w-full min-h-[40px] rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-white/10 active:scale-[0.98] transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Kapat
        </button>
      </div>
    </>
  );
};
