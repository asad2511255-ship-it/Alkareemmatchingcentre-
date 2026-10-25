import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, ShoppingBag, Loader2, ArrowRight, ShieldCheck, Smartphone, MessageSquare } from 'lucide-react';
import { Product, PaymentMethod, Order } from '../types.ts';
import { api } from '../utils/api.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface OrderModalProps {
  product: Product | null;
  initialColour?: string;
  initialQuantity?: number;
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (data: {
    orderId: string;
    trackingToken: string;
    order: Order;
    whatsappUrl: string;
  }) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  product,
  initialColour,
  initialQuantity = 1,
  paymentMethods,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedColour, setSelectedColour] = useState(initialColour || '');
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

  // Payment proof options: 'upload' | 'whatsapp'
  const [proofDeliveryMode, setProofDeliveryMode] = useState<'upload' | 'whatsapp'>('upload');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadedProofData, setUploadedProofData] = useState<{ filename: string; path: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    if (product) {
      setSelectedColour(initialColour || product.available_colours?.[0] || '');
      setQuantity(initialQuantity || 1);
      setIdempotencyKey(`idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
      setErrorMessage(null);
    }
  }, [product, initialColour, initialQuantity, isOpen]);

  // Set default active payment method if available
  useEffect(() => {
    const active = paymentMethods.filter((m) => m.is_active);
    if (active.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(active[0].id);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

  if (!isOpen || !product) return null;

  const activeMethods = paymentMethods.filter((m) => m.is_active);
  const currentPaymentMethod = activeMethods.find((m) => m.id === selectedPaymentMethodId) || activeMethods[0];

  const unitPrice = product.price_pkr;
  const totalPrice = unitPrice * quantity;

  // Handle Proof File Change & immediate private upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid file format. Please upload JPG, JPEG, PNG, or WebP screenshot.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setErrorMessage(null);
    setUploadingProof(true);

    try {
      const res = await api.uploadPaymentProof(file);
      setUploadedProofData({
        filename: res.filename,
        path: res.path,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment proof upload failed. Please try again.');
      setProofFile(null);
      setProofPreview(null);
      setUploadedProofData(null);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setUploadedProofData(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your Customer Full Name.');
      return;
    }
    if (!customerCity.trim()) {
      setErrorMessage('Please enter your City.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your Customer Phone Number.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter your complete Delivery Address.');
      return;
    }
    if (!selectedColour) {
      setErrorMessage('Please choose a Selected Colour.');
      return;
    }
    if (!product.available_colours.includes(selectedColour)) {
      setErrorMessage(`Selected colour "${selectedColour}" is not available for this fabric.`);
      return;
    }
    if (quantity <= 0 || quantity > product.stock_quantity) {
      setErrorMessage(`Invalid quantity. Available stock: ${product.stock_quantity}`);
      return;
    }

    const effectivePaymentMethodId = selectedPaymentMethodId || currentPaymentMethod?.id || 'pm-default';

    // Payment proof resolution: file upload or WhatsApp
    let finalProofFilename = 'send_via_whatsapp';
    let finalProofPath = 'send_via_whatsapp';

    if (proofDeliveryMode === 'upload') {
      if (uploadedProofData?.filename) {
        finalProofFilename = uploadedProofData.filename;
        finalProofPath = uploadedProofData.path;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_city: customerCity.trim(),
        delivery_address: deliveryAddress.trim(),
        product_id: product.id,
        selected_colour: selectedColour,
        quantity,
        payment_method_id: effectivePaymentMethodId,
        payment_proof_filename: finalProofFilename,
        payment_proof_path: finalProofPath,
        idempotency_key: idempotencyKey,
      });

      // Safely open WhatsApp in a new tab / external app without navigating the current iframe window
      const whatsappUrl = response.whatsappUrl;
      try {
        const waWin = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!waWin) {
          const link = document.createElement('a');
          link.href = whatsappUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 1000);
        }
      } catch (openErr) {
        console.warn('Could not auto-open WhatsApp:', openErr);
      }

      onClose();
      onOrderSuccess({
        orderId: response.orderId,
        trackingToken: response.trackingToken,
        order: response.order,
        whatsappUrl: response.whatsappUrl,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit order. Please check all fields and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 flex flex-col my-auto max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="bg-[#0F3826] text-[#FAF7F2] px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
              Checkout &bull; Online Payment Only
            </span>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide">
              Complete Your Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmitOrder} className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Please correct the following:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Customer & Delivery Information (Clean, No Numbers) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F3826] pb-1 border-b border-[#0F3826]/15">
              Customer &amp; Delivery Information
            </h3>

            {/* Customer Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                Customer Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fatima Zahra / Muhammad Ali"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826] focus:ring-1 focus:ring-[#0F3826]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore, Karachi, Fatehpur, Islamabad"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826] focus:ring-1 focus:ring-[#0F3826]"
                />
              </div>

              {/* Customer Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                  Customer Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826] focus:ring-1 focus:ring-[#0F3826]"
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="House / Flat / Shop Number, Street / Mohalla, Landmark, Area"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826] focus:ring-1 focus:ring-[#0F3826]"
              />
            </div>
          </div>

          {/* Product & Matching Options (Clean, No Numbers) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F3826] pb-1 border-b border-[#0F3826]/15">
              Product &amp; Matching Options
            </h3>

            {/* Selected Product Snapshot */}
            <div className="bg-white p-3.5 rounded-xl border border-[#0F3826]/15 flex items-center gap-3">
              <img
                src={product.images?.[0] || ''}
                alt=""
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-[#0F3826]/10"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">Selected Product</span>
                <span className="font-serif font-bold text-sm text-[#0F3826] truncate block">{product.name}</span>
                <span className="text-[11px] text-[#1A261D]/60 font-mono">Product ID: {product.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selected Colour */}
              <div>
                <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                  Selected Colour <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedColour}
                  onChange={(e) => setSelectedColour(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                >
                  {product.available_colours.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-[#1A261D] mb-1">
                  Quantity (Meters / Items) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                    className="w-full bg-white rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 focus:outline-none focus:border-[#0F3826]"
                  />
                  <span className="text-xs text-[#1A261D]/60 shrink-0">
                    (Max: {product.stock_quantity})
                  </span>
                </div>
              </div>
            </div>

            {/* Unit Price & Total Price */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#D4AF37]/30">
              <div>
                <span className="text-[11px] uppercase font-semibold text-[#1A261D]/60 block">
                  Unit Price
                </span>
                <span className="font-cinzel text-base sm:text-lg font-bold text-[#0F3826]">
                  {formatPkr(unitPrice)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase font-semibold text-[#1A261D]/60 block">
                  Total Price
                </span>
                <span className="font-cinzel text-xl sm:text-2xl font-extrabold text-[#0F3826]">
                  {formatPkr(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Online Payment (Clean, No Numbers) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F3826] pb-1 border-b border-[#0F3826]/15">
              Online Payment &amp; Instructions
            </h3>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-[#1A261D] mb-1.5">
                Payment Method <span className="text-red-500">*</span>
              </label>

              {activeMethods.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1">
                  <strong>Online Transfer / JazzCash / EasyPaisa</strong>
                  <p>Send payment to <strong>03067341386</strong> (Muhammad Kareem, AL KAREEM MATCHING CENTRE).</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeMethods.map((m) => {
                    const isSelected = (selectedPaymentMethodId === m.id) || (!selectedPaymentMethodId && m.id === activeMethods[0].id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethodId(m.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#0F3826] text-[#FAF7F2] border-[#D4AF37] shadow-md'
                            : 'bg-white text-[#1A261D] border-[#0F3826]/15 hover:border-[#0F3826]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{m.provider_name}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          )}
                        </div>
                        <span className={`text-[11px] ${isSelected ? 'text-[#FAF7F2]/80' : 'text-[#1A261D]/70'}`}>
                          {m.bank_or_wallet_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            {currentPaymentMethod && (
              <div className="bg-white p-4 rounded-2xl border border-[#D4AF37]/40 shadow-sm space-y-3">
                <span className="text-[11px] uppercase font-bold text-[#0F3826] block">
                  Payment Instructions for {currentPaymentMethod.provider_name}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-[#1A261D]/60 block font-semibold uppercase">Account Holder</span>
                    <strong className="text-[#0F3826] font-bold">{currentPaymentMethod.account_holder_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#1A261D]/60 block font-semibold uppercase">Account / IBAN / Wallet #</span>
                    <strong className="text-[#0F3826] font-mono font-bold select-all">{currentPaymentMethod.account_number_or_iban}</strong>
                  </div>
                </div>

                <p className="text-xs text-[#1A261D]/80 whitespace-pre-line leading-relaxed">
                  {currentPaymentMethod.payment_instructions}
                </p>

                {currentPaymentMethod.qr_code_url && (
                  <div className="pt-2 border-t border-[#0F3826]/10 flex items-center gap-4">
                    <img
                      src={currentPaymentMethod.qr_code_url}
                      alt="Payment QR"
                      className="w-24 h-24 object-contain rounded-lg border border-[#0F3826]/15 bg-white p-1"
                    />
                    <div className="text-xs text-[#1A261D]/70">
                      Scan this QR code with your {currentPaymentMethod.provider_name} app to pay instantly.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Proof Selection */}
            <div className="bg-white p-4 rounded-2xl border border-[#0F3826]/20 space-y-3">
              <label className="block text-xs font-semibold text-[#1A261D]">
                Payment Proof
              </label>

              {/* Toggle proof mode */}
              <div className="flex gap-2 p-1 bg-[#FAF7F2] rounded-xl border border-[#0F3826]/15 text-xs">
                <button
                  type="button"
                  onClick={() => setProofDeliveryMode('upload')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    proofDeliveryMode === 'upload'
                      ? 'bg-[#0F3826] text-[#D4AF37] shadow-sm'
                      : 'text-[#1A261D]/70 hover:text-[#0F3826]'
                  }`}
                >
                  Upload Screenshot Now
                </button>
                <button
                  type="button"
                  onClick={() => setProofDeliveryMode('whatsapp')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    proofDeliveryMode === 'whatsapp'
                      ? 'bg-[#0F3826] text-[#D4AF37] shadow-sm'
                      : 'text-[#1A261D]/70 hover:text-[#0F3826]'
                  }`}
                >
                  Send Screenshot on WhatsApp
                </button>
              </div>

              {proofDeliveryMode === 'upload' ? (
                !proofPreview ? (
                  <label className="border-2 border-dashed border-[#0F3826]/30 hover:border-[#D4AF37] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-colors">
                    <Upload className="w-8 h-8 text-[#0F3826] mb-2" />
                    <span className="text-xs font-bold text-[#0F3826]">
                      Click to upload transfer screenshot (JPG, PNG, WebP)
                    </span>
                    <span className="text-[10px] text-[#1A261D]/60 mt-0.5">
                      Maximum file size: 10MB
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-4 bg-[#FAF7F2] p-3 rounded-xl border border-emerald-300">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="w-16 h-16 object-cover rounded-lg border border-[#0F3826]/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {uploadingProof ? 'Uploading...' : 'Payment Proof Attached'}
                      </span>
                      <span className="text-[11px] text-[#1A261D]/60 truncate block">
                        {proofFile?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveProof}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1 rounded-md bg-white border border-red-200"
                    >
                      Replace
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <MessageSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Attach proof in WhatsApp</strong>
                    <span>You can submit your order now. When WhatsApp opens with your order details, simply attach your payment screenshot to the message.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Order Button */}
          <div className="pt-4 border-t border-[#0F3826]/15">
            <button
              type="submit"
              disabled={isSubmitting || uploadingProof}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-base font-bold">Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
