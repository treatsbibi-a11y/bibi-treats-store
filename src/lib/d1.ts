import { ProductWithImages, OrderDetail, StoreSettingsData, OrderStatus, PaymentMethod, ReviewItem, ReviewStats, ReviewStatus } from '@/types';
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

    sql += ` GROUP BY p.id ORDER BY CASE WHEN p.status = 'ACTIVE' THEN 0 ELSE 1 END ASC, p.createdAt DESC`;

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
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
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
// 3. ORDER DETAILS & MUTATIONS (Front End: OrderDetail)
// ----------------------------------------------------------------------

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    instagram?: string | null;
    address: string;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentMethod: string;
  shippingFee?: number;
  note?: string | null;
  slipUrl?: string | null;
  d1Binding: CloudflareD1Binding;
}

export async function createD1Order(input: CreateOrderInput): Promise<OrderDetail> {
  const { d1Binding } = input;

  // 1. Check if store is open from StoreSettings
  const settingsStmt = d1Binding.prepare(`
    SELECT isStoreOpen, defaultShippingFee FROM StoreSettings LIMIT 1
  `);
  const settings = await settingsStmt.bind().first<any>();

  if (settings && (settings.isStoreOpen === 0 || settings.isStoreOpen === false)) {
    throw new Error('ขออภัย ขณะนี้ร้านปิดรับออเดอร์ชั่วคราว');
  }

  // 2. Check product existence, active status, and stock
  let subtotal = 0;
  const preparedOrderItems: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[] = [];

  for (const item of input.items) {
    const product = await d1Binding
      .prepare(`SELECT id, name, price, stock, status FROM Product WHERE id = ? LIMIT 1`)
      .bind(item.productId)
      .first<any>();

    if (!product) {
      throw new Error('ไม่พบข้อมูลสินค้าบางรายการในระบบ');
    }

    if (product.status !== 'ACTIVE') {
      throw new Error(`สินค้า "${product.name}" ไม่พร้อมจำหน่ายในขณะนี้`);
    }

    if (Number(product.stock) < item.quantity) {
      throw new Error(
        `สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)`
      );
    }

    const itemPrice = Number(product.price);
    const itemSubtotal = itemPrice * item.quantity;
    subtotal += itemSubtotal;

    preparedOrderItems.push({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: itemPrice,
      subtotal: itemSubtotal,
    });
  }

  // 3. Generate unique orderNumber (BT-XXXX)
  const countRow = await d1Binding
    .prepare(`SELECT COUNT(*) as count FROM [Order]`)
    .bind()
    .first<any>();
  const count = Number(countRow?.count || 0);

  const lastOrder = await d1Binding
    .prepare(`SELECT orderNumber FROM [Order] ORDER BY createdAt DESC LIMIT 1`)
    .bind()
    .first<any>();

  let maxNum = count;
  if (lastOrder?.orderNumber && typeof lastOrder.orderNumber === 'string' && lastOrder.orderNumber.startsWith('BT-')) {
    const parsed = parseInt(lastOrder.orderNumber.replace('BT-', ''), 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  let nextNum = maxNum + 1;
  let orderNumber = `BT-${String(nextNum).padStart(4, '0')}`;
  let exists = await d1Binding
    .prepare(`SELECT id FROM [Order] WHERE orderNumber = ? LIMIT 1`)
    .bind(orderNumber)
    .first<any>();

  while (exists) {
    nextNum++;
    orderNumber = `BT-${String(nextNum).padStart(4, '0')}`;
    exists = await d1Binding
      .prepare(`SELECT id FROM [Order] WHERE orderNumber = ? LIMIT 1`)
      .bind(orderNumber)
      .first<any>();
  }

  // 4. Calculate shipping fee and total
  const shippingFee =
    input.shippingFee !== undefined
      ? Number(input.shippingFee)
      : settings?.defaultShippingFee !== undefined && settings?.defaultShippingFee !== null
      ? Number(settings.defaultShippingFee)
      : 40;
  const total = subtotal + shippingFee;

  // 5. Insert into Customer, [Order], and OrderItem
  const customerId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();

  await d1Binding
    .prepare(`
      INSERT INTO Customer (id, name, phone, instagram, address, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      customerId,
      input.customer.name.trim(),
      input.customer.phone.trim(),
      input.customer.instagram?.trim() || null,
      input.customer.address.trim(),
      now
    )
    .run();

  const paymentMethod = input.paymentMethod === 'COD' ? 'COD' : 'TRANSFER';
  const cleanSlipUrl = input.slipUrl ? String(input.slipUrl).trim() : null;
  const initialStatus = paymentMethod === 'TRANSFER' && cleanSlipUrl ? 'SLIP_UPLOADED' : 'PENDING';

  await d1Binding
    .prepare(`
      INSERT INTO [Order] (
        id, orderNumber, customerId, subtotal, shippingFee, total,
        status, paymentMethod, slipUrl, note, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      orderId,
      orderNumber,
      customerId,
      subtotal,
      shippingFee,
      total,
      initialStatus,
      paymentMethod,
      cleanSlipUrl,
      input.note?.trim() || null,
      now,
      now
    )
    .run();

  for (const item of preparedOrderItems) {
    await d1Binding
      .prepare(`
        INSERT INTO OrderItem (id, orderId, productId, productName, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        item.id,
        orderId,
        item.productId,
        item.productName,
        item.quantity,
        item.price,
        item.subtotal
      )
      .run();
  }

  // 6. Update product stock and sold (UPDATE Product SET stock = stock - ?, sold = sold + ? WHERE id = ?)
  for (const item of preparedOrderItems) {
    await d1Binding
      .prepare(`
        UPDATE Product SET stock = stock - ?, sold = sold + ? WHERE id = ?
      `)
      .bind(
        item.quantity,
        item.quantity,
        item.productId
      )
      .run();
  }

  // 7. Return created order object matching OrderDetail
  const createdOrder = await getD1OrderDetail(orderId, d1Binding);
  if (createdOrder) {
    return createdOrder;
  }

  return {
    id: orderId,
    orderNumber,
    customerId,
    subtotal,
    shippingFee,
    total,
    status: initialStatus,
    paymentMethod: paymentMethod as PaymentMethod,
    slipUrl: cleanSlipUrl,
    note: input.note?.trim() || null,
    createdAt: now,
    customer: {
      id: customerId,
      name: input.customer.name.trim(),
      phone: input.customer.phone.trim(),
      instagram: input.customer.instagram?.trim() || null,
      address: input.customer.address.trim(),
    },
    items: preparedOrderItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      product: null,
    })),
  };
}

export async function getD1OrderDetail(
  orderIdOrNumber: string,
  d1Binding?: CloudflareD1Binding
): Promise<OrderDetail | null> {
  if (d1Binding) {
    const orderRow = await d1Binding
      .prepare(`
        SELECT 
          o.id, o.orderNumber, o.customerId, o.subtotal, o.shippingFee, o.total,
          o.status, o.paymentMethod, o.slipUrl, o.note, o.createdAt, o.updatedAt,
          c.id as customer_id, c.name as customer_name, c.phone as customer_phone,
          c.instagram as customer_instagram, c.address as customer_address
        FROM [Order] o
        LEFT JOIN Customer c ON o.customerId = c.id
        WHERE o.id = ? OR o.orderNumber = ?
        LIMIT 1
      `)
      .bind(orderIdOrNumber, orderIdOrNumber)
      .first<any>();

    if (!orderRow) return null;

    const { results: itemRows } = await d1Binding
      .prepare(`
        SELECT id, orderId, productId, productName, quantity, price, subtotal
        FROM OrderItem
        WHERE orderId = ?
      `)
      .bind(orderRow.id)
      .all<any>();

    const productIds = (itemRows || [])
      .map((item: any) => item.productId)
      .filter((id: any): id is string => Boolean(id));

    const imagesByProductId = new Map<string, { imageUrl: string; isPrimary: boolean }[]>();

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const { results: imgRows } = await d1Binding
        .prepare(`
          SELECT productId, imageUrl, isPrimary, displayOrder
          FROM ProductImage
          WHERE productId IN (${placeholders})
          ORDER BY displayOrder ASC
        `)
        .bind(...productIds)
        .all<any>();

      for (const img of (imgRows || [])) {
        if (!imagesByProductId.has(img.productId)) {
          imagesByProductId.set(img.productId, []);
        }
        imagesByProductId.get(img.productId)!.push({
          imageUrl: img.imageUrl,
          isPrimary: Boolean(img.isPrimary),
        });
      }
    }

    return {
      id: orderRow.id,
      orderNumber: orderRow.orderNumber,
      customerId: orderRow.customerId,
      subtotal: Number(orderRow.subtotal),
      shippingFee: Number(orderRow.shippingFee),
      total: Number(orderRow.total),
      status: orderRow.status as OrderStatus,
      paymentMethod: orderRow.paymentMethod as PaymentMethod,
      slipUrl: orderRow.slipUrl,
      note: orderRow.note,
      createdAt: new Date(orderRow.createdAt).toISOString(),
      customer: {
        id: orderRow.customer_id || orderRow.customerId,
        name: orderRow.customer_name || '',
        phone: orderRow.customer_phone || '',
        instagram: orderRow.customer_instagram || null,
        address: orderRow.customer_address || '',
      },
      items: (itemRows || []).map((item: any) => ({
        id: item.id,
        productId: item.productId || '',
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: item.productId
          ? {
              images: imagesByProductId.get(item.productId) || [],
            }
          : null,
      })),
    };
  }

  // Fallback / Standard Node Runtime via Prisma:
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

export async function getD1Orders(options?: {
  status?: string;
  search?: string;
  d1Binding?: CloudflareD1Binding;
}): Promise<OrderDetail[]> {
  if (options?.d1Binding) {
    let sql = `
      SELECT 
        o.id, o.orderNumber, o.customerId, o.subtotal, o.shippingFee, o.total,
        o.status, o.paymentMethod, o.slipUrl, o.note, o.createdAt, o.updatedAt,
        c.id as customer_id, c.name as customer_name, c.phone as customer_phone,
        c.instagram as customer_instagram, c.address as customer_address
      FROM [Order] o
      LEFT JOIN Customer c ON o.customerId = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.status && options.status !== 'ALL' && options.status !== 'all') {
      sql += ` AND o.status = ?`;
      params.push(options.status);
    }

    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      sql += ` AND (o.orderNumber LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY o.createdAt DESC`;

    const { results: orderRows } = await options.d1Binding
      .prepare(sql)
      .bind(...params)
      .all<any>();

    if (!orderRows || orderRows.length === 0) {
      return [];
    }

    const orderIds = orderRows.map((r: any) => r.id);
    const placeholders = orderIds.map(() => '?').join(',');
    const itemsSql = `
      SELECT 
        oi.id, oi.orderId, oi.productId, oi.productName, oi.quantity, oi.price, oi.subtotal,
        pi.imageUrl, pi.isPrimary
      FROM OrderItem oi
      LEFT JOIN ProductImage pi ON oi.productId = pi.productId AND pi.isPrimary = 1
      WHERE oi.orderId IN (${placeholders})
    `;
    const { results: itemRows } = await options.d1Binding
      .prepare(itemsSql)
      .bind(...orderIds)
      .all<any>();

    const itemsByOrderId = new Map<string, any[]>();
    for (const item of (itemRows || [])) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push({
        id: item.id,
        productId: item.productId || '',
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: item.productId
          ? {
              images: item.imageUrl
                ? [{ imageUrl: item.imageUrl, isPrimary: Boolean(item.isPrimary) }]
                : [],
            }
          : null,
      });
    }

    return orderRows.map((row: any) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      subtotal: Number(row.subtotal),
      shippingFee: Number(row.shippingFee),
      total: Number(row.total),
      status: row.status as OrderStatus,
      paymentMethod: row.paymentMethod as PaymentMethod,
      slipUrl: row.slipUrl,
      note: row.note,
      createdAt: new Date(row.createdAt).toISOString(),
      customer: {
        id: row.customer_id || row.customerId,
        name: row.customer_name || '',
        phone: row.customer_phone || '',
        instagram: row.customer_instagram || null,
        address: row.customer_address || '',
      },
      items: itemsByOrderId.get(row.id) || [],
    }));
  }

  // Fallback / Standard Node Runtime via Prisma:
  const where: any = {};
  if (options?.status && options.status !== 'ALL' && options.status !== 'all') {
    where.status = options.status;
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { orderNumber: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod as PaymentMethod,
    slipUrl: o.slipUrl,
    note: o.note,
    createdAt: o.createdAt.toISOString(),
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      phone: o.customer.phone,
      instagram: o.customer.instagram,
      address: o.customer.address,
    },
    items: o.items.map((item) => ({
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
  }));
}

// ----------------------------------------------------------------------
// 4. CUSTOMER REVIEWS (Front End: ReviewItem[], ReviewStats)
// ----------------------------------------------------------------------

function parseReviewImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function computeReviewStats(visibleReviews: ReviewItem[]): ReviewStats {
  const totalCount = visibleReviews.length;
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of visibleReviews) {
    const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    counts[rating] = (counts[rating] || 0) + 1;
    sum += rating;
  }

  const averageRating = totalCount > 0 ? Math.round((sum / totalCount) * 100) / 100 : 0;
  const stars: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];
  const breakdown = stars.map((star) => ({
    star,
    count: counts[star] || 0,
    percentage: totalCount > 0 ? Math.round(((counts[star] || 0) / totalCount) * 100) : 0,
  }));

  return { averageRating, totalCount, breakdown };
}

