import { OrderStatus } from '@/types';

export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'รอร้านยืนยัน',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  CONFIRMED: {
    label: 'ร้านยืนยันแล้ว / รอชำระเงิน',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  SLIP_UPLOADED: {
    label: 'ชำระเงินแล้ว / รอตรวจสอบ',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  PREPARING: {
    label: 'กำลังเตรียมสินค้า',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  SHIPPING: {
    label: 'กำลังจัดส่ง',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  COMPLETED: {
    label: 'เสร็จสิ้น',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CANCELLED: {
    label: 'ปฏิเสธออเดอร์',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function formatPrice(amount: number): string {
  // Formats price in Thai locale for UI consistency
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
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
    return '-';
  }
}
