import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ url }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const q = url.searchParams.get('q') || '';
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.oeuvresWhereInput = q ? {
    OR: [
      {
        oeuvre_translations: {
          some: {
            language_code: 'fr',
            titre: { contains: q, mode: 'insensitive' }
          }
        }
      },
      {
        artistes: {
          artiste_translations: {
            some: {
              language_code: 'fr',
              nom: { contains: q, mode: 'insensitive' }
            }
          }
        }
      }
    ]
  } : {};

  const [oeuvres, totalCount] = await Promise.all([
    prisma.oeuvres.findMany({
      where,
      select: {
        id: true,
        image_url_thumb: true,
        oeuvre_translations: { 
          where: { language_code: 'fr' },
          select: { titre: true, verification_status: true }
        },
        artistes: { 
          select: { 
            artiste_translations: { 
              where: { language_code: 'fr' },
              select: { nom: true }
            }
          }
        }
      },
      orderBy: { id: 'desc' },
      skip,
      take: PAGE_SIZE
    }),
    prisma.oeuvres.count({ where })
  ]);

  return { 
    oeuvres,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      q
    }
  };
};
