import React, { useState } from 'react';
import { ShoppingBag, Search, MoreVertical, ShieldCheck, Truck, LogIn, LayoutDashboard } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface NavbarProps {
  settings: StoreSettings;
  onOpenOwnerAuth: () => void;
  isOwnerAuthenticated: boolean;
  onOpenOwnerDashboard: () => void;
  onOpenTracking: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenOwnerAuth,
  isOwnerAuthenticated,
  onOpenOwnerDashboard,
  onOpenTracking,
  searchQuery,
  onSearchChange,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F3826] text-[#FAF7F2] shadow-md border-b border-[#D4AF37]/30">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14532D] to-[#092217] border border-[#D4AF37] flex items-center justify-center shadow-inner text-[#D4AF37] font-cinzel font-bold text-xl tracking-wider">
              AK
            </div>
            <div>
              <span className="block text-xl sm:text-2xl font-cinzel font-bold tracking-wider text-[#FAF7F2] drop-shadow-sm">
                AL KAREEM
              </span>
              <span className="block text-[11px] sm:text-xs font-medium tracking-[0.22em] text-[#D4AF37] uppercase -mt-0.5">
                Matching Centre
              </span>
            </div>
          </div>

          {/* Search bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search matching fabrics, dupattas, silk..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#FAF7F2]/10 text-[#FAF7F2] placeholder-[#FAF7F2]/60 rounded-full pl-11 pr-4 py-2.5 text-sm border border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] focus:bg-[#FAF7F2]/15 transition-all"
              />
              <Search className="w-4 h-4 text-[#D4AF37] absolute left-4 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-2.5 text-xs text-[#FAF7F2]/60 hover:text-[#FAF7F2] bg-white/10 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Search"
              className="md:hidden p-2 text-[#FAF7F2]/90 hover:text-[#D4AF37] hover:bg-white/5 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Track Order Button */}
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium text-[#FAF7F2] bg-[#14532D]/80 hover:bg-[#14532D] border border-[#D4AF37]/40 rounded-full shadow-sm hover:border-[#D4AF37] transition-all shrink-0"
            >
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              <span className="font-semibold whitespace-nowrap">Track Order</span>
            </button>

            {/* Owner Quick Dashboard if logged in */}
            {isOwnerAuthenticated && (
              <button
                onClick={onOpenOwnerDashboard}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-[#092217] bg-[#D4AF37] hover:bg-[#F3E7C4] rounded-full shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Owner Dashboard</span>
              </button>
            )}

            {/* Three-dot menu containing Owner Login */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Options Menu"
                className="p-2 text-[#FAF7F2]/90 hover:text-[#D4AF37] hover:bg-white/10 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-[#092217] border border-[#D4AF37]/40 rounded-xl shadow-2xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-[#D4AF37]/20 text-xs text-[#FAF7F2]/60">
                      Store Options
                    </div>
                    {isOwnerAuthenticated ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenOwnerDashboard();
                        }}
                        className="w-full text-left px-4 py-2.5 text-[#D4AF37] hover:bg-white/5 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Owner Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenOwnerAuth();
                        }}
                        className="w-full text-left px-4 py-2.5 text-[#FAF7F2] hover:text-[#D4AF37] hover:bg-white/5 flex items-center gap-2 font-medium"
                      >
                        <LogIn className="w-4 h-4 text-[#D4AF37]" />
                        Owner Login
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenTracking();
                      }}
                      className="w-full text-left px-4 py-2.5 text-[#FAF7F2] hover:text-[#D4AF37] hover:bg-white/5 flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-[#D4AF37]" />
                      Track Customer Order
                    </button>
                    <a
                      href="https://wa.me/923067341386"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2.5 text-[#FAF7F2] hover:text-[#D4AF37] hover:bg-white/5"
                    >
                      WhatsApp Customer Care
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search input expand */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-4 pt-1">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search matching fabrics, dupattas, silk..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full bg-[#FAF7F2]/10 text-[#FAF7F2] placeholder-[#FAF7F2]/60 rounded-full pl-10 pr-4 py-2.5 text-sm border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3.5" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
