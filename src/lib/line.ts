/**
 * LINE Messaging API Push Notification Helper (Edge-compatible)
 *
 * Uses LINE Messaging API (`POST https://api.line.me/v2/bot/message/push`)
 * because LINE Notify was discontinued on March 31, 2025.
 *
 * Required environment variables (in Cloudflare Pages Settings -> Environment variables,
 * or .env.local for localhost):
 * - LINE_CHANNEL_ACCESS_TOKEN : Long-lived Channel Access Token from LINE Developers Console
 * - LINE_ADMIN_TO               : Target LINE User ID (U...) or Group ID (C...), comma-separated if multiple
 */

export interface LineOrderSummary {
  orderNumber: string;
  total: number;
  shippingFee?: number;
  paymentMethod?: string;
  note?: string | null;
  slipUrl?: string | null;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  } | null;
  items?: {
    productName: string;
    quantity: number;
    subtotal: number;
  }[];
}

interface LineEnvLike {
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_ADMIN_TO?: string;
}

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

async function pushLineText(
  text: string,
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
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to,
            messages: [{ type: 'text', text }],
          }),
          signal: AbortSignal.timeout(3500),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('[LINE Push Error]', res.status, errText);
        }
      } catch (err) {
        console.error('[LINE Push Exception]', err);
      }
    })
  );
}

export async function notifyNewOrderToLine(
  order: LineOrderSummary,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const paymentLabel =
    order.paymentMethod === 'COD' ? 'เก็บเงินปลายทาง (COD)' : 'โอนเงิน / PromptPay';

  const itemsText = (order.items || [])
    .map(
      (item) =>
        `• ${item.productName} x${item.quantity} (฿${Number(item.subtotal).toLocaleString()})`
    )
    .join('\n');

  const lines = [
    `🧁 ออเดอร์ใหม่ #${order.orderNumber}`,
    `👤 ลูกค้า: ${order.customer?.name || '-'} (${order.customer?.phone || '-'})`,
    itemsText ? `📦 รายการ:\n${itemsText}` : '',
    `💰 ยอดสุทธิ: ฿${Number(order.total).toLocaleString()}`,
    `💳 ชำระเงิน: ${paymentLabel}`,
    order.slipUrl ? `📎 สลิป: แนบหลักฐานการโอนเงินแล้ว` : '',
    order.note ? `📝 หมายเหตุ: ${order.note}` : '',
    `🔗 จัดการออเดอร์: https://bibi-treats-admin.pages.dev/orders`,
  ].filter(Boolean);

  await pushLineText(lines.join('\n'), runtimeEnv);
}

export async function notifySlipUploadedToLine(
  order: LineOrderSummary,
  runtimeEnv?: LineEnvLike
): Promise<void> {
  const lines = [
    `💳 ลูกค้าแนบสลิปโอนเงินแล้ว #${order.orderNumber}`,
    `👤 ลูกค้า: ${order.customer?.name || '-'} (${order.customer?.phone || '-'})`,
    `💰 ยอดชำระ: ฿${Number(order.total).toLocaleString()}`,
    `🔗 ตรวจสอบสลิปในแอดมิน: https://bibi-treats-admin.pages.dev/orders`,
  ];

  await pushLineText(lines.join('\n'), runtimeEnv);
}
