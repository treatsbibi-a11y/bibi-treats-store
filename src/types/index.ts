export interface ProductWithImages {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  initialStock: number;
  sold: number;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  images: {
    id: string;
    productId: string;
    imageUrl: string;
    isPrimary: boolean;
    displayOrder: number;
  }[];
}

export interface CartItem {
  product: ProductWithImages;
  quantity: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SLIP_UPLOADED'
  | 'PREPARING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'TRANSFER' | 'COD';

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  slipUrl?: string | null;
  note?: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    instagram?: string | null;
    address: string;
  };
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    product?: {
      images: { imageUrl: string; isPrimary: boolean }[];
    } | null;
  }[];
}

export interface StoreSettingsData {
  shopName: string;
  tagline: string;
  logoUrl?: string | null;
  qrImageUrl?: string | null;
  promptpayNumber: string;
  promptpayName: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  defaultShippingFee: number;
  isStoreOpen: boolean;
  announcement?: string | null;
}

export type ReviewStatus = 'VISIBLE' | 'HIDDEN';

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  images: string[];
  productId?: string | null;
  productName?: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRatingBreakdown {
  star: 5 | 4 | 3 | 2 | 1;
  count: number;
  percentage: number;
}

export interface ReviewStats {
  averageRating: number;
  totalCount: number;
  breakdown: ReviewRatingBreakdown[];
}
