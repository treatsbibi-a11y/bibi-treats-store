/**
 * LINE Messaging API Push Notification Helper (Edge-compatible & Flex Message)
 *
 * Uses LINE Messaging API (`POST https://api.line.me/v2/bot/message/push`)
 * with elegant Flex Message Cards and automatic Plain Text fallback.
 *
 * Required environment variables:
 * - LINE_CHANNEL_ACCESS_TOKEN : Long-lived Channel Access Token from LINE Developers Console
 * - LINE_ADMIN_TO               : Target LINE User ID (U...) or Group ID (C...), comma-separated if multiple
 */

export interface LineOrderSummary {
  id?: string;
  orderNumber: string;
  total: number;
  shippingFee?: number;
  paymentMethod?: string;
  status?: string;
  note?: string | null;
  slipUrl?: string | null;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    instagram?: string | null;
  } | null;
  items?: {
    productName?: string;
    product?: any;
    quantity: number;
    subtotal?: number;
    price?: number;
  }[];
}

export interface LineEnvLike {
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_ADMIN_TO?: string;
}

const ADMIN_URL = 'https://bibi-treats-admin.pages.dev/orders';

function getLineCredentials(runtimeEnv?: LineEnvLike) {
  const token =
    runtimeEnv?.LINE_CHANNEL_ACCESS_TOKEN ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    '';
  const rawTo =
    runtimeEnv?.LINE_ADMIN_TO ||
    process.env.LINE_ADMIN_TO ||
    '';

  const recipients = rawTo
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return { token: token.trim(), recipients };
}

function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}

function formatCurrency(amount: number): string {
  return Number(amount || 0).toLocaleString();
}

function getItemsList(order: LineOrderSummary) {
  return (order.items || []).map((item) => {
    const name = item.productName || item.product?.name || 'ขนม';
    const qty = Number(item.quantity) || 1;
    const subtotal = Number(item.subtotal ?? (Number(item.price || 0) * qty));
    return { name, quantity: qty, subtotal };
  });
}

async function pushLineMessage(
  flexMessage: Record<string, any>,
  fallbackText: string,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const { token, recipients } = getLineCredentials(runtimeEnv);
  if (!token || recipients.length === 0) {
    console.warn('[LINE] Missing LINE_CHANNEL_ACCESS_TOKEN or LINE_ADMIN_TO; skipping LINE push.');
    return;
  }

  await Promise.all(
    recipients.map(async (to) => {
      try {
        // Try Flex Message first
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to,
            messages: [flexMessage],
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) return;

        // If Flex fails, fallback to clean plain text
        const errText = await res.text().catch(() => '');
        console.warn('[LINE Flex Warning, falling back to text]', res.status, errText);

        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to,
            messages: [{ type: 'text', text: fallbackText }],
          }),
          signal: AbortSignal.timeout(4000),
        });
      } catch (err) {
        console.error('[LINE Push Exception]', err);
      }
    })
  );
}

/**
 * 1. แจ้งเตือนเมื่อมีออเดอร์ใหม่เข้ามา
 */
