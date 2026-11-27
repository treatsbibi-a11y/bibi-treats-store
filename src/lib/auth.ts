import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';

const COOKIE_NAME = 'bibi_admin_token';
const DEFAULT_JWT_SECRET = 'bibi-treats-super-cute-secret-key-2026';

function getJwtSecretKey(): Uint8Array {
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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAdminToken(payload: { id: string; username: string; role: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getJwtSecretKey());
}

export async function verifyAdminToken(token: string): Promise<{ id: string; username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as { id: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAdminToken(token);
}
