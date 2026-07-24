import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  try {
    const verifiedArtworks = await prisma.oeuvres.findMany({
      where: {
        is_active: true,
        oeuvre_translations: {
          some: {
            language_code: 'fr',
            verification_status: 'VERIFIED'
          }
        }
      },
      include: {
        oeuvre_translations: { where: { language_code: 'fr' } },
        artistes: {
          include: { artiste_translations: { where: { language_code: 'fr' } } }
        },
        courants: {
          include: { courant_translations: { where: { language_code: 'fr' } } }
        }
      }
    });

    // We format them into Artwork and ContentArtwork arrays to easily cache them
    const artworks = verifiedArtworks.map(a => ({
      id: a.id,
      slug: a.slug,
      id_courant: a.id_courant,
      id_artiste: a.id_artiste,
      titre: a.oeuvre_translations[0]?.titre || 'Inconnu',
      date_creation: a.date_creation,
      image_url_thumb: a.image_url_thumb,
      image_url_full: a.image_url_full,
      aspect_ratio: a.aspect_ratio,
      artistes: { nom: a.artistes?.artiste_translations?.[0]?.nom || 'Inconnu' },
      courants: { 
        nom: a.courants?.courant_translations?.[0]?.nom || 'Inconnu',
        oklch_token: a.courants?.oklch_token || 'var(--movement-theme)'
      }
    }));

    const mcqs = verifiedArtworks.map(a => ({
      id_oeuvre: a.id,
      article_principal: a.oeuvre_translations[0]?.article_principal,
      qcm: a.oeuvre_translations[0]?.qcm,
      verification_status: a.oeuvre_translations[0]?.verification_status
    }));

    return json({ artworks, mcqs });
  } catch (err) {
    console.error('Error fetching verified artworks:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
