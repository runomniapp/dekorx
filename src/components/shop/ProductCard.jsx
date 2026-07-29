import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Heart, ShoppingBag, Star, Sparkles, Box } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, favorites, toggleFavorite, setActiveTab } = useApp();
  const isFav = favorites.includes(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Discount / Tag Badge */}
      {product.badge && (
        <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
          {product.badge}
        </span>
      )}

      {/* Favorite Button */}
      <button
        onClick={() => toggleFavorite(product.id)}
        className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
          isFav
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-white/80 text-gray-700 hover:bg-white'
        }`}
        aria-label="Favorilere Ekle"
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
      </button>

      {/* Product Render Image */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-50 mb-3 cursor-pointer group-hover:scale-102 transition-transform duration-300"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 text-[#FAD02C] fill-current" />
          <span>{product.rating || '4.8'}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          {product.category}
        </span>
        <h3
          onClick={() => onSelectProduct(product)}
          className="font-bold text-gray-900 text-sm leading-snug cursor-pointer hover:text-black line-clamp-1"
        >
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
      </div>

      {/* Price & Action Buttons */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-gray-400 block line-through">
            {formatCurrency(product.price * 1.2)}
          </span>
          <span className="font-extrabold text-[#121212] text-base">
            {formatCurrency(product.price)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Open 3D Configurator Button */}
          <button
            onClick={() => setActiveTab('studio3d')}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center active:scale-95 transition-all"
            title="3D Studio'da Özelleştir"
          >
            <Box className="w-4 h-4" />
          </button>

          {/* Quick Add to Cart */}
          <button
            onClick={() => addToCart(product)}
            className="w-9 h-9 rounded-xl bg-[#121212] text-white hover:bg-black flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Sepete Ekle"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
