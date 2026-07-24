import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const q = url.searchParams.get('q') || '';
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.courantsWhereInput = q ? {
    courant_translations: {
      some: {
        language_code: 'fr',
        nom: { contains: q, mode: 'insensitive' }
      }
    }
  } : {};

  const [courants, totalCount] = await Promise.all([
    prisma.courants.findMany({
      where,
      include: {
        courant_translations: { where: { language_code: 'fr' } }
      },
      orderBy: { id: 'asc' },
      skip,
      take: PAGE_SIZE
    }),
    prisma.courants.count({ where })
  ]);

  return { 
    courants,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      q
    }
  };
};
