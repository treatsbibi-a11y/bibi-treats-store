'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPlus,
  faMinus,
  faCheck,
  faBagShopping,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { ProductWithImages } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: ProductWithImages | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const images =
    product.images && product.images.length > 0
      ? [...product.images].sort((a, b) => a.displayOrder - b.displayOrder)
      : [];

  const currentImageUrl = images[selectedImageIndex]?.imageUrl || '';
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const success = addToCart(product, quantity);
    if (success) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Warm Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-[#120F0D]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl overflow-hidden border border-[#EFEAE2] my-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#6B6155] hover:text-[#2A2421] shadow-sm flex items-center justify-center transition-all border border-[#EFEAE2]/80"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="p-6 bg-[#F5F0EB]/50 border-b md:border-b-0 md:border-r border-[#EFEAE2] flex flex-col justify-between">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-[#EFEAE2] mb-4 shadow-sm flex items-center justify-center">
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faCakeCandles} className="text-4xl text-[#D8CEBA]" />
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border transition-all flex-shrink-0 ${
                        selectedImageIndex === idx
                          ? 'ring-2 ring-[#201B17] ring-offset-2 ring-offset-[#FAF8F5] border-transparent scale-105'
                          : 'border-[#EFEAE2] opacity-70 hover:opacity-100 hover:border-[#D8CEBA]'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Column */}
            <div className="p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="mb-2">
                  <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C827A] block mb-1">
                    {product.category}
                  </span>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                      สินค้าหมดชั่วคราว
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      เหลือเพียง {product.stock} ชิ้น
                    </span>
                  ) : null}
                </div>

                <h2 className="font-serif text-[#2A2421] text-2xl font-medium tracking-tight mb-2">
                  {product.name}
                </h2>

                <div className="font-serif text-2xl font-medium text-[#2A2421] mb-4">
                  ฿{product.price.toLocaleString()}
                </div>

                <p className="text-sm text-[#6B6155] leading-relaxed mb-6 font-light">
                  {product.description}
                </p>
              </div>

              {/* Order Controls */}
              <div className="space-y-4 pt-4 border-t border-[#EFEAE2]">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#5C5248]">จำนวน</span>
                    <div className="inline-flex items-center bg-white border border-[#E5DFD5] rounded-full p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C5248] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-[#2A2421]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C5248] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Increase quantity"
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 px-6 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                    isOutOfStock
                      ? 'bg-[#E5DFD5] text-[#9E9488] cursor-not-allowed'
                      : isAdded
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-none'
                      : 'bg-[#201B17] hover:bg-[#342D26] active:scale-[0.99] text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-brand-600" />
                      <span>เพิ่มลงตะกร้าแล้ว</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>สินค้าหมดชั่วคราว</span>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4 opacity-90" />
                      <span>เพิ่มลงตะกร้า · ฿{(product.price * quantity).toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
