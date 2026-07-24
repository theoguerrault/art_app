import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Get all verified artworks with their relations
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

    if (verifiedArtworks.length === 0) {
      return json({ lesson: null });
    }

    // Get user progress
    const progressList = await prisma.user_artwork_progress.findMany({
      where: { user_id: userId }
    });
    
    const progressMap = new Map<number, any>();
    for (const p of progressList) {
      progressMap.set(p.id_oeuvre, p);
    }

    let selectedArtwork: any = null;

    // Priority 1: Check Leitner items due outside 7-day cooldown
    const dueItems = verifiedArtworks.filter((art) => {
      const p = progressMap.get(art.id);
      if (!p) return false;
      const isDue = p.next_review_at && p.next_review_at <= now;
      const outsideCooldown = !p.last_presented_daily_at || p.last_presented_daily_at < sevenDaysAgo;
      return isDue && outsideCooldown;
    });

    if (dueItems.length > 0) {
      dueItems.sort((a, b) => {
        const pa = progressMap.get(a.id);
        const pb = progressMap.get(b.id);
        const timeA = pa?.next_review_at ? pa.next_review_at.getTime() : 0;
        const timeB = pb?.next_review_at ? pb.next_review_at.getTime() : 0;
        return timeA - timeB;
      });
      selectedArtwork = dueItems[0];
    }

    // Priority 2: Undiscovered artwork
    if (!selectedArtwork) {
      const undiscovered = verifiedArtworks.filter((art) => {
        const p = progressMap.get(art.id);
        return !p || !p.last_presented_daily_at;
      });
      if (undiscovered.length > 0) {
        selectedArtwork = undiscovered[0];
      }
    }

    // Priority 3: Fallback to lowest box_level
    if (!selectedArtwork) {
      const sortedFallback = [...verifiedArtworks].sort((a, b) => {
        const pa = progressMap.get(a.id);
        const pb = progressMap.get(b.id);
        const levelA = pa?.box_level ?? 1;
        const levelB = pb?.box_level ?? 1;
        if (levelA !== levelB) return levelA - levelB;
        const timeA = pa?.last_presented_daily_at ? pa.last_presented_daily_at.getTime() : 0;
        const timeB = pb?.last_presented_daily_at ? pb.last_presented_daily_at.getTime() : 0;
        return timeA - timeB;
      });
      selectedArtwork = sortedFallback[0];
    }

    if (selectedArtwork) {
      const translation = selectedArtwork.oeuvre_translations[0];
      const movementTranslation = selectedArtwork.courants?.courant_translations?.[0];
      const artistTranslation = selectedArtwork.artistes?.artiste_translations?.[0];

      // Format as ActiveLessonView
      const lesson = {
        id: selectedArtwork.id,
        slug: selectedArtwork.slug,
        id_courant: selectedArtwork.id_courant,
        id_artiste: selectedArtwork.id_artiste,
        titre: translation?.titre || 'Inconnu',
        date_creation: selectedArtwork.date_creation,
        image_url_thumb: selectedArtwork.image_url_thumb,
        image_url_full: selectedArtwork.image_url_full,
        aspect_ratio: selectedArtwork.aspect_ratio,
        artistes: { nom: artistTranslation?.nom || 'Inconnu' },
        nom_courant: movementTranslation?.nom || 'Mouvement Artistique',
        oklch_token: selectedArtwork.courants?.oklch_token || 'var(--movement-theme)',
        verification_status: translation?.verification_status || null,
        introduction: translation?.introduction || null,
        article_portions: translation?.article_portions || [],
        article_principal: translation?.article_principal || "Explorez l'histoire remarquable et la composition de ce chef-d'œuvre intemporel.",
        qcm: translation?.qcm || {
          question: `Quel mouvement artistique ou période est le mieux représenté par "${translation?.titre || 'cette oeuvre'}" ?`,
          options: [
            movementTranslation?.nom || 'Impressionnisme',
            'Expressionnisme abstrait',
            'Néoclassicisme',
            'Surréalisme'
          ],
          correctIndex: 0,
          explanation: `"${translation?.titre || 'Cette oeuvre'}" créé par ${artistTranslation?.nom || 'Inconnu'} est un exemple fondamental de ${movementTranslation?.nom || 'Impressionnisme'}.`
        }
      };
      
      return json({ lesson });
    }
    
    return json({ lesson: null });

  } catch (err) {
    console.error('Error in daily artwork API:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
