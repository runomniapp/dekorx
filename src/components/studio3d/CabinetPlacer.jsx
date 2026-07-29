import React, { useState } from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { AVAILABLE_MODULE_TYPES } from '../../utils/pricingEngine';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CabinetPlacer = () => {
  const [activeCategory, setActiveCategory] = useState('alt');
  const { addModule, autoCountertopEnabled, setAutoCountertopEnabled } = useStudio3D();
  const { showToast } = useApp();

  const categories = [
    { id: 'alt', name: 'Alt Modüller', icon: '🗄️' },
    { id: 'ust', name: 'Üst Modüller', icon: '🖼️' },
    { id: 'boy', name: 'Boy Üniteler', icon: '🕋' },
    { id: 'ada', name: 'Ada Mutfak', icon: '🏝️' }
  ];

  const filteredModules = AVAILABLE_MODULE_TYPES.filter((m) => m.category === activeCategory);

  return (
    <div className="bg-[#121820]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-3 sm:p-4 text-white shadow-2xl space-y-3">
      {/* Category Header Tabs - Mobile Friendly */}
      <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                activeCategory === cat.id
                  ? 'bg-[#FAD02C] text-black shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Auto Countertop Toggle */}
        <button
          onClick={() => {
            setAutoCountertopEnabled(!autoCountertopEnabled);
            showToast(autoCountertopEnabled ? 'Otomatik tezgah devreden çıkarıldı' : 'Otomatik tek parça tezgah aktif 🪄');
          }}
          className={`min-h-[44px] px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
            autoCountertopEnabled
              ? 'bg-blue-500/20 border-blue-400 text-blue-300'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">Otomatik Tezgah</span>
        </button>
      </div>

      {/* Pill Shape Module Chips - Tap to Add 1 Unit */}
      <div className="flex flex-wrap items-center gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
        {filteredModules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              addModule(mod.id);
              showToast(`${mod.name} eklendi (+1) 📦`);
            }}
            className="min-h-[48px] px-4 py-2 rounded-full bg-white/10 hover:bg-[#FAD02C] hover:text-black border border-white/15 transition-all cursor-pointer flex items-center gap-2.5 shadow-md active:scale-95 group text-left"
          >
            {/* Small Module Image Preview / Icon Badge */}
            <span className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-black/20 flex items-center justify-center text-sm shrink-0 shadow-inner">
              {mod.icon}
            </span>

            {/* Module Name Text */}
            <span className="font-extrabold text-xs tracking-tight whitespace-nowrap">
              {mod.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
