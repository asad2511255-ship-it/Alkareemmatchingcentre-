import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface HeroSectionProps {
  settings: StoreSettings;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings, onExploreClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0F3826] via-[#0B2A1D] to-[#FAF7F2] text-[#FAF7F2] pt-8 pb-14 sm:pb-20">
      {/* Subtle ornamental patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#14532D]/80 border border-[#D4AF37]/50 text-[#D4AF37] text-xs uppercase tracking-widest font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pakistani Matching Speciality</span>
          </div>

          {/* Main Brand Title */}
          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-wide text-[#FAF7F2] mb-4">
            AL KAREEM <span className="text-[#D4AF37]">MATCHING</span> CENTRE
          </h1>

          {/* Exact Brand Description Required */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#092217]/70 backdrop-blur-md border border-[#D4AF37]/30 shadow-xl mb-8">
            <p className="font-playfair text-lg sm:text-2xl text-[#FAF7F2] italic leading-relaxed">
              &ldquo;{settings.homepage_description || 'Premium Quality Fabrics, Beautiful Designs, and Multiple Colours. Only Online Payment Accepted.'}&rdquo;
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onExploreClick}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#092217] font-bold text-sm tracking-wide shadow-lg hover:shadow-[#D4AF37]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Explore Collection</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href="https://wa.me/923067341386"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-[#14532D]/70 hover:bg-[#14532D] text-[#FAF7F2] font-semibold text-sm border border-[#D4AF37]/40 shadow-sm transition-all"
            >
              Consult On WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
