'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faTrashCan,
  faPlus,
  faMinus,
  faShieldHalved,
  faCircleExclamation,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/order-utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
    shippingFee,
    total,
    isLoaded,
  } = useCart();

  const [stockError, setStockError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    for (const item of items) {
      if (item.product.stock <= 0) {
        setStockError(`ขออภัย สินค้า "${item.product.name}" หมดสต็อกแล้ว กรุณาลบออกจากตะกร้า`);
        return;
      }
      if (item.quantity > item.product.stock) {
        setStockError(
          `ขออภัย สินค้า "${item.product.name}" มีจำนวนคงเหลือเพียง ${item.product.stock} ชิ้น`
        );
        return;
      }
    }
    setStockError(null);
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-ground py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-card border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FontAwesomeIcon icon={faBagShopping} className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">ไม่มีสินค้าในตะกร้า</h2>
          <p className="text-xs text-slate-500 mb-6">
            เลือกชิมเบเกอรี่และขนมสดใหม่สูตรพิเศษของเราได้เลย
          </p>
          <Link href="/#menu">
            <Button variant="primary" size="md">
              เลือกดูเมนูขนม
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-ground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ตะกร้าสินค้าของคุณ
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              มีสินค้าในตะกร้าทั้งหมด {totalItems} รายการ
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
          >
            ล้างตะกร้า
          </button>
        </div>

        {stockError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{stockError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items Table */}
          <div className="lg:col-span-8">
            <Card>
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const primaryImg =
                    item.product.images?.find((img) => img.isPrimary)?.imageUrl ||
                    item.product.images?.[0]?.imageUrl ||
                    '';

                  return (
                    <div key={item.product.id} className="p-4 sm:p-5 flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faCakeCandles} className="text-2xl text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                              ชิ้นละ ฿{formatPrice(item.product.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            aria-label="Remove item"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-slate-200 rounded-button bg-slate-50">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 hover:bg-slate-200/60 rounded-l-button text-slate-600 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-slate-800 font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-1 hover:bg-slate-200/60 rounded-r-button text-slate-600 disabled:opacity-30 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-slate-900 font-mono">
                            ฿{formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24">
              <CardHeader>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  สรุปรายการสั่งซื้อ
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>ยอดรวมสินค้า</span>
                    <span className="font-mono font-medium text-slate-900">
                      ฿{formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าจัดส่งโดยประมาณ</span>
                    <span className="font-mono font-medium text-slate-900">
                      ฿{formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="font-mono text-brand-600">฿{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800"
                  onClick={handleProceedToCheckout}
                >
                  <span>ดำเนินการสั่งซื้อ</span>
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center pt-1">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ตรวจสอบสต็อกสินค้าทันที</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
