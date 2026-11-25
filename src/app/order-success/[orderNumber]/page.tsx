'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { formatPrice } from '@/lib/order-utils';
import { OrderDetail, StoreSettingsData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import PaymentSlipSection from '@/components/customer/PaymentSlipSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCopy,
  faCheck,
  faMagnifyingGlass,
  faHouse,
  faQrcode,
  faLocationDot,
  faPrint,
  faTruck,
  faMoneyBillWave,
  faBuildingColumns,
  faDownload,
  faReceipt,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  PENDING: { label: 'รอตรวจสอบยอดชำระ', badgeClass: 'text-amber-800 bg-amber-50 border border-amber-200' },
  CONFIRMED: { label: 'ยืนยันออเดอร์แล้ว', badgeClass: 'text-emerald-800 bg-emerald-50 border border-emerald-200' },
  PREPARING: { label: 'กำลังเตรียมขนม', badgeClass: 'text-blue-800 bg-blue-50 border border-blue-200' },
  SHIPPING: { label: 'กำลังจัดส่งพัสดุ', badgeClass: 'text-indigo-800 bg-indigo-50 border border-indigo-200' },
  COMPLETED: { label: 'จัดส่งสำเร็จเรียบร้อย', badgeClass: 'text-emerald-800 bg-emerald-50 border border-emerald-200' },
  CANCELLED: { label: 'ยกเลิกคำสั่งซื้อ', badgeClass: 'text-rose-800 bg-rose-50 border border-rose-200' },
};

