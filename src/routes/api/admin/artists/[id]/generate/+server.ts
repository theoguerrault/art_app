import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateArtistDefinition } from '$lib/server/ingestion/services/artist';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artist = await prisma.artists.findUnique({ 
      where: { id },
      include: { artist_translations: { where: { language_code: 'fr' } } }
    });
    if (!artist) return json({ error: 'Artist not found' }, { status: 404 });

    const artisteName = artist.artist_translations?.[0]?.name || artist.slug.replace(/-/g, ' ');
    const description = await generateArtistDefinition(artisteName);
    if (!description) return json({ error: 'Failed to generate content' }, { status: 500 });

    const updated = await prisma.artist_translations.upsert({
      where: { artist_id_language_code: { artist_id: id, language_code: 'fr' } },
      update: { short_description: description, verification_status: 'VERIFIED' },
      create: { 
        artist_id: id, 
        language_code: 'fr',
        name: artist.artist_translations?.[0]?.name || artist.slug.replace(/-/g, ' '),
        short_description: description, 
        verification_status: 'VERIFIED' 
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
