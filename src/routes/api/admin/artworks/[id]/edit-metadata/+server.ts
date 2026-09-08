import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request, params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { musee, creation_date } = body;

    const dataToUpdate: Record<string, any> = {};
    if (musee !== undefined) {
      dataToUpdate.musee = musee ? String(musee).trim() : null;
    }
    if (creation_date !== undefined) {
      dataToUpdate.creation_date = String(creation_date).trim();
    }

    const updated = await prisma.artworks.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate
    });

    return json({ success: true, artwork: updated });
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 });
  }
}
