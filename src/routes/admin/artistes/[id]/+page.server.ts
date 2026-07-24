import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function load({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const artiste = await prisma.artistes.findUnique({
    where: { id },
    include: {
      artiste_translations: { where: { language_code: 'fr' } }
    }
  });

  if (!artiste) throw error(404, 'Artiste not found');

  return { artiste };
}
