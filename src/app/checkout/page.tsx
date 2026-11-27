'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLock,
  faCircleExclamation,
  faCakeCandles,
  faQrcode,
  faTruck,
  faReceipt,
  faMagnifyingGlass,
  faBell,
  faXmark,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/context/CartContext';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { formatPrice } from '@/lib/order-utils';
import { OrderDetail } from '@/types';
import { convertImageToWebP } from '@/lib/image-utils';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import PaymentSlipSection from '@/components/customer/PaymentSlipSection';
import { Turnstile } from '@marsidev/react-turnstile';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderParam = searchParams.get('order')?.trim() || '';

  const { items, subtotal, shippingFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    instagram: '',
    address: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD'>('TRANSFER');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [preSlipUrl, setPreSlipUrl] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{
    bankName?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
    promptpayNumber?: string;
    promptpayName?: string;
    qrImageUrl?: string;
  }>({
    bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
    bankAccountName: 'น.ส. ฮาบีบี บุตรแหล่',
    bankAccountNo: '142-1-52907-4',
    promptpayNumber: '086-296-5765',
    promptpayName: 'น.ส. ฮาบีบี บุตรแหล่',
    qrImageUrl: '/images/thai-qr-payment.jpg',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setStoreSettings({
            bankName: data.bankName || 'ธนาคารกสิกรไทย (Kasikorn Bank)',
            bankAccountName: data.bankAccountName || 'น.ส. ฮาบีบี บุตรแหล่',
            bankAccountNo: data.bankAccountNo || '142-1-52907-4',
            promptpayNumber: data.promptpayNumber || '086-296-5765',
            promptpayName: data.promptpayName || 'น.ส. ฮาบีบี บุตรแหล่',
            qrImageUrl: data.qrImageUrl || '/images/thai-qr-payment.jpg',
          });
        }
      })
      .catch((err) => console.warn('Failed to load store settings:', err));
  }, []);

  useEffect(() => {
    if (isQrZoomOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isQrZoomOpen]);

  const handlePreSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSlipError(null);
    setIsUploadingSlip(true);
    try {
      const webpFile = await convertImageToWebP(file);
      const formData = new FormData();
      formData.append('file', webpFile);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'อัปโหลดสลิปไม่สำเร็จ');
      }
      setPreSlipUrl(data.url);
    } catch (err: any) {
      setSlipError(err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป');
    } finally {
      setIsUploadingSlip(false);
    }
  };
  const [confirmedChecked, setConfirmedChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active order state when ?order=BT-xxxx is present
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderLoadError, setOrderLoadError] = useState('');
  const [showConfirmedBanner, setShowConfirmedBanner] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  const applyLatestOrder = useCallback((latest: OrderDetail) => {
    const prevStatus = prevStatusRef.current;
    const nextStatus = latest.status as string;
    if (prevStatus === 'PENDING' && nextStatus === 'CONFIRMED') {
      setShowConfirmedBanner(true);
    } else if (nextStatus !== 'CONFIRMED') {
      setShowConfirmedBanner(false);
    }
    prevStatusRef.current = nextStatus;
    setActiveOrder(latest);
  }, []);

  const fetchActiveOrder = useCallback(async () => {
    if (!orderParam) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderParam)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'ไม่พบข้อมูลคำสั่งซื้อ');
      }
      const data: OrderDetail = await res.json();
      setOrderLoadError('');
      applyLatestOrder(data);
    } catch (err: any) {
      setOrderLoadError(err?.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
    }
  }, [orderParam, applyLatestOrder]);

  useEffect(() => {
    if (!orderParam) {
      setActiveOrder(null);
      setOrderLoadError('');
      setShowConfirmedBanner(false);
      prevStatusRef.current = null;
      return;
    }

    let cancelled = false;
    setOrderLoading(true);
    fetchActiveOrder().finally(() => {
      if (!cancelled) {
        setOrderLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderParam, fetchActiveOrder]);

  // Poll every 3000ms (with focus/visibility revalidation) when ?order=BT-xxxx is active
  useSmartPolling(fetchActiveOrder, 3000, Boolean(orderParam));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('ไม่มีสินค้าในตะกร้า');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, เบอร์โทรศัพท์, ที่อยู่จัดส่ง)');
      return;
    }

    if (!confirmedChecked) {
      setErrorMessage('กรุณากดยืนยันการตรวจสอบข้อมูลและรายการสั่งซื้อ');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        instagram: formData.instagram.trim() || null,
        address: formData.address.trim(),
        note: formData.note.trim() || null,
        paymentMethod,
        slipUrl: paymentMethod === 'TRANSFER' ? preSlipUrl : null,
        turnstileToken: turnstileToken || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingFee,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }

      clearCart();

      if (paymentMethod === 'TRANSFER') {
        prevStatusRef.current = (data.status as string) || 'PENDING';
        setActiveOrder(data);
        setIsSubmitting(false);
        router.replace(`/checkout?order=${encodeURIComponent(data.orderNumber)}`);
      } else {
        router.push(`/order-success/${data.orderNumber}`);
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      setIsSubmitting(false);
    }
  };

  // Active order view on /checkout?order=BT-xxxx
  if (orderParam) {
    const activeStatus = (activeOrder?.status as string) || '';
    const canViewReceipt =
      activeStatus !== '' && activeStatus !== 'PENDING' && activeStatus !== 'CANCELLED';

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-surface-ground to-surface-ground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/#menu"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
              <span>กลับหน้าหลักร้านค้า</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200 text-xs font-mono text-slate-700 shadow-subtle">
              <span className="text-slate-400">ออเดอร์</span>
              <span className="font-bold text-brand-700">{orderParam}</span>
            </div>
          </div>

          {/* Prominent Sky-Blue Notification Banner on PENDING -> CONFIRMED transition */}
          {showConfirmedBanner && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500 to-brand-600 text-white shadow-hover border border-sky-300 flex items-center justify-between gap-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold tracking-tight">
                    ร้านยืนยันออเดอร์แล้ว สามารถชำระเงินได้
                  </p>
                  <p className="text-xs text-sky-100 mt-0.5">
                    สแกน QR Code ด้านล่างและแนบสลิปการโอนเงินเพื่อเริ่มจัดเตรียมขนม
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmedBanner(false)}
                className="p-2 rounded-xl hover:bg-white/15 text-white/90 transition-colors cursor-pointer shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
          )}

          {orderLoading && !activeOrder ? (
            <Card className="border-sky-200/80 bg-white rounded-3xl shadow-sm">
              <CardBody className="p-10 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  กำลังโหลดสถานะคำสั่งซื้อ {orderParam}...
                </p>
              </CardBody>
            </Card>
          ) : orderLoadError && !activeOrder ? (
            <Card className="border-rose-200 bg-white rounded-3xl shadow-sm">
              <CardBody className="p-8 text-center space-y-4">
                <p className="text-sm font-bold text-rose-700">{orderLoadError}</p>
                <div className="flex justify-center gap-3">
                  <Link href="/tracking">
                    <Button variant="primary" size="md">
                      ไปหน้าติดตามออเดอร์
                    </Button>
                  </Link>
                  <Link href="/#menu">
                    <Button variant="outline" size="md">
                      กลับหน้าหลัก
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : activeOrder ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Payment / Waiting / Status Section */}
              <div className="lg:col-span-7 space-y-5">
                <PaymentSlipSection
                  order={activeOrder}
                  onOrderUpdated={applyLatestOrder}
                  onRefresh={fetchActiveOrder}
                />

                {/* View Receipt Button once confirmed / paid */}
                {canViewReceipt && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/order-success/${activeOrder.orderNumber}`} className="flex-1 min-w-[200px]">
                      <Button variant="primary" size="lg" className="w-full gap-2 rounded-2xl">
                        <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
                        <span>ดูใบเสร็จรับเงิน ({activeOrder.orderNumber})</span>
                      </Button>
                    </Link>
                    <Link href="/tracking">
                      <Button variant="outline" size="lg" className="gap-2 rounded-2xl border-sky-200 text-sky-900 hover:bg-sky-50">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5" />
                        <span>ติดตามสถานะ</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5">
                <Card className="border-sky-200/80 bg-white rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="bg-sky-50/70 border-b border-sky-100 px-5 py-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      สรุปรายการสั่งซื้อ
                    </h2>
                    <span className="text-xs font-mono font-semibold text-brand-700">
                      {activeOrder.orderNumber}
                    </span>
                  </CardHeader>
                  <CardBody className="p-5 space-y-4 text-xs">
                    <div className="divide-y divide-slate-100">
                      {activeOrder.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ฿{formatPrice(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0">
                            ฿{formatPrice(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>ยอดรวมสินค้า</span>
                        <span className="font-mono font-medium text-slate-900">
                          ฿{formatPrice(activeOrder.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ค่าจัดส่ง</span>
                        <span className="font-mono font-medium text-slate-900">
                          {activeOrder.shippingFee === 0 ? (
                            <span className="font-sans font-semibold text-emerald-600">จัดส่งฟรี</span>
                          ) : (
                            `฿${formatPrice(activeOrder.shippingFee)}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-slate-950 pt-2 border-t border-slate-200">
                        <span>ยอดชำระสุทธิ</span>
                        <span className="font-mono text-brand-700">
                          ฿{formatPrice(activeOrder.total)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1 text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-brand-600 shrink-0" />
                        <span>{activeOrder.customer?.name}</span>
                        <span className="text-slate-500 font-mono font-normal">
                          ({activeOrder.customer?.phone})
                        </span>
                      </div>
                      <p className="pl-4 leading-relaxed">{activeOrder.customer?.address}</p>
                      {activeOrder.note && (
                        <p className="pl-4 text-[11px] text-slate-500">
                          หมายเหตุ: {activeOrder.note}
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-surface-ground py-20 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-card border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">ไม่มีสินค้าในตะกร้า</h2>
          <p className="text-xs text-slate-500 mb-6">กรุณาเลือกเมนูขนมก่อนดำเนินการชำระเงิน</p>
          <Link href="/#menu">
            <Button variant="primary" size="md">
              เลือกเมนูขนม
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-ground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/#menu"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
            <span>กลับไปเลือกเมนู</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 text-emerald-600" />
            <span>ระบบเข้ารหัสความปลอดภัย SSL 256-Bit</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-8">
          ยืนยันคำสั่งซื้อและข้อมูลจัดส่ง
        </h1>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer & Delivery Info */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="overflow-hidden border-slate-200/90 shadow-xs">
                <CardHeader className="bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white/40 border-b border-sky-100/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide font-sans">
                      1. ข้อมูลผู้รับสินค้า
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="เช่น อารยา สุขใจ"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-subtle"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="เช่น 0812345678"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อ Instagram (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="เช่น @bibi.treats"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-subtle"
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="overflow-hidden border-slate-200/90 shadow-xs">
                <CardHeader className="bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white/40 border-b border-sky-100/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide font-sans">
                      2. ที่อยู่สำหรับจัดส่ง
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Premium Pickup Schedule Notice */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-amber-950 font-medium">
                      <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong className="text-amber-900 font-bold">วันและจุดนัดรับขนม:</strong> อาทิตย์ – พฤหัสฯ (ตันหยงมัส) · ศุกร์ – เสาร์ (เมืองนราธิวาส)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300/70 self-start sm:self-auto shrink-0 shadow-2xs">
                      หรือจัดส่งถึงบ้านตามที่อยู่
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ที่อยู่จัดส่งพัสดุ (บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, รหัสไปรษณีย์) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="ระบุที่อยู่จัดส่งอย่างละเอียดเพื่อให้ขนส่งนำส่งได้อย่างถูกต้อง..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-subtle"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      หมายเหตุเพิ่มเติม / คำขอพิเศษถึงร้าน
                    </label>
                    <input
                      type="text"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="เช่น ฝากไว้กับนิติบุคคล, แพ็กของขวัญวันเกิด"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-button focus:outline-none focus:border-brand-500 shadow-subtle"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Payment Method Selection */}
              <Card className="overflow-hidden border-slate-200/90 shadow-xs">
                <CardHeader className="bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white/40 border-b border-sky-100/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide font-sans">
                      3. วิธีการชำระเงิน
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {/* Option 1: QR Code & Bank Transfer */}
                  <label
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-1 ring-slate-900/5'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'TRANSFER'
                            ? 'border-slate-900 bg-slate-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'TRANSFER' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FontAwesomeIcon icon={faQrcode} className="w-3.5 h-3.5 text-brand-600" />
                          <span>โอนเงินผ่านธนาคาร / PromptPay QR</span>
                        </span>
                        <span className="text-[10px] font-semibold tracking-wide text-brand-800 bg-brand-50/90 px-2 py-0.5 rounded-full border border-brand-200/70">
                          แนะนำ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        สแกน QR Code ผ่านแอปธนาคาร สะดวก รวดเร็ว ไม่มีค่าธรรมเนียม
                      </p>
                    </div>
                  </label>

                  {/* Immediate Bank Details, Original QR Code & Slip Upload when TRANSFER is selected */}
                  {paymentMethod === 'TRANSFER' && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                      {/* Bank Details */}
                      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 space-y-1.5 text-xs sm:text-sm">
                        <div className="font-bold text-slate-900 mb-2">
                          💳 รายละเอียดบัญชีธนาคาร
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">ธนาคาร:</span>
                          <span className="font-semibold text-slate-900">
                            {storeSettings.bankName || 'กสิกรไทย'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">ชื่อบัญชี:</span>
                          <span className="font-semibold text-slate-900">
                            {storeSettings.bankAccountName || storeSettings.promptpayName || 'น.ส. ฮาบีบี บุตรแหล่'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">เลขบัญชี:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {storeSettings.bankAccountNo || '142-1-52907-4'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500">PromptPay:</span>
                          <span className="font-mono font-bold text-brand-700">
                            {storeSettings.promptpayNumber || '086-296-5765'}
                          </span>
                        </div>
                      </div>

                      {/* Original QR Code (no crop, no distortion, clickable to zoom) */}
                      <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-center space-y-2.5">
                        <button
                          type="button"
                          onClick={() => setIsQrZoomOpen(true)}
                          className="inline-block rounded-lg overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand-500"
                          aria-label="กดเพื่อขยายรูป QR Code"
                        >
                          <img
                            src={storeSettings.qrImageUrl || '/images/thai-qr-payment.jpg'}
                            alt="PromptPay QR Code"
                            className="w-56 sm:w-64 h-auto object-contain mx-auto"
                          />
                        </button>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">
                            สแกน QR Code เพื่อชำระเงิน
                          </p>
                          <p className="text-xs text-slate-500">
                            กรุณาชำระเงินตามยอดรวมของออเดอร์ (แตะที่รูปเพื่อขยาย)
                          </p>
                        </div>
                      </div>

                      {/* Slip Upload */}
                      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            แนบหลักฐานการชำระเงิน (สลิปโอนเงิน)
                          </span>
                          {preSlipUrl && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              แนบหลักฐานการชำระเงินแล้ว
                            </span>
                          )}
                        </div>

                        {preSlipUrl ? (
                          <div className="space-y-3">
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex justify-center">
                              <img
                                src={preSlipUrl}
                                alt="ตัวอย่างสลิปการโอนเงิน"
                                className="max-h-56 w-auto object-contain rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-brand-400 bg-white text-slate-700 text-xs font-semibold text-center cursor-pointer">
                                {isUploadingSlip ? 'กำลังอัปโหลด...' : 'เปลี่ยนสลิป'}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  disabled={isUploadingSlip}
                                  onChange={handlePreSlipUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setPreSlipUrl(null)}
                                className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                              >
                                ลบสลิป
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block w-full py-5 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/70 hover:bg-brand-50/30 text-center cursor-pointer transition-colors">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {isUploadingSlip
                                ? 'กำลังอัปโหลดสลิป...'
                                : 'แตะเพื่อเลือกรูปสลิปการโอนเงิน (จากมือถือหรือคอมพิวเตอร์)'}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              disabled={isUploadingSlip}
                              onChange={handlePreSlipUpload}
                              className="hidden"
                            />
                          </label>
                        )}

                        {slipError && (
                          <p className="text-xs text-rose-600 font-medium">{slipError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Option 2: Cash on Delivery (COD) */}
                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      paymentMethod === 'COD'
                        ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-1 ring-slate-900/5'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'COD'
                            ? 'border-slate-900 bg-slate-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'COD' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5 text-slate-600" />
                          <span>เก็บเงินปลายทาง (Cash on Delivery)</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ชำระเงินสดกับเจ้าหน้าที่จัดส่งเมื่อได้รับพัสดุ
                      </p>
                    </div>
                  </label>
                </CardBody>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="lg:sticky lg:top-24 border-slate-200/90 shadow-sm">
                <CardHeader>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide font-sans">
                    สรุปรายการสั่งซื้อ
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Item List */}
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => {
                      const primaryImg =
                        item.product.images?.find((img) => img.isPrimary)?.imageUrl ||
                        item.product.images?.[0]?.imageUrl ||
                        '';

                      return (
                        <div key={item.product.id} className="py-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img
                                src={primaryImg}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FontAwesomeIcon icon={faCakeCandles} className="text-slate-300 text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ฿{formatPrice(item.product.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            ฿{formatPrice(item.product.price * item.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>ยอดรวมสินค้า</span>
                      <span className="font-mono font-medium text-slate-900">
                        ฿{formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ค่าจัดส่ง</span>
                      <span className="font-mono font-medium text-slate-900">
                        {shippingFee === 0 ? (
                          <span className="font-sans font-semibold text-emerald-600">จัดส่งฟรี</span>
                        ) : (
                          `฿${formatPrice(shippingFee)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>วิธีชำระเงิน</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={paymentMethod === 'TRANSFER' ? faQrcode : faTruck}
                          className="w-3 h-3 text-slate-700"
                        />
                        <span>
                          {paymentMethod === 'TRANSFER'
                            ? 'โอนเงิน / PromptPay'
                            : 'เก็บเงินปลายทาง'}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-950 pt-2 border-t border-slate-200">
                      <span>ยอดชำระสุทธิ</span>
                      <span className="font-mono text-slate-950">฿{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-normal select-none">
                      <input
                        type="checkbox"
                        checked={confirmedChecked}
                        onChange={(e) => setConfirmedChecked(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>ฉันตรวจสอบข้อมูลและรายการสั่งซื้อเรียบร้อยแล้ว</span>
                    </label>
                  </div>

                  {/* Cloudflare Turnstile Bot Immunity */}
                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className="pt-2 pb-1 flex justify-center">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onSuccess={(token) => setTurnstileToken(token)}
                        options={{
                          theme: 'light',
                          size: 'flexible',
                        }}
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all active:scale-[0.99] mt-1"
                    isLoading={isSubmitting}
                    disabled={!confirmedChecked || items.length === 0}
                  >
                    ยืนยันการสั่งซื้อ · ฿{formatPrice(total)}
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        </form>
      </div>
      {/* QR Code Zoom Modal */}
      {isQrZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ขยายรูป QR Code"
          onClick={() => setIsQrZoomOpen(false)}
          className="fixed inset-0 z-[120] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full text-center space-y-3 shadow-2xl"
          >
            <img
              src="/images/thai-qr-payment.jpg"
              alt="PromptPay QR Code"
              className="w-full h-auto object-contain mx-auto rounded-xl"
            />
            <p className="text-sm font-bold text-slate-900">สแกน QR Code เพื่อชำระเงิน</p>
            <p className="text-xs text-slate-500">กรุณาชำระเงินตามยอดรวมของออเดอร์</p>
            <button
              type="button"
              onClick={() => setIsQrZoomOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-ground flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
