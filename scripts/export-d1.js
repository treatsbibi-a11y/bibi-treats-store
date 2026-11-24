const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportData() {
  const products = await prisma.product.findMany();
  const productImages = await prisma.productImage.findMany();
  const customers = await prisma.customer.findMany();
  const orders = await prisma.order.findMany();
  const orderItems = await prisma.orderItem.findMany();
  const admins = await prisma.admin.findMany();
  const settings = await prisma.storeSettings.findMany();

  const escapeVal = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val instanceof Date) return "'" + val.toISOString() + "'";
    return "'" + String(val).replace(/'/g, "''") + "'";
  };

  let sql = 'PRAGMA defer_foreign_keys = ON;\n';

  for (const p of products) {
    sql += `INSERT INTO Product (id, name, description, price, stock, initialStock, sold, category, status, createdAt, updatedAt) VALUES (${escapeVal(p.id)}, ${escapeVal(p.name)}, ${escapeVal(p.description)}, ${escapeVal(p.price)}, ${escapeVal(p.stock)}, ${escapeVal(p.initialStock)}, ${escapeVal(p.sold)}, ${escapeVal(p.category)}, ${escapeVal(p.status)}, ${escapeVal(p.createdAt)}, ${escapeVal(p.updatedAt)});\n`;
  }
  for (const pi of productImages) {
    sql += `INSERT INTO ProductImage (id, productId, imageUrl, isPrimary, displayOrder, createdAt) VALUES (${escapeVal(pi.id)}, ${escapeVal(pi.productId)}, ${escapeVal(pi.imageUrl)}, ${escapeVal(pi.isPrimary)}, ${escapeVal(pi.displayOrder)}, ${escapeVal(pi.createdAt)});\n`;
  }
  for (const c of customers) {
    sql += `INSERT INTO Customer (id, name, phone, instagram, address, createdAt) VALUES (${escapeVal(c.id)}, ${escapeVal(c.name)}, ${escapeVal(c.phone)}, ${escapeVal(c.instagram)}, ${escapeVal(c.address)}, ${escapeVal(c.createdAt)});\n`;
  }
  for (const o of orders) {
    sql += `INSERT INTO "Order" (id, orderNumber, customerId, subtotal, shippingFee, total, status, paymentMethod, slipUrl, note, createdAt, updatedAt) VALUES (${escapeVal(o.id)}, ${escapeVal(o.orderNumber)}, ${escapeVal(o.customerId)}, ${escapeVal(o.subtotal)}, ${escapeVal(o.shippingFee)}, ${escapeVal(o.total)}, ${escapeVal(o.status)}, ${escapeVal(o.paymentMethod)}, ${escapeVal(o.slipUrl)}, ${escapeVal(o.note)}, ${escapeVal(o.createdAt)}, ${escapeVal(o.updatedAt)});\n`;
  }
  for (const oi of orderItems) {
    sql += `INSERT INTO OrderItem (id, orderId, productId, productName, quantity, price, subtotal) VALUES (${escapeVal(oi.id)}, ${escapeVal(oi.orderId)}, ${escapeVal(oi.productId)}, ${escapeVal(oi.productName)}, ${escapeVal(oi.quantity)}, ${escapeVal(oi.price)}, ${escapeVal(oi.subtotal)});\n`;
  }
  for (const a of admins) {
    sql += `INSERT INTO Admin (id, username, passwordHash, role, createdAt) VALUES (${escapeVal(a.id)}, ${escapeVal(a.username)}, ${escapeVal(a.passwordHash)}, ${escapeVal(a.role)}, ${escapeVal(a.createdAt)});\n`;
  }
  for (const s of settings) {
    sql += `INSERT INTO StoreSettings (id, shopName, tagline, logoUrl, qrImageUrl, promptpayNumber, promptpayName, bankName, bankAccountNo, bankAccountName, defaultShippingFee, isStoreOpen, announcement, updatedAt) VALUES (${escapeVal(s.id)}, ${escapeVal(s.shopName)}, ${escapeVal(s.tagline)}, ${escapeVal(s.logoUrl)}, ${escapeVal(s.qrImageUrl)}, ${escapeVal(s.promptpayNumber)}, ${escapeVal(s.promptpayName)}, ${escapeVal(s.bankName)}, ${escapeVal(s.bankAccountNo)}, ${escapeVal(s.bankAccountName)}, ${escapeVal(s.defaultShippingFee)}, ${escapeVal(s.isStoreOpen)}, ${escapeVal(s.announcement)}, ${escapeVal(s.updatedAt)});\n`;
  }

  fs.writeFileSync('prisma/d1_data_seed.sql', sql, 'utf8');
  console.log('Exported data to prisma/d1_data_seed.sql successfully');
  process.exit(0);
}

exportData().catch((err) => {
  console.error(err);
  process.exit(1);
});
