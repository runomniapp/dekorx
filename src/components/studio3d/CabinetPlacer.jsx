import React, { useEffect, useMemo, useState } from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { getRoom } from '../../utils/moduleCatalog';
import { Sparkles, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CabinetPlacer = () => {
  const { addModule, autoCountertopEnabled, setAutoCountertopEnabled, activeRoomId } = useStudio3D();
  const { showToast } = useApp();

  const room = getRoom(activeRoomId);
  const sections = room?.sections || [];

  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id);
  const [query, setQuery] = useState('');

  // Kategori değişince ilk bölüme dön
  useEffect(() => {
    setActiveSectionId(sections[0]?.id);
    setQuery('');
  }, [activeRoomId]);

  const modules = useMemo(() => {
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase('tr');
      return sections.flatMap((s) => s.modules).filter((m) => m.name.toLocaleLowerCase('tr').includes(q));
    }
    const section = sections.find((s) => s.id === activeSectionId) || sections[0];
    return section?.modules || [];
  }, [sections, activeSectionId, query]);

  return (
    <div className="bg-[#121820]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-3 sm:p-4 text-white shadow-2xl space-y-3">
      {/* Aktif kategori başlığı + otomatik tezgah anahtarı */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#FAD02C]/15 flex items-center justify-center text-base shrink-0">
            {room?.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold truncate">{room?.name} Modülleri</p>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              Dokun, sahneye eklenir
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setAutoCountertopEnabled(!autoCountertopEnabled);
            showToast(autoCountertopEnabled ? 'Otomatik tezgah devreden çıkarıldı' : 'Otomatik tek parça tezgah aktif 🪄');
          }}
          className={`min-h-[40px] px-2.5 py-2 rounded-2xl text-[11px] font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 shrink-0 ${
            autoCountertopEnabled
              ? 'bg-blue-500/20 border-blue-400 text-blue-300'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Tezgah</span>
        </button>
      </div>

      {/* Bölüm sekmeleri */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSectionId(sec.id);
                setQuery('');
              }}
              className={`min-h-[40px] px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                !query && activeSectionId === sec.id
                  ? 'bg-[#FAD02C] text-black shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              <span>{sec.icon}</span>
              <span className="whitespace-nowrap">{sec.name}</span>
              <span className="opacity-60">{sec.modules.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modül arama */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${room?.name} içinde modül ara...`}
          className="w-full h-10 pl-9 pr-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-semibold text-white placeholder:text-gray-500 outline-none focus:border-[#FAD02C]/60"
        />
      </div>

      {/* Modül listesi — dokununca sahneye eklenir */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => {
              addModule(mod.id);
              showToast(`${mod.name} eklendi (+1) 📦`);
            }}
            className="min-h-[46px] w-full px-2.5 py-2 rounded-2xl bg-white/8 hover:bg-[#FAD02C] hover:text-black border border-white/10 transition-all cursor-pointer flex items-center gap-2.5 active:scale-[0.98] group text-left"
          >
            <span className="w-7 h-7 rounded-xl bg-white/15 group-hover:bg-black/15 flex items-center justify-center text-sm shrink-0">
              {mod.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold text-[11px] leading-tight truncate">{mod.name}</span>
              <span className="block text-[9px] font-semibold text-gray-400 group-hover:text-black/60 tabular-nums">
                {Math.round(mod.width * 100)}×{Math.round(mod.height * 100)}×{Math.round(mod.depth * 100)} cm
              </span>
            </span>
          </button>
        ))}

        {modules.length === 0 && (
          <p className="text-[11px] text-gray-500 font-semibold text-center py-4">
            Eşleşen modül bulunamadı.
          </p>
        )}
      </div>
    </div>
  );
};
