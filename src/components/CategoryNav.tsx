import React from 'react';
import { Category } from '../types.ts';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  activeCount: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  activeCount,
}) => {
  return (
    <div className="w-full bg-[#FAF7F2] py-4 border-b border-[#0F3826]/10 sticky top-20 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 'All' Category */}
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                selectedCategoryId === 'all'
                  ? 'bg-[#0F3826] text-[#D4AF37] shadow-md border border-[#D4AF37]'
                  : 'bg-white text-[#1A261D] hover:bg-[#FAF7F2] border border-[#0F3826]/15 hover:border-[#0F3826]/40'
              }`}
            >
              All Fabrics
            </button>

            {/* Dynamic categories from database */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#0F3826] text-[#D4AF37] shadow-md border border-[#D4AF37]'
                      : 'bg-white text-[#1A261D] hover:bg-[#FAF7F2] border border-[#0F3826]/15 hover:border-[#0F3826]/40'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block text-xs font-medium text-[#1A261D]/60 shrink-0">
            Showing <span className="font-bold text-[#0F3826]">{activeCount}</span> available products
          </div>
        </div>
      </div>
    </div>
  );
};
