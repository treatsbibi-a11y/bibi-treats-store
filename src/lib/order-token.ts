import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const ORDER_ACCESS_COOKIE = 'bibi_order_access';
const ADMIN_COOKIE = 'bibi_admin_token';
const DEFAULT_JWT_SECRET = 'bibi-treats-super-cute-secret-key-2026';

function getSecretKey(): Uint8Array {
  let secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    try {
      const edgeSecret = (getRequestContext()?.env as any)?.JWT_SECRET;
      if (typeof edgeSecret === 'string' && edgeSecret.trim().length >= 16) {
        secret = edgeSecret.trim();
      }
    } catch {}
  }
  if (!secret || secret.trim().length < 16) {
    secret = DEFAULT_JWT_SECRET;
  }
  return new TextEncoder().encode(secret);
}

function isHttpsRequest(req: NextRequest): boolean {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  return proto === 'https';
}

async function readAuthorizedOrders(token: string | undefined): Promise<string[]> {
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (Array.isArray(payload.orders)) {
      return payload.orders.filter((v): v is string => typeof v === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

export async function grantOrderAccess(
  req: NextRequest,
  res: NextResponse,
  orderKeys: string[]
): Promise<NextResponse> {
  const existing = await readAuthorizedOrders(req.cookies.get(ORDER_ACCESS_COOKIE)?.value);
  const merged = Array.from(
    new Set([...existing, ...orderKeys.map((k) => k.trim()).filter(Boolean)])
  ).slice(-20);

  const token = await new SignJWT({ orders: merged })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecretKey());

  res.cookies.set(ORDER_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: isHttpsRequest(req),
  });

  return res;
}

export async function hasOrderAccess(req: NextRequest, idOrOrderNumber: string): Promise<boolean> {
  // 1. Admin session always has access
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (adminToken) {
    try {
      await jwtVerify(adminToken, getSecretKey());
      return true;
    } catch {
      // fall through to customer order token
    }
  }

  // 2. Customer signed order access cookie (set on POST /api/orders or POST /api/orders/track)
  const orderToken = req.cookies.get(ORDER_ACCESS_COOKIE)?.value;
  if (!orderToken) return false;

  const allowed = await readAuthorizedOrders(orderToken);
  const target = idOrOrderNumber.trim().toLowerCase();
  return allowed.some((entry) => entry.toLowerCase() === target);
}
