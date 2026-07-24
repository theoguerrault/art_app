import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function load({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const courant = await prisma.courants.findUnique({
    where: { id },
    include: {
      courant_translations: { where: { language_code: 'fr' } }
    }
  });

  if (!courant) throw error(404, 'Courant not found');

  return { courant };
}
