import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function load({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const oeuvre = await prisma.oeuvres.findUnique({
    where: { id },
    include: { contenus_oeuvres: true }
  });

  if (!oeuvre) throw error(404, 'Oeuvre not found');

  return { oeuvre };
}
