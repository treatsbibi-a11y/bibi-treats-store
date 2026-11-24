import * as XLSX from 'xlsx';

const BASE_URL = 'http://localhost:3005';

let passedTests = 0;
let totalTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    results.push({ name: testName, status: 'PASS', details });
    console.log(`✅ [PASS] ${testName}`);
  } else {
    results.push({ name: testName, status: 'FAIL', details });
    console.error(`❌ [FAIL] ${testName} - ${details}`);
  }
}

async function run() {
  console.log('🧪 Starting Bibi\'s Treats Functional Integration Tests...\n');

  let adminCookie = '';
  let testProduct = null;
  let soldOutProduct = null;
  let initialStock = 0;
  let initialSold = 0;
  let createdOrderId = '';
  let createdOrderNumber = '';

  // ==========================================
  // Test 1: Fetch active products list
  // ==========================================
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    assert(res.status === 200, 'GET /api/products returns HTTP 200');
    const data = await res.json();
    const products = Array.isArray(data) ? data : data.products || [];
    assert(products.length >= 4, `Products count is at least 4 (found ${products.length})`);

    testProduct = products.find((p) => p.stock > 5 && p.name === 'Chocolate Brownie') || products.find((p) => p.stock > 5);
    soldOutProduct = products.find((p) => p.stock === 0) || products.find((p) => p.name.includes('Soft Cookie'));

    assert(!!testProduct, `Found active test product with stock > 5: ${testProduct?.name} (Stock: ${testProduct?.stock})`);
    initialStock = testProduct?.stock ?? 0;
    initialSold = testProduct?.sold ?? 0;

    assert(!!soldOutProduct, `Found sold-out product: ${soldOutProduct?.name} (Stock: ${soldOutProduct?.stock})`);
  } catch (err) {
    assert(false, 'Fetch products failed', err.message);
  }

  // ==========================================
  // Test 2: Atomic checkout transaction & BT-XXXX generation
  // ==========================================
  try {
    const orderPayload = {
      name: 'พิมพ์ชนก ทดสอบระบบ',
      phone: '089-777-6655',
      instagram: 'pim.test',
      address: '99/1 ซอยอารีย์ ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กทม. 10400',
      items: [
        {
          productId: testProduct.id,
          quantity: 2,
        },
      ],
      note: 'ทดสอบตัดสต็อกและหมายเลขคำสั่งซื้อ BT-XXXX',
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    assert(res.status === 200 || res.status === 201, `POST /api/orders returns success (status: ${res.status})`);
    const orderData = await res.json();
    const order = orderData.order || orderData;

    createdOrderId = order.id;
    createdOrderNumber = order.orderNumber;

    assert(
      /^BT-\d{4}$/.test(createdOrderNumber),
      `Order number matches BT-XXXX pattern: "${createdOrderNumber}"`
    );
    assert(order.status === 'PENDING', `Initial order status is PENDING (got ${order.status})`);
    assert(order.total === (testProduct.price * 2) + 40, `Total price calculated correctly (items: ${testProduct.price * 2} + shipping 40 = ${order.total})`);

    // Verify atomic stock deduction
    const prodRes = await fetch(`${BASE_URL}/api/products/${testProduct.id}`);
    const updatedProd = await prodRes.json();
    assert(
      updatedProd.stock === initialStock - 2,
      `Stock decremented atomically by 2: ${initialStock} -> ${updatedProd.stock}`
    );
    assert(
      updatedProd.sold === initialSold + 2,
      `Sold count incremented atomically by 2: ${initialSold} -> ${updatedProd.sold}`
    );
  } catch (err) {
    assert(false, 'Atomic checkout test failed', err.message);
  }

  // ==========================================
  // Test 3: Out of stock (sold out) behavior
  // ==========================================
  try {
    // 3A: Excessive quantity
    const excessivePayload = {
      name: 'ทดสอบ ซื้อเกินสต็อก',
      phone: '081-222-3333',
      address: '123 ถนนสุขุมวิท กทม.',
      items: [{ productId: testProduct.id, quantity: 999999 }],
    };
    const resExcess = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(excessivePayload),
    });
    assert(
      resExcess.status === 400,
      `Excessive quantity order rejected with HTTP 400 (got ${resExcess.status})`
    );
    const errExcess = await resExcess.json();
    assert(
      errExcess.error && /ไม่เพียงพอ|สต็อก/.test(errExcess.error),
      `Error message describes insufficient stock: "${errExcess.error}"`
    );

    // 3B: Sold-out item (stock = 0)
    if (soldOutProduct) {
      const soldOutPayload = {
        name: 'ทดสอบ ซื้อของหมด',
        phone: '081-222-3333',
        address: '123 ถนนสุขุมวิท กทม.',
        items: [{ productId: soldOutProduct.id, quantity: 1 }],
      };
      const resSoldOut = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(soldOutPayload),
      });
      assert(
        resSoldOut.status === 400,
        `Sold-out item order rejected with HTTP 400 (got ${resSoldOut.status})`
      );
      const errSoldOut = await resSoldOut.json();
      assert(
        errSoldOut.error && /ไม่เพียงพอ|สต็อก|ไม่พร้อมจำหน่าย/.test(errSoldOut.error),
        `Sold-out error message: "${errSoldOut.error}"`
      );
    }
  } catch (err) {
    assert(false, 'Out of stock tests failed', err.message);
  }

  // ==========================================
  // Test 4: Order tracking with matching vs mismatch phone
  // ==========================================
  try {
    // 4A: Valid tracking with matching phone (with dashes)
    const trackValid = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: createdOrderNumber,
        phone: '089-777-6655',
      }),
    });
    assert(trackValid.status === 200, `Tracking with matching phone returns HTTP 200 (order: ${createdOrderNumber})`);
    const trackData = await trackValid.json();
    const trackedOrder = trackData.order || trackData;
    assert(
      trackedOrder.orderNumber === createdOrderNumber,
      `Tracking returns correct orderNumber ${trackedOrder.orderNumber}`
    );
    assert(
      trackedOrder.customer?.name === 'พิมพ์ชนก ทดสอบระบบ',
      `Tracking returns customer details (${trackedOrder.customer?.name})`
    );
    assert(
      Array.isArray(trackedOrder.items) && trackedOrder.items.length === 1,
      `Tracking returns order items breakdown (count: ${trackedOrder.items?.length})`
    );

    // 4B: Tracking with normalized phone (without dashes)
    const trackNormalized = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: createdOrderNumber,
        phone: '0897776655',
      }),
    });
    assert(trackNormalized.status === 200, 'Tracking works with normalized unhyphenated phone number');

    // 4C: Tracking with mismatched phone
    const trackMismatch = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: createdOrderNumber,
        phone: '081-000-9999',
      }),
    });
    assert(
      trackMismatch.status === 400 || trackMismatch.status === 404,
      `Tracking with mismatched phone rejected with HTTP ${trackMismatch.status}`
    );
    const mismatchData = await trackMismatch.json();
    assert(
      mismatchData.error && /ไม่ถูกต้อง|ไม่พบ/.test(mismatchData.error),
      `Mismatch error message: "${mismatchData.error}"`
    );

    // 4D: Tracking non-existent orderNumber
    const trackNonExistent = await fetch(`${BASE_URL}/api/orders/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: 'BT-9999',
        phone: '089-777-6655',
      }),
    });
    assert(
      trackNonExistent.status === 404,
      `Non-existent orderNumber returns HTTP 404 (got ${trackNonExistent.status})`
    );
  } catch (err) {
    assert(false, 'Order tracking tests failed', err.message);
  }

  // ==========================================
  // Test 5: Admin authentication, status changes & cancellation restock
  // ==========================================
  try {
    // 5A: Invalid login
    const invalidLogin = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });
    assert(invalidLogin.status === 401, `Invalid admin credentials return HTTP 401 (got ${invalidLogin.status})`);

    // 5B: Valid login
    const validLogin = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin1234' }),
    });
    assert(validLogin.status === 200, 'Valid admin login (admin/admin1234) returns HTTP 200');
    const rawCookie = validLogin.headers.get('set-cookie') || '';
    adminCookie = rawCookie.split(';')[0];
    assert(adminCookie.includes('bibi_admin_token='), `Received httpOnly admin JWT cookie`);

    // 5C: Access admin stats
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert(statsRes.status === 200, 'GET /api/admin/stats returns HTTP 200 with admin token');
    const stats = await statsRes.json();
    assert(stats.totalOrders >= 1, `Stats contain totalOrders (${stats.totalOrders})`);
    assert(typeof stats.totalSales === 'number', `Stats contain totalSales (${stats.totalSales})`);
    assert(Array.isArray(stats.bestSellers), `Stats contain bestSellers list (${stats.bestSellers.length} items)`);

    // 5D: Update order status: PENDING -> CONFIRMED -> PREPARING
    const statusUpdateRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    assert(statusUpdateRes.status === 200, `PATCH /api/orders/${createdOrderId} status -> CONFIRMED`);
    const confirmedOrder = await statusUpdateRes.json();
    assert(confirmedOrder.status === 'CONFIRMED', `Order status updated to CONFIRMED`);

    // 5E: Cancel order and verify atomic stock refund
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert(cancelRes.status === 200, `PATCH /api/orders/${createdOrderId} status -> CANCELLED`);
    const cancelledOrder = await cancelRes.json();
    assert(cancelledOrder.status === 'CANCELLED', `Order status successfully changed to CANCELLED`);

    // Verify stock is restored
    const restoredProdRes = await fetch(`${BASE_URL}/api/products/${testProduct.id}`);
    const restoredProd = await restoredProdRes.json();
    assert(
      restoredProd.stock === initialStock,
      `Stock fully refunded on cancellation: restored from ${initialStock - 2} back to ${restoredProd.stock}`
    );
    assert(
      restoredProd.sold === initialSold,
      `Sold count restored on cancellation: decremented back to ${restoredProd.sold}`
    );

    // 5F: Prevent double-restock on duplicate cancellation
    const doubleCancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert(doubleCancelRes.status === 200, 'Duplicate cancellation request accepted idempotently');
    const afterDoubleRes = await fetch(`${BASE_URL}/api/products/${testProduct.id}`);
    const afterDoubleProd = await afterDoubleRes.json();
    assert(
      afterDoubleProd.stock === initialStock,
      `Idempotent restock protection: stock remains ${initialStock} (no double-restock bug)`
    );
  } catch (err) {
    assert(false, 'Admin auth and status workflow test failed', err.message);
  }

  // ==========================================
  // Test 6: Sales reports generation and Excel (.xlsx) export
  // ==========================================
  try {
    const reportRes = await fetch(`${BASE_URL}/api/admin/reports?status=ALL`, {
      headers: { Cookie: adminCookie },
    });
    assert(reportRes.status === 200, 'GET /api/admin/reports returns HTTP 200');
    const report = await reportRes.json();
    assert(!!report.summary, 'Report contains summary metrics object');
    assert(typeof report.summary.totalOrders === 'number', `Summary totalOrders: ${report.summary.totalOrders}`);
    assert(typeof report.summary.totalSales === 'number', `Summary totalSales: ${report.summary.totalSales}฿`);
    assert(Array.isArray(report.orders), `Report orders array present (count: ${report.orders.length})`);

    // Verify XLSX generation
    const wb = XLSX.utils.book_new();

    const ordersSheetData = report.orders.map((o, idx) => ({
      'ลำดับ': idx + 1,
      'เลขที่ออเดอร์': o.orderNumber,
      'วันที่สั่งซื้อ': new Date(o.createdAt).toLocaleString('th-TH'),
      'ชื่อลูกค้า': o.customer?.name || '-',
      'เบอร์โทรศัพท์': o.customer?.phone || '-',
      'ยอดรวม (บาท)': o.total,
      'สถานะ': o.status,
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersSheetData);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'รายการคำสั่งซื้อ');

    const summaryData = [
      { 'หัวข้อ': 'จำนวนคำสั่งซื้อทั้งหมด', 'ค่า': report.summary.totalOrders },
      { 'หัวข้อ': 'ยอดขายรวม (บาท)', 'ค่า': report.summary.totalSales },
      { 'หัวข้อ': 'จำนวนชิ้นที่ขายได้', 'ค่า': report.summary.totalItemsSold || 0 },
      { 'หัวข้อ': 'ยอดขายเฉลี่ยต่อออเดอร์ (บาท)', 'ค่า': report.summary.averageOrderValue || 0 },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ภาพรวมสรุป');

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    assert(xlsxBuffer && xlsxBuffer.length > 0, `XLSX export generates valid Excel binary buffer (${xlsxBuffer.length} bytes)`);
  } catch (err) {
    assert(false, 'Sales report & XLSX export test failed', err.message);
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n==========================================');
  console.log(`📊 INTEGRATION TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('==========================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
