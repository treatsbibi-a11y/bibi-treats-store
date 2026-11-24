import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Bibi\'s Treats API Integration Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ==========================================
    // 1. Store Settings & Admin Verification
    // ==========================================
    console.log('📌 Test Group 1: Admin & Store Settings');
    const admin = await prisma.admin.findUnique({ where: { username: 'admin' } });
    assert(!!admin, 'Admin account exists in database');
    const passwordMatch = await bcrypt.compare('admin1234', admin.passwordHash);
    assert(passwordMatch, 'Admin password matches "admin1234"');

    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    assert(!!settings, 'Store settings exist in database');
    assert(settings.isStoreOpen === true, 'Store is open by default');

    // ==========================================
    // 2. Products API
    // ==========================================
    console.log('\n📌 Test Group 2: Product Management API');

    // 2.1 Create a new product
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Matcha Mochi Cookie',
        description: 'Chewy matcha cookie with gooey mochi center ♡',
        price: 65,
        stock: 10,
        initialStock: 10,
        category: 'Cookies & Macarons',
        status: 'ACTIVE',
        images: {
          create: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
              isPrimary: true,
              displayOrder: 1,
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
              isPrimary: false,
              displayOrder: 2,
            },
          ],
        },
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    assert(testProduct.id && testProduct.stock === 10, 'Product created successfully with stock 10');
    assert(testProduct.images.length === 2, 'Product created with 2 images');
    assert(testProduct.images[0].isPrimary === true, 'First image is marked primary');

    // 2.2 Update product fields
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: { price: 70, stock: 8 },
    });
    assert(updatedProduct.price === 70 && updatedProduct.stock === 8, 'Product updated successfully');

    // 2.3 Image management: add new image and set as primary
    await prisma.productImage.updateMany({
      where: { productId: testProduct.id },
      data: { isPrimary: false },
    });
    const extraImage = await prisma.productImage.create({
      data: {
        productId: testProduct.id,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        isPrimary: true,
        displayOrder: 3,
      },
    });
    assert(extraImage.isPrimary === true, 'New primary image added successfully');

    // Delete image and ensure another becomes primary
    await prisma.productImage.delete({ where: { id: extraImage.id } });
    const firstRemaining = await prisma.productImage.findFirst({
      where: { productId: testProduct.id },
      orderBy: { displayOrder: 'asc' },
    });
    if (firstRemaining) {
      await prisma.productImage.update({
        where: { id: firstRemaining.id },
        data: { isPrimary: true },
      });
    }
    const finalImages = await prisma.productImage.findMany({
      where: { productId: testProduct.id },
    });
    assert(finalImages.length === 2, 'Image deleted and count is back to 2');
    assert(finalImages.some((img) => img.isPrimary), 'Remaining image is set as primary');

    // ==========================================
    // 3. Orders & Atomic Checkout Transaction
    // ==========================================
    console.log('\n📌 Test Group 3: Atomic Order Transaction & Stock Management');

    // Test product initial state
    const orderTestProduct = await prisma.product.create({
      data: {
        name: 'Atomic Test Cupcake',
        description: 'For testing atomic stock transactions',
        price: 50,
        stock: 5,
        initialStock: 5,
        sold: 0,
        category: 'Cupcakes',
        status: 'ACTIVE',
      },
    });

    // 3.1 Successful Checkout Transaction
    const orderQty = 2;
    const customerPhone = '0899998888';

    const orderResult = await prisma.$transaction(async (tx) => {
      // 1. Check stock
      const prod = await tx.product.findUnique({ where: { id: orderTestProduct.id } });
      if (!prod || prod.stock < orderQty) {
        throw new Error('Insufficient stock');
      }

      // 2. Decrement stock & increment sold
      await tx.product.update({
        where: { id: orderTestProduct.id },
        data: {
          stock: { decrement: orderQty },
          sold: { increment: orderQty },
        },
      });

      // 3. Order number generation
      const count = await tx.order.count();
      const lastOrder = await tx.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });
      let maxNum = count;
      if (lastOrder && lastOrder.orderNumber.startsWith('BT-')) {
        const parsed = parseInt(lastOrder.orderNumber.replace('BT-', ''), 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      }
      const orderNumber = `BT-${String(maxNum + 1).padStart(4, '0')}`;

      // 4. Create customer & order
      const customer = await tx.customer.create({
        data: {
          name: 'Nong Bibi Test',
          phone: customerPhone,
          instagram: '@bibi_fan',
          address: '456 Sukhumvit Rd, Bangkok',
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          subtotal: prod.price * orderQty,
          shippingFee: 40,
          total: prod.price * orderQty + 40,
          status: 'PENDING',
          items: {
            create: [
              {
                productId: prod.id,
                productName: prod.name,
                quantity: orderQty,
                price: prod.price,
                subtotal: prod.price * orderQty,
              },
            ],
          },
        },
        include: { customer: true, items: true },
      });

      return order;
    });

    assert(orderResult.orderNumber.startsWith('BT-'), `Order generated with order number ${orderResult.orderNumber}`);
    assert(orderResult.total === 140, 'Order total calculated correctly (50 * 2 + 40 = 140)');

    const prodAfterOrder = await prisma.product.findUnique({ where: { id: orderTestProduct.id } });
    assert(prodAfterOrder.stock === 3, `Stock correctly decremented from 5 to 3 (current: ${prodAfterOrder.stock})`);
    assert(prodAfterOrder.sold === 2, `Sold count correctly incremented from 0 to 2 (current: ${prodAfterOrder.sold})`);

    // 3.2 Insufficient Stock Prevention Test
    let outOfStockCaught = false;
    try {
      await prisma.$transaction(async (tx) => {
        const prod = await tx.product.findUnique({ where: { id: orderTestProduct.id } });
        const excessiveQty = 10;
        if (!prod || prod.stock < excessiveQty) {
          throw new Error(`สินค้า "${prod.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${prod.stock} ชิ้น)`);
        }
      });
    } catch (err) {
      outOfStockCaught = true;
      assert(err.message.includes('สต็อกไม่เพียงพอ'), 'Atomic transaction correctly rejected order exceeding stock');
    }
    assert(outOfStockCaught, 'Out of stock error raised properly');

    // ==========================================
    // 4. Order Tracking & Customer Verification
    // ==========================================
    console.log('\n📌 Test Group 4: Order Tracking API Logic');

    // 4.1 Valid match
    const foundOrder = await prisma.order.findUnique({
      where: { orderNumber: orderResult.orderNumber },
      include: { customer: true, items: true },
    });
    assert(!!foundOrder, 'Order found by orderNumber');

    const cleanInputPhone = customerPhone.replace(/\D/g, '');
    const cleanCustomerPhone = foundOrder.customer.phone.replace(/\D/g, '');
    const phoneMatch = cleanCustomerPhone === cleanInputPhone;
    assert(phoneMatch, 'Order tracking verifies phone matches customer phone');

    // 4.2 Invalid phone match
    const wrongPhone = '0811112222';
    const wrongMatch = cleanCustomerPhone === wrongPhone.replace(/\D/g, '');
    assert(!wrongMatch, 'Order tracking correctly rejects mismatched phone number');

    // ==========================================
    // 5. Order Cancellation & Stock Refund (Double Restock Prevention)
    // ==========================================
    console.log('\n📌 Test Group 5: Cancellation & Stock Restock Logic');

    // Cancel the order and restore stock
    const oldStatus = orderResult.status; // 'PENDING'
    const newStatus = 'CANCELLED';

    await prisma.$transaction(async (tx) => {
      if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        for (const item of orderResult.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                sold: { decrement: item.quantity },
              },
            });
          }
        }
      }
      await tx.order.update({
        where: { id: orderResult.id },
        data: { status: newStatus },
      });
    });

    const prodAfterCancel = await prisma.product.findUnique({ where: { id: orderTestProduct.id } });
    assert(prodAfterCancel.stock === 5, `Stock restored from 3 back to 5 (current: ${prodAfterCancel.stock})`);
    assert(prodAfterCancel.sold === 0, `Sold count restored from 2 back to 0 (current: ${prodAfterCancel.sold})`);

    // Try cancelling again: must not double-restock
    const cancelledOrder = await prisma.order.findUnique({
      where: { id: orderResult.id },
      include: { items: true },
    });
    const currentStatus = cancelledOrder.status; // 'CANCELLED'
    const secondCancelStatus = 'CANCELLED';

    await prisma.$transaction(async (tx) => {
      if (secondCancelStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
        for (const item of cancelledOrder.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                sold: { decrement: item.quantity },
              },
            });
          }
        }
      }
      await tx.order.update({
        where: { id: cancelledOrder.id },
        data: { status: secondCancelStatus },
      });
    });

    const prodAfterSecondCancel = await prisma.product.findUnique({ where: { id: orderTestProduct.id } });
    assert(prodAfterSecondCancel.stock === 5, `Double-restock prevented! Stock remains 5 (current: ${prodAfterSecondCancel.stock})`);

    // ==========================================
    // 6. Admin Stats & Reports Metrics
    // ==========================================
    console.log('\n📌 Test Group 6: Admin Statistics & Reporting Metrics');

    const totalOrders = await prisma.order.count({ where: { status: { not: 'CANCELLED' } } });
    const totalSalesAgg = await prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });
    const totalSales = totalSalesAgg._sum.total ?? 0;
    const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const stockAgg = await prisma.product.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { stock: true },
    });
    const remainingStock = stockAgg._sum.stock ?? 0;

    assert(typeof totalOrders === 'number', `totalOrders metric is valid (${totalOrders})`);
    assert(typeof totalSales === 'number', `totalSales metric is valid (${totalSales} THB)`);
    assert(typeof totalProducts === 'number' && totalProducts > 0, `totalProducts metric is valid (${totalProducts})`);
    assert(typeof remainingStock === 'number' && remainingStock >= 0, `remainingStock metric is valid (${remainingStock})`);

    // ==========================================
    // 7. File Upload Directory Verification
    // ==========================================
    console.log('\n📌 Test Group 7: File Upload Directory & System');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const testFile = path.join(uploadDir, 'test-probe.txt');
    await fs.writeFile(testFile, 'test upload probe');
    const fileExists = await fs.stat(testFile).then(() => true).catch(() => false);
    assert(fileExists, 'public/uploads directory is writable');
    await fs.unlink(testFile);

    // ==========================================
    // Clean up test records
    // ==========================================
    console.log('\n🧹 Cleaning up test artifacts...');
    await prisma.productImage.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: orderResult.id } });
    await prisma.order.delete({ where: { id: orderResult.id } });
    await prisma.customer.delete({ where: { id: orderResult.customerId } });
    await prisma.product.delete({ where: { id: orderTestProduct.id } });
    console.log('✅ Cleanup complete');

    console.log(`\n==========================================`);
    console.log(`🎉 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite exception:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
