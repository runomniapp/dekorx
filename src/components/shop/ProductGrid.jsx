import React, { useState } from 'react';
import { ProductCard } from './ProductCard';
import { PillTag } from '../ui/PillTag';
import { useApp } from '../../context/AppContext';
import { Search, Sparkles, ArrowRight, SlidersHorizontal, Box } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';

const PRODUCTS_DATA = [
  {
    id: 'p1',
    name: 'Lüks Modüler Mutfak Ada Modülü',
    category: 'Mutfak',
    price: 18500,
    rating: '4.9',
    badge: '%25 İndirim',
    description: 'Calacatta mermer kaplama tezgahlı, bas-aç lake çekmeceli modüler ada.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p2',
    name: 'Soft Meşe Giyinme Odası Gardırop',
    category: 'Gardırop',
    price: 24900,
    rating: '4.8',
    badge: 'Çok Satan',
    description: 'LED aydınlatmalı raylı füme cam kapaklı lüks gardırop modülü.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p3',
    name: 'Minimalist Mat Siyah TV Ünitesi',
    category: 'Salon',
    price: 14200,
    rating: '4.7',
    badge: 'Yeni',
    description: 'Gizli kablo kanallı, duvara monte yüzen TV konsolu.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p4',
    name: 'Japon Stil Yumuşak İskeletli Koltuk',
    category: 'Sofa',
    price: 19800,
    rating: '4.9',
    badge: 'Lüks',
    description: 'Leke tutmaz boucle kumaş kaplamalı ergonomik oturma grubu.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p5',
    name: 'Banyo Lavabo & Ayna Kombini',
    category: 'Banyo',
    price: 9800,
    rating: '4.6',
    badge: 'Fırsat',
    description: 'Nem korumalı lake dolap ve dokunmatik LED aynalı set.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'p6',
    name: 'Brüt Beton Masif Ada Sandalyesi',
    category: 'Chair',
    price: 3400,
    rating: '4.8',
    badge: '3D Hazır',
    description: 'Ergonomik sırt destekli doğal ahşap bar sandalyesi.',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80'
  }
];

export const ProductGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { setActiveTab } = useApp();

  const categories = ['Tümü', 'Mutfak', 'Gardırop', 'Salon', 'Sofa', 'Banyo', 'Chair'];

  const filteredProducts = PRODUCTS_DATA.filter((item) => {
    const matchesCat = selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4">
      {/* Search Bar & Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#121212] tracking-tight">
            Modüler Mobilya Kataloğu
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            3D olarak özelleştirilebilir özel üretim mobilyalar.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="w-full sm:w-72 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Katalogda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-gray-200 text-xs font-medium focus:border-[#121212] outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Pill Categories Bar (Inspired by Reference Image 2 WOOLEN UI) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <PillTag
            key={cat}
            active={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </PillTag>
        ))}
      </div>

      {/* Feature Promo Banners (Inspired by Reference Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deal 1 */}
        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/20 p-5 rounded-3xl border border-amber-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-[#121212] text-[#FAD02C] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
              75% Özel Fırsat
            </span>
            <h3 className="font-extrabold text-[#121212] text-lg leading-tight">
              Özel Üretim Mutfaklar
            </h3>
            <p className="text-xs text-gray-600">Ücretsiz mimari keşif ve 3D çizim</p>
          </div>
          <button
            onClick={() => setActiveTab('quote')}
            className="w-10 h-10 rounded-full bg-[#121212] text-white flex items-center justify-center shadow-md shrink-0 hover:scale-105 transition-transform"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Deal 2 */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
              3D Editör
            </span>
            <h3 className="font-extrabold text-[#121212] text-lg leading-tight">
              Kendin Tasarla
            </h3>
            <p className="text-xs text-gray-600">Dolap, renk ve kapakları değiştir</p>
          </div>
          <button
            onClick={() => setActiveTab('studio3d')}
            className="w-10 h-10 rounded-full bg-[#FAD02C] text-black flex items-center justify-center shadow-md shrink-0 hover:scale-105 transition-transform"
          >
            <Box className="w-5 h-5" />
          </button>
        </div>

        {/* Deal 3 */}
        <div className="bg-[#121212] text-white p-5 rounded-3xl border border-white/10 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
              Ekspres İmalat
            </span>
            <h3 className="font-extrabold text-white text-lg leading-tight">
              10 Günde Teslimat
            </h3>
            <p className="text-xs text-gray-400">İstanbul içi ücretsiz montaj</p>
          </div>
          <button
            onClick={() => setActiveTab('quote')}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0 hover:scale-105 transition-transform"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Cards Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelectProduct={setSelectedProduct}
          />
        ))}
      </div>
    </div>
  );
};
