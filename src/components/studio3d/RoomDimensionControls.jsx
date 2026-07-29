import React from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import { Sliders, Maximize2, Grid, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RoomDimensionControls = () => {
  const { roomDimensions, setRoomDimensions } = useStudio3D();
  const { showToast } = useApp();

  const handleWidthChange = (val) => {
    setRoomDimensions((prev) => ({ ...prev, width: Number(val) }));
  };

  const handleLengthChange = (val) => {
    setRoomDimensions((prev) => ({ ...prev, length: Number(val) }));
  };

  const handleHeightChange = (val) => {
    setRoomDimensions((prev) => ({ ...prev, height: Number(val) }));
  };

  const area = (roomDimensions.width * roomDimensions.length).toFixed(1);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#121212]">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 leading-none">
              Oda Ölçüleri (Metre)
            </h3>
            <span className="text-xs text-gray-400">Genislik x Uznluk x Yukseklik</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-[#121212] text-[#FAD02C] text-xs font-extrabold rounded-full">
          {area} m² Alan
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-3 pt-1">
        {/* Room Width Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Oda Genişliği (Duvar)</span>
            <span className="text-[#121212] bg-gray-100 px-2 py-0.5 rounded-md">
              {roomDimensions.width} Metre
            </span>
          </div>
          <input
            type="range"
            min="2.0"
            max="10.0"
            step="0.5"
            value={roomDimensions.width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="w-full accent-[#121212] cursor-pointer"
          />
        </div>

        {/* Room Length Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Oda Uzunluğu (Derinlik)</span>
            <span className="text-[#121212] bg-gray-100 px-2 py-0.5 rounded-md">
              {roomDimensions.length} Metre
            </span>
          </div>
          <input
            type="range"
            min="2.0"
            max="10.0"
            step="0.5"
            value={roomDimensions.length}
            onChange={(e) => handleLengthChange(e.target.value)}
            className="w-full accent-[#121212] cursor-pointer"
          />
        </div>

        {/* Ceiling Height Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Tavan Yüksekliği</span>
            <span className="text-[#121212] bg-gray-100 px-2 py-0.5 rounded-md">
              {roomDimensions.height} Metre
            </span>
          </div>
          <input
            type="range"
            min="2.2"
            max="3.5"
            step="0.1"
            value={roomDimensions.height}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="w-full accent-[#121212] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
