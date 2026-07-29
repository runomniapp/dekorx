import React, { useState, useEffect } from 'react';
import { StepRoom } from './StepRoom';
import { StepStyle } from './StepStyle';
import { StepBudget } from './StepBudget';
import { StepContact } from './StepContact';
import { TouchButton } from '../ui/TouchButton';
import { ChevronLeft, ChevronRight, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateQuoteEstimate } from '../../utils/formatters';
import confetti from 'canvas-confetti';

const INITIAL_FORM_DATA = {
  roomType: 'kitchen',
  width: '4',
  length: '3',
  materialQuality: 'premium',
  doorType: 'matte',
  timeline: 'standard',
  fullName: '',
  phone: '',
  address: '',
  notes: ''
};

export const QuoteWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('dekorx_quote_draft');
    return saved ? JSON.parse(saved) : INITIAL_FORM_DATA;
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    localStorage.setItem('dekorx_quote_draft', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setIsSubmitted(true);
    showToast('Teklif talebiniz başarıyla oluşturuldu! 🎉');
    localStorage.removeItem('dekorx_quote_draft');
  };

  const estimate = calculateQuoteEstimate(formData);

  const handleWhatsAppSend = () => {
    const message = `Merhaba DekorX!%0A*Yeni 3D Teklif Talebi*%0A- Alan: ${formData.roomType.toUpperCase()} (${formData.width}m x ${formData.length}m)%0A- Malzeme: ${formData.materialQuality}%0A- Tahmini Bütçe: ${estimate.formatted}%0A- Ad Soyad: ${formData.fullName}%0A- Tel: ${formData.phone}%0A- Adres: ${formData.address}`;
    window.open(`https://wa.me/905550000000?text=${message}`, '_blank');
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center space-y-5 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[#121212]">
            Teklif Talebiniz Alındı!
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Mimari ekibimiz 15 dakika içerisinde sizinle iletişime geçecektir.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Müşteri:</span>
            <span className="font-bold text-gray-900">{formData.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Telefon:</span>
            <span className="font-bold text-gray-900">{formData.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tahmini Tutar:</span>
            <span className="font-extrabold text-[#121212]">{estimate.formatted}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleWhatsAppSend}
            className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp'tan Anında Gönder
          </button>
          <TouchButton
            variant="secondary"
            size="md"
            onClick={() => {
              setIsSubmitted(false);
              setCurrentStep(1);
              setFormData(INITIAL_FORM_DATA);
            }}
          >
            Yeni Teklif Al
          </TouchButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-4 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
      {/* Progress Bar & Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span>ADIM {currentStep} / 4</span>
          <span className="text-[#121212]">
            {currentStep === 1 && 'Alan & Ölçü'}
            {currentStep === 2 && 'Stil & Malzeme'}
            {currentStep === 3 && 'Bütçe & Takvim'}
            {currentStep === 4 && 'İletişim & Onay'}
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-[#121212] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Views */}
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <StepRoom formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepStyle formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepBudget formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepContact formData={formData} updateFormData={updateFormData} />
        )}

        {/* Controls Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="h-12 px-5 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 hover:bg-gray-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <TouchButton
              type="button"
              variant="dark"
              size="md"
              onClick={nextStep}
              className="ml-auto"
            >
              <span>Devam Et</span>
              <ChevronRight className="w-4 h-4" />
            </TouchButton>
          ) : (
            <TouchButton
              type="submit"
              variant="yellow"
              size="md"
              icon={Sparkles}
              className="ml-auto shadow-xl"
            >
              Teklifi Tamamla & Al
            </TouchButton>
          )}
        </div>
      </form>
    </div>
  );
};
