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

  const barcodeBars = React.useMemo(() => {
    const seed = order?.orderNumber || 'BIBISTREATS';
    const bars: number[] = [];
    for (let i = 0; i < 44; i++) {
      const code = seed.charCodeAt(i % seed.length) || 65;
      const w = ((code * (i + 7)) % 3) + 1; // 1, 2, or 3px
      bars.push(w);
    }
    return bars;
  }, [order?.orderNumber]);

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
        {/* Success Header */}
        <div className="text-center space-y-2.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200/80 shadow-xs">
            <FontAwesomeIcon icon={faCircleCheck} className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            สั่งซื้อสำเร็จเรียบร้อยแล้ว
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs font-mono text-xs">
            <span className="text-slate-400">เลขที่ออเดอร์:</span>
            <span className="font-bold text-slate-900">{orderNumber}</span>
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

        {/* Realistic 80mm POS Thermal Receipt Slip */}
        {order && (
          <div className="space-y-3 pt-2">
            {/* Control Bar (Web Only) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                  ใบเสร็จคำสั่งซื้อ (Receipt Slip)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  80mm Thermal Slip
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveImage}
                  type="button"
                  disabled={isSavingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-95"
                  title="พิมพ์ใบเสร็จ หรือบันทึกเป็น PDF"
                >
                  <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5 text-slate-600" />
                  <span>พิมพ์ใบเสร็จ</span>
                </button>
              </div>
            </div>

            {/* Authentic 80mm Slip */}
            <div
              id="printable-slip"
              className="w-full max-w-[420px] mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_35px_-8px_rgba(0,0,0,0.07)] relative overflow-hidden text-slate-800 font-sans transition-all"
            >
              {/* Top Sawtooth Paper Tear Effect (Web only decorative) */}
              <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print">
                <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,6 L5,0 L10,6 L15,0 L20,6 L25,0 L30,6 L35,0 L40,6 L45,0 L50,6 L55,0 L60,6 L65,0 L70,6 L75,0 L80,6 L85,0 L90,6 L95,0 L100,6 L105,0 L110,6 L115,0 L120,6 L125,0 L130,6 L135,0 L140,6 L145,0 L150,6 L155,0 L160,6 L165,0 L170,6 L175,0 L180,6 L185,0 L190,6 L195,0 L200,6 L205,0 L210,6 L215,0 L220,6 L225,0 L230,6 L235,0 L240,6 L245,0 L250,6 L255,0 L260,6 L265,0 L270,6 L275,0 L280,6 L285,0 L290,6 L295,0 L300,6 Z" />
                </svg>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Store POS Header */}
                <div className="text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-mono font-medium">
                    ARTISANAL HOMEMADE BAKERY
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {settings?.shopName || "Bibi's Treats"}
                  </h1>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {settings?.tagline || "ขนมโฮมเมด สดใหม่จากเตา อบด้วยใจทุกชิ้น"}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1 flex items-center justify-center gap-2">
                    <span>IG: @bibis.treats.bkk</span>
                    <span>•</span>
                    <span>โทร: 086-296-5765</span>
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Receipt Meta */}
                <div className="text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">เอกสาร / DOC</span>
                    <span className="font-bold text-slate-900">RECEIPT / ORDER SLIP</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">เลขที่ / ORDER NO.</span>
                    <span className="font-bold text-slate-900">{order.orderNumber}</span>
                  </div>
                  {formattedOrderDate && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase">วันที่ / DATE</span>
                      <span>{formattedOrderDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] text-slate-400 uppercase">สถานะ / STATUS</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                        STATUS_CONFIG[order.status]?.badgeClass || 'text-slate-700 bg-slate-100'
                      }`}
                    >
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Itemized Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400 pb-1 border-b border-slate-200">
                    <span>รายการ (ITEM)</span>
                    <span className="text-right">ยอดรวม (AMOUNT)</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {order.items.map((item) => {
                      const unitPrice =
                        item.price || (item.quantity ? Math.round(item.subtotal / item.quantity) : item.subtotal);
                      return (
                        <div key={item.id} className="space-y-0.5">
                          <div className="flex justify-between items-start text-xs font-semibold text-slate-900 leading-snug">
                            <span className="pr-2">{item.productName}</span>
                            <span className="font-mono text-slate-900 shrink-0 font-bold">
                              ฿{formatPrice(item.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                            <span>
                              {item.quantity} × ฿{formatPrice(unitPrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Financial Summary */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>ยอดรวมสินค้า (Subtotal)</span>
                    <span className="font-mono font-medium">฿{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าจัดส่งพัสดุ (Shipping)</span>
                    <span className="font-mono font-medium">฿{formatPrice(order.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>วิธีชำระเงิน (Payment)</span>
                    <span className="font-medium text-slate-800">
                      {order.paymentMethod === 'COD'
                        ? 'เก็บเงินปลายทาง (Cash on Delivery)'
                        : 'โอนเงินผ่าน PromptPay / QR'}
                    </span>
                  </div>

                  {/* Net Total Box */}
                  <div className="flex justify-between items-baseline pt-2 mt-2 border-t-2 border-b-2 border-dashed border-slate-900 py-1.5">
                    <span className="font-bold text-slate-950 text-xs uppercase tracking-wider font-mono">
                      ยอดรวมสุทธิ (TOTAL)
                    </span>
                    <span className="font-mono text-base font-black text-slate-950">
                      ฿{formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Customer & Delivery Section */}
                <div className="pt-1 space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                    ข้อมูลจัดส่ง (DELIVER TO)
                  </div>
                  <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-1 border border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{order.customer.name}</span>
                      <span className="text-slate-500 font-mono font-normal">({order.customer.phone})</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-4 text-[11px]">{order.customer.address}</p>
                    {order.note && (
                      <p className="text-amber-800 bg-amber-50/80 px-2 py-1 rounded text-[10px] mt-1 border border-amber-200/60">
                        <span className="font-semibold">หมายเหตุ:</span> {order.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="border-b border-dashed border-slate-300 my-2" />

                {/* Barcode & Footer */}
                <div className="text-center space-y-2 pt-1">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-[2px] h-7 overflow-hidden px-4">
                      {barcodeBars.map((w, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-900 h-full inline-block shrink-0"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500 mt-1 uppercase">
                      *{order.orderNumber}*
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[11px] text-slate-600 font-medium pt-1">
                    <p>ขอบคุณที่อุดหนุนความอร่อยกับ Bibi&apos;s Treats ♡</p>
                    <p className="text-[10px] text-slate-400">ติดตามสถานะออเดอร์ได้ที่ bibi-store.com</p>
                  </div>
                </div>
              </div>

              {/* Bottom Sawtooth Paper Tear Effect (Web only decorative) */}
              <div className="w-full h-2 overflow-hidden flex text-slate-100 no-print">
                <svg className="w-full h-2" viewBox="0 0 300 6" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,0 L5,6 L10,0 L15,6 L20,0 L25,6 L30,0 L35,6 L40,0 L45,6 L50,0 L55,6 L60,0 L65,6 L70,0 L75,6 L80,0 L85,6 L90,0 L95,6 L100,0 L105,6 L110,0 L115,6 L120,0 L125,6 L130,0 L135,6 L140,0 L145,6 L150,0 L155,6 L160,0 L165,6 L170,0 L175,6 L180,0 L185,6 L190,0 L195,6 L200,0 L205,6 L210,0 L215,6 L220,0 L225,6 L230,0 L235,6 L240,0 L245,6 L250,0 L255,6 L260,0 L265,6 L270,0 L275,6 L280,0 L285,6 L290,0 L295,6 L300,0 Z" />
                </svg>
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
