import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page')) || 1;
    const q = url.searchParams.get('q') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: Prisma.artworksWhereInput = q ? {
      OR: [
        {
          artwork_translations: {
            some: {
              language_code: 'fr',
              title: { contains: q, mode: 'insensitive' }
            }
          }
        },
        {
          artists: {
            artist_translations: {
              some: {
                language_code: 'fr',
                name: { contains: q, mode: 'insensitive' }
              }
            }
          }
        }
      ]
    } : {};

    const [artworks, totalCount] = await Promise.all([
      prisma.artworks.findMany({
        where,
        select: {
          id: true,
          image_url_thumb: true,
          artwork_translations: { 
            where: { language_code: 'fr' },
            select: { title: true, verification_status: true }
          },
          artists: { 
            select: { 
              artist_translations: { 
                where: { language_code: 'fr' },
                select: { name: true }
              }
            }
          }
        },
        orderBy: { id: 'desc' },
        skip,
        take: PAGE_SIZE
      }),
      prisma.artworks.count({ where })
    ]);

    return { 
      artworks,
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
