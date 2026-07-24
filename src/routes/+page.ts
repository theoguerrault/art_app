import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, UserProgress, ContentArtwork, Movement, ActiveLessonView } from '$lib/types/database';
import { sanitizeArtworks } from '$lib/utils/artworks';

export const ssr = false; // Client-side rendering enabled for daily storage state logic

/**
 * Calculates the next review date based on Leitner Box Level rules:
 * Box 1 -> +1 day, Box 2 -> +3 days, Box 3 -> +7 days, Box 4 -> +14 days, Box 5 -> +30 days.
 */
export function _getLeitnerReviewDate(boxLevel: number, fromDate: Date = new Date()): string {
	const daysMap: Record<number, number> = {
		1: 1,
		2: 3,
		3: 7,
		4: 14,
		5: 30
	};
	const addDays = daysMap[Math.max(1, Math.min(5, boxLevel))] || 1;
	const target = new Date(fromDate.getTime() + addDays * 86400000);
	return target.toISOString();
}

export const load: PageLoad = async ({ fetch }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	if (isOnline) {
		try {
			// Trigger background caching of all verified artworks
			fetch('/api/verified-artworks').then(async (res) => {
				if (res.ok) {
					const { artworks, mcqs } = await res.json();
					if (artworks && mcqs) {
						await saveToLocalCache('cached_artworks', artworks);
						await saveToLocalCache('cached_mcqs', mcqs);
					}
				}
			}).catch(err => console.warn('Background cache failed:', err));

			// Fetch daily lesson from server
			const res = await fetch('/api/daily-artwork');
			if (res.ok) {
				const { lesson } = await res.json();
				return { lesson, isOffline: false };
			}
		} catch (err) {
			console.warn('[TodayLoad] Error fetching online daily artwork, falling back to cache:', err);
		}
	}

	// Offline Fallback Logic (run Leitner client-side)
	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
	
	const artworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
	const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
	const progressList: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];

	const progressMap = new Map<number, UserProgress>();
	for (const p of progressList) {
		progressMap.set(p.id_oeuvre, p);
	}

	const contentsMap: Record<number, ContentArtwork> = {};
	for (const mcq of cachedMcqs) {
		if (mcq && mcq.id_oeuvre) contentsMap[mcq.id_oeuvre] = mcq;
	}

	let selectedArtwork: Artwork | null = null;
	const validatedArtworks = artworks.filter(art => {
		const content = contentsMap[art.id];
		return content && content.verification_status === 'VERIFIED';
	});

	if (validatedArtworks.length > 0) {
		const dueItems = validatedArtworks.filter((art) => {
			const p = progressMap.get(art.id);
			if (!p) return false;
			const isDue = new Date(p.next_review_at) <= now;
			const outsideCooldown = !p.last_presented_daily_at || new Date(p.last_presented_daily_at) < sevenDaysAgo;
			return isDue && outsideCooldown;
		});

		if (dueItems.length > 0) {
			dueItems.sort((a, b) => {
				const pa = progressMap.get(a.id);
				const pb = progressMap.get(b.id);
				const timeA = pa?.next_review_at ? new Date(pa.next_review_at).getTime() : 0;
				const timeB = pb?.next_review_at ? new Date(pb.next_review_at).getTime() : 0;
				return timeA - timeB;
			});
			selectedArtwork = dueItems[0];
		}

		if (!selectedArtwork) {
			const undiscovered = validatedArtworks.filter((art) => !progressMap.get(art.id) || !progressMap.get(art.id)!.last_presented_daily_at);
			if (undiscovered.length > 0) selectedArtwork = undiscovered[0];
		}

		if (!selectedArtwork) {
			const sortedFallback = [...validatedArtworks].sort((a, b) => {
				const pa = progressMap.get(a.id);
				const pb = progressMap.get(b.id);
				const levelA = pa?.box_level ?? 1;
				const levelB = pb?.box_level ?? 1;
				if (levelA !== levelB) return levelA - levelB;
				const timeA = pa?.last_presented_daily_at ? new Date(pa.last_presented_daily_at).getTime() : 0;
				const timeB = pb?.last_presented_daily_at ? new Date(pb.last_presented_daily_at).getTime() : 0;
				return timeA - timeB;
			});
			selectedArtwork = sortedFallback[0];
		}
	}

	let lesson: ActiveLessonView | null = null;
	if (selectedArtwork) {
		const content = contentsMap[selectedArtwork.id];
		lesson = {
			...selectedArtwork,
			nom_courant: (selectedArtwork as any).courants?.nom || 'Mouvement Artistique',
			oklch_token: (selectedArtwork as any).courants?.oklch_token || 'var(--movement-theme)',
			article_principal: content?.article_principal || 'Explorez l\'histoire remarquable et la composition de ce chef-d\'œuvre intemporel.',
			qcm: content?.qcm || {
				question: `Quel mouvement artistique ou période est le mieux représenté par "${selectedArtwork.titre}" ?`,
				options: [
					(selectedArtwork as any).courants?.nom || 'Impressionnisme',
					'Expressionnisme abstrait',
					'Néoclassicisme',
					'Surréalisme'
				],
				correctIndex: 0,
				explanation: `"${selectedArtwork.titre}" créé par ${selectedArtwork.artistes?.nom || 'Inconnu'} est un exemple fondamental de ${(selectedArtwork as any).courants?.nom || 'Impressionnisme'}.`
			}
		};
	}

	return {
		lesson,
		isOffline: !isOnline
	};
};
