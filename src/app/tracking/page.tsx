'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faArrowLeft,
  faCircleExclamation,
  faLocationDot,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { formatPrice, formatDate } from '@/lib/order-utils';
import { OrderDetail, OrderStatus, StoreSettingsData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import PaymentSlipSection from '@/components/customer/PaymentSlipSection';

const STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'PENDING', label: 'รอยืนยันคำสั่งซื้อ', desc: 'ร้านค้ากำลังตรวจสอบรายการ' },
  { status: 'CONFIRMED', label: 'ยืนยันและชำระแล้ว', desc: 'เข้าสู่คิวจัดเตรียมขนม' },
  { status: 'PREPARING', label: 'กำลังอบขนมสดใหม่', desc: 'ขนมกำลังอยู่ในเตาอบ' },
  { status: 'SHIPPING', label: 'กำลังจัดส่งพัสดุ', desc: 'ขนส่งนำส่งถึงหน้าบ้านคุณ' },
  { status: 'COMPLETED', label: 'จัดส่งสำเร็จ', desc: 'จัดส่งถึงผู้รับเรียบร้อยแล้ว' },
];

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load store settings', err);
      }
    }
    loadSettings();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOrder(null);
    setHasSearched(true);

    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMessage('กรุณาระบุทั้งเลขที่คำสั่งซื้อ (เช่น BT-0001) และเบอร์โทรศัพท์ติดต่อ');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่พบข้อมูลคำสั่งซื้อ กรุณาตรวจสอบเลขที่ออเดอร์และเบอร์โทรศัพท์อีกครั้ง');
      }

      setOrder(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'ไม่สามารถค้นหาข้อมูลออเดอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'SHIPPING':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-surface-ground py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
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
            ตรวจสอบสถานะการอบขนมสดใหม่และการจัดส่งพัสดุแบบเรียลไทม์
          </p>
        </div>

        {/* Tracking Search Card */}
        <Card className="shadow-sm">
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
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button font-mono uppercase focus:outline-none focus:border-brand-500 shadow-sm"
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
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
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
            {/* Status Stepper Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50/70 flex justify-between items-center py-4">
                <div>
                  <span className="text-xs text-slate-500 font-mono">เลขที่คำสั่งซื้อ</span>
                  <p className="text-base font-extrabold text-slate-900 font-mono">
                    {order.orderNumber}
                  </p>
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
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center space-y-1">
                    <p className="text-sm font-bold text-red-700">คำสั่งซื้อนี้ถูกยกเลิกแล้ว (Cancelled)</p>
                    <p className="text-xs text-red-600">
                      จำนวนสินค้าได้รับการคืนสต็อกเรียบร้อยแล้ว หากมีข้อสงสัยกรุณาติดต่อร้านค้า
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stepper Graphic */}
                    <div className="relative">
                      {/* Bar Background */}
                      <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                      {/* Active Progress Bar */}
                      <div
                        className="hidden sm:block absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2 transition-all duration-500 z-0"
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                        {STEPS.map((step, idx) => {
                          const isDone = idx <= currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div key={step.status} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                                  isDone
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-brand-100 scale-110' : ''}`}
                              >
                                {isDone ? <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" /> : idx + 1}
                              </div>
                              <div>
                                <p
                                  className={`text-xs font-bold ${
                                    isDone ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </p>
                                <p className="text-[10px] text-slate-500 hidden sm:block">
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

            {/* Payment & Slip Section (when not cancelled) */}
            {!isCancelled && (
              <PaymentSlipSection
                order={order}
                settings={settings}
                onOrderUpdated={(updated) => setOrder(updated)}
                onRefresh={async () => {
                  if (!orderNumber || !phone) return;
                  try {
                    const res = await fetch('/api/orders/track', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        orderNumber: orderNumber.trim(),
                        phone: phone.trim(),
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setOrder(data);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            )}

            {/* Order Items & Destination Details */}
            <Card>
              <CardHeader>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  สรุปรายการสินค้าและสถานที่จัดส่ง
                </h3>
              </CardHeader>
              <CardBody className="space-y-4 text-xs">
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
                    <span className="font-mono">฿{formatPrice(order.shippingFee)}</span>
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

                <div className="pt-4 border-t border-slate-200 bg-slate-50/70 -mx-5 -mb-5 p-5 rounded-b-card space-y-1 text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-slate-400" />
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
