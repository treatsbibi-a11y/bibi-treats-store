'use client';

import React, { useState } from 'react';
import { OrderDetail, StoreSettingsData } from '@/types';
import { formatPrice } from '@/lib/order-utils';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faQrcode,
  faMoneyBillWave,
  faTruck,
  faDownload,
  faCopy,
  faCheck,
  faCloudArrowUp,
  faReceipt,
  faRotate,
  faLock,
  faCircleCheck,
  faClock,
  faFileImage,
  faArrowRight,
  faEye,
  faTriangleExclamation,
  faPenToSquare,
  faLocationDot,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
import { faLine, faInstagram } from '@fortawesome/free-brands-svg-icons';

interface PaymentSlipSectionProps {
  order: OrderDetail;
  settings?: StoreSettingsData | null;
  onOrderUpdated?: (updatedOrder: OrderDetail) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function PaymentSlipSection({
  order,
  settings,
  onOrderUpdated,
  onRefresh,
}: PaymentSlipSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullSlip, setShowFullSlip] = useState(false);

  // Address editing states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState(order.customer?.address || '');
  const [editNote, setEditNote] = useState(order.note || '');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddress.trim()) {
      setAddressSaveError('กรุณากรอกที่อยู่จัดส่ง');
      return;
    }
    setIsSavingAddress(true);
    setAddressSaveError(null);
    setAddressSaveSuccess(false);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: editAddress.trim(),
          note: editNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถแก้ไขที่อยู่ได้');
      }

      if (onOrderUpdated) {
        onOrderUpdated(data);
      }
      setAddressSaveSuccess(true);
      setTimeout(() => {
        setIsEditingAddress(false);
        setAddressSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      setAddressSaveError(err.message || 'เกิดข้อผิดพลาดในการบันทึกที่อยู่');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCopyField = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualRefresh = async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!file) return;

    // Reset error
    setUploadError(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์เกิน 5MB กรุณาเลือกรูปภาพขนาดเล็กลง');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload file to /api/upload
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'ไม่สามารถอัปโหลดไฟล์รูปภาพได้');
      }

      const slipUrl = uploadData.url;

      // 2. Attach slipUrl to order via PATCH /api/orders/[id]
      const orderRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slipUrl }),
      });

      const updatedOrderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(updatedOrderData.error || 'บันทึกสลิปไม่สำเร็จ');
      }

      if (onOrderUpdated) {
        onOrderUpdated(updatedOrderData);
      }
    } catch (err: any) {
      console.error('Slip upload error:', err);
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
    // Clear file input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  // Case 1: COD (Cash on Delivery) - Luxury Minimalist
  if (order.paymentMethod === 'COD') {
    return (
      <Card className="border-slate-200/80 bg-white overflow-hidden shadow-subtle rounded-2xl">
        <CardHeader className="bg-white border-b border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-700 shrink-0">
              <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight">
              เก็บเงินปลายทาง (Cash on Delivery)
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 whitespace-nowrap shrink-0">
            ชำระเมื่อรับสินค้า
          </span>
        </CardHeader>
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                คำแนะนำการจัดส่ง
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                เตรียมเงินสดให้พอดีเมื่อรับสินค้า
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
                เจ้าหน้าที่จัดส่งจะโทรแจ้งล่วงหน้าที่เบอร์{' '}
                <strong className="text-slate-900 font-mono font-semibold">{order.customer?.phone}</strong>{' '}
                ก่อนนำส่งกล่องขนมถึงมือคุณ
              </p>
            </div>

            <div className="w-full sm:w-auto px-6 py-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-center sm:text-right flex-shrink-0 min-w-[180px]">
              <span className="text-[11px] font-medium text-slate-500 block">
                ยอดชำระปลายทาง
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight block mt-0.5">
                ฿{formatPrice(order.total)}
              </span>
              <span className={`text-xs block mt-1 font-medium ${order.shippingFee === 0 ? 'text-brand-600' : 'text-slate-500'}`}>
                {order.shippingFee === 0
                  ? 'จัดส่งฟรี'
                  : `รวมค่าจัดส่ง ฿${formatPrice(order.shippingFee)}`}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Case 2: TRANSFER Payment - STATUS === 'PENDING'
  // (รอร้านค้ายืนยันก่อน จึงสามารถโอนเงินได้ และแนบสลิป)
  if (order.status === 'PENDING') {
    return (
      <Card className="border-sky-200/80 bg-white overflow-hidden shadow-xs">
        {/* Sleek Status Header */}
        <CardHeader className="bg-sky-50/70 border-b border-sky-100/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
            <h2 className="text-xs font-bold text-slate-800 tracking-wide font-mono">
              สถานะ: รอยืนยันออเดอร์จากทางร้าน
            </h2>
          </div>
          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/80 text-sky-800 border border-sky-200/70 whitespace-nowrap">
            รอยืนยันสต็อกและคิวอบ
          </span>
        </CardHeader>

        <CardBody className="p-4 sm:p-6 space-y-4">
          {/* Direct, clean status text */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              ทางร้านได้รับคำสั่งซื้อแล้ว อยู่ระหว่างตรวจสอบสต็อกและคิวอบ
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เมื่อทางร้านกดยืนยันออเดอร์แล้ว ระบบจะแสดง QR Code และช่องทางแนบสลิปโอนเงินทันที
            </p>
          </div>

          {/* Action Row: Refresh, Chat, and Edit Address */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                isLoading={isRefreshing}
                className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs py-1.5 px-3 h-auto"
              >
                <FontAwesomeIcon
                  icon={faRotate}
                  className={`w-3 h-3 text-brand-600 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>รีเฟรชสถานะ</span>
              </Button>

              <a
                href={`https://line.me/R/ti/p/@bibis.treats?text=${encodeURIComponent(`สวัสดีค่ะ แจ้งเตือนออเดอร์ใหม่ #${order.orderNumber} ค่ะ รบกวนตรวจสอบและกดยืนยันออเดอร์ให้ด้วยนะคะ ♡`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faLine} className="w-3.5 h-3.5 text-emerald-600" />
                <span>แจ้งเตือนผ่าน LINE</span>
              </a>

              <a
                href="https://www.instagram.com/bibi.streats?fqnt=MXNtZmVvaDhjbmZrOA%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} className="w-3.5 h-3.5 text-rose-500" />
                <span>Instagram</span>
              </a>
            </div>

            {!isEditingAddress && (
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors py-1 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
                <span>แก้ไขที่อยู่จัดส่ง</span>
              </button>
            )}
          </div>

          {/* Expandable Address Edit Form */}
          {isEditingAddress && (
            <form onSubmit={handleSaveAddress} className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">แก้ไขที่อยู่จัดส่งและหมายเหตุ</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingAddress(false);
                    setEditAddress(order.customer?.address || '');
                    setEditNote(order.note || '');
                    setAddressSaveError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ที่อยู่จัดส่งพัสดุ *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="ระบุที่อยู่จัดส่งอย่างละเอียด..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติมถึงร้าน (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="เช่น ฝากไว้กับนิติ, เขียนการ์ดอวยพร"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

              {addressSaveError && (
                <p className="text-xs text-rose-600 font-medium">{addressSaveError}</p>
              )}
              {addressSaveSuccess && (
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  <span>บันทึกที่อยู่เรียบร้อยแล้ว</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingAddress}
                >
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    );
  }

  // Case 3: TRANSFER Payment - STATUS !== 'PENDING'
  // (CONFIRMED, PREPARING, SHIPPING, COMPLETED -> Reveal Thai QR Payment + Upload Transfer Slip module)
  const bankAccountName = settings?.bankAccountName || 'น.ส. ฮาบีบี บุตรแหล่';
  const promptpayNumber = settings?.promptpayNumber || '086-296-5765';
  const bankName = settings?.bankName || 'ธนาคารกสิกรไทย (Kasikorn Bank)';
  const bankAccountNo = settings?.bankAccountNo || '142-1-52907-4';
  const qrImageUrl = settings?.qrImageUrl || '/images/thai-qr-payment.jpg';

  return (
    <div className="space-y-6">
      {/* Confirmation Callout */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-emerald-950">
              ร้านค้ายืนยันคำสั่งซื้อแล้ว
            </h3>
            <p className="text-xs text-emerald-800/80">
              สแกน QR Code ด้านล่างเพื่อชำระเงินและแนบสลิปโอนเงิน
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-emerald-800 hover:bg-emerald-100/80 shrink-0 text-xs hidden sm:inline-flex"
          >
            <FontAwesomeIcon
              icon={faRotate}
              className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>รีเฟรช</span>
          </Button>
        )}
      </div>

      {/* Official Thai QR Payment Card */}
      <Card className="border-brand-200 bg-white overflow-hidden shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2 min-w-0">
            <FontAwesomeIcon icon={faQrcode} className="w-4 h-4 text-brand-700 shrink-0" />
            <h2 className="text-xs font-bold text-slate-900 tracking-wide font-mono">
              ข้อมูลการชำระเงิน (ไทยคิวอาร์ / พร้อมเพย์)
            </h2>
          </div>
          <Badge variant="success" size="sm" className="whitespace-nowrap shrink-0">
            ยืนยันออเดอร์แล้ว • พร้อมชำระเงิน
          </Badge>
        </CardHeader>

        <CardBody className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Card */}
            <div className="md:col-span-5 text-center flex flex-col items-center">
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border-2 border-brand-200 shadow-md inline-block max-w-[180px] sm:max-w-[220px] mx-auto w-full">
                <img
                  src={qrImageUrl}
                  alt="Thai QR Payment PromptPay"
                  className="w-full h-auto rounded-xl object-contain mx-auto"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={qrImageUrl}
                  download="bibi-treats-qr.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors shadow-sm active:scale-95"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                  <span>บันทึกรูป QR Code</span>
                </a>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="md:col-span-7 space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 bg-brand-50/50 rounded-xl border border-brand-100 shadow-subtle">
                <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">
                  ยอดชำระสุทธิ (Total Amount to Transfer)
                </span>
                <span className="text-2xl font-black text-brand-600 font-mono">
                  ฿{formatPrice(order.total)}
                </span>
              </div>

              <div className="space-y-2">
                {/* Account Name */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 gap-1 sm:gap-2">
                  <span className="text-slate-500">ชื่อบัญชี:</span>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-slate-900">{bankAccountName}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('name', bankAccountName)}
                      className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      title="คัดลอกชื่อบัญชี"
                    >
                      {copiedField === 'name' ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* PromptPay */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 gap-1 sm:gap-2">
                  <span className="text-slate-500">พร้อมเพย์ (PromptPay):</span>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">
                      {promptpayNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('promptpay', promptpayNumber.replace(/[^0-9]/g, ''))}
                      className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      title="คัดลอกเบอร์พร้อมเพย์"
                    >
                      {copiedField === 'promptpay' ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 gap-1 sm:gap-2">
                  <span className="text-slate-500">ธนาคาร:</span>
                  <span className="font-semibold text-slate-900">{bankName}</span>
                </div>

                {/* Account Number */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 gap-1 sm:gap-2">
                  <span className="text-slate-500">เลขที่บัญชี:</span>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">
                      {bankAccountNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('account', bankAccountNo.replace(/[^0-9]/g, ''))}
                      className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      title="คัดลอกเลขบัญชี"
                    >
                      {copiedField === 'account' ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Upload Transfer Slip Module */}
      <Card className="border-brand-200 bg-white overflow-hidden shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2 min-w-0">
            <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-brand-700 shrink-0" />
            <h2 className="text-xs font-bold text-slate-900 tracking-wide font-mono">
              แนบสลิปหลักฐานการโอนเงิน (Upload Slip)
            </h2>
          </div>
          {order.slipUrl ? (
            <Badge variant="success" size="sm" className="whitespace-nowrap shrink-0">
              แนบสลิปแล้ว
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" className="whitespace-nowrap shrink-0">
              รอแนบสลิป
            </Badge>
          )}
        </CardHeader>

        <CardBody className="p-4 sm:p-6">
          {order.slipUrl ? (
            /* Sub-case: Slip is already attached */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      แนบสลิปเรียบร้อยแล้ว
                    </h4>
                    <p className="text-xs text-emerald-700">
                      ทางร้านกำลังตรวจสอบยอดเงิน เมื่อตรวจสอบเสร็จสิ้นจะเริ่มอบขนมทันทีค่ะ ♡
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all hover:scale-102">
                    <FontAwesomeIcon icon={faRotate} className="w-3 h-3 text-slate-500" />
                    <span>เปลี่ยนรูปสลิป</span>
                  </span>
                </label>
              </div>

              {/* Preview Thumbnail Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img
                      src={order.slipUrl}
                      alt="สลิปการโอนเงิน"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">หลักฐานการโอนเงินของคุณ</p>
                    <p className="text-[11px] text-slate-500 font-mono">ไฟล์สลิปถูกบันทึกเรียบร้อย</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={order.slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-brand-700 border border-brand-200 shadow-sm transition-colors"
                  >
                    <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                    <span>ดูสลิปขนาดเต็ม</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Sub-case: Slip NOT attached yet -> Drag & Drop / Touch-Friendly File Input */
            <div className="space-y-4">
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center select-none ${
                  isUploading
                    ? 'border-brand-400 bg-brand-50/50 opacity-90 cursor-wait'
                    : isDragging
                    ? 'border-brand-500 bg-brand-100/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50/30 active:scale-[0.99]'
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto border border-brand-300 shadow-subtle animate-spin">
                      <FontAwesomeIcon icon={faRotate} className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 max-w-xs mx-auto">
                      <p className="text-sm font-bold text-brand-800">
                        กำลังอัปโหลดและประมวลผลสลิป...
                      </p>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-600 h-full rounded-full animate-pulse w-3/4" />
                      </div>
                      <p className="text-[11px] text-slate-500">กรุณารอสักครู่ ระบบกำลังบันทึกหลักฐานการโอนเงิน</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border shadow-subtle transition-all ${
                        isDragging
                          ? 'bg-brand-600 text-white border-brand-700 scale-110'
                          : 'bg-brand-50 text-brand-600 border-brand-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {isDragging ? 'วางไฟล์รูปสลิปตรงนี้ได้เลย' : 'แตะเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางที่นี่'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        รองรับไฟล์ภาพ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </label>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
