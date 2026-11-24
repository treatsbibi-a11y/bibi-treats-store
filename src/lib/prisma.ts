import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

let localPrisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  try {
    const ctx = getRequestContext();
    if (ctx?.env && (ctx.env as any).DB) {
      const adapter = new PrismaD1((ctx.env as any).DB);
      return new PrismaClient({ adapter: adapter as any });
    }
  } catch {
    // getRequestContext is unavailable outside of active Cloudflare Pages request
  }

  if (!localPrisma) {
    localPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  return localPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
