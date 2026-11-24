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
  faFire,
} from '@fortawesome/free-solid-svg-icons';
import { ProductWithImages } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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

  const images = product.images && product.images.length > 0
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="p-6 bg-slate-50 border-r border-slate-100 flex flex-col justify-between">
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 mb-4 shadow-sm flex items-center justify-center">
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
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-brand-600 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
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
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="mb-2">
                  <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-1">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>ขายไปแล้ว {product.sold || 0} ชิ้น</span>
                    <span className="text-slate-300">•</span>
                    {isOutOfStock ? (
                      <span className="text-rose-500 font-medium">สินค้าหมด</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-amber-600 font-medium">เหลือเพียง {product.stock} ชิ้น</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">พร้อมส่ง</span>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  {product.name}
                </h2>

                <div className="text-2xl font-bold text-slate-900 font-mono mb-4">
                  ฿{product.price}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {product.description}
                </p>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 space-y-1 mb-6">
                  <p className="font-semibold text-slate-900">วัตถุดิบและคำแนะนำการทาน:</p>
                  <p>ใช้เนยสดแท้ 100% ปราศจากไขมันทรานส์ ไม่ใช้วัตถุกันเสีย แนะนำเก็บในตู้เย็นและรับประทานภายใน 3-5 วัน</p>
                </div>
              </div>

              {/* Order Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">จำนวน</span>
                    <div className="inline-flex items-center border border-slate-200 rounded-button bg-slate-50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1.5 hover:bg-slate-200/60 rounded-l-button text-slate-600 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-sm font-bold text-slate-800 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="p-1.5 hover:bg-slate-200/60 rounded-r-button text-slate-600 disabled:opacity-30 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  {isAdded ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-emerald-400 mr-2" />
                      <span>เพิ่มลงตะกร้าแล้ว</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>สินค้าหมดชั่วคราว</span>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4 mr-2" />
                      <span>ใส่ตะกร้าสินค้า · ฿{(product.price * quantity).toLocaleString()}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
