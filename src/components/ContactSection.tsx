import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, Building, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface ContactSectionProps {
  settings: StoreSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const contactNum = settings.contact_number || '03067341386';
  const whatsappNum = settings.whatsapp_number || '03067341386';
  const address = settings.business_address || 'Moti Bazar, Link Masjid Wali Gali, Fatehpur';

  return (
    <section className="bg-white py-14 sm:py-16 border-t border-[#0F3826]/10 text-[#1A261D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-[#D4AF37] block mb-1">
            Visit Our Store &bull; Get in Touch
          </span>
          <h2 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-[#0F3826]">
            AL KAREEM MATCHING CENTRE
          </h2>
          <p className="text-xs sm:text-sm text-[#1A261D]/70 mt-2">
            Providing high-quality matching fabrics, unstitched silk, dupattas, and exclusive suit fabrics in Fatehpur and across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Business Address */}
          <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#0F3826]/10 flex flex-col justify-between hover:border-[#D4AF37] transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0F3826] text-[#D4AF37] flex items-center justify-center mb-4 shadow">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F3826] block mb-1">
                Store Location &amp; Address
              </span>
              <p className="text-sm font-semibold text-[#1A261D] leading-relaxed">
                {address}
              </p>
              <span className="text-xs text-[#1A261D]/60 mt-1 block">
                Fatehpur, Punjab, Pakistan
              </span>
            </div>
            <div className="pt-4 mt-4 border-t border-[#0F3826]/10 text-xs text-[#0F3826] font-medium flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#D4AF37]" />
              <span>Physical Retail Matching Centre</span>
            </div>
          </div>

          {/* Card 2: Contact Number */}
          <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#0F3826]/10 flex flex-col justify-between hover:border-[#D4AF37] transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0F3826] text-[#D4AF37] flex items-center justify-center mb-4 shadow">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F3826] block mb-1">
                Direct Phone Line
              </span>
              <p className="text-xl font-bold font-mono text-[#0F3826]">
                {contactNum}
              </p>
              <span className="text-xs text-[#1A261D]/60 mt-1 block">
                Call for stock inquiries, fabric advice, and matching consultations.
              </span>
            </div>
            <div className="pt-4 mt-4 border-t border-[#0F3826]/10">
              <a
                href={`tel:${contactNum}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F3826] hover:text-[#D4AF37] transition-colors"
              >
                <span>Call Store Now</span>
                &rarr;
              </a>
            </div>
          </div>

          {/* Card 3: WhatsApp Orders & Support */}
          <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#0F3826]/10 flex flex-col justify-between hover:border-[#D4AF37] transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center mb-4 shadow">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F3826] block mb-1">
                WhatsApp Order Line
              </span>
              <p className="text-xl font-bold font-mono text-[#0F3826]">
                {whatsappNum}
              </p>
              <span className="text-xs text-[#1A261D]/60 mt-1 block">
                Automatic order handoff, color swatch pictures, and payment proof verification.
              </span>
            </div>
            <div className="pt-4 mt-4 border-t border-[#0F3826]/10">
              <a
                href="https://wa.me/923067341386"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                <span>Message on WhatsApp</span>
                &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