async function ensureReviewProductColumns(d1Binding: CloudflareD1Binding) {
  try {
    await d1Binding.prepare(`ALTER TABLE Review ADD COLUMN productId TEXT`).bind().run();
  } catch {
    // Column already exists
  }
  try {
    await d1Binding.prepare(`ALTER TABLE Review ADD COLUMN productName TEXT`).bind().run();
  } catch {
    // Column already exists
  }
}

export async function getD1Reviews(options?: {
  rating?: number;
  hasImages?: boolean;
  sort?: 'latest' | 'highest' | 'lowest';
  includeHidden?: boolean;
  d1Binding?: CloudflareD1Binding;
}): Promise<{ reviews: ReviewItem[]; stats: ReviewStats }> {
  let allRows: ReviewItem[] = [];

  if (options?.d1Binding) {
    await ensureReviewProductColumns(options.d1Binding);
    const sql = options.includeHidden
      ? `SELECT id, customerName, rating, comment, images, productId, productName, status, createdAt, updatedAt FROM Review ORDER BY datetime(createdAt) DESC`
      : `SELECT id, customerName, rating, comment, images, productId, productName, status, createdAt, updatedAt FROM Review WHERE status = 'VISIBLE' ORDER BY datetime(createdAt) DESC`;

    const { results } = await options.d1Binding.prepare(sql).bind().all<any>();
    allRows = (results || []).map((row: any) => ({
      id: row.id,
      customerName: row.customerName,
      rating: Number(row.rating),
      comment: row.comment,
      images: parseReviewImages(row.images),
      productId: row.productId ?? null,
      productName: row.productName ?? null,
      status: (row.status === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE') as ReviewStatus,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    }));
  } else {
    const rows = await prisma.review.findMany({
      where: options?.includeHidden ? undefined : { status: 'VISIBLE' },
      orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
    });
    allRows = rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      rating: row.rating,
      comment: row.comment,
      images: parseReviewImages(row.images),
      status: (row.status === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE') as ReviewStatus,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  const visibleReviews = allRows.filter((r) => r.status === 'VISIBLE');
  const stats = computeReviewStats(visibleReviews);

  let filtered = [...allRows];
  if (options?.rating && options.rating >= 1 && options.rating <= 5) {
    filtered = filtered.filter((r) => r.rating === options.rating);
  }
  if (options?.hasImages) {
    filtered = filtered.filter((r) => r.images.length > 0);
  }

  const sort = options?.sort || 'latest';
  if (sort === 'highest') {
    filtered.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'lowest') {
    filtered.sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return { reviews: filtered, stats };
}

export async function createD1Review(input: {
  customerName: string;
  rating: number;
  comment: string;
  images: string[];
  productId?: string | null;
  productName?: string | null;
  d1Binding?: CloudflareD1Binding;
}): Promise<{ review: ReviewItem; stats: ReviewStats }> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const imagesJson = JSON.stringify(input.images.slice(0, 5));
  const productId = input.productId || null;
  const productName = input.productName || null;

  if (input.d1Binding) {
    await ensureReviewProductColumns(input.d1Binding);
    await input.d1Binding
      .prepare(
        `INSERT INTO Review (id, customerName, rating, comment, images, productId, productName, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'VISIBLE', ?, ?)`
      )
      .bind(id, input.customerName, input.rating, input.comment, imagesJson, productId, productName, now, now)
      .run();

    const { stats } = await getD1Reviews({ d1Binding: input.d1Binding });
    return {
      review: {
        id,
        customerName: input.customerName,
        rating: input.rating,
        comment: input.comment,
        images: input.images.slice(0, 5),
        productId,
        productName,
        status: 'VISIBLE',
        createdAt: now,
        updatedAt: now,
      },
      stats,
    };
  }

  const created = await prisma.review.create({
    data: {
      id,
      customerName: input.customerName,
      rating: input.rating,
      comment: input.comment,
      images: imagesJson,
      status: 'VISIBLE',
    },
  });

  const { stats } = await getD1Reviews();
  return {
    review: {
      id: created.id,
      customerName: created.customerName,
      rating: created.rating,
      comment: created.comment,
      images: parseReviewImages(created.images),
      status: 'VISIBLE',
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
    stats,
  };
}
