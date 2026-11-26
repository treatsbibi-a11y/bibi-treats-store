'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
import { formatPrice } from '@/lib/order-utils';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: ProductWithImages | null;
  onClose: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const reduceMotion = useReducedMotion();
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setIsAdded(false);
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [product, onClose]);

  const images =
    product?.images && product.images.length > 0
      ? [...product.images].sort((a, b) => a.displayOrder - b.displayOrder)
      : [];

  const currentImageUrl = images[selectedImageIndex]?.imageUrl || '';
  const isOutOfStock = (product?.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    const success = addToCart(product, quantity);
    if (success) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 700);
    }
  };

  const renderOrderControls = (isMobile: boolean) => {
    if (!product) return null;
    return (
      <div className={`space-y-2.5 sm:space-y-4 ${isMobile ? '' : 'pt-4 border-t border-slate-100'}`}>
        {!isOutOfStock && (
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-600">จำนวน</span>
            <div className="inline-flex items-center bg-slate-50/80 border border-slate-200 rounded-full p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <FontAwesomeIcon icon={faMinus} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <span className="w-8 sm:w-10 text-center font-mono text-xs sm:text-sm font-bold text-slate-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
          </div>
        )}

        <button
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full py-2.5 sm:py-3.5 px-5 sm:px-6 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-[var(--ease-out)] cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isAdded
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-none'
              : 'bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 active:scale-[0.985] text-white shadow-lg shadow-brand-600/20'
          }`}
        >
          {isAdded ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600" />
              <span>เพิ่มลงตะกร้าแล้ว</span>
            </>
          ) : isOutOfStock ? (
            <span>สินค้าหมดชั่วคราว</span>
          ) : (
            <>
              <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-90" />
              <span>เพิ่มลงตะกร้า · ฿{formatPrice(product.price * quantity)}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {product && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain"
        >
          {/* Full-bleed Dimmed Backdrop (oversized to eliminate mobile Safari bottom seam) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="fixed -inset-16 bg-slate-950/55 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.16 : 0.28, ease: EASE_DRAWER }}
              className="pointer-events-auto relative w-full max-w-2xl bg-white rounded-t-[2rem] sm:rounded-3xl shadow-[0_-12px_40px_rgba(15,23,42,0.18)] sm:shadow-2xl overflow-hidden border-t border-white/60 sm:border sm:border-slate-200/80 max-h-[86dvh] sm:max-h-[90dvh] flex flex-col"
            >
              {/* Floating Translucent Mobile Sheet Handle (overlaid on image, zero white gap) */}
              <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-10 h-1 bg-white/80 backdrop-blur-sm rounded-full shadow-xs pointer-events-none" />

              {/* Frosted Glass Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 hover:text-slate-950 shadow-lg shadow-slate-900/10 flex items-center justify-center transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-95 border border-white/70 cursor-pointer"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>

              {/* Scrollable Modal Content */}
              <div className="overflow-y-auto overscroll-contain flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 md:h-full">
                  {/* Gallery Column (Edge-to-edge borderless image on top, left, right) */}
                  <div className="bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between overflow-hidden md:h-full">
                    <div className="relative aspect-[16/10] sm:aspect-square md:aspect-auto md:flex-1 md:h-full md:min-h-0 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      {currentImageUrl ? (
                        <img
                          src={currentImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faCakeCandles} className="text-4xl text-slate-300" />
                      )}
                      <div className="sm:hidden pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/15 to-transparent" />
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                      <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-5 sm:py-3.5 no-scrollbar bg-slate-50/90 border-t border-slate-100/80">
                        {images.map((img, idx) => (
                          <button
                            key={img.id || idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden transition-[transform,opacity] duration-150 ease-[var(--ease-out)] flex-shrink-0 cursor-pointer ${
                              selectedImageIndex === idx
                                ? 'ring-2 ring-brand-600 ring-offset-2 scale-105'
                                : 'opacity-65 hover:opacity-100'
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
                  <div className="p-5 sm:p-7 flex flex-col justify-between bg-white md:h-full">
                    <div>
                      {/* Category & Stock row with pr-10 to prevent overlap with Close button */}
                      <div className="flex items-center justify-between gap-2 mb-2 pr-10">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-600">
                          {product.category}
                        </span>
                        {isOutOfStock ? (
                          <span className="inline-flex items-center text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                            สินค้าหมดชั่วคราว
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 whitespace-nowrap">
                            เหลือเพียง {product.stock} ชิ้น
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 whitespace-nowrap">
                            เหลือ {product.stock} ชิ้น
                          </span>
                        )}
                      </div>

                      <h2 className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
                        {product.name}
                      </h2>

                      <div className="font-mono text-2xl font-bold text-slate-900 mb-3 sm:mb-4">
                        ฿{formatPrice(product.price)}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4 sm:mb-6">
                        {product.description}
                      </p>
                    </div>

                    {/* Desktop Order Controls */}
                    <div className="hidden md:block">
                      {renderOrderControls(false)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sticky Bottom CTA Bar */}
              <div className="md:hidden shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 pt-2.5 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                {renderOrderControls(true)}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
