import React from 'react';
import { useApp } from '../../context/AppContext';
import { promptInstallPWA } from '../../utils/pwaUtils';
import { Smartphone, Download, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWABanner = () => {
  const { isPWAInstallable, isOnline, showToast } = useApp();

  const handleInstall = async () => {
    const installed = await promptInstallPWA();
    if (installed) {
      showToast('DekorX PWA başarıyla kuruldu! 🎉');
    }
  };

  return (
    <>
      {/* Offline Alert Indicator */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Çevrimdışı moddasınız - PWA önbelleği aktif</span>
        </div>
      )}

      {/* Floating Install Prompt Banner for Mobile Users */}
      <AnimatePresence>
        {isPWAInstallable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#FAD02C] text-[#121212] px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>DekorX Mobil Uygulamasını Ana Ekranınıza Ekleyin!</span>
            </div>
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-black text-white rounded-full text-[11px] font-bold flex items-center gap-1 hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3 h-3" />
              Yükle
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
