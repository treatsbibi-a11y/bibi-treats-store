import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { resolveD1Binding } from './d1-remote';

let localPrisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  const d1 = resolveD1Binding();
  if (d1) {
    const adapter = new PrismaD1(d1 as any);
    return new PrismaClient({ adapter: adapter as any });
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
