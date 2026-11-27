import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Read .env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value.trim();
    }
  }
  return env;
}

const env = loadEnv();
const accountId = env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
const databaseId = env.CLOUDFLARE_D1_DATABASE_ID || '4ac8e95b-0102-404f-8555-341bd7e3ea97';
const token = env.CLOUDFLARE_API_TOKEN || env.CF_D1_REMOTE_TOKEN;

if (!token) {
  console.error('❌ Missing token in .env');
  process.exit(1);
}

async function queryD1(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params: [] }),
    }
  );
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || 'Query failed');
  }
  return json.result?.[0]?.results || [];
}

async function main() {
  console.log('🚀 Connecting to Cloudflare D1 to pull all live data...');

  const [
    products,
    productImages,
    customers,
    orders,
    orderItems,
    reviews,
    storeSettings,
    admins,
  ] = await Promise.all([
    queryD1('SELECT * FROM Product'),
    queryD1('SELECT * FROM ProductImage'),
    queryD1('SELECT * FROM Customer'),
    queryD1('SELECT * FROM [Order]'),
    queryD1('SELECT * FROM OrderItem'),
    queryD1('SELECT * FROM Review'),
    queryD1('SELECT * FROM StoreSettings'),
    queryD1('SELECT * FROM Admin'),
  ]);

  const backupData = {
    exportedAt: new Date().toISOString(),
    stats: {
      orders: orders.length,
      customers: customers.length,
      products: products.length,
      productImages: productImages.length,
      orderItems: orderItems.length,
      reviews: reviews.length,
      settings: storeSettings.length,
      admins: admins.length,
    },
    orders,
    customers,
    products,
    productImages,
    orderItems,
    reviews,
    storeSettings,
    admins,
  };

  console.log(`📦 Successfully retrieved from Cloudflare D1:`);
  console.log(`   - Orders: ${backupData.stats.orders}`);
  console.log(`   - Customers: ${backupData.stats.customers}`);
  console.log(`   - Products: ${backupData.stats.products}`);
  console.log(`   - Product Images: ${backupData.stats.productImages}`);
  console.log(`   - Order Items: ${backupData.stats.orderItems}`);
  console.log(`   - Reviews: ${backupData.stats.reviews}`);
  console.log(`   - Store Settings: ${backupData.stats.settings}`);
  console.log(`   - Admins: ${backupData.stats.admins}`);

  // Save JSON backup in bibi-store
  const jsonPath = path.join(process.cwd(), 'prisma', 'cloudflare-d1-backup.json');
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`💾 Saved permanent JSON backup: ${jsonPath}`);

  // Save JSON backup in admin-bibi-store
  const adminPrismaDir = path.resolve(process.cwd(), '../admin-bibi-store/prisma');
  if (fs.existsSync(adminPrismaDir)) {
    const adminJsonPath = path.join(adminPrismaDir, 'cloudflare-d1-backup.json');
    fs.writeFileSync(adminJsonPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`💾 Synced backup to admin console: ${adminJsonPath}`);
  }

  // Sync into local SQLite dev.db
  console.log('🔄 Syncing records into local SQLite database (prisma/dev.db)...');

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        initialStock: Number(p.initialStock || 0),
        sold: Number(p.sold || 0),
        category: p.category || 'Bakery',
        status: p.status || 'ACTIVE',
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt || p.createdAt),
      },
      update: {
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        initialStock: Number(p.initialStock || 0),
        sold: Number(p.sold || 0),
        category: p.category || 'Bakery',
        status: p.status || 'ACTIVE',
        updatedAt: new Date(p.updatedAt || p.createdAt),
      },
    });
  }

  for (const img of productImages) {
    await prisma.productImage.upsert({
      where: { id: img.id },
      create: {
        id: img.id,
        productId: img.productId,
        imageUrl: img.imageUrl,
        isPrimary: Boolean(img.isPrimary),
        displayOrder: Number(img.displayOrder || 0),
        createdAt: new Date(img.createdAt),
      },
      update: {
        imageUrl: img.imageUrl,
        isPrimary: Boolean(img.isPrimary),
        displayOrder: Number(img.displayOrder || 0),
      },
    });
  }

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        instagram: c.instagram || null,
        address: c.address,
        createdAt: new Date(c.createdAt),
      },
      update: {
        name: c.name,
        phone: c.phone,
        instagram: c.instagram || null,
        address: c.address,
      },
    });
  }

  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      create: {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shippingFee || 0),
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.paymentMethod || 'TRANSFER',
        slipUrl: o.slipUrl || null,
        note: o.note || null,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt || o.createdAt),
      },
      update: {
        orderNumber: o.orderNumber,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shippingFee || 0),
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.paymentMethod || 'TRANSFER',
        slipUrl: o.slipUrl || null,
        note: o.note || null,
        updatedAt: new Date(o.updatedAt || o.createdAt),
      },
    });
  }

  for (const item of orderItems) {
    await prisma.orderItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        orderId: item.orderId,
        productId: item.productId || null,
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      },
      update: {
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      },
    });
  }

  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        customerName: r.customerName,
        rating: Number(r.rating),
        comment: r.comment,
        images: r.images || '[]',
        productId: r.productId || null,
        productName: r.productName || null,
        status: r.status || 'VISIBLE',
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt || r.createdAt),
      },
      update: {
        customerName: r.customerName,
        rating: Number(r.rating),
        comment: r.comment,
        images: r.images || '[]',
        status: r.status || 'VISIBLE',
      },
    });
  }

  for (const s of storeSettings) {
    await prisma.storeSettings.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        shopName: s.shopName,
        tagline: s.tagline || '',
        logoUrl: s.logoUrl || null,
        qrImageUrl: s.qrImageUrl || null,
        promptpayNumber: s.promptpayNumber || '',
        promptpayName: s.promptpayName || '',
        bankName: s.bankName || '',
        bankAccountNo: s.bankAccountNo || '',
        bankAccountName: s.bankAccountName || '',
        defaultShippingFee: Number(s.defaultShippingFee || 40),
        isStoreOpen: Boolean(s.isStoreOpen === 1 || s.isStoreOpen === true),
        announcement: s.announcement || '',
        updatedAt: new Date(s.updatedAt || new Date()),
      },
      update: {
        shopName: s.shopName,
        tagline: s.tagline || '',
        logoUrl: s.logoUrl || null,
        qrImageUrl: s.qrImageUrl || null,
        promptpayNumber: s.promptpayNumber || '',
        promptpayName: s.promptpayName || '',
        bankName: s.bankName || '',
        bankAccountNo: s.bankAccountNo || '',
        bankAccountName: s.bankAccountName || '',
        defaultShippingFee: Number(s.defaultShippingFee || 40),
        isStoreOpen: Boolean(s.isStoreOpen === 1 || s.isStoreOpen === true),
        announcement: s.announcement || '',
        updatedAt: new Date(s.updatedAt || new Date()),
      },
    });
  }

  for (const a of admins) {
    await prisma.admin.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        username: a.username,
        passwordHash: a.passwordHash,
        role: a.role || 'OWNER',
        createdAt: new Date(a.createdAt),
      },
      update: {
        username: a.username,
        passwordHash: a.passwordHash,
        role: a.role || 'OWNER',
      },
    });
  }

  console.log('✅ Successfully synced all Cloudflare D1 data into local SQLite database (prisma/dev.db)!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error in sync:', e);
  await prisma.$disconnect();
  process.exit(1);
});