export async function notifyNewOrderToLine(
  order: LineOrderSummary,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const isCOD = order.paymentMethod === 'COD';
  const paymentBadge = isCOD ? 'เก็บเงินปลายทาง (COD)' : 'โอนเงิน / PromptPay';
  const headerBg = isCOD ? '#78350F' : '#1E293B';
  const badgeColor = isCOD ? '#FBBF24' : '#38BDF8';
  const customerName = order.customer?.name || '-';
  const customerPhone = order.customer?.phone || '-';
  const customerAddress = order.customer?.address || '-';
  const items = getItemsList(order);
  const totalStr = formatCurrency(order.total);
  const orderNumber = order.orderNumber;
  const telUri = cleanPhone(customerPhone);

  const flexMessage = {
    type: 'flex',
    altText: `🧁 ออเดอร์ใหม่ #${orderNumber} (฿${totalStr}) - ${customerName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerBg,
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: "Bibi's Treats",
                weight: 'bold',
                color: '#F59E0B',
                size: 'xs',
              },
              {
                type: 'text',
                text: paymentBadge,
                size: 'xs',
                color: badgeColor,
                align: 'end',
                weight: 'bold',
              },
            ],
          },
          {
            type: 'text',
            text: '🧁 มีออเดอร์ใหม่เข้ามา!',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
            margin: 'sm',
          },
          {
            type: 'text',
            text: `#${orderNumber}`,
            size: 'sm',
            color: '#CBD5E1',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '👤 ลูกค้า', size: 'xs', color: '#64748B', flex: 2 },
                  { type: 'text', text: customerName, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📞 โทร', size: 'xs', color: '#64748B', flex: 2 },
                  { type: 'text', text: customerPhone, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📍 จัดส่ง/นัดรับ', size: 'xs', color: '#64748B', flex: 2 },
                  { type: 'text', text: customerAddress, size: 'xs', color: '#334155', wrap: true, flex: 5 },
                ],
              },
              ...(order.customer?.instagram ? [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '📸 IG', size: 'xs', color: '#64748B', flex: 2 },
                    { type: 'text', text: order.customer.instagram, size: 'xs', color: '#E11D48', flex: 5 },
                  ],
                }
              ] : []),
            ],
          },
          { type: 'separator', color: '#E2E8F0' },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              { type: 'text', text: '📦 รายการขนมในออเดอร์:', size: 'xs', weight: 'bold', color: '#475569' },
              ...items.map((item) => ({
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: `• ${item.name}`, size: 'xs', color: '#334155', flex: 5, wrap: true },
                  { type: 'text', text: `x${item.quantity}`, size: 'xs', color: '#64748B', align: 'center', flex: 1 },
                  { type: 'text', text: `฿${formatCurrency(item.subtotal)}`, size: 'xs', color: '#0F172A', weight: 'bold', align: 'end', flex: 2 },
                ],
              })),
            ],
          },
          { type: 'separator', color: '#E2E8F0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '💰 ยอดสุทธิทั้งสิ้น', size: 'sm', weight: 'bold', color: '#1E293B' },
              { type: 'text', text: `฿${totalStr}`, size: 'lg', weight: 'bold', color: '#D97706', align: 'end' },
            ],
          },
          ...(order.note ? [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📝 หมายเหตุ', size: 'xs', color: '#64748B', flex: 2 },
                { type: 'text', text: order.note, size: 'xs', color: '#B45309', wrap: true, flex: 5 },
              ],
            }
          ] : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#D97706',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📋 ดูออเดอร์ในแอดมิน',
              uri: ADMIN_URL,
            },
          },
          ...(telUri ? [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: `📞 โทร ${customerPhone}`,
                uri: `tel:${telUri}`,
              },
            }
          ] : []),
          ...(order.slipUrl ? [
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📎 เปิดดูรูปสลิปโอนเงิน',
                uri: order.slipUrl,
              },
            }
          ] : []),
        ],
      },
    },
  };

  const fallbackText = [
    `🧁 ออเดอร์ใหม่ #${orderNumber}`,
    `👤 ลูกค้า: ${customerName} (${customerPhone})`,
    `📍 นัดรับ/จัดส่ง: ${customerAddress}`,
    `💰 ยอดสุทธิ: ฿${totalStr} (${paymentBadge})`,
    items.map((i) => `• ${i.name} x${i.quantity} (฿${formatCurrency(i.subtotal)})`).join('\n'),
    order.note ? `📝 หมายเหตุ: ${order.note}` : '',
    `🔗 แอดมิน: ${ADMIN_URL}`,
  ].filter(Boolean).join('\n');

  await pushLineMessage(flexMessage, fallbackText, runtimeEnv);
}

/**
 * 2. แจ้งเตือนเมื่อลูกค้าแนบสลิปโอนเงินแล้ว
 */
export async function notifySlipUploadedToLine(
  order: LineOrderSummary,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const customerName = order.customer?.name || '-';
  const customerPhone = order.customer?.phone || '-';
  const totalStr = formatCurrency(order.total);
  const orderNumber = order.orderNumber;
  const telUri = cleanPhone(customerPhone);

  const flexMessage = {
    type: 'flex',
    altText: `💳 ลูกค้าแนบสลิปแล้ว #${orderNumber} (฿${totalStr})`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0369A1',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: "Bibi's Treats",
                weight: 'bold',
                color: '#BAE6FD',
                size: 'xs',
              },
              {
                type: 'text',
                text: 'แนบสลิปโอนเงินแล้ว',
                size: 'xs',
                color: '#38BDF8',
                align: 'end',
                weight: 'bold',
              },
            ],
          },
          {
            type: 'text',
            text: '💳 ตรวจสอบสลิปโอนเงิน',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
            margin: 'sm',
          },
          {
            type: 'text',
            text: `#${orderNumber}`,
            size: 'sm',
            color: '#E0F2FE',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '👤 ลูกค้า', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: customerName, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📞 โทร', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: customerPhone, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '💰 ยอดชำระ', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: `฿${totalStr}`, size: 'md', color: '#0284C7', weight: 'bold', flex: 5 },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          ...(order.slipUrl ? [
            {
              type: 'button',
              style: 'primary',
              color: '#0284C7',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🖼️ เปิดดูรูปสลิปทันที',
                uri: order.slipUrl,
              },
            }
          ] : []),
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📋 ตรวจสอบในแอดมิน',
              uri: ADMIN_URL,
            },
          },
          ...(telUri ? [
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: `📞 โทร ${customerPhone}`,
                uri: `tel:${telUri}`,
              },
            }
          ] : []),
        ],
      },
    },
  };

  const fallbackText = [
    `💳 ลูกค้าแนบสลิปโอนเงินแล้ว #${orderNumber}`,
    `👤 ลูกค้า: ${customerName} (${customerPhone})`,
    `💰 ยอดชำระ: ฿${totalStr}`,
    order.slipUrl ? `📎 ลิงก์สลิป: ${order.slipUrl}` : '',
    `🔗 ตรวจสอบในแอดมิน: ${ADMIN_URL}`,
  ].filter(Boolean).join('\n');

  await pushLineMessage(flexMessage, fallbackText, runtimeEnv);
}

