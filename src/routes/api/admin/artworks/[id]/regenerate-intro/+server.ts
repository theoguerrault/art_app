import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { regenerateArtworkIntroduction } from '$lib/server/ingestion/services/description';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { 
        oeuvre_translations: { where: { language_code: 'fr' } },
        artistes: { include: { artiste_translations: { where: { language_code: 'fr' } } } }
      }
    });

    if (!artwork || !artwork.oeuvre_translations || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    const titre = artwork.oeuvre_translations[0].titre;
    const artisteNom = artwork.artistes?.artiste_translations?.[0]?.nom || 'Inconnu';
    const existingContext = artwork.oeuvre_translations[0].article_principal || '';

    const newIntro = await regenerateArtworkIntroduction(titre, artisteNom, existingContext);

    if (!newIntro) {
      return json({ error: 'Failed to generate introduction' }, { status: 500 });
    }

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        introduction: newIntro
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/regenerate-intro] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
