import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

