import React from 'react';
import { Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { calculateQuoteEstimate } from '../../utils/formatters';

export const StepBudget = ({ formData, updateFormData }) => {
  const estimate = calculateQuoteEstimate(formData);

  const budgetTiers = [
    { id: 'standard', name: '40.000 ₺ - 80.000 ₺' },
    { id: 'mid', name: '80.000 ₺ - 150.000 ₺' },
    { id: 'high', name: '150.000 ₺ ve üzeri' }
  ];

  const timelines = [
    { id: 'urgent', name: 'Acil (1-2 Hafta)', badge: 'Ekspres İmalat' },
    { id: 'standard', name: 'Standart (3-4 Hafta)', badge: 'Tavsiye Edilen' },
    { id: 'flexible', name: 'Esnek (1-2 Ay)', badge: 'Özel İndirimli' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-[#121212] mb-1">
          Bütçe & Teslimat Süresi
        </h2>
        <p className="text-xs text-gray-500">
          Tahmini bütçe aralığınızı ve projenizin ne zaman bitmesini istediğinizi seçin.
        </p>
      </div>

      {/* Live Calculated Estimate Banner */}
      <div className="bg-[#121212] text-white p-5 rounded-2xl border border-white/10 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FAD02C]" />
            Tahmini İmalat & Montaj Tutarı
          </span>
          <span className="bg-[#FAD02C] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            Anlık Hesaplama
          </span>
        </div>
        <div className="text-2xl font-extrabold text-[#FAD02C]">
          {estimate.formatted}
        </div>
        <p className="text-[11px] text-gray-400 leading-tight">
          *Bu fiyat nakliye, mimari 3D çizim ve yerinde ölçü alımı dahil tahmini imalat aralığıdır.
        </p>
      </div>

      {/* Timeline Selection */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Hedeflenen Teslimat Takvimi
        </span>
        <div className="space-y-2">
          {timelines.map((time) => (
            <button
              key={time.id}
              type="button"
              onClick={() => updateFormData({ timeline: time.id })}
              className={`w-full p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                formData.timeline === time.id
                  ? 'border-[#121212] bg-[#121212] text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span>{time.name}</span>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                  formData.timeline === time.id
                    ? 'bg-[#FAD02C] text-black'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {time.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
