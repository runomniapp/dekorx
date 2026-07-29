import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Box,
  ShoppingBag,
  FileText,
  MessageCircle,
  PhoneCall,
  User,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomBar = () => {
  const { activeTab, setActiveTab, cart, setIsCartOpen, showToast } = useApp();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleWhatsApp = () => {
    window.open('https://wa.me/905550000000?text=Merhaba,%203D%20mobilya%20tasarımı%20için%20bilgi%20almak%20istiyorum.', '_blank');
  };

  const handleCall = () => {
    window.location.href = 'tel:+905550000000';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="glass-dark rounded-3xl p-2 shadow-2xl flex items-center justify-between gap-1 border border-white/15"
        >
          {/* 3D Studio */}
          <button
            onClick={() => setActiveTab('studio3d')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
              activeTab === 'studio3d'
                ? 'bg-[#FAD02C] text-[#121212] font-bold shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Box className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight leading-none font-semibold">
              3D Editör
            </span>
          </button>

          {/* Catalog */}
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
              activeTab === 'shop'
                ? 'bg-[#FAD02C] text-[#121212] font-bold shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight leading-none font-semibold">
              Katalog
            </span>
          </button>

          {/* Quick Quote Center Button */}
          <button
            onClick={() => setActiveTab('quote')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
              activeTab === 'quote'
                ? 'bg-white text-black font-extrabold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px] tracking-tight leading-none font-bold">
              Teklif Al
            </span>
          </button>

          {/* WhatsApp Direct */}
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight leading-none font-semibold">
              WhatsApp
            </span>
          </button>

          {/* Cart Drawer */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-gray-300 hover:text-white transition-all"
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight leading-none font-semibold">
              Sepet
            </span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-[#FAD02C] text-[#121212] rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};
