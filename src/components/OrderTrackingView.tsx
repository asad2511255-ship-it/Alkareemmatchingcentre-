import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, Truck, PackageCheck, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import { TrackOrderResponse } from '../types.ts';
import { api } from '../utils/api.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface OrderTrackingViewProps {
  initialToken?: string;
  onBackToStore: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialToken,
  onBackToStore,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [orderIdInput, setOrderIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [lookupMode, setLookupMode] = useState<'token' | 'id_phone'>(initialToken ? 'token' : 'id_phone');

  const [order, setOrder] = useState<TrackOrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialToken) {
      loadByToken(initialToken);
    }
  }, [initialToken]);

  const loadByToken = async (tok: string) => {
    if (!tok.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.trackOrder(tok.trim());
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to find order with this tracking link.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupMode === 'token') {
      loadByToken(tokenInput);
    } else {
      if (!orderIdInput.trim() || !phoneInput.trim()) {
        setError('Both 6-Digit Order ID and Customer Phone are required.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await api.trackOrderByLookup(orderIdInput.trim(), phoneInput.trim());
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Order lookup failed. Please verify your Order ID and Phone Number.');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
  };

  // Determine active step index
  // Step 1: In Review (0)
  // Step 2: Payment Verified (1)
  // Step 3: Completed (2)
  const currentStatus = order?.order_status || 'In Review';
  let activeStep = 0;
  if (currentStatus === 'Payment Verified') activeStep = 1;
  if (currentStatus === 'Completed') activeStep = 2;

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#0F3826] hover:text-[#D4AF37] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] block mb-1">
            AL KAREEM MATCHING CENTRE
          </span>
          <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-[#0F3826]">
            Secure Order Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#1A261D]/70 mt-2 max-w-md mx-auto">
            View verified status transitions, estimated delivery dates, and processing history in real-time.
          </p>
        </div>

        {/* Lookup Box if no order or searching another */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F3826]/10 shadow-lg mb-8">
          <div className="flex border-b border-[#0F3826]/10 pb-3 mb-6 gap-4">
            <button
              onClick={() => {
                setLookupMode('id_phone');
                setError(null);
              }}
              className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                lookupMode === 'id_phone'
                  ? 'border-[#0F3826] text-[#0F3826]'
                  : 'border-transparent text-[#1A261D]/50 hover:text-[#0F3826]'
              }`}
            >
              Search by Order ID &amp; Phone
            </button>
            <button
              onClick={() => {
                setLookupMode('token');
                setError(null);
              }}
              className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${
                lookupMode === 'token'
                  ? 'border-[#0F3826] text-[#0F3826]'
                  : 'border-transparent text-[#1A261D]/50 hover:text-[#0F3826]'
              }`}
            >
              Search by Tracking Token
            </button>
          </div>

          <form onSubmit={handleLookupSubmit} className="space-y-4">
            {lookupMode === 'id_phone' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                    6-Digit Order ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 477383"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2.5 text-sm font-mono border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                    Customer Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 03001234567"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                  Secure Tracking Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste your private tracking token..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2.5 text-sm font-mono border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                />
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching Database...' : 'Track Order'}</span>
            </button>
          </form>
        </div>

        {/* Order Details & Progress if loaded */}
        {order && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#0F3826]/10 shadow-xl space-y-8 animate-fadeIn">
            {/* Top Order Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#0F3826]/10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A261D]/50 block">
                  Tracking Order
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0F3826]">
                  #{order.order_id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A261D]/50 block">
                  Date Placed
                </span>
                <span className="text-xs font-semibold text-[#1A261D]">
                  {new Date(order.created_at).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* THREE-STEP ORDER PROGRESS TRACKER */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F3826] mb-6">
                Three-Step Order Progress
              </h3>

              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-[#0F3826] transition-all duration-500"
                    style={{
                      width: activeStep === 0 ? '0%' : activeStep === 1 ? '50%' : '100%',
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
                  {/* STEP 1: IN REVIEW */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
                        activeStep >= 0
                          ? 'bg-[#0F3826] text-[#D4AF37] ring-4 ring-[#FAF7F2]'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      1
                    </div>
                    <span className="font-bold text-xs mt-3 text-[#0F3826]">
                      Step 1
                    </span>
                    <span className="text-[11px] font-semibold text-[#1A261D]">
                      In Review
                    </span>
                  </div>

                  {/* STEP 2: PAYMENT VERIFIED */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
                        activeStep >= 1
                          ? 'bg-[#0F3826] text-[#D4AF37] ring-4 ring-[#FAF7F2]'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      2
                    </div>
                    <span className="font-bold text-xs mt-3 text-[#0F3826]">
                      Step 2
                    </span>
                    <span className="text-[11px] font-semibold text-[#1A261D]">
                      Payment Verified
                    </span>
                  </div>

                  {/* STEP 3: COMPLETED */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
                        activeStep >= 2
                          ? 'bg-emerald-600 text-white ring-4 ring-[#FAF7F2]'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      3
                    </div>
                    <span className="font-bold text-xs mt-3 text-[#0F3826]">
                      Step 3
                    </span>
                    <span className="text-[11px] font-semibold text-[#1A261D]">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Message Display Box */}
              <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#D4AF37]/40 shadow-sm">
                {activeStep === 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                      Current Status: In Review
                    </span>
                    <p className="text-sm font-medium text-[#1A261D]">
                      &ldquo;In Review — Your order has been received and your payment is awaiting verification.&rdquo;
                    </p>
                    <p className="text-xs text-[#1A261D]/70 pt-1">
                      Our accounts team is reviewing your uploaded payment proof against the received bank/wallet transfer. Once verified, your delivery date will appear here.
                    </p>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        Payment Verified
                      </span>
                    </div>
                    {order.estimated_delivery_date ? (
                      <div className="bg-white p-3 rounded-xl border border-emerald-300">
                        <span className="text-[11px] uppercase font-semibold text-emerald-900 block">
                          Scheduled Delivery
                        </span>
                        <strong className="text-base text-[#0F3826] font-cinzel">
                          Estimated Delivery: {order.estimated_delivery_date}
                        </strong>
                      </div>
                    ) : (
                      <p className="text-xs text-[#1A261D]/70">
                        Payment verified. Delivery schedule being updated by store owner.
                      </p>
                    )}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-1 text-emerald-900">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-emerald-600" />
                      <strong className="text-base font-cinzel font-bold">
                        Completed — Your order has been completed.
                      </strong>
                    </div>
                    <p className="text-xs text-emerald-800/80">
                      Your fabrics have been dispatched and finalized. Thank you for choosing AL KAREEM MATCHING CENTRE!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#0F3826]/10 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F3826] block">
                Ordered Item Details
              </span>
              <div className="flex items-center gap-4">
                {order.product_image_snapshot && (
                  <img
                    src={order.product_image_snapshot}
                    alt=""
                    className="w-16 h-16 object-cover rounded-xl border border-[#0F3826]/15 bg-white shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-base text-[#0F3826] truncate">
                    {order.product_name_snapshot}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs text-[#1A261D]/70 mt-1">
                    <span>Colour: <strong className="text-[#0F3826]">{order.selected_colour}</strong></span>
                    <span>&bull;</span>
                    <span>Qty: <strong className="text-[#0F3826]">{order.quantity}</strong></span>
                  </div>
                  <div className="font-cinzel font-extrabold text-[#0F3826] text-base mt-1">
                    Total: {formatPkr(order.total_price)}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Destination */}
            {(order.delivery_address || order.customer_name) && (
              <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#0F3826]/10 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F3826] block">
                  Delivery Destination
                </span>
                <div className="text-xs space-y-1">
                  {order.customer_name && (
                    <div className="font-semibold text-[#0F3826]">
                      Recipient: <span className="text-[#1A261D] font-medium">{order.customer_name}</span>
                    </div>
                  )}
                  {order.delivery_address && (
                    <div className="text-[#1A261D]/80">
                      Address: <span className="font-medium text-[#1A261D]">{order.delivery_address}{order.customer_city ? `, ${order.customer_city}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F3826] block">
                  Processing Audit Timeline
                </span>
                <div className="space-y-2">
                  {order.status_history.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white border border-[#0F3826]/10 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-[#0F3826] block">{h.status}</span>
                        <span className="text-[#1A261D]/70">{h.note}</span>
                      </div>
                      <span className="text-[10px] text-[#1A261D]/50 font-mono whitespace-nowrap">
                        {new Date(h.timestamp).toLocaleDateString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
