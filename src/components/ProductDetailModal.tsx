import React, { useState } from 'react';
import { X, ShoppingBag, Share2, Check, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { Product, Category } from '../types.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface ProductDetailModalProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onOrderNow: (product: Product, selectedColour?: string, quantity?: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  isOpen,
  onClose,
  onOrderNow,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColour, setSelectedColour] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedColour(product.available_colours?.[0] || '');
      setQuantity(1);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Fabrics';
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'];

  const isOutOfStock = product.stock_quantity <= 0;

  const handleCopy = () => {
    const permalink = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#D4AF37]/40 flex flex-col my-auto max-h-[92vh]">
        {/* Header Close */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy Permanent Link"
            className="p-2 rounded-full bg-white/90 hover:bg-white text-[#0F3826] shadow-md transition-all flex items-center gap-1 text-xs font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-black shadow-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-2">
          {/* Left: Images */}
          <div className="p-4 sm:p-6 bg-[#F2ECE1] flex flex-col justify-between">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md border border-[#0F3826]/10 mb-4">
              <img
                src={images[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#0F3826] shadow-md transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#0F3826] shadow-md transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Stock badge */}
              <div className="absolute bottom-3 left-3">
                {isOutOfStock ? (
                  <span className="px-3 py-1 bg-red-700 text-white text-xs font-bold rounded-lg shadow">
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#0F3826] text-[#D4AF37] text-xs font-bold rounded-lg shadow border border-[#D4AF37]/30">
                    {product.stock_quantity} In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-[#0F3826] ring-2 ring-[#D4AF37]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Order Form Prefill */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & ID */}
              <div className="flex items-center justify-between text-xs text-[#1A261D]/60 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[#0F3826] bg-[#0F3826]/10 px-2.5 py-1 rounded-md">
                  {categoryName}
                </span>
                <span className="font-mono text-[11px]">ID: {product.id}</span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F3826] mb-3 leading-snug">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-cinzel text-3xl font-extrabold text-[#0F3826]">
                  {formatPkr(product.price_pkr)}
                </span>
                <span className="text-xs text-[#1A261D]/60 font-medium">PKR (Online Payment Only)</span>
              </div>

              {/* Description */}
              <div className="text-sm text-[#1A261D]/80 leading-relaxed mb-6 bg-white/60 p-4 rounded-xl border border-[#0F3826]/10">
                {product.description}
              </div>

              {/* Colour Selection */}
              {product.available_colours && product.available_colours.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3826] mb-2">
                    Select Matching Colour: <span className="text-[#D4AF37] font-semibold">{selectedColour}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.available_colours.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColour(col)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          selectedColour === col
                            ? 'bg-[#0F3826] text-[#D4AF37] border-[#D4AF37] shadow-sm'
                            : 'bg-white text-[#1A261D] border-[#0F3826]/20 hover:border-[#0F3826]'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3826] mb-2">
                  Quantity:
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#0F3826]/20 bg-white rounded-xl overflow-hidden shadow-inner">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3.5 py-2 text-[#0F3826] hover:bg-[#FAF7F2] font-bold text-base disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 font-bold text-[#0F3826] text-sm min-w-10 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      disabled={quantity >= product.stock_quantity || isOutOfStock}
                      className="px-3.5 py-2 text-[#0F3826] hover:bg-[#FAF7F2] font-bold text-base disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-[#1A261D]/60">
                    Max: {product.stock_quantity} in stock
                  </span>
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#D4AF37]/30 flex items-center justify-between mb-6">
                <span className="text-xs font-semibold text-[#1A261D]/70 uppercase">Estimated Total</span>
                <span className="font-cinzel text-xl font-bold text-[#0F3826]">
                  {formatPkr(product.price_pkr * quantity)}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#0F3826]/10 flex flex-col gap-2">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onClose();
                  onOrderNow(product, selectedColour, quantity);
                }}
                className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Proceed to Order ({formatPkr(product.price_pkr * quantity)})</span>
              </button>

              <div className="text-center text-[11px] text-[#1A261D]/60 flex items-center justify-center gap-1.5 pt-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Instant order saving &amp; official WhatsApp message generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
