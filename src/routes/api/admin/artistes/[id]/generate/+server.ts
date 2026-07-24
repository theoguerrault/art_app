import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateArtistDefinition } from '$lib/server/ingestion/services/artiste';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artiste = await prisma.artistes.findUnique({ 
      where: { id },
      include: { artiste_translations: { where: { language_code: 'fr' } } }
    });
    if (!artiste) return json({ error: 'Artiste not found' }, { status: 404 });

    const artisteName = artiste.artiste_translations?.[0]?.nom || artiste.slug.replace(/-/g, ' ');
    const description = await generateArtistDefinition(artisteName);
    if (!description) return json({ error: 'Failed to generate content' }, { status: 500 });

    const updated = await prisma.artiste_translations.upsert({
      where: { id_artiste_language_code: { id_artiste: id, language_code: 'fr' } },
      update: { description_courte: description, verification_status: 'VERIFIED' },
      create: { 
        id_artiste: id, 
        language_code: 'fr',
        nom: artiste.artiste_translations?.[0]?.nom || artiste.slug.replace(/-/g, ' '),
        description_courte: description, 
        verification_status: 'VERIFIED' 
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/artistes/generate] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
