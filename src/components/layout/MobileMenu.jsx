import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  X,
  Box,
  ShoppingBag,
  FileText,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Home,
  Sliders,
  Layers,
  Search,
  CheckCircle,
  Smartphone
} from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';
import { promptInstallPWA } from '../../utils/pwaUtils';

export const MobileMenu = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setActiveTab,
    isPWAInstallable,
    showToast
  } = useApp();

  if (!isMobileMenuOpen) return null;

  const categories = [
    { id: 'studio3d', name: '3D Tasarım Editörü', icon: Box, badge: 'Canlı 3D', desc: 'Sürükle, Döndür & Renklendir' },
    { id: 'shop', name: 'Mobilya & Ürün Kataloğu', icon: ShoppingBag, desc: 'Lüks Modüler Tasarımlar' },
    { id: 'quote', name: 'Anında Fiyat Teklifi Al', icon: FileText, badge: '1 Dakikada', desc: 'Özel Ölçülü İmalat Fiyatı' },
    { id: 'portfolio', name: 'Tamamlanan Projeler', icon: Layers, desc: 'Gerçek Müşteri Uygulamaları' }
  ];

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handlePWAInstall = async () => {
    const installed = await promptInstallPWA();
    if (installed) {
      showToast('DekorX PWA uygulamanıza başarıyla yüklendi!');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAD02C] text-[#121212] flex items-center justify-center font-extrabold text-lg">
              F
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight block leading-none">
                DEKOR<span className="text-[#FAD02C]">X</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
                Mobil Menü
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all"
            aria-label="Menüyü Kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Search inside Mobile Menu */}
        <div className="my-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Menü içinde ara..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/10 text-white placeholder-gray-400 text-xs outline-none border border-white/10 focus:border-[#FAD02C]"
            />
          </div>
        </div>

        {/* Primary Categories Navigation */}
        <div className="space-y-3 my-auto">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav(cat.id)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/15 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-[#FAD02C] group-hover:text-black text-white flex items-center justify-center transition-colors">
                    <IconComponent className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {cat.name}
                      </span>
                      {cat.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FAD02C] text-black text-[10px] font-extrabold uppercase">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {cat.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </motion.button>
            );
          })}
        </div>

        {/* PWA App Install Banner if Available */}
        {isPWAInstallable && (
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-[#FAD02C]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-[#FAD02C]" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Uygulama Olarak Yükle
                </span>
                <span className="text-[11px] text-gray-300">
                  Ana ekrana ekle, internetsiz kullan
                </span>
              </div>
            </div>
            <button
              onClick={handlePWAInstall}
              className="px-3 py-1.5 rounded-full bg-[#FAD02C] text-black font-bold text-xs"
            >
              Yükle
            </button>
          </div>
        )}

        {/* Fixed Quick Action Buttons: WhatsApp & Call & Get Quote */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://wa.me/905550000000?text=Merhaba,%20DekorX%203D%20mobilya%20tasarımı%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl bg-emerald-600/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="tel:+905550000000"
              className="h-12 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              Hemen Ara
            </a>
          </div>

          <TouchButton
            variant="yellow"
            fullWidth
            size="lg"
            icon={FileText}
            onClick={() => handleNav('quote')}
          >
            Hızlı Teklif Al
          </TouchButton>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
