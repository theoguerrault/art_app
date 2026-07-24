import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params, request }) {
  const { id } = params;
  const { content } = await request.json();
  const artisteId = parseInt(id);

  const existingContent = await prisma.artiste_translations.findUnique({
    where: { id_artiste_language_code: { id_artiste: artisteId, language_code: 'fr' } }
  });

  if (!existingContent) {
    return json({ error: 'Content not found' }, { status: 404 });
  }

  const updated = await prisma.artiste_translations.update({
    where: { id_artiste_language_code: { id_artiste: artisteId, language_code: 'fr' } },
    data: {
      description_courte: content,
      verification_status: 'PENDING'
    }
  });

  return json({ success: true, content: updated });
}
