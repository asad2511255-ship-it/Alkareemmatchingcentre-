import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, Copy, Check, Truck, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Order } from '../types.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface OrderSuccessModalProps {
  order: Order | null;
  orderId: string;
  trackingToken: string;
  whatsappUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (token: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  orderId,
  trackingToken,
  whatsappUrl,
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyTrackingLink = () => {
    const url = `${window.location.origin}/track/${trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-[#D4AF37] flex flex-col my-auto text-center p-6 sm:p-8">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
          Order Confirmed &amp; Recorded
        </span>

        <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-[#0F3826] mt-1 mb-2">
          Thank You, {order?.customer_name || 'Valued Customer'}!
        </h2>

        <p className="text-xs text-[#1A261D]/75 mb-6">
          Your order has been permanently recorded in our database.
        </p>

        {/* 6-Digit Order ID Hero Card */}
        <div className="bg-[#0F3826] text-[#FAF7F2] p-5 rounded-2xl border border-[#D4AF37]/50 shadow-xl mb-6">
          <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-semibold block mb-1">
            Your 6-Digit Order ID
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest">
              {orderId}
            </span>
            <button
              onClick={handleCopyId}
              title="Copy Order ID"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] transition-all"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-[#FAF7F2]/70 mt-2 block">
            Keep this Order ID for phone verification and tracking.
          </span>
        </div>

        {/* Address Confirmation Card */}
        {order && (
          <div className="bg-[#FAF7F2] border border-[#0F3826]/10 rounded-2xl p-3.5 mb-6 text-left text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">
              Delivery Address Saved
            </span>
            <p className="font-semibold text-[#0F3826]">
              {order.customer_name} &bull; {order.customer_phone}
            </p>
            <p className="text-[#1A261D]/80">
              {order.delivery_address}, {order.customer_city}
            </p>
          </div>
        )}

        {/* WhatsApp Handoff Status */}
        <div className="bg-[#E7F8EE] border border-emerald-300 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F3826]">
                Order Saved &amp; Sent to WhatsApp (آرڈر محفوظ اور روانہ)
              </h4>
              <p className="text-xs text-[#1A261D]/80 leading-relaxed mt-0.5">
                Your order is saved in the owner panel. If WhatsApp opened, simply tap <strong>&apos;Send&apos;</strong> in WhatsApp. If it didn&apos;t open automatically on your device, tap below:
              </p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open WhatsApp Chat (03067341386)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Tracking & Details Action */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(trackingToken);
            }}
            className="w-full py-3 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>View 3-Step Live Order Tracking</span>
          </button>

          <button
            onClick={handleCopyTrackingLink}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#0F3826] border border-[#0F3826]/20 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tracking Link Copied!' : 'Copy Permanent Tracking Link'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-xs text-[#1A261D]/60 hover:text-[#0F3826] font-medium"
        >
          Return to Storefront
        </button>
      </div>
    </div>
  );
};
