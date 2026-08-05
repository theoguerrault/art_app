import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { regenerateArtworkIntroduction } from '$lib/server/ingestion/services/description';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { 
        artwork_translations: { where: { language_code: 'fr' } },
        artists: { include: { artist_translations: { where: { language_code: 'fr' } } } }
      }
    });

    if (!artwork || !artwork.artwork_translations || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    const titre = artwork.artwork_translations[0].title;
    const artisteNom = artwork.artists?.artist_translations?.[0]?.name || 'Inconnu';
    const existingContext = artwork.artwork_translations[0].main_article || '';

    const newIntro = await regenerateArtworkIntroduction(titre, artisteNom, existingContext);

    if (!newIntro) {
      return json({ error: 'Failed to generate introduction' }, { status: 500 });
    }

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        introduction: newIntro
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
