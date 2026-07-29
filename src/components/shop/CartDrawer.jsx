import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';
import confetti from 'canvas-confetti';

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    showToast
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isCartOpen) return null;

  const handleApplePayCheckout = () => {
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
    showToast('Apple Pay ile siparişiniz alındı! 🍏');
    setTimeout(() => {
      setIsCartOpen(false);
      setIsCheckingOut(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#121212] text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base leading-none">
                Sepetim
              </h2>
              <span className="text-xs text-gray-400">
                {cart.length} Ürün Kalemi
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        {cart.length === 0 ? (
          <div className="my-auto text-center space-y-3 p-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Sepetiniz Boş</h3>
            <p className="text-xs text-gray-400">
              Katalogdan beğendiğiniz modüler mobilyaları sepete ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="my-4 space-y-3 overflow-y-auto flex-1 pr-1">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shadow-xs"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />

                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-1">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 block">
                    {item.color}
                  </span>
                  <span className="font-extrabold text-sm text-[#121212] block">
                    {formatCurrency(item.price)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-700 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-700 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span className="font-semibold">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>İstanbul İçi Nakliye & Montaj</span>
                <span className="text-emerald-600 font-bold">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Genel Toplam</span>
                <span className="text-[#121212]">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Apple Pay & Digital Checkout Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleApplePayCheckout}
                className="w-full h-13 rounded-2xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-900 active:scale-95 transition-all"
              >
                <span> Apple Pay ile Öde</span>
              </button>

              <TouchButton
                variant="yellow"
                fullWidth
                size="md"
                icon={CreditCard}
                onClick={handleApplePayCheckout}
              >
                Kredi Kartı ile 1-Tık Öde
              </TouchButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
