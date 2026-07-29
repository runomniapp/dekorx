import React from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { Box, Home, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PresetRooms = () => {
  const { activeRoomPreset, setActiveRoomPreset } = useStudio3D();
  const { showToast } = useApp();

  const presets = [
    { id: 'kitchen', name: 'Mutfak Projesi', icon: '🍳', count: '14 Modül' },
    { id: 'villa', name: 'Lüks Villa', icon: '🏡', count: '28 Modül' },
    { id: 'wardrobe', name: 'Gardırop Odası', icon: '👔', count: '10 Modül' },
    { id: 'bathroom', name: 'Banyo Konsepti', icon: '🛁', count: '8 Modül' }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => {
            setActiveRoomPreset(preset.id);
            showToast(`${preset.name} 3D sahneye yüklendi!`);
          }}
          className={`shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 ${
            activeRoomPreset === preset.id
              ? 'bg-[#121212] text-white border-[#121212] shadow-md scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-base">{preset.icon}</span>
          <div className="text-left">
            <span className="block leading-none">{preset.name}</span>
            <span className="text-[9px] opacity-70 font-normal">{preset.count}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
