import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;

// Ensure new models like user_reactions are present on global instance during dev hot reloads
const existingPrisma = globalForPrisma.prisma;
const isUpToDate = existingPrisma && 'user_reactions' in (existingPrisma as unknown as object);

export const prisma = isUpToDate
  ? existingPrisma!
  : new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
