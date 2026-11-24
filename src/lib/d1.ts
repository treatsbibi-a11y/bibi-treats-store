import { ProductWithImages, OrderDetail, StoreSettingsData, OrderStatus, PaymentMethod } from '@/types';
import { prisma } from './prisma';

/**
 * Cloudflare D1 Database Helper & Repository
 * 
 * Maps directly between Cloudflare D1 (SQLite Edge Database)
 * and the Frontend TypeScript Data Models (ProductWithImages, OrderDetail, StoreSettingsData).
 */

export interface CloudflareD1Binding {
  prepare(query: string): {
    bind(...values: any[]): {
      first<T = any>(): Promise<T | null>;
      all<T = any>(): Promise<{ results: T[]; success: boolean }>;
      run(): Promise<{ success: boolean; meta: any }>;
    };
  };
}

// ----------------------------------------------------------------------
// 1. PRODUCTS & CATALOG (Front End: ProductWithImages[])
// ----------------------------------------------------------------------

export async function getD1Products(options?: {
  category?: string;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'all';
  d1Binding?: CloudflareD1Binding;
}): Promise<ProductWithImages[]> {
  // If running in Edge environment with native D1 binding:
  if (options?.d1Binding) {
    let sql = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.initialStock, p.sold, 
        p.category, p.status, p.createdAt, p.updatedAt,
        COALESCE(
          json_group_array(
            json_object(
              'id', pi.id,
              'productId', pi.productId,
              'imageUrl', pi.imageUrl,
              'isPrimary', pi.isPrimary,
              'displayOrder', pi.displayOrder
            )
          ),
          '[]'
        ) as images_json
      FROM Product p
      LEFT JOIN ProductImage pi ON p.id = pi.productId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.status && options.status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(options.status);
    } else if (!options.status) {
      sql += ` AND p.status = 'ACTIVE'`;
    }

    if (options.category && options.category !== 'All') {
      sql += ` AND p.category = ?`;
      params.push(options.category);
    }

    if (options.search && options.search.trim()) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
    }

    sql += ` GROUP BY p.id ORDER BY p.createdAt DESC`;

    const stmt = options.d1Binding.prepare(sql).bind(...params);
    const { results } = await stmt.all<any>();

    return results.map((row: any) => {
      let images = [];
      try {
        images = JSON.parse(row.images_json || '[]').filter((img: any) => img.id !== null);
      } catch {
        images = [];
      }
      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        stock: Number(row.stock),
        initialStock: Number(row.initialStock),
        sold: Number(row.sold),
        category: row.category,
        status: row.status as 'ACTIVE' | 'INACTIVE',
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
        images: images.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
      };
    });
  }

  // Fallback / Standard Node Runtime via Prisma:
  const where: any = {};
  if (options?.status && options.status !== 'all') {
    where.status = options.status;
  } else if (!options?.status) {
    where.status = 'ACTIVE';
  }

  if (options?.category && options?.category !== 'All') {
    where.category = options.category;
  }

  if (options?.search && options.search.trim()) {
    where.OR = [
      { name: { contains: options.search.trim() } },
      { description: { contains: options.search.trim() } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    initialStock: p.initialStock,
    sold: p.sold,
    category: p.category,
    status: p.status as 'ACTIVE' | 'INACTIVE',
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  }));
}

// ----------------------------------------------------------------------
// 2. STORE SETTINGS (Front End: StoreSettingsData)
// ----------------------------------------------------------------------

export async function getD1StoreSettings(d1Binding?: CloudflareD1Binding): Promise<StoreSettingsData | null> {
  if (d1Binding) {
    const stmt = d1Binding.prepare(`SELECT * FROM StoreSettings LIMIT 1`);
    const row = await stmt.bind().first<any>();
    if (!row) return null;

    return {
      shopName: row.shopName,
      tagline: row.tagline,
      logoUrl: row.logoUrl,
      qrImageUrl: row.qrImageUrl,
      promptpayNumber: row.promptpayNumber,
      promptpayName: row.promptpayName,
      bankName: row.bankName,
      bankAccountNo: row.bankAccountNo,
      bankAccountName: row.bankAccountName,
      defaultShippingFee: Number(row.defaultShippingFee),
      isStoreOpen: Boolean(row.isStoreOpen),
      announcement: row.announcement,
    };
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings) return null;

  return {
    shopName: settings.shopName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    qrImageUrl: settings.qrImageUrl,
    promptpayNumber: settings.promptpayNumber,
    promptpayName: settings.promptpayName,
    bankName: settings.bankName,
    bankAccountNo: settings.bankAccountNo,
    bankAccountName: settings.bankAccountName,
    defaultShippingFee: settings.defaultShippingFee,
    isStoreOpen: settings.isStoreOpen,
    announcement: settings.announcement,
  };
}

// ----------------------------------------------------------------------
// 3. ORDER DETAILS (Front End: OrderDetail)
// ----------------------------------------------------------------------

export async function getD1OrderDetail(
  orderIdOrNumber: string,
  d1Binding?: CloudflareD1Binding
): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    status: order.status as OrderStatus,
    paymentMethod: order.paymentMethod as PaymentMethod,
    slipUrl: order.slipUrl,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone,
      instagram: order.customer.instagram,
      address: order.customer.address,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? '',
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      product: item.product
        ? {
            images: item.product.images.map((img) => ({
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary,
            })),
          }
        : null,
    })),
  };
}
