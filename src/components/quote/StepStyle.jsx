import React from 'react';
import { Check } from 'lucide-react';

export const StepStyle = ({ formData, updateFormData }) => {
  const materials = [
    { id: 'standard', name: 'Mat Lake & Standart MDF', badge: 'Ekonomik & Dayanıklı', factor: '1.0x' },
    { id: 'premium', name: 'Doğal Ahşap Meşe Kaplama', badge: 'En Çok Satan', factor: '1.35x' },
    { id: 'luxury', name: 'Calacatta Mermer & Brass Gold', badge: 'Lüks Segment', factor: '1.75x' }
  ];

  const doorTypes = [
    { id: 'matte', name: 'Mat Soft-Touch Kapak' },
    { id: 'glossy', name: 'Yüksek Parlaklık Acrylic' },
    { id: 'wood', name: 'Masif Ahşap Derin Doku' },
    { id: 'glass', name: 'Füme Cam & Alüminyum Çerçeve' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-[#121212] mb-1">
          Malzeme & Stil Tercihiniz
        </h2>
        <p className="text-xs text-gray-500">
          İmalat kalitesi ve kapak kaplamasını seçin.
        </p>
      </div>

      {/* Material Quality Selection */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Malzeme Kalite Seviyesi
        </span>
        {materials.map((mat) => (
          <button
            key={mat.id}
            type="button"
            onClick={() => updateFormData({ materialQuality: mat.id })}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              formData.materialQuality === mat.id
                ? 'border-[#121212] bg-[#121212] text-white shadow-lg'
                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
            }`}
          >
            <div>
              <span className="font-bold text-sm block leading-tight">
                {mat.name}
              </span>
              <span
                className={`text-[11px] ${
                  formData.materialQuality === mat.id ? 'text-amber-300' : 'text-gray-500'
                }`}
              >
                {mat.badge}
              </span>
            </div>
            {formData.materialQuality === mat.id && (
              <div className="w-6 h-6 rounded-full bg-[#FAD02C] text-black flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Door Finish Style */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Kapak Tipi & Kaplama
        </span>
        <div className="grid grid-cols-2 gap-2">
          {doorTypes.map((door) => (
            <button
              key={door.id}
              type="button"
              onClick={() => updateFormData({ doorType: door.id })}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                formData.doorType === door.id
                  ? 'border-[#121212] bg-gray-900 text-white shadow-xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {door.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
