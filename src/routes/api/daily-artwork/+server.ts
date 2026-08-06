import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';
import { sanitizeArtwork } from '$lib/utils/artworks';

// Simple in-memory cache for the heavy verified artworks query
let cachedVerifiedArtworks: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(_event: RequestEvent) {
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Get all verified artworks with their relations (with cache)
    let verifiedArtworks = cachedVerifiedArtworks;
    if (!verifiedArtworks || now.getTime() - cacheTimestamp > CACHE_TTL) {
      verifiedArtworks = await prisma.artworks.findMany({
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
      cachedVerifiedArtworks = verifiedArtworks;
      cacheTimestamp = now.getTime();
    }

    if (verifiedArtworks.length === 0) {
      return json({ lesson: null });
    }

    // Get user progress
    const progressList = await prisma.user_artwork_progress.findMany({
      where: { user_id: userId }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressMap = new Map<number, any>();
    for (const p of progressList) {
      progressMap.set(p.artwork_id, p);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectedArtwork: any = null;

    // Priority 1: Check Leitner items due outside 7-day cooldown
    const dueItems = verifiedArtworks.filter((art: any) => {
      const p = progressMap.get(art.id);
      if (!p) return false;
      const isDue = p.next_review_at && p.next_review_at <= now;
      const outsideCooldown = !p.last_presented_daily_at || p.last_presented_daily_at < sevenDaysAgo;
      return isDue && outsideCooldown;
    });

    if (dueItems.length > 0) {
      dueItems.sort((a: any, b: any) => {
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
      const undiscovered = verifiedArtworks.filter((art: any) => {
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
      const optimizedArtwork = sanitizeArtwork(selectedArtwork);
      const translation = selectedArtwork.artwork_translations[0];
      const movementTranslation = selectedArtwork.movements?.movement_translations?.[0];
      const artistTranslation = selectedArtwork.artists?.artist_translations?.[0];

      // Format as ActiveLessonView
      const lesson = {
        id: selectedArtwork.id,
        slug: selectedArtwork.slug,
        movement_id: selectedArtwork.movement_id,
        artist_id: selectedArtwork.artist_id,
        title: translation?.title || 'Inconnu',
        creation_date: selectedArtwork.creation_date,
        image_url_thumb: optimizedArtwork.image_url_thumb,
        image_url_full: optimizedArtwork.image_url_full,
        aspect_ratio: selectedArtwork.aspect_ratio,
        artists: {
          name: artistTranslation?.name || 'Inconnu',
          dates: selectedArtwork.artists?.dates || null
        },
        movement_name: movementTranslation?.name || 'Mouvement Artistique',
        movement_century: selectedArtwork.movements?.century || null,
        oklch_token: selectedArtwork.movements?.oklch_token || 'var(--movement-theme)',
        verification_status: translation?.verification_status || null,
        introduction: translation?.introduction || null,
        article_portions: translation?.article_portions || [],
        main_article: translation?.main_article || "Explorez l'histoire remarquable et la composition de ce chef-d'œuvre intemporel.",
        glossary: {
          artist_description: artistTranslation?.short_description || null,
          movement_description: movementTranslation?.short_description || null,
          artist_dates: selectedArtwork.artists?.dates || null,
          movement_century: selectedArtwork.movements?.century || null
        },
        qcm: translation?.qcm || {
          question: `Quel mouvement artistique ou période est le mieux représenté par "${translation?.title || 'cette artwork'}" ?`,
          options: [
            movementTranslation?.name || 'Impressionnisme',
            'Expressionnisme abstrait',
            'Néoclassicisme',
            'Surréalisme'
          ],
          correctIndex: 0,
          explanation: `"${translation?.title || 'Cette artwork'}" créé par ${artistTranslation?.name || 'Inconnu'} est un exemple fondamental de ${movementTranslation?.name || 'Impressionnisme'}.`
        }
      };
      
      return json({ lesson });
    }
    
    return json({ lesson: null });

  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
