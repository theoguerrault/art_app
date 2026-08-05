import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const artwork = await prisma.artworks.findUnique({
    where: { id },
    include: { artwork_translations: { where: { language_code: 'fr' } }, artists: { include: { artist_translations: { where: { language_code: 'fr' } } } } }
  });

  if (!artwork) throw error(404, 'Artwork not found');

  return { artwork };
}
