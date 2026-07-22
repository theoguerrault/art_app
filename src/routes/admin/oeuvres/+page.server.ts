import { prisma } from '$lib/server/prisma';

export async function load() {
  const oeuvres = await prisma.oeuvres.findMany({
    include: {
      contenus_oeuvres: true
    },
    orderBy: { id: 'desc' }
  });

  return { oeuvres };
}
