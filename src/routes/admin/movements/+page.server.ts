import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page')) || 1;
    const q = url.searchParams.get('q') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: Prisma.movementsWhereInput = q ? {
      movement_translations: {
        some: {
          language_code: 'fr',
          name: { contains: q, mode: 'insensitive' }
        }
      }
    } : {};

    const [movements, totalCount] = await Promise.all([
      prisma.movements.findMany({
        where,
        include: {
          movement_translations: { where: { language_code: 'fr' } }
        },
        orderBy: { id: 'asc' },
        skip,
        take: PAGE_SIZE
      }),
      prisma.movements.count({ where })
    ]);

    return { 
      movements,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
        q
      }
    };
  } catch (err) {
    throw err;
  }
};
