import React, { useState } from 'react';
import { useStudio3D } from '../../context/Studio3DContext';
import {
  FLOOR_MATERIALS,
  CABINET_DOOR_FINISHES,
  COUNTERTOP_MATERIALS
} from '../../utils/pricingEngine';
import { ChevronDown, ChevronUp, Check, FileText, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MaterialsPicker = () => {
  const {
    selectedFloorMaterial,
    setSelectedFloorMaterial,
    selectedDoorFinish,
    setSelectedDoorFinish,
    selectedCountertop,
    setSelectedCountertop,
    triggerBOMModal
  } = useStudio3D();

  const { showToast } = useApp();
  const [openSection, setOpenSection] = useState('floor'); // 'floor' | 'doors' | 'countertop'

  const toggleSection = (sec) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  return (
    <div className="w-full space-y-3">
      {/* 1. Zemin Kaplaması Malzeme Seçimi */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection('floor')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold text-base">
              🪵
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-xs block leading-tight uppercase tracking-wider">
                Zemin Kaplaması
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                {selectedFloorMaterial.name} ({selectedFloorMaterial.pricePerSqm} ₺/m²)
              </span>
            </div>
          </div>
          {openSection === 'floor' ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSection === 'floor' && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 gap-2 animate-in fade-in duration-200">
            {FLOOR_MATERIALS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedFloorMaterial(item);
                  showToast(`${item.name} zemin kaplaması seçildi!`);
                }}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedFloorMaterial.id === item.id
                    ? 'border-[#121212] bg-[#121212] text-white shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full border border-white/60 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    selectedFloorMaterial.id === item.id ? 'text-[#FAD02C]' : 'text-gray-500'
                  }`}
                >
                  {item.pricePerSqm} ₺/m²
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Dolap Kapak Malzeme & Kaplama Seçimi */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection('doors')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-base">
              🗄️
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-xs block leading-tight uppercase tracking-wider">
                Dolap Kapak Kaplaması
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                {selectedDoorFinish.name} ({selectedDoorFinish.multiplier}x)
              </span>
            </div>
          </div>
          {openSection === 'doors' ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSection === 'doors' && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 gap-2 animate-in fade-in duration-200">
            {CABINET_DOOR_FINISHES.map((door) => (
              <button
                key={door.id}
                onClick={() => {
                  setSelectedDoorFinish(door);
                  showToast(`${door.name} dolap kapak tipi seçildi!`);
                }}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedDoorFinish.id === door.id
                    ? 'border-[#121212] bg-[#121212] text-white shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full border border-white/60 shrink-0"
                    style={{ backgroundColor: door.color }}
                  />
                  <span>{door.name}</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    selectedDoorFinish.id === door.id ? 'text-[#FAD02C]' : 'text-gray-500'
                  }`}
                >
                  {door.multiplier}x Çarpan
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Mutfak / Banyo Tezgah Malzemesi */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection('countertop')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold text-base">
              ✨
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-xs block leading-tight uppercase tracking-wider">
                Tezgah Malzemesi
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                {selectedCountertop.name} ({selectedCountertop.pricePerMeter} ₺/m)
              </span>
            </div>
          </div>
          {openSection === 'countertop' ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSection === 'countertop' && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 gap-2 animate-in fade-in duration-200">
            {COUNTERTOP_MATERIALS.map((cnt) => (
              <button
                key={cnt.id}
                onClick={() => {
                  setSelectedCountertop(cnt);
                  showToast(`${cnt.name} tezgah malzemesi seçildi!`);
                }}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedCountertop.id === cnt.id
                    ? 'border-[#121212] bg-[#121212] text-white shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full border border-white/60 shrink-0"
                    style={{ backgroundColor: cnt.color }}
                  />
                  <span>{cnt.name}</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    selectedCountertop.id === cnt.id ? 'text-[#FAD02C]' : 'text-gray-500'
                  }`}
                >
                  {cnt.pricePerMeter} ₺/m
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
