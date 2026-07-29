import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Studio3DProvider } from './context/Studio3DContext';
import { Header } from './components/layout/Header';
import { MobileMenu } from './components/layout/MobileMenu';
import { BottomBar } from './components/layout/BottomBar';
import { PWABanner } from './components/layout/PWABanner';
import { NotificationToast } from './components/ui/NotificationToast';

import { StudioCanvas } from './components/studio3d/StudioCanvas';
import { CustomContextMenu } from './components/studio3d/CustomContextMenu';
import { RoomDimensionControls } from './components/studio3d/RoomDimensionControls';
import { CabinetPlacer } from './components/studio3d/CabinetPlacer';
import { MaterialsPicker } from './components/studio3d/MaterialsPicker';
import { LivePriceCalculator } from './components/studio3d/LivePriceCalculator';
import { ObjectControls } from './components/studio3d/ObjectControls';
import { PresetRooms } from './components/studio3d/PresetRooms';
import { RenderModal } from './components/studio3d/RenderModal';

import { ProductGrid } from './components/shop/ProductGrid';
import { CartDrawer } from './components/shop/CartDrawer';
import { QuoteWizard } from './components/quote/QuoteWizard';

import { ChevronRight } from 'lucide-react';

function MainAppContent() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F6] text-[#121212] safe-pb">
      <PWABanner />
      <Header />
      <MobileMenu />
      <CartDrawer />
      <NotificationToast />
      <CustomContextMenu />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-3 sm:px-6 py-4">
        {/* VIEW 1: 3D ROOM PLANNER & DATA-DRIVEN PRICE MODEL */}
        {activeTab === 'studio3d' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Bar Studio Info & Presets */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#121212] text-[#FAD02C] flex items-center justify-center font-extrabold text-lg shadow-md">
                  3D
                </div>
                <div>
                  <h1 className="font-extrabold text-lg text-gray-900 leading-tight">
                    Tam Teşekküllü 3D Oda Planlayıcı & Otomatik Tezgah Mimarisi
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Sağ tıklayarak menüyü açın, modülleri dilediğiniz yere sürükleyin, üst/alt & camlı modülleri yerleştirin.
                  </p>
                </div>
              </div>

              {/* Preset Selector */}
              <PresetRooms />
            </div>

            {/* 3D Studio Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Room Dimensions + Cabinet Placer Controls */}
              <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
                <RoomDimensionControls />
                <CabinetPlacer />
                <ObjectControls />
              </div>

              {/* Center Column: Interactive 3D WebGL Canvas */}
              <div className="lg:col-span-6 order-1 lg:order-2 h-[520px] md:h-[680px] bg-white rounded-3xl p-2 shadow-xl border border-gray-200">
                <StudioCanvas />
              </div>

              {/* Right Column: Live Data-Driven Pricing Engine + Materials Selector */}
              <div className="lg:col-span-3 order-3 space-y-4">
                <LivePriceCalculator />
                <MaterialsPicker />
              </div>
            </div>

            <RenderModal />
          </div>
        )}

        {/* VIEW 2: MODULAR E-COMMERCE SHOP CATALOG */}
        {activeTab === 'shop' && <ProductGrid />}

        {/* VIEW 3: MULTI-STEP QUOTE WIZARD */}
        {activeTab === 'quote' && (
          <div className="py-4">
            <QuoteWizard />
          </div>
        )}

        {/* VIEW 4: COMPLETED PORTFOLIO PROJECTS */}
        {activeTab === 'portfolio' && (
          <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h1 className="text-2xl font-extrabold text-[#121212]">
                Tamamlanan Lüks Mimari Projeler
              </h1>
              <p className="text-xs text-gray-500">
                Türkiye ve Avrupa çapında tamamlanan özel üretim 3D mobilya uygulamalarımız.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Kadıköy Lüks Villa Mutfak',
                  desc: 'Calacatta mermer ada ve bas-aç mat lake gardırop kombinasyonu.',
                  image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                },
                {
                  title: 'Bodrum Loft Rezidans',
                  desc: 'Masif meşe kaplama özel gardırop ve gizli LED lambalı TV ünitesi.',
                  image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
                },
                {
                  title: 'Ataşehir Ofis & Banyo',
                  desc: 'Suya dayanıklı özel banyo dolabı ve mimari banko çözümü.',
                  image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
                }
              ].map((proj, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
                >
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={proj.image}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#121212] text-[#FAD02C] text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Teslim Edildi
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-base text-gray-900">{proj.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{proj.desc}</p>
                    <button
                      onClick={() => setActiveTab('quote')}
                      className="pt-2 text-xs font-bold text-black flex items-center gap-1 hover:text-amber-600"
                    >
                      <span>Hemen Teklif Al</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Native Action Bar */}
      <BottomBar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Studio3DProvider>
        <MainAppContent />
      </Studio3DProvider>
    </AppProvider>
  );
}
