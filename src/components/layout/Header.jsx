import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  ShoppingBag,
  Search,
  Sparkles,
  Box,
  FileText,
  Heart,
  X,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { PillTag } from '../ui/PillTag';
import { TouchButton } from '../ui/TouchButton';

export const Header = () => {
  const {
    activeTab,
    setActiveTab,
    setIsMobileMenuOpen,
    cart,
    setIsCartOpen,
    favorites
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121212] text-white shadow-lg backdrop-blur-xl bg-opacity-95">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('studio3d')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FAD02C] text-[#121212] flex items-center justify-center font-extrabold text-lg shadow-inner group-active:scale-95 transition-transform">
              F
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-lg leading-tight flex items-center gap-1.5">
                DEKOR<span className="text-[#FAD02C]">X</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase block -mt-0.5">
                Mobile 3D Studio
              </span>
            </div>
          </button>
        </div>

        {/* Desktop / Tablet Navigation Pills */}
        <div className="hidden md:flex items-center gap-2 bg-[#1E1E1E] p-1.5 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('studio3d')}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'studio3d'
                ? 'bg-white text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            3D Modeller
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'shop'
                ? 'bg-white text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Katalog
          </button>
          <button
            onClick={() => setActiveTab('quote')}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'quote'
                ? 'bg-white text-black shadow-md'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Teklif Al
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 transition-colors"
            aria-label="Arama"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Favorites */}
          <button
            onClick={() => setActiveTab('shop')}
            className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 transition-colors"
            aria-label="Favoriler"
          >
            <Heart className="w-4 h-4" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-200 transition-colors"
            aria-label="Sepetim"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FAD02C] text-[#121212] rounded-full text-[10px] font-extrabold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Desktop Call to Action */}
          <div className="hidden lg:block">
            <TouchButton
              variant="yellow"
              size="sm"
              icon={FileText}
              onClick={() => setActiveTab('quote')}
            >
              Teklif Al
            </TouchButton>
          </div>

          {/* Fullscreen Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-11 h-11 rounded-2xl bg-[#FAD02C] text-[#121212] flex items-center justify-center font-bold shadow-md hover:bg-yellow-400 active:scale-95 transition-all"
            aria-label="Menü"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Search Drawer Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex flex-col justify-start pt-12 animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto w-full relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Mutfak dolabı, gardırop, ada masa ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-14 pl-12 pr-12 rounded-2xl bg-[#1E1E1E] text-white border border-white/20 focus:border-[#FAD02C] outline-none text-sm placeholder-gray-400"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                Popüler Aramalar
              </span>
              <div className="flex flex-wrap gap-2">
                {['Mutfak Adaları', 'Mat Lake Kapaklar', 'Calacatta Mermer', 'Minimal Gardırop'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      setActiveTab('shop');
                      setIsSearchOpen(false);
                    }}
                    className="px-4 py-2 rounded-full bg-white/10 text-xs font-medium text-white hover:bg-[#FAD02C] hover:text-black transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
