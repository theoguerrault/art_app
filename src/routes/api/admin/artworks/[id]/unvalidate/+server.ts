import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        verification_status: 'PENDING_VALIDATION'
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
