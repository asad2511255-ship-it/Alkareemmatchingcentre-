import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { CategoryNav } from './components/CategoryNav.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { OrderModal } from './components/OrderModal.tsx';
import { OrderSuccessModal } from './components/OrderSuccessModal.tsx';
import { OrderTrackingView } from './components/OrderTrackingView.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { OwnerAuthModal } from './components/OwnerAuthModal.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { Product, Category, PaymentMethod, Order, StoreSettings } from './types.ts';
import { api, getAuthToken } from './utils/api.ts';
import { Loader2, SearchX, ShoppingBag, Sparkles } from 'lucide-react';

export default function App() {
  // Store Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    brand_name: 'AL KAREEM MATCHING CENTRE',
    homepage_description: 'Premium Quality Fabrics, Beautiful Designs, and Multiple Colours. Only Online Payment Accepted.',
    contact_number: '03067341386',
    whatsapp_number: '03067341386',
    business_address: 'Moti Bazar, Link Masjid Wali Gali, Fatehpur',
    announcement: 'Welcome to AL KAREEM MATCHING CENTRE — Serving you with unmatched fabric matching & luxury unstitched fabrics.',
  });

  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Routing / View States
  const [currentRoute, setCurrentRoute] = useState<'store' | 'track'>('store');
  const [trackingToken, setTrackingToken] = useState<string>('');

  // Modals
  const [activeProductForDetail, setActiveProductForDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [activeProductForOrder, setActiveProductForOrder] = useState<Product | null>(null);
  const [orderModalColour, setOrderModalColour] = useState<string>('');
  const [orderModalQuantity, setOrderModalQuantity] = useState<number>(1);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Success Modal
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderId: string;
    trackingToken: string;
    order: Order;
    whatsappUrl: string;
  } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Owner Auth & Dashboard
  const [isOwnerAuthOpen, setIsOwnerAuthOpen] = useState(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState(false);
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false);

  // Initial Load and URL Routing
  useEffect(() => {
    loadStoreData();
    checkAuth();
    handleInitialUrlRoute();

    window.addEventListener('popstate', handleInitialUrlRoute);
    return () => window.removeEventListener('popstate', handleInitialUrlRoute);
  }, []);

  const handleInitialUrlRoute = () => {
    const path = window.location.pathname;
    if (path === '/track' || path.startsWith('/track/')) {
      const token = path.startsWith('/track/') ? path.replace('/track/', '').trim() : '';
      setTrackingToken(token);
      setCurrentRoute('track');
    } else if (path.startsWith('/product/')) {
      const prodId = path.replace('/product/', '').trim();
      if (prodId) {
        api.getProduct(prodId).then((prod) => {
          if (prod) {
            setActiveProductForDetail(prod);
            setIsDetailModalOpen(true);
          }
        }).catch((err) => console.error(err));
      }
    }
  };

  const checkAuth = async () => {
    try {
      const status = await api.getAuthStatus();
      setIsOwnerAuthenticated(status.isAuthenticated);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [prods, cats, pms, sts] = await Promise.all([
        api.getProducts({ active_only: true }),
        api.getCategories(false),
        api.getPaymentMethods(false),
        api.getSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setPaymentMethods(pms);
      if (sts && sts.brand_name) setSettings(sts);
    } catch (err: any) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId !== 'all' && p.category_id !== selectedCategoryId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  // Product Selection Handlers
  const handleSelectProduct = (product: Product) => {
    window.history.pushState({}, '', `/product/${product.id}`);
    setActiveProductForDetail(product);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    window.history.pushState({}, '', '/');
    setIsDetailModalOpen(false);
    setActiveProductForDetail(null);
  };

  const handleOpenOrderModal = (product: Product, colour?: string, quantity?: number) => {
    setActiveProductForOrder(product);
    setOrderModalColour(colour || product.available_colours?.[0] || '');
    setOrderModalQuantity(quantity || 1);
    setIsOrderModalOpen(true);
  };

  const handleOrderSuccess = (data: {
    orderId: string;
    trackingToken: string;
    order: Order;
    whatsappUrl: string;
  }) => {
    setOrderSuccessData(data);
    setIsSuccessModalOpen(true);
    // Reload products so stock is updated
    loadStoreData();
  };

  const handleNavigateToTrack = (token?: string) => {
    if (token) {
      window.history.pushState({}, '', `/track/${token}`);
      setTrackingToken(token);
    } else {
      window.history.pushState({}, '', '/track');
      setTrackingToken('');
    }
    setCurrentRoute('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1A261D]">
      {/* Primary Navigation */}
      <Navbar
        settings={settings}
        onOpenOwnerAuth={() => setIsOwnerAuthOpen(true)}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onOpenOwnerDashboard={() => setIsOwnerDashboardOpen(true)}
        onOpenTracking={() => handleNavigateToTrack()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main View Router */}
      {currentRoute === 'track' ? (
        <OrderTrackingView
          initialToken={trackingToken}
          onBackToStore={handleBackToStore}
        />
      ) : (
        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection
            settings={settings}
            onExploreClick={() => {
              const el = document.getElementById('products-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Category Navigation Bar */}
          <div id="products-section">
            <CategoryNav
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              activeCount={filteredProducts.length}
            />
          </div>

          {/* Product Grid Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-[#D4AF37] block mb-1">
                  Exquisite Pakistani Fabrics
                </span>
                <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-[#0F3826]">
                  {selectedCategoryId === 'all'
                    ? 'Latest Arrivals (Newest First)'
                    : categories.find((c) => c.id === selectedCategoryId)?.name || 'Matching Fabrics'}
                </h2>
              </div>

              {searchQuery && (
                <div className="text-xs text-[#1A261D]/70 bg-white px-3 py-1.5 rounded-full border border-[#0F3826]/10 flex items-center gap-2">
                  <span>Filtered by: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="font-bold text-[#0F3826] hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#0F3826]" />
                <span className="text-sm font-medium text-[#1A261D]/70">
                  Loading AL KAREEM fabric collections...
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#0F3826]/20 p-8 max-w-md mx-auto">
                <SearchX className="w-12 h-12 text-[#0F3826]/40 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-[#0F3826] mb-1">
                  No matching fabrics found
                </h3>
                <p className="text-xs text-[#1A261D]/60 mb-4">
                  Try adjusting your search query or selecting &quot;All Fabrics&quot;.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 rounded-full bg-[#0F3826] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelectProduct={handleSelectProduct}
                    onOrderNow={(p) => handleOpenOrderModal(p)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Contact Section */}
          <ContactSection settings={settings} />
        </main>
      )}

      {/* Footer (Strictly Zero Return Policy Mentions) */}
      <Footer
        settings={settings}
        onOpenOwnerAuth={() => setIsOwnerAuthOpen(true)}
        onOpenTracking={() => handleNavigateToTrack()}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={activeProductForDetail}
        categories={categories}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onOrderNow={(p, col, qty) => handleOpenOrderModal(p, col, qty)}
      />

      {/* Customer 13-Field Order Modal */}
      <OrderModal
        product={activeProductForOrder}
        initialColour={orderModalColour}
        initialQuantity={orderModalQuantity}
        paymentMethods={paymentMethods}
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setActiveProductForOrder(null);
        }}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success & WhatsApp Handoff Modal */}
      {orderSuccessData && (
        <OrderSuccessModal
          order={orderSuccessData.order}
          orderId={orderSuccessData.orderId}
          trackingToken={orderSuccessData.trackingToken}
          whatsappUrl={orderSuccessData.whatsappUrl}
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          onTrackOrder={(tok) => {
            setIsSuccessModalOpen(false);
            handleNavigateToTrack(tok);
          }}
        />
      )}

      {/* Owner Auth Modal */}
      <OwnerAuthModal
        isOpen={isOwnerAuthOpen}
        onClose={() => setIsOwnerAuthOpen(false)}
        onAuthSuccess={() => {
          setIsOwnerAuthenticated(true);
          setIsOwnerDashboardOpen(true);
        }}
      />

      {/* Owner Full Dashboard (All 8 Tabs) */}
      {isOwnerDashboardOpen && (
        <OwnerDashboard
          onClose={() => setIsOwnerDashboardOpen(false)}
          onLogout={() => {
            setIsOwnerAuthenticated(false);
            setIsOwnerDashboardOpen(false);
          }}
        />
      )}
    </div>
  );
}
