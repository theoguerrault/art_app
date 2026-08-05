import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params, request }) {
  const { id } = params;
  const { content } = await request.json();
  const courantId = parseInt(id);

  const existingContent = await prisma.movement_translations.findUnique({
    where: { movement_id_language_code: { movement_id: courantId, language_code: 'fr' } }
  });

  if (!existingContent) {
    return json({ error: 'Content not found' }, { status: 404 });
  }

  const updated = await prisma.movement_translations.update({
    where: { movement_id_language_code: { movement_id: courantId, language_code: 'fr' } },
    data: {
      short_description: content,
      verification_status: 'PENDING'
    }
  });

  return json({ success: true, content: updated });
}
