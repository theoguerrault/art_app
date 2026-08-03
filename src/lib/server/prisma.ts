import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

