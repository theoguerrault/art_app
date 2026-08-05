import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page')) || 1;
    const q = url.searchParams.get('q') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: Prisma.artistsWhereInput = q ? {
      artist_translations: {
        some: {
          language_code: 'fr',
          name: { contains: q, mode: 'insensitive' }
        }
      }
    } : {};

    const [artists, totalCount] = await Promise.all([
      prisma.artists.findMany({
        where,
        include: {
          artist_translations: { where: { language_code: 'fr' } }
        },
        orderBy: { id: 'asc' },
        skip,
        take: PAGE_SIZE
      }),
      prisma.artists.count({ where })
    ]);

    return { 
      artists,
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
