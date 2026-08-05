import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(_event: RequestEvent) {
  try {
    const verifiedArtworks = await prisma.artworks.findMany({
      where: {
        is_active: true,
        artwork_translations: {
          some: {
            language_code: 'fr',
            verification_status: 'VERIFIED'
          }
        }
      },
      include: {
        artwork_translations: { where: { language_code: 'fr' } },
        artists: {
          include: { artist_translations: { where: { language_code: 'fr' } } }
        },
        movements: {
          include: { movement_translations: { where: { language_code: 'fr' } } }
        }
      }
    });

    // We format them into Artwork and ContentArtwork arrays to easily cache them
    const artworks = verifiedArtworks.map(a => ({
      id: a.id,
      slug: a.slug,
      movement_id: a.movement_id,
      artist_id: a.artist_id,
      title: a.artwork_translations[0]?.title || 'Inconnu',
      creation_date: a.creation_date,
      image_url_thumb: a.image_url_thumb,
      image_url_full: a.image_url_full,
      aspect_ratio: a.aspect_ratio,
      artists: { name: a.artists?.artist_translations?.[0]?.name || 'Inconnu' },
      movements: { 
        name: a.movements?.movement_translations?.[0]?.name || 'Inconnu',
        oklch_token: a.movements?.oklch_token || 'var(--movement-theme)'
      }
    }));

    const mcqs = verifiedArtworks.map(a => ({
      artwork_id: a.id,
      main_article: a.artwork_translations[0]?.main_article,
      
      verification_status: a.artwork_translations[0]?.verification_status
    }));

    return json({ artworks, mcqs });
  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