export default function OrderSuccessPage() {
  const params = useParams();
  const orderNumber = (params?.orderNumber as string) || '';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0F87E8', '#38A4F6', '#BAE0FD', '#F1F5F9'],
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [orderRes, settingsRes] = await Promise.all([
          fetch(`/api/orders/${orderNumber}`),
          fetch('/api/settings'),
        ]);

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } catch (err) {
        console.error('Failed to load order success data', err);
      } finally {
        setLoading(false);
      }
    }

    if (orderNumber) {
      loadData();
    }
  }, [orderNumber]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveImage = async () => {
    const slipElement = document.getElementById('printable-slip');
    if (!slipElement || isSavingImage) return;

    try {
      setIsSavingImage(true);
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await (html2canvas as any)(slipElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc: Document) => {
          const clonedSlip = clonedDoc.getElementById('printable-slip');
          if (clonedSlip) {
            clonedSlip.style.borderRadius = '16px';
            clonedSlip.style.boxShadow = 'none';
          }
        },
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${order?.orderNumber || 'bibi-treats'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export receipt image', err);
    } finally {
      setIsSavingImage(false);
    }
  };

  const formattedOrderDate = React.useMemo(() => {
    if (!order?.createdAt) return '';
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return '';
      return (
        d.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' น.'
      );
    } catch {
      return '';
    }
  }, [order?.createdAt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-ground flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-ground py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header - Luxury Minimalist */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto border border-brand-200/80">
            <FontAwesomeIcon icon={faCheck} className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              สั่งซื้อสำเร็จเรียบร้อยแล้ว
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ขอบคุณที่ไว้วางใจขนมอบสดใหม่จาก Bibi&apos;s Treats
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleCopyAccount(orderNumber)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 shadow-subtle font-mono text-xs transition-all active:scale-95 cursor-pointer"
              title="คัดลอกเลขที่ออเดอร์"
            >
              <span className="text-slate-400">เลขที่ออเดอร์</span>
              <span className="font-bold text-slate-900">{orderNumber}</span>
              <span className="h-3 w-px bg-slate-200" />
              <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                className={`w-3 h-3 ${copied ? 'text-brand-600' : 'text-slate-400'}`}
              />
            </button>
          </div>
        </div>

        {/* Payment & Slip Section */}
        {order && (
          <PaymentSlipSection
            order={order}
            settings={settings}
            onOrderUpdated={(updated) => setOrder(updated)}
            onRefresh={async () => {
              if (!orderNumber) return;
              try {
                const res = await fetch(`/api/orders/${orderNumber}`);
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

        {/* Boutique Digital Receipt */}
        {order && (
          <div className="space-y-3 pt-2">
            {/* Control Bar (Web Only) */}
            <div className="no-print max-w-lg mx-auto flex flex-wrap items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  ใบเสร็จคำสั่งซื้อ
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveImage}
                  type="button"
                  disabled={isSavingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-subtle hover:border-slate-300 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  title="บันทึกใบเสร็จเป็นรูปภาพ PNG คมชัดสูง"
                >
                  <FontAwesomeIcon
                    icon={isSavingImage ? faRotate : faDownload}
                    className={`w-3.5 h-3.5 text-brand-600 ${isSavingImage ? 'animate-spin' : ''}`}
                  />
                  <span>{isSavingImage ? 'กำลังบันทึก...' : 'บันทึกรูปภาพ'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-subtle hover:border-slate-300 transition-all cursor-pointer active:scale-95"
                  title="พิมพ์ใบเสร็จ หรือบันทึกเป็น PDF"
                >
                  <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-slate-600" />
                  <span>พิมพ์ใบเสร็จ</span>
                </button>
              </div>
            </div>

            {/* Boutique Receipt Card */}
            <div
              id="printable-slip"
              className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-subtle relative overflow-hidden text-slate-800 font-sans transition-all"
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Store Header */}
                <div className="text-center space-y-1.5">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium">
                    ARTISANAL HOMEMADE BAKERY
                  </div>
                  <div
                    className="text-4xl font-normal text-slate-900 py-0.5 select-none"
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                  >
                    {settings?.shopName || "Bibi's Treats"}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {settings?.tagline || "ขนมโฮมเมด สดใหม่จากเตา อบด้วยใจทุกชิ้น"}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-0.5 flex items-center justify-center gap-2">
                    <span>IG: @bibis.treats.bkk</span>
                    <span>•</span>
                    <span>โทร: 086-296-5765</span>
                  </div>
                </div>

                {/* Order Meta */}
                <div className="border-t border-b border-slate-100 py-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">เลขที่ออเดอร์</span>
                    <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">วันที่สั่งซื้อ</span>
                    <span className="text-slate-700 mt-0.5 block">
                      {formattedOrderDate || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">วิธีชำระเงิน</span>
                    <span className="text-slate-700 font-medium mt-0.5 block">
                      {order.paymentMethod === 'COD'
                        ? 'เก็บเงินปลายทาง (COD)'
                        : 'โอนเงิน PromptPay / QR'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">สถานะ</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 mt-0.5">
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400 pb-1 border-b border-slate-100">
                    <span>รายการสินค้า</span>
                    <span className="text-right">ยอดรวม</span>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const unitPrice =
                        item.price || (item.quantity ? Math.round(item.subtotal / item.quantity) : item.subtotal);
                      return (
                        <div key={item.id} className="flex justify-between items-start gap-4 text-xs sm:text-sm">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 leading-snug">
                              {item.productName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {item.quantity} × ฿{formatPrice(unitPrice)}
                            </div>
                          </div>
                          <span className="font-mono text-slate-900 shrink-0 font-semibold">
                            ฿{formatPrice(item.subtotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 pt-4 border-t border-slate-100 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>ยอดรวมสินค้า</span>
                    <span className="font-mono text-slate-700">฿{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>ค่าจัดส่งพัสดุ</span>
                    <span className="font-mono">
                      {order.shippingFee === 0 ? (
                        <span className="font-sans font-medium text-brand-600">จัดส่งฟรี</span>
                      ) : (
                        <span className="text-slate-700">฿{formatPrice(order.shippingFee)}</span>
                      )}
                    </span>
                  </div>

                  {/* Net Total Row */}
                  <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-slate-200/80">
                    <span className="font-semibold text-slate-900 text-sm">
                      ยอดรวมสุทธิ
                    </span>
                    <span className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                      ฿{formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Customer & Delivery Section */}
                <div className="bg-slate-50/80 rounded-xl p-4 space-y-1.5 border border-slate-100 text-xs">
                  <div className="text-[11px] font-medium text-slate-400">
                    ข้อมูลจัดส่ง
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{order.customer.name}</span>
                    <span className="text-slate-500 font-mono font-normal">({order.customer.phone})</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-4">{order.customer.address}</p>
                  {order.note && (
                    <p className="text-slate-600 bg-white px-2.5 py-1.5 rounded-lg text-[11px] mt-1.5 border border-slate-200/70">
                      <span className="font-semibold text-slate-700">หมายเหตุ:</span> {order.note}
                    </p>
                  )}
                </div>

                {/* Boutique Footer */}
                <div className="text-center space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600 font-medium">
                    ขอบคุณที่อุดหนุนความอร่อยกับ Bibi&apos;s Treats
                  </p>
                  <p className="text-[11px] text-slate-400">
                    bibi-treats-store.pages.dev
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/tracking" className="flex-1">
            <Button variant="primary" size="lg" className="w-full gap-2">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 mr-1" />
              <span>ติดตามสถานะออเดอร์</span>
            </Button>
          </Link>
          <Link href="/#menu" className="flex-1">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <FontAwesomeIcon icon={faHouse} className="w-3.5 h-3.5 mr-1" />
              <span>กลับหน้าหลักร้านค้า</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
