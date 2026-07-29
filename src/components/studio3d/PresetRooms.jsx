import React from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { MODULE_ROOMS, countRoomModules } from '../../utils/moduleCatalog';
import { useApp } from '../../context/AppContext';

// Üst bardaki modül kategorisi seçici. Seçilen kategori, sol paneldeki
// modül yerleştiriciyi (CabinetPlacer) besler.
export const PresetRooms = () => {
  const { activeRoomId, setActiveRoomId } = useStudio3D();
  const { showToast } = useApp();

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 max-w-full">
      {MODULE_ROOMS.map((room) => {
        const isActive = activeRoomId === room.id;
        return (
          <button
            key={room.id}
            onClick={() => {
              setActiveRoomId(room.id);
              showToast(`${room.name} modülleri yüklendi`);
            }}
            className={`shrink-0 pl-2.5 pr-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 active:scale-95 ${
              isActive
                ? 'bg-[#121212] text-white border-[#121212] shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                isActive ? 'bg-[#FAD02C]/20' : 'bg-gray-100'
              }`}
            >
              {room.icon}
            </span>
            <span className="text-left leading-tight">
              <span className="block whitespace-nowrap">{room.name}</span>
              <span className={`text-[9px] font-semibold ${isActive ? 'text-[#FAD02C]' : 'text-gray-400'}`}>
                {countRoomModules(room)} Modül
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
