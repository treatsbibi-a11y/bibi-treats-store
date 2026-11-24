'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLock,
  faShieldHalved,
  faCircleExclamation,
  faCheck,
  faCakeCandles,
  faQrcode,
  faTruck,
  faMoneyBillWave,
  faBuildingColumns,
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    instagram: '',
    address: '',
    note: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD'>('TRANSFER');
  const [confirmedChecked, setConfirmedChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

      // Clear cart on success and navigate to order success page
      clearCart();
      router.push(`/order-success/${data.orderNumber}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      setIsSubmitting(false);
    }
  };

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
                          <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-200/80 flex items-center justify-center">
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
                              ฿{item.product.price} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            ฿{(item.product.price * item.quantity).toLocaleString()}
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
                        ฿{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ค่าจัดส่ง</span>
                      <span className="font-mono font-medium text-slate-900">
                        ฿{shippingFee}
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
                      <span className="font-mono text-slate-950">฿{total.toLocaleString()}</span>
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all active:scale-[0.99] mt-1"
                    isLoading={isSubmitting}
                    disabled={!confirmedChecked || items.length === 0}
                  >
                    ยืนยันการสั่งซื้อ · ฿{total.toLocaleString()}
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
