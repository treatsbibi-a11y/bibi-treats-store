'use client';

import React, { useEffect, useState } from 'react';
import { OrderDetail, StoreSettingsData } from '@/types';
import { formatPrice } from '@/lib/order-utils';
import { convertImageToWebP } from '@/lib/image-utils';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faDownload,
  faCopy,
  faCheck,
  faCloudArrowUp,
  faRotate,
  faCircleCheck,
  faEye,
  faTriangleExclamation,
  faPenToSquare,
  faBoxOpen,
  faXmark,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { faLine, faInstagram } from '@fortawesome/free-brands-svg-icons';

interface PaymentQrData {
  allowed: boolean;
  orderNumber?: string;
  total: number;
  qrEndpoint: string;
  promptpayNumber: string;
  promptpayName: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  error?: string;
}

interface PaymentSlipSectionProps {
  order: OrderDetail;
  settings?: StoreSettingsData | null;
  onOrderUpdated?: (updatedOrder: OrderDetail) => void;
  onRefresh?: () => Promise<void> | void;
}

export default function PaymentSlipSection({
  order,
  onOrderUpdated,
  onRefresh,
}: PaymentSlipSectionProps) {
  const status = order.status as string;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullSlip, setShowFullSlip] = useState(false);

  // Gated QR state (fetched ONLY when TRANSFER + CONFIRMED)
  const [qrData, setQrData] = useState<PaymentQrData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Address editing states (allowed while PENDING)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState(order.customer?.address || '');
  const [editNote, setEditNote] = useState(order.note || '');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);
  const [addressSaveError, setAddressSaveError] = useState<string | null>(null);

  useEffect(() => {
    setEditAddress(order.customer?.address || '');
    setEditNote(order.note || '');
  }, [order.customer?.address, order.note]);

  useEffect(() => {
    if (!showFullSlip) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFullSlip(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullSlip]);

  const fetchPaymentQr = React.useCallback(async () => {
    if (order.paymentMethod !== 'TRANSFER' || (order.status as string) !== 'CONFIRMED') {
      setQrData(null);
      setQrError(null);
      return;
    }

    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/payment-qr`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.allowed) {
        setQrData(null);
        setQrError(data?.error || 'ไม่สามารถโหลดข้อมูล QR Code ชำระเงินได้ในขณะนี้');
        return;
      }
      setQrData(data as PaymentQrData);
    } catch {
      setQrData(null);
      setQrError('เกิดข้อผิดพลาดในการโหลด QR Code กรุณาลองใหม่อีกครั้ง');
    } finally {
      setQrLoading(false);
    }
  }, [order.orderNumber, order.paymentMethod, order.status]);

  useEffect(() => {
    if (order.paymentMethod === 'TRANSFER' && status === 'CONFIRMED') {
      void fetchPaymentQr();
    } else {
      // Never retain QR data outside CONFIRMED status
      setQrData(null);
      setQrError(null);
    }
  }, [order.paymentMethod, status, fetchPaymentQr]);

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

    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์เกิน 5MB กรุณาเลือกรูปภาพขนาดเล็กลง');
      return;
    }

    setIsUploading(true);

    try {
      const webpFile = await convertImageToWebP(file);
      const formData = new FormData();
      formData.append('file', webpFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'ไม่สามารถอัปโหลดไฟล์รูปภาพได้');
      }

      const slipUrl = uploadData.url;

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

  // Status: CANCELLED (both TRANSFER & COD) - NO QR Code, NO slip upload
  if (status === 'CANCELLED') {
    return (
      <Card className="border-rose-200/80 bg-white overflow-hidden shadow-sm rounded-3xl">
        <CardHeader className="bg-rose-50/70 border-b border-rose-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            🔴 ปฏิเสธออเดอร์
          </span>
          <span className="text-xs font-mono text-rose-700/80">#{order.orderNumber}</span>
        </CardHeader>
        <CardBody className="p-5 sm:p-7 space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1.5">
            <h3 className="text-sm sm:text-base font-bold text-rose-900">
              ไม่สามารถดำเนินการคำสั่งซื้อนี้ได้
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              ขออภัย ร้านไม่สามารถรับออเดอร์นี้ได้ในขณะนี้ กรุณาติดต่อร้านเพื่อสอบถามรายละเอียด
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <a
              href={`https://line.me/R/ti/p/@bibis.treats?text=${encodeURIComponent(`สวัสดีค่ะ สอบถามรายละเอียดออเดอร์ #${order.orderNumber} ค่ะ`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-semibold transition-colors"
            >
              <FontAwesomeIcon icon={faLine} className="w-3.5 h-3.5 text-emerald-600" />
              <span>ติดต่อร้านผ่าน LINE</span>
            </a>
            <a
              href="https://www.instagram.com/bibi.streats?fqnt=MXNtZmVvaDhjbmZrOA%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 font-semibold transition-colors"
            >
              <FontAwesomeIcon icon={faInstagram} className="w-3.5 h-3.5 text-rose-500" />
              <span>Instagram @bibi.streats</span>
            </a>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Case: COD (Cash on Delivery)
  if (order.paymentMethod === 'COD') {
    const codStatusBadge: Record<string, string> = {
      PENDING: '🟡 รอร้านยืนยัน',
      CONFIRMED: '🟢 ร้านยืนยันแล้ว / เตรียมจัดส่ง',
      SLIP_UPLOADED: '🟣 กำลังเตรียมสินค้า',
      PREPARING: '🟣 กำลังเตรียมสินค้า',
      SHIPPING: '🚚 กำลังจัดส่ง',
      COMPLETED: '✅ เสร็จสิ้น',
    };

    return (
      <Card className="border-sky-200/80 bg-white overflow-hidden shadow-sm rounded-3xl">
        <CardHeader className="bg-sky-50/80 border-b border-sky-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-brand-600 shrink-0 shadow-subtle">
              <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              เก็บเงินปลายทาง (Cash on Delivery)
            </h2>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-sky-900 border border-sky-200 whitespace-nowrap shrink-0">
            {codStatusBadge[status] || 'ชำระเมื่อรับสินค้า'}
          </span>
        </CardHeader>
        <CardBody className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 block">
                คำแนะนำการจัดส่ง
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                เตรียมเงินสดให้พอดีเมื่อรับสินค้า
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                เจ้าหน้าที่จัดส่งจะโทรแจ้งล่วงหน้าที่เบอร์{' '}
                <strong className="text-slate-900 font-mono font-semibold">{order.customer?.phone}</strong>{' '}
                ก่อนนำส่งกล่องขนมถึงมือคุณ
              </p>
            </div>

            <div className="w-full sm:w-auto px-6 py-4 bg-sky-50/70 rounded-2xl border border-sky-200/70 text-center sm:text-right flex-shrink-0 min-w-[180px]">
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

  // TRANSFER Case 1: PENDING (No QR Code, No slip upload)
  if (status === 'PENDING') {
    return (
      <Card className="border-sky-200/80 bg-white overflow-hidden shadow-sm rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-sky-50 via-sky-100/60 to-brand-50 border-b border-sky-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-800 border border-amber-200/90 shadow-subtle">
            🟡 รอร้านยืนยัน
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-800">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            อัปเดตสถานะอัตโนมัติ
          </span>
        </CardHeader>

        <CardBody className="p-5 sm:p-7 space-y-5">
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              ขอบคุณสำหรับคำสั่งซื้อ ❤️ กรุณารอร้านตรวจสอบและยืนยันออเดอร์ก่อนชำระเงิน
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              เมื่อร้านยืนยันคำสั่งซื้อแล้ว ระบบจะแสดง QR Code สำหรับชำระเงิน
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {onRefresh && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  isLoading={isRefreshing}
                  className="gap-1.5 border-sky-200 text-sky-800 bg-sky-50/50 hover:bg-sky-100/70 text-xs py-1.5 px-3 h-auto rounded-xl"
                >
                  <FontAwesomeIcon
                    icon={faRotate}
                    className={`w-3 h-3 text-brand-600 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span>รีเฟรชสถานะ</span>
                </Button>
              )}

              <a
                href={`https://line.me/R/ti/p/@bibis.treats?text=${encodeURIComponent(`สวัสดีค่ะ แจ้งเตือนออเดอร์ใหม่ #${order.orderNumber} ค่ะ รบกวนตรวจสอบและกดยืนยันออเดอร์ให้ด้วยนะคะ ♡`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faLine} className="w-3.5 h-3.5 text-emerald-600" />
                <span>แจ้งเตือนผ่าน LINE</span>
              </a>

              <a
                href="https://www.instagram.com/bibi.streats?fqnt=MXNtZmVvaDhjbmZrOA%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium transition-colors"
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

          {isEditingAddress && (
            <form onSubmit={handleSaveAddress} className="pt-4 border-t border-slate-100 space-y-3">
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
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

  // TRANSFER Case 2: CONFIRMED (ONLY status that fetches & renders gated QR + slip upload)
  if (status === 'CONFIRMED') {
    const payableTotal = qrData?.total ?? order.total;

    return (
      <div className="space-y-6">
        <Card className="border-sky-200/90 bg-white overflow-hidden shadow-sm rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-sky-50 via-sky-100/60 to-brand-50 border-b border-sky-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-subtle">
                🟢 ร้านยืนยันแล้ว / รอชำระเงิน
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                💳 ชำระเงินด้วย PromptPay
              </h2>
            </div>
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                isLoading={isRefreshing}
                className="text-sky-800 hover:bg-sky-100/80 shrink-0 text-xs rounded-xl"
              >
                <FontAwesomeIcon
                  icon={faRotate}
                  className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>รีเฟรช</span>
              </Button>
            )}
          </CardHeader>

          <CardBody className="p-5 sm:p-7 space-y-6">
            {qrLoading ? (
              <div className="py-10 text-center space-y-3 bg-sky-50/50 rounded-2xl border border-sky-100">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-medium">กำลังโหลด QR Code ชำระเงิน...</p>
              </div>
            ) : qrError || !qrData?.allowed ? (
              <div className="p-5 bg-rose-50/80 border border-rose-200 rounded-2xl text-center space-y-3">
                <p className="text-xs sm:text-sm text-rose-700 font-medium">
                  {qrError || 'ไม่สามารถแสดง QR Code ได้ในขณะนี้'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={fetchPaymentQr}>
                  ลองโหลด QR Code อีกครั้ง
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Image */}
                <div className="md:col-span-5 text-center flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl border-2 border-sky-200 shadow-sm inline-block max-w-[210px] mx-auto w-full">
                    <img
                      src={qrData.qrEndpoint}
                      alt="PromptPay QR Code"
                      className="w-full h-auto rounded-xl object-contain mx-auto"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={qrData.qrEndpoint}
                      download={`bibi-treats-qr-${order.orderNumber}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-brand-700 border border-sky-200 transition-colors shadow-subtle active:scale-95"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                      <span>บันทึกรูป QR Code</span>
                    </a>
                  </div>
                </div>

                {/* Bank & PromptPay Info */}
                <div className="md:col-span-7 space-y-3.5 text-xs text-slate-700">
                  <div className="p-4 bg-gradient-to-br from-sky-50 to-brand-50/80 rounded-2xl border border-sky-200/80 shadow-subtle">
                    <span className="text-sky-800 block text-[11px] font-semibold">
                      ยอดที่ต้องชำระ
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-brand-700 font-mono mt-0.5 block">
                      ฿{formatPrice(payableTotal)}
                    </span>
                  </div>

                  <div className="bg-slate-50/70 rounded-2xl border border-slate-100 px-4 py-1 divide-y divide-slate-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2">
                      <span className="text-slate-500">ชื่อบัญชี:</span>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="font-bold text-slate-900">
                          {qrData.bankAccountName || qrData.promptpayName}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyField('name', qrData.bankAccountName || qrData.promptpayName)
                          }
                          className="p-1 px-2.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
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

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2">
                      <span className="text-slate-500">พร้อมเพย์ (PromptPay):</span>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {qrData.promptpayNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyField('promptpay', qrData.promptpayNumber.replace(/[^0-9]/g, ''))
                          }
                          className="p-1 px-2.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
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

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2">
                      <span className="text-slate-500">ธนาคาร:</span>
                      <span className="font-semibold text-slate-900">{qrData.bankName}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2">
                      <span className="text-slate-500">เลขที่บัญชี:</span>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {qrData.bankAccountNo}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyField('account', qrData.bankAccountNo.replace(/[^0-9]/g, ''))
                          }
                          className="p-1 px-2.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
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
            )}

            {/* Prominent Slip Upload Section */}
            <div className="pt-5 border-t border-sky-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  📤 แนบสลิปการโอนเงิน
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  รอแนบสลิป
                </span>
              </div>

              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-[border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer text-center select-none ${
                  isUploading
                    ? 'border-brand-400 bg-sky-50/70 opacity-90 cursor-wait'
                    : isDragging
                    ? 'border-brand-500 bg-sky-100/80 scale-[1.01]'
                    : 'border-sky-300 bg-sky-50/40 hover:border-brand-500 hover:bg-sky-50 active:scale-[0.99]'
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-brand-600 flex items-center justify-center mx-auto border border-sky-300 animate-spin">
                      <FontAwesomeIcon icon={faRotate} className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 max-w-xs mx-auto">
                      <p className="text-sm font-bold text-brand-800">
                        กำลังอัปโหลดและบันทึกสลิป...
                      </p>
                      <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-600 h-full rounded-full animate-pulse w-3/4" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        กรุณารอสักครู่ ระบบกำลังส่งหลักฐานให้ทางร้านตรวจสอบ
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border shadow-subtle transition-[transform,background-color,border-color,color] duration-150 ease-[var(--ease-out)] ${
                        isDragging
                          ? 'bg-brand-600 text-white border-brand-700 scale-110'
                          : 'bg-white text-brand-600 border-sky-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCloudArrowUp} className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {isDragging
                          ? 'วางไฟล์รูปสลิปตรงนี้ได้เลย'
                          : 'แตะเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางที่นี่'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        รองรับไฟล์ภาพ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)
                      </p>
                    </div>

                    <div className="pt-1">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors">
                        📤 แนบสลิปการโอนเงิน
                      </span>
                    </div>
                  </div>
                )}
              </label>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // TRANSFER Case 3: SLIP_UPLOADED (Hide QR code, show slip thumbnail + awaiting verification)
  if (status === 'SLIP_UPLOADED') {
    return (
      <>
        <Card className="border-sky-200/90 bg-white overflow-hidden shadow-sm rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-sky-50 via-sky-100/60 to-brand-50 border-b border-sky-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white text-brand-800 border border-sky-200 shadow-subtle">
              🔵 ชำระเงินแล้ว / รอตรวจสอบ
            </span>
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                isLoading={isRefreshing}
                className="text-sky-800 hover:bg-sky-100/80 shrink-0 text-xs rounded-xl"
              >
                <FontAwesomeIcon
                  icon={faRotate}
                  className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>รีเฟรช</span>
              </Button>
            )}
          </CardHeader>

          <CardBody className="p-5 sm:p-7 space-y-5">
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white border border-sky-200 text-brand-600 flex items-center justify-center shrink-0 shadow-subtle">
                <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  ได้รับสลิปการโอนเงินเรียบร้อยแล้ว
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ทางร้านกำลังตรวจสอบสลิปและยอดเงินของคุณ เมื่อตรวจสอบเรียบร้อยแล้วจะเริ่มจัดเตรียมขนมสดใหม่ทันทีค่ะ ♡
                </p>
              </div>
            </div>

            {order.slipUrl && (
              <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowFullSlip(true)}
                    className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-subtle hover:opacity-90 transition-opacity cursor-pointer"
                    title="คลิกเพื่อดูรูปสลิปขนาดใหญ่"
                  >
                    <img
                      src={order.slipUrl}
                      alt="สลิปการโอนเงิน"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      หลักฐานการโอนเงินของคุณ
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ยอดชำระ ฿{formatPrice(order.total)} • รอร้านตรวจสอบสลิป
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullSlip(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-sky-50 text-brand-700 border border-sky-200 shadow-subtle transition-colors cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
                  <span>ดูสลิปขนาดเต็ม</span>
                </button>
              </div>
            )}
          </CardBody>
        </Card>

        {showFullSlip && order.slipUrl && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="สลิปการโอนเงินขนาดเต็ม"
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowFullSlip(false)}
          >
            <div
              className="relative bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowFullSlip(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-slate-100 text-slate-700 flex items-center justify-center shadow-sm cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
              <img
                src={order.slipUrl}
                alt="สลิปการโอนเงินขนาดเต็ม"
                className="w-full max-h-[80vh] object-contain block"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // TRANSFER Case 4: PREPARING / SHIPPING / COMPLETED (NO QR)
  const postPaymentMeta: Record<
    string,
    { badge: string; title: string; desc: string; icon: any; accentClass: string }
  > = {
    PREPARING: {
      badge: '🟣 กำลังเตรียมสินค้า',
      title: 'ชำระเงินเรียบร้อยแล้ว • ทางร้านกำลังอบและจัดเตรียมขนม',
      desc: 'ขนมของคุณกำลังถูกอบสดใหม่จากเตาและแพ็กอย่างพิถีพิถัน',
      icon: faBoxOpen,
      accentClass: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    SHIPPING: {
      badge: '🚚 กำลังจัดส่ง',
      title: 'พัสดุอยู่ระหว่างการจัดส่งถึงมือคุณ',
      desc: 'ขนส่งกำลังนำส่งกล่องขนมสดใหม่ กรุณารอรับสายจากเจ้าหน้าที่จัดส่ง',
      icon: faTruck,
      accentClass: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    COMPLETED: {
      badge: '✅ เสร็จสิ้น',
      title: 'จัดส่งสำเร็จเรียบร้อยแล้ว ขอบคุณที่อุดหนุน Bibi’s Treats ♡',
      desc: 'หวังว่าคุณจะมีความสุขกับขนมโฮมเมดจากร้านเรานะคะ',
      icon: faCircleCheck,
      accentClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  };

  const meta = postPaymentMeta[status] || {
    badge: status,
    title: 'ตรวจสอบข้อมูลการชำระเงินเรียบร้อยแล้ว',
    desc: 'ขอบคุณสำหรับคำสั่งซื้อกับ Bibi’s Treats',
    icon: faCreditCard,
    accentClass: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  return (
    <Card className="border-sky-200/80 bg-white overflow-hidden shadow-sm rounded-3xl">
      <CardHeader className="bg-gradient-to-r from-sky-50 via-sky-100/50 to-brand-50 border-b border-sky-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 px-5 sm:px-7 py-4">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${meta.accentClass}`}
        >
          {meta.badge}
        </span>
        <span className="text-xs font-mono font-semibold text-slate-600">
          ชำระแล้ว ฿{formatPrice(order.total)}
        </span>
      </CardHeader>
      <CardBody className="p-5 sm:p-7">
        <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-100">
          <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 text-brand-600 flex items-center justify-center shrink-0 shadow-subtle">
            <FontAwesomeIcon icon={meta.icon} className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{meta.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{meta.desc}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
