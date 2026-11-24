'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faCakeCandles, faFire } from '@fortawesome/free-solid-svg-icons';
import { ProductWithImages } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ProductCardProps {
  product: ProductWithImages;
  onOpenModal: (product: ProductWithImages) => void;
  index?: number;
}

export default function ProductCard({ product, onOpenModal }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    '';

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const success = addToCart(product, 1);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1200);
    }
  };

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <FontAwesomeIcon icon={faCakeCandles} className="text-3xl text-slate-300" />
          </div>
        )}

        {/* Minimalist Stock Warning Badge only if Out of Stock or Low */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500 text-white shadow-sm">
              สินค้าหมด
            </span>
          </div>
        )}


      </div>

      {/* Card Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Subtle Category Tag (Un-slopped: clean text, no box) */}
          <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 mb-1 block">
            {product.category}
          </span>

          <div className="flex justify-between items-baseline gap-2 mb-1.5">
            <h3 className="font-medium text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <span className="font-semibold text-base text-slate-900 font-rubik flex-shrink-0">
              ฿{product.price}
            </span>
          </div>

          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4 font-light">
            {product.description}
          </p>

          {/* Sales & Stock Stats (Un-slopped: clean text only, background & borders removed) */}
          <div className="flex items-center justify-between text-xs py-2.5 mb-3.5 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-normal">
              ขายไปแล้ว {product.sold || 0} ชิ้น
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              {isOutOfStock ? (
                <span className="text-rose-500 font-medium">สินค้าหมด</span>
              ) : (
                <span>เหลือ {product.stock} ชิ้น</span>
              )}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isOutOfStock ? (
            <Button
              variant="outline"
              size="md"
              disabled
              className="w-full text-slate-400 bg-slate-50 border-slate-200 text-xs"
            >
              สินค้าหมดชั่วคราว
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className={`w-full transition-all duration-200 text-xs font-medium ${
                isAdded ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              }`}
              onClick={handleQuickAdd}
            >
              {isAdded ? (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 mr-1.5" />
                  <span>เพิ่มลงตะกร้าแล้ว</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5 mr-1.5" />
                  <span>เพิ่มลงตะกร้า</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
