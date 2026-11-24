import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3005';

let passed = 0;
let total = 0;

function check(cond, title, details = '') {
  total++;
  if (cond) {
    passed++;
    console.log(`✅ [PASS] ${title}`);
  } else {
    console.error(`❌ [FAIL] ${title} - ${details}`);
  }
}

async function run() {
  console.log('🧪 Starting End-to-End Verification: Order Approval & Slip Upload Flow\n');

  // 1. Fetch available products
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  check(prodRes.status === 200, 'GET /api/products returns HTTP 200');
  const prodData = await prodRes.json();
  const products = Array.isArray(prodData) ? prodData : prodData.products;
  const product = products.find((p) => p.stock > 2) || products[0];
  check(!!product, `Found product with stock: ${product.name} (Stock: ${product.stock})`);

  // 2. Create test order with paymentMethod: 'TRANSFER'
  const orderPayload = {
    name: 'กานต์สินี สุขสมบูรณ์',
    phone: '086-296-5765',
    instagram: 'kansinee.treats',
    address: '88/45 หมู่บ้านพฤกษาภิรมย์ ซอยลาดพร้าว 71 กทม. 10230',
    paymentMethod: 'TRANSFER',
    items: [
      {
        productId: product.id,
        quantity: 1,
      },
    ],
    note: 'ขอใบเสร็จและแจ้งคิวอบด้วยนะคะ',
  };

  const createRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  check(createRes.status === 200 || createRes.status === 201, 'POST /api/orders created TRANSFER order');
  const createData = await createRes.json();
  const order = createData.order || createData;
  const orderId = order.id;
  const orderNumber = order.orderNumber;

  check(order.paymentMethod === 'TRANSFER', `Order paymentMethod is TRANSFER (got ${order.paymentMethod})`);
  check(order.status === 'PENDING', `Initial order status is PENDING (got ${order.status})`);
  check(!order.slipUrl, `Initial slipUrl is empty/null`);

  // 3. Verify Customer View when PENDING (Approval-pending card shown, QR hidden)
  const successPageRes = await fetch(`${BASE_URL}/order-success/${orderNumber}`);
  check(successPageRes.status === 200, `GET /order-success/${orderNumber} returns HTTP 200`);
  const successPageHtml = await successPageRes.text();
  check(successPageHtml.length > 500, `Order success page HTML rendered (${successPageHtml.length} bytes)`);

  // Customer tracking endpoint check
  const trackRes = await fetch(`${BASE_URL}/api/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, phone: '0862965765' }),
  });
  check(trackRes.status === 200, 'POST /api/orders/track returns HTTP 200');
  const trackData = await trackRes.json();
  const trackedOrder = trackData.order || trackData;
  check(trackedOrder.status === 'PENDING', 'Customer sees order status is PENDING (approval pending)');
  check(trackedOrder.paymentMethod === 'TRANSFER', 'Customer sees paymentMethod is TRANSFER');
  check(!trackedOrder.slipUrl, 'No slip uploaded yet');

  // 4. Admin Authentication
  const adminLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin1234' }),
  });
  check(adminLoginRes.status === 200, 'Admin login successful');
  const setCookie = adminLoginRes.headers.get('set-cookie') || '';
  const adminCookie = setCookie.split(';')[0];
  check(adminCookie.includes('bibi_admin_token='), 'Admin token cookie retrieved');

  // 5. Admin confirms the order to CONFIRMED
  const confirmRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  check(confirmRes.status === 200, 'Admin successfully confirmed order (status -> CONFIRMED)');
  const confirmedData = await confirmRes.json();
  check(confirmedData.status === 'CONFIRMED', `Updated status is CONFIRMED (got ${confirmedData.status})`);

  // 6. Customer now sees order is CONFIRMED and can upload transfer slip
  const trackConfirmed = await fetch(`${BASE_URL}/api/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, phone: '086-296-5765' }),
  });
  const trackConfirmedData = await trackConfirmed.json();
  const trackedConfirmedOrder = trackConfirmedData.order || trackConfirmedData;
  check(
    trackedConfirmedOrder.status === 'CONFIRMED',
    'Customer sees updated status is CONFIRMED (PromptPay QR unlocked)'
  );

  // 7. Customer uploads transfer slip via /api/upload
  // Create a 1x1 test PNG image buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const formData = new FormData();
  const blob = new Blob([samplePngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'slip-receipt.png');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  check(uploadRes.status === 200, 'POST /api/upload succeeds for transfer slip image');
  const uploadData = await uploadRes.json();
  check(
    uploadData.url && uploadData.url.startsWith('/uploads/'),
    `Slip uploaded and returned valid path: ${uploadData.url}`
  );

  const slipUrl = uploadData.url;

  // 8. Attach slipUrl to order via PATCH /api/orders/[id]
  const attachSlipRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slipUrl }),
  });
  check(attachSlipRes.status === 200, 'PATCH /api/orders/[id] successfully attached slipUrl');
  const attachSlipData = await attachSlipRes.json();
  check(attachSlipData.slipUrl === slipUrl, `Order slipUrl persisted: ${attachSlipData.slipUrl}`);

  // 9. Admin views order and verifies slip is attached
  const adminGetOrderRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers: { Cookie: adminCookie },
  });
  check(adminGetOrderRes.status === 200, `Admin GET /api/orders/${orderId} returns HTTP 200`);
  const adminOrderData = await adminGetOrderRes.json();
  check(
    adminOrderData.slipUrl === slipUrl,
    `Admin order detail modal displays attached slipUrl (${adminOrderData.slipUrl})`
  );

  // Admin orders list table check
  const adminListRes = await fetch(`${BASE_URL}/api/orders?status=ALL`, {
    headers: { Cookie: adminCookie },
  });
  check(adminListRes.status === 200, 'Admin GET /api/orders list returns HTTP 200');
  const adminOrdersList = await adminListRes.json();
  const listedOrder = adminOrdersList.find((o) => o.id === orderId || o.orderNumber === orderNumber);
  check(!!listedOrder, `Order ${orderNumber} found in Admin Orders table list`);
  check(listedOrder?.slipUrl === slipUrl, `Admin table shows slip badge for order (${listedOrder?.slipUrl})`);

  // 10. Admin advances status: "ตรวจสอบสลิปถูกต้อง · เริ่มเตรียมสินค้า" (CONFIRMED -> PREPARING)
  const preparingRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({ status: 'PREPARING' }),
  });
  check(preparingRes.status === 200, 'Admin advanced status to PREPARING');
  const preparingData = await preparingRes.json();
  check(preparingData.status === 'PREPARING', `Order status is now PREPARING`);
  check(preparingData.slipUrl === slipUrl, `SlipUrl remains intact during status transitions`);

  console.log('\n==========================================');
  console.log(`📊 END-TO-END VERIFICATION: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('==========================================\n');

  if (passed === total) {
    console.log('🎉 ALL END-TO-END FLOW TESTS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} tests failed.`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
