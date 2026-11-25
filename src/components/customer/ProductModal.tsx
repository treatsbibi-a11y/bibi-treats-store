'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setIsAdded(false);
  }, [product?.id]);

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
      {/* Full-bleed Dimmed Backdrop (oversized to eliminate mobile Safari bottom seam) */}
      <div
        className="fixed -inset-16 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-slate-200/80 max-h-[92dvh] overflow-y-auto">
          {/* Mobile Handle */}
          <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-900 shadow-subtle flex items-center justify-center transition-all border border-slate-200/80 cursor-pointer"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="p-5 sm:p-6 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
              <div className="aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/70 mb-3 sm:mb-4 shadow-subtle flex items-center justify-center">
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faCakeCandles} className="text-4xl text-slate-300" />
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border transition-all flex-shrink-0 cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'ring-2 ring-brand-600 ring-offset-2 border-transparent scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
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
            <div className="p-5 sm:p-7 pb-[calc(4.5rem+env(safe-area-inset-bottom,1rem))] sm:pb-7 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-600">
                    {product.category}
                  </span>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                      สินค้าหมดชั่วคราว
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      เหลือเพียง {product.stock} ชิ้น
                    </span>
                  ) : null}
                </div>

                <h2 className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
                  {product.name}
                </h2>

                <div className="font-mono text-2xl font-bold text-slate-900 mb-3 sm:mb-4">
                  ฿{product.price.toLocaleString()}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-5 sm:mb-6">
                  {product.description}
                </p>
              </div>

              {/* Order Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-slate-600">จำนวน</span>
                    <div className="inline-flex items-center bg-slate-50/80 border border-slate-200 rounded-full p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center font-mono text-sm font-bold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
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
                  className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isAdded
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-none'
                      : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white shadow-sm'
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
