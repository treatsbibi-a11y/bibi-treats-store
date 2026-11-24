'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrashCan,
  faPlus,
  faMinus,
  faBagShopping,
  faShieldHalved,
  faCakeCandles,
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/context/CartContext';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    totalItems,
    subtotal,
    shippingFee,
    total,
    updateQuantity,
    removeFromCart,
    isDrawerOpen,
    closeDrawer,
  } = useCart();

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title={`ตะกร้าสินค้าของคุณ (${totalItems})`}
      footer={
        items.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>ยอดรวมสินค้า</span>
                <span className="font-medium text-slate-900">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่งโดยประมาณ</span>
                <span className="font-medium text-slate-900">฿{shippingFee}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-brand-600">฿{total.toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full h-12 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
              onClick={handleCheckout}
            >
              <span>ดำเนินการสั่งซื้อ</span>
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-emerald-600" />
              <span>รับประกันความสดใหม่ ตรวจสอบความถูกต้องก่อนส่ง</span>
            </div>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FontAwesomeIcon icon={faBagShopping} className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">ยังไม่มีสินค้าในตะกร้า</h3>
          <p className="text-sm text-slate-500 mb-6">
            เลือกดูเมนูขนมอบสดใหม่แสนอร่อยจาก Bibi&apos;s Treats ได้เลยค่ะ
          </p>
          <Button variant="outline" size="md" onClick={closeDrawer}>
            เลือกดูเมนูขนม
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const primaryImg =
              item.product.images?.find((img) => img.isPrimary)?.imageUrl ||
              item.product.images?.[0]?.imageUrl ||
              '';

            return (
              <div key={item.product.id} className="py-4 flex gap-4">
                <div className="w-20 h-20 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/80 flex items-center justify-center">
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

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ชิ้นละ ฿{item.product.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-2 -mr-1 rounded-lg hover:bg-red-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-90"
                      aria-label="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-slate-200 rounded-button bg-slate-50/70">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 sm:p-1.5 hover:bg-slate-200/60 rounded-l-button text-slate-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center active:bg-slate-200"
                        aria-label="Decrease quantity"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 min-w-[32px] text-center font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2 sm:p-1.5 hover:bg-slate-200/60 rounded-r-button text-slate-600 transition-colors disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center active:bg-slate-200"
                        disabled={item.quantity >= item.product.stock}
                        aria-label="Increase quantity"
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ฿{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
