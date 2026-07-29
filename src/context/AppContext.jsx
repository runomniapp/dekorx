import React, { createContext, useContext, useState, useEffect } from 'react';
import { initPWA } from '../utils/pwaUtils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('studio3d'); // 'studio3d' | 'shop' | 'quote' | 'portfolio'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cart, setCart] = useState([
    {
      id: 'p1',
      name: 'Lüks Modüler Mutfak Ada Modülü',
      price: 18500,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      quantity: 1,
      color: 'Soft Meşe & Mat Siyah'
    }
  ]);
  const [favorites, setFavorites] = useState(['p1']);
  const [toastMessage, setToastMessage] = useState(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    initPWA(
      (canInstall) => setIsPWAInstallable(canInstall),
      (onlineState) => setIsOnline(onlineState)
    );
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} sepetinize eklendi! ✨`);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast('Ürün sepetten çıkarıldı');
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      if (isFav) {
        showToast('Favorilerden çıkarıldı');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Favorilere eklendi ❤️');
        return [...prev, productId];
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isDarkMode,
        setIsDarkMode,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        favorites,
        toggleFavorite,
        toastMessage,
        showToast,
        isPWAInstallable,
        isOnline
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
