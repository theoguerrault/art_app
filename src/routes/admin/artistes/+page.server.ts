import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const q = url.searchParams.get('q') || '';
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.artistesWhereInput = q ? {
    artiste_translations: {
      some: {
        language_code: 'fr',
        nom: { contains: q, mode: 'insensitive' }
      }
    }
  } : {};

  const [artistes, totalCount] = await Promise.all([
    prisma.artistes.findMany({
      where,
      include: {
        artiste_translations: { where: { language_code: 'fr' } }
      },
      orderBy: { id: 'asc' },
      skip,
      take: PAGE_SIZE
    }),
    prisma.artistes.count({ where })
  ]);

  return { 
    artistes,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      q
    }
  };
};
