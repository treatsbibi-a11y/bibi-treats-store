import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory sliding/fixed window store
const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    });
  }
}

/**
 * Extracts client IP from Cloudflare or proxy headers, falling back to 127.0.0.1
 */
export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  return '127.0.0.1';
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Rate limit checker per key (e.g. `orders:${ip}`)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanupExpired();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      limited: false,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count >= maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    limited: false,
    remaining: maxRequests - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}
