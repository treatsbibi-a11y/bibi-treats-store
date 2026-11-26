'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faArrowLeft,
  faCircleExclamation,
  faLocationDot,
  faCheck,
  faBell,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { formatPrice, formatDate } from '@/lib/order-utils';
import { OrderDetail } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import PaymentSlipSection from '@/components/customer/PaymentSlipSection';
import { useSmartPolling } from '@/hooks/useSmartPolling';

const STEPS: { status: string; label: string; desc: string }[] = [
  { status: 'PENDING', label: '🟡 รอร้านยืนยัน', desc: 'ร้านกำลังตรวจสอบรายการ' },
  { status: 'CONFIRMED', label: '🟢 ร้านยืนยันแล้ว / รอชำระเงิน', desc: 'พร้อมชำระเงินและแนบสลิป' },
  { status: 'SLIP_UPLOADED', label: '🔵 ชำระเงินแล้ว / รอตรวจสอบ', desc: 'ร้านกำลังตรวจสอบสลิป' },
  { status: 'PREPARING', label: '🟣 กำลังเตรียมสินค้า', desc: 'กำลังอบขนมสดใหม่' },
  { status: 'SHIPPING', label: '🚚 กำลังจัดส่ง', desc: 'ขนส่งกำลังนำส่งพัสดุ' },
  { status: 'COMPLETED', label: '✅ เสร็จสิ้น', desc: 'จัดส่งสำเร็จเรียบร้อย' },
];

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: '🟡 รอร้านยืนยัน', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  CONFIRMED: { label: '🟢 ร้านยืนยันแล้ว / รอชำระเงิน', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  SLIP_UPLOADED: { label: '🔵 ชำระเงินแล้ว / รอตรวจสอบ', className: 'bg-sky-50 text-sky-800 border-sky-200' },
  PREPARING: { label: '🟣 กำลังเตรียมสินค้า', className: 'bg-purple-50 text-purple-800 border-purple-200' },
  SHIPPING: { label: '🚚 กำลังจัดส่ง', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: '✅ เสร็จสิ้น', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: '🔴 ปฏิเสธออเดอร์', className: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmedBanner, setShowConfirmedBanner] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  const applyLatestOrder = useCallback((latest: OrderDetail) => {
    const nextStatus = latest.status as string;
    if (prevStatusRef.current === 'PENDING' && nextStatus === 'CONFIRMED') {
      setShowConfirmedBanner(true);
    } else if (nextStatus !== 'CONFIRMED') {
      setShowConfirmedBanner(false);
    }
    prevStatusRef.current = nextStatus;
    setOrder(latest);
  }, []);

  const refreshTrackedOrder = useCallback(async () => {
    if (!order || !orderNumber.trim() || !phone.trim()) return;
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });
      if (res.ok) {
        const data: OrderDetail = await res.json();
        applyLatestOrder(data);
      }
    } catch {}
  }, [order, orderNumber, phone, applyLatestOrder]);

  // Poll every 3000ms (with focus/visibility revalidation) while an order is tracked
  useSmartPolling(refreshTrackedOrder, 3000, Boolean(order));

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOrder(null);
    setShowConfirmedBanner(false);
    prevStatusRef.current = null;

    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMessage('กรุณาระบุทั้งเลขที่คำสั่งซื้อ (เช่น BT-0001) และเบอร์โทรศัพท์ติดต่อ');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลคำสั่งซื้อ กรุณาตรวจสอบเลขที่ออเดอร์และเบอร์โทรศัพท์อีกครั้ง');
      }

      applyLatestOrder(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'ไม่สามารถค้นหาข้อมูลออเดอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = STEPS.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStep = order ? getStepIndex(order.status as string) : 0;
  const isCancelled = (order?.status as string) === 'CANCELLED';
  const statusBadge = order
    ? STATUS_BADGE_MAP[order.status as string] || {
        label: order.status,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-surface-ground to-surface-ground py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            <span>กลับหน้าหลักร้านค้า</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ติดตามสถานะคำสั่งซื้อ
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            ตรวจสอบสถานะการยืนยันออเดอร์ การอบขนมสดใหม่ และการจัดส่งพัสดุแบบเรียลไทม์
          </p>
        </div>

        {/* Tracking Search Card */}
        <Card className="shadow-sm rounded-3xl border-sky-200/80">
          <CardBody className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่คำสั่งซื้อ (Order Number)
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    placeholder="เช่น BT-0001"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 mr-1" />
                <span>ค้นหาสถานะคำสั่งซื้อ</span>
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Order Tracking Result */}
        {order && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {showConfirmedBanner && (
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-brand-600 text-white shadow-hover border border-sky-300 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold">
                    ร้านยืนยันออเดอร์แล้ว สามารถชำระเงินได้
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmedBanner(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
                  aria-label="ปิดการแจ้งเตือน"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Status Stepper Card */}
            <Card className="overflow-hidden rounded-3xl border-sky-200/80 shadow-sm">
              <CardHeader className="bg-sky-50/70 border-b border-sky-100 flex flex-wrap justify-between items-center gap-3 py-4 px-6">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">เลขที่คำสั่งซื้อ</span>
                    <p className="text-base font-extrabold text-slate-900 font-mono">
                      {order.orderNumber}
                    </p>
                  </div>
                  {statusBadge && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">วันที่สั่งซื้อ</span>
                  <p className="text-xs font-medium text-slate-800">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </CardHeader>

              <CardBody className="p-6">
                {isCancelled ? (
                  <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-center space-y-2">
                    <p className="text-sm font-bold text-rose-800">🔴 ปฏิเสธออเดอร์</p>
                    <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                      ขออภัย ร้านไม่สามารถรับออเดอร์นี้ได้ในขณะนี้ กรุณาติดต่อร้านเพื่อสอบถามรายละเอียด
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Bar Background */}
                      <div className="hidden sm:block absolute top-4 left-[8%] right-[8%] h-1 bg-slate-200 z-0 rounded-full" />
                      {/* Active Progress Bar */}
                      <div
                        className="hidden sm:block absolute top-4 left-[8%] h-1 bg-brand-600 transition-all duration-500 z-0 rounded-full"
                        style={{
                          width: `${(currentStep / (STEPS.length - 1)) * 84}%`,
                        }}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 sm:gap-2 relative z-10">
                        {STEPS.map((step, idx) => {
                          const isDone = idx <= currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div
                              key={step.status}
                              className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm shrink-0 ${
                                  isDone
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-sky-100 scale-110' : ''}`}
                              >
                                {isDone ? (
                                  <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-[11px] font-bold leading-snug ${
                                    isDone ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </p>
                                <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Payment & Slip Section (handles all statuses strictly, including CANCELLED) */}
            <PaymentSlipSection
              order={order}
              onOrderUpdated={applyLatestOrder}
              onRefresh={refreshTrackedOrder}
            />

            {/* Order Items & Destination Details */}
            <Card className="rounded-3xl border-sky-200/80 overflow-hidden shadow-sm">
              <CardHeader className="bg-sky-50/50 border-b border-sky-100 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  สรุปรายการสินค้าและสถานที่จัดส่ง
                </h3>
              </CardHeader>
              <CardBody className="p-6 space-y-4 text-xs">
                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-900">{item.productName}</span>
                        <span className="text-slate-500 font-mono ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ฿{formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>ยอดรวมสินค้า</span>
                    <span className="font-mono">฿{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ค่าจัดส่งพัสดุ</span>
                    <span className="font-mono">
                      {order.shippingFee === 0 ? (
                        <span className="font-sans font-semibold text-emerald-600">จัดส่งฟรี</span>
                      ) : (
                        `฿${formatPrice(order.shippingFee)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>วิธีการชำระเงิน</span>
                    <span className="font-semibold text-slate-800">
                      {order.paymentMethod === 'COD'
                        ? 'เก็บเงินปลายทาง (COD)'
                        : 'โอนเงิน / PromptPay QR'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-slate-200">
                    <span>ยอดชำระสุทธิ</span>
                    <span className="font-mono text-brand-600">฿{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-sky-100 bg-sky-50/50 -mx-6 -mb-6 p-6 space-y-1 text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-brand-600" />
                    <span>สถานที่จัดส่ง: {order.customer.name} ({order.customer.phone})</span>
                  </div>
                  <p className="pl-5 text-slate-500">{order.customer.address}</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
