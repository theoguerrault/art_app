import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const artist = await prisma.artists.findUnique({
    where: { id },
    include: {
      artist_translations: { where: { language_code: 'fr' } }
    }
  });

  if (!artist) throw error(404, 'Artist not found');

  return { artist };
}
