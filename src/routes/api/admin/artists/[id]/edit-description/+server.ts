import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params, request }) {
  const { id } = params;
  const { content } = await request.json();
  const artisteId = parseInt(id);

  const existingContent = await prisma.artist_translations.findUnique({
    where: { artist_id_language_code: { artist_id: artisteId, language_code: 'fr' } }
  });

  if (!existingContent) {
    return json({ error: 'Content not found' }, { status: 404 });
  }

  const updated = await prisma.artist_translations.update({
    where: { artist_id_language_code: { artist_id: artisteId, language_code: 'fr' } },
    data: {
      short_description: content,
      verification_status: 'PENDING'
    }
  });

  return json({ success: true, content: updated });
}
