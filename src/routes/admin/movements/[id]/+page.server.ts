import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const movement = await prisma.movements.findUnique({
    where: { id },
    include: {
      movement_translations: { where: { language_code: 'fr' } }
    }
  });

  if (!movement) throw error(404, 'Movement not found');

  return { movement };
}
