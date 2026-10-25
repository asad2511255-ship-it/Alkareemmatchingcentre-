import React from 'react';
import { StoreSettings } from '../types.ts';
import { Phone, MapPin, MessageSquare, ShieldCheck, Truck, Lock } from 'lucide-react';

interface FooterProps {
  settings: StoreSettings;
  onOpenOwnerAuth: () => void;
  onOpenTracking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenOwnerAuth, onOpenTracking }) => {
  const currentYear = 2026;
  const address = settings.business_address || 'Moti Bazar, Link Masjid Wali Gali, Fatehpur';
  const contactNum = settings.contact_number || '03067341386';

  return (
    <footer className="bg-[#092217] text-[#FAF7F2] border-t-2 border-[#D4AF37]/40 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#FAF7F2]/10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14532D] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-cinzel font-bold text-lg">
                AK
              </div>
              <div>
                <span className="block text-xl font-cinzel font-bold tracking-wider text-[#FAF7F2]">
                  AL KAREEM
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#D4AF37] uppercase font-semibold block -mt-1">
                  Matching Centre
                </span>
              </div>
            </div>

            <p className="font-playfair text-sm text-[#FAF7F2]/80 italic max-w-md leading-relaxed">
              &ldquo;{settings.homepage_description || 'Premium Quality Fabrics, Beautiful Designs, and Multiple Colours. Only Online Payment Accepted.'}&rdquo;
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-[#D4AF37]/30 text-[11px] text-[#D4AF37] font-medium">
                100% Online Payment Only
              </span>
              <span className="px-3 py-1 rounded-md bg-white/5 border border-[#D4AF37]/30 text-[11px] text-[#FAF7F2]/80 font-medium">
                Direct WhatsApp Handoff
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
              Customer Services
            </span>
            <ul className="space-y-2 text-xs text-[#FAF7F2]/80">
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Track Order (3-Step Progress)</span>
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/923067341386"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>WhatsApp Fabric Matching Help</span>
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenOwnerAuth}
                  className="hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors text-[#FAF7F2]/60"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Owner Administration Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
              Store Contact
            </span>
            <div className="space-y-2.5 text-xs text-[#FAF7F2]/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-snug">{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`tel:${contactNum}`} className="hover:text-[#D4AF37] font-mono">
                  {contactNum}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-mono">WhatsApp: 03067341386</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FAF7F2]/60">
          <div>
            &copy; {currentYear} AL KAREEM MATCHING CENTRE. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span>Moti Bazar, Fatehpur, Pakistan</span>
            <span>&bull;</span>
            <span>Online Orders &amp; WhatsApp Handoff</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
