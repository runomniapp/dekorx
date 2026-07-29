import React from 'react';
import { Home, Box, Grid, Sliders } from 'lucide-react';

export const StepRoom = ({ formData, updateFormData }) => {
  const roomTypes = [
    { id: 'kitchen', title: 'Mutfak Dolabı & Ada', icon: '🍳', rate: 'En Çok Tercih Edilen' },
    { id: 'wardrobe', title: 'Giyinme Odası / Gardırop', icon: '👔', rate: 'Özel Ölçü' },
    { id: 'living', title: 'TV Ünitesi & Salon', icon: '🛋️', rate: 'Modern Çözümler' },
    { id: 'bathroom', title: 'Banyo Dolabı & Tezgah', icon: '🛁', rate: 'Suya Dayanıklı' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-[#121212] mb-1">
          Hangi Alan İçin Tasarım İstiyorsunuz?
        </h2>
        <p className="text-xs text-gray-500">
          Projenizin türünü seçin ve alan ölçülerini yaklaşık olarak belirtin.
        </p>
      </div>

      {/* Room Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roomTypes.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => updateFormData({ roomType: room.id })}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              formData.roomType === room.id
                ? 'border-[#121212] bg-[#121212] text-white shadow-lg scale-[1.02]'
                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{room.icon}</span>
              <div>
                <span className="font-bold text-sm block leading-tight">
                  {room.title}
                </span>
                <span
                  className={`text-[10px] ${
                    formData.roomType === room.id ? 'text-gray-300' : 'text-gray-400'
                  }`}
                >
                  {room.rate}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Room Dimensions Sliders */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Yaklaşık Alan Ölçüleri (Metre)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
              <span>Genişlik (Duvar)</span>
              <span className="text-[#121212]">{formData.width} Metre</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="10"
              step="0.5"
              value={formData.width}
              onChange={(e) => updateFormData({ width: e.target.value })}
              className="w-full accent-[#121212] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
              <span>Derinlik / Uzunluk</span>
              <span className="text-[#121212]">{formData.length} Metre</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="10"
              step="0.5"
              value={formData.length}
              onChange={(e) => updateFormData({ length: e.target.value })}
              className="w-full accent-[#121212] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