/**
 * 3. แจ้งเตือนเมื่อร้านค้าอัปเดตสถานะออเดอร์
 */
export async function notifyOrderStatusUpdatedToLine(
  order: LineOrderSummary,
  newStatus: string,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const statusConfigs: Record<string, { title: string; badge: string; color: string; bg: string }> = {
    CONFIRMED: {
      title: '✅ ร้านค้ายืนยันออเดอร์แล้ว',
      badge: 'ยืนยันแล้ว',
      color: '#34D399',
      bg: '#064E3B',
    },
    PREPARING: {
      title: '👩‍🍳 กำลังอบ & เตรียมขนม',
      badge: 'กำลังเตรียม',
      color: '#C084FC',
      bg: '#581C87',
    },
    SHIPPING: {
      title: '🛵 ขนมกำลังออกจัดส่ง',
      badge: 'กำลังจัดส่ง',
      color: '#38BDF8',
      bg: '#0C4A6E',
    },
    COMPLETED: {
      title: '🎉 จัดส่งสำเร็จ / เสร็จสิ้น',
      badge: 'เสร็จสิ้นเรียบร้อย',
      color: '#4ADE80',
      bg: '#14532D',
    },
    CANCELLED: {
      title: '❌ ปฏิเสธ / ยกเลิกออเดอร์',
      badge: 'ยกเลิกออเดอร์',
      color: '#F87171',
      bg: '#7F1D1D',
    },
  };

  const config = statusConfigs[newStatus] || {
    title: `📦 อัปเดตสถานะ: ${newStatus}`,
    badge: newStatus,
    color: '#94A3B8',
    bg: '#1E293B',
  };

  const customerName = order.customer?.name || '-';
  const customerPhone = order.customer?.phone || '-';
  const customerAddress = order.customer?.address || '-';
  const totalStr = formatCurrency(order.total);
  const orderNumber = order.orderNumber;
  const telUri = cleanPhone(customerPhone);

  const flexMessage = {
    type: 'flex',
    altText: `${config.title} #${orderNumber}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: config.bg,
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: "Bibi's Treats",
                weight: 'bold',
                color: '#FCD34D',
                size: 'xs',
              },
              {
                type: 'text',
                text: config.badge,
                size: 'xs',
                color: config.color,
                align: 'end',
                weight: 'bold',
              },
            ],
          },
          {
            type: 'text',
            text: config.title,
            weight: 'bold',
            size: 'md',
            color: '#FFFFFF',
            margin: 'sm',
          },
          {
            type: 'text',
            text: `#${orderNumber}`,
            size: 'sm',
            color: '#E2E8F0',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '👤 ลูกค้า', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: customerName, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📞 โทร', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: customerPhone, size: 'xs', color: '#0F172A', weight: 'bold', flex: 5 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📍 จัดส่ง/นัดรับ', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: customerAddress, size: 'xs', color: '#334155', wrap: true, flex: 5 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '💰 ยอดรวม', size: 'xs', color: '#64748B', flex: 2 },
              { type: 'text', text: `฿${totalStr}`, size: 'sm', color: '#D97706', weight: 'bold', flex: 5 },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#0F172A',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📋 ตรวจสอบในระบบแอดมิน',
              uri: ADMIN_URL,
            },
          },
          ...(telUri ? [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: `📞 โทรหาลูกค้า`,
                uri: `tel:${telUri}`,
              },
            }
          ] : []),
        ],
      },
    },
  };

  const fallbackText = [
    `${config.title} #${orderNumber}`,
    `👤 ลูกค้า: ${customerName} (${customerPhone})`,
    `📍 นัดรับ/จัดส่ง: ${customerAddress}`,
    `💰 ยอดรวม: ฿${totalStr}`,
    `🔗 จัดการในแอดมิน: ${ADMIN_URL}`,
  ].join('\n');

  await pushLineMessage(flexMessage, fallbackText, runtimeEnv);
}
