import React from 'react';
import { ShoppingBag, Eye, Share2, Check, Sparkles } from 'lucide-react';
import { Product } from '../types.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onOrderNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onOrderNow,
}) => {
  const [copied, setCopied] = React.useState(false);

  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80';
  const isOutOfStock = product.stock_quantity <= 0;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl overflow-hidden border border-[#0F3826]/10 hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-[#F2ECE1]">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <span className="px-2.5 py-1 bg-amber-600/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-sm">
              Only {product.stock_quantity} Left
            </span>
          )}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-red-700/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-sm">
              Out of Stock
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#0F3826]/90 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-sm border border-[#D4AF37]/30">
              In Stock ({product.stock_quantity})
            </span>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          title="Copy Permanent Product Link"
          aria-label="Copy Product Link"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-[#0F3826] hover:text-[#D4AF37] shadow-md transition-all z-10"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {/* Quick view button overlay */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="flex-1 py-2 bg-white/95 hover:bg-white text-[#0F3826] font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Colours Preview */}
          {product.available_colours && product.available_colours.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#1A261D]/60 mr-1">Colours:</span>
              {product.available_colours.slice(0, 4).map((col, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#0F3826]/10 text-[10px] font-medium text-[#0F3826]"
                >
                  {col}
                </span>
              ))}
              {product.available_colours.length > 4 && (
                <span className="text-[10px] font-bold text-[#D4AF37]">
                  +{product.available_colours.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#0F3826] line-clamp-2 mb-1.5 group-hover:text-[#B89628] transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-[#1A261D]/70 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-[#0F3826]/10 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#1A261D]/50 block">Price</span>
            <span className="font-cinzel font-extrabold text-base sm:text-lg text-[#0F3826]">
              {formatPkr(product.price_pkr)}
            </span>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onOrderNow(product);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
