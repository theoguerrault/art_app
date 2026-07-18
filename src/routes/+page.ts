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
export function getLeitnerReviewDate(boxLevel: number, fromDate: Date = new Date()): string {
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

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

	let artworks: Artwork[] = [];
	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let contentsMap: Record<number, ContentArtwork> = {};

	if (!isOnline) {
		// Offline data retrieval
		artworks = sanitizeArtworks(await readFromLocalCache('cached_artworks'));
		const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
		progressList = (await readFromLocalCache('user_progress_cache')) || [];

		for (const mcq of cachedMcqs) {
			if (mcq && mcq.id_oeuvre) contentsMap[mcq.id_oeuvre] = mcq;
		}
	} else {
		try {
			// Online data retrieval from Supabase
			const [artworksRes, movementsRes, progressRes, contentsRes] = await Promise.all([
				supabase.from('oeuvres').select('*').eq('is_active', true),
				supabase.from('courants').select('*'),
				supabase.from('user_artwork_progress').select('*'),
				supabase.from('contenus_oeuvres').select('*')
			]);

			if (artworksRes.data && artworksRes.data.length > 0) {
				artworks = sanitizeArtworks(artworksRes.data);
				await saveToLocalCache('cached_artworks', artworks);
			} else {
				// Fallback if DB query returned empty or unseeded
				artworks = sanitizeArtworks(await readFromLocalCache('cached_artworks'));
			}

			if (movementsRes.data) {
				movements = movementsRes.data;
			}

			if (progressRes.data) {
				progressList = progressRes.data;
				await saveToLocalCache('user_progress_cache', progressList);
			} else {
				progressList = (await readFromLocalCache('user_progress_cache')) || [];
			}

			if (contentsRes.data) {
				const fetchedContents = contentsRes.data as unknown as ContentArtwork[];
				for (const c of fetchedContents) {
					contentsMap[c.id_oeuvre] = c;
				}
				await saveToLocalCache('cached_mcqs', fetchedContents);
			} else {
				const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
				for (const mcq of cachedMcqs) {
					if (mcq && mcq.id_oeuvre) contentsMap[mcq.id_oeuvre] = mcq;
				}
			}
		} catch (err) {
			console.warn('[TodayLoad] Error fetching from Supabase, falling back to cache:', err);
			artworks = sanitizeArtworks(await readFromLocalCache('cached_artworks'));
			const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
			for (const mcq of cachedMcqs) {
				if (mcq && mcq.id_oeuvre) contentsMap[mcq.id_oeuvre] = mcq;
			}
		}
	}

	// Create lookup maps
	const progressMap = new Map<number, UserProgress>();
	for (const p of progressList) {
		progressMap.set(p.id_oeuvre, p);
	}

	const movementsMap = new Map<number, Movement>();
	for (const m of movements) {
		movementsMap.set(m.id, m);
	}

	// Daily Selection Algorithm ("Snack Learning")
	let selectedArtwork: Artwork | null = null;

	if (artworks.length > 0) {
		// Priority 1: Check Leitner items due outside 7-day cooldown
		const dueItems = artworks.filter((art) => {
			const p = progressMap.get(art.id);
			if (!p) return false;
			const isDue = new Date(p.next_review_at) <= now;
			const outsideCooldown = !p.last_presented_daily_at || new Date(p.last_presented_daily_at) < sevenDaysAgo;
			return isDue && outsideCooldown;
		});

		if (dueItems.length > 0) {
			// Select oldest due review
			dueItems.sort((a, b) => {
				const pa = progressMap.get(a.id);
				const pb = progressMap.get(b.id);
				const timeA = pa?.next_review_at ? new Date(pa.next_review_at).getTime() : 0;
				const timeB = pb?.next_review_at ? new Date(pb.next_review_at).getTime() : 0;
				return timeA - timeB;
			});
			selectedArtwork = dueItems[0];
		}

		// Priority 2: Undiscovered artwork (`last_presented_daily_at IS NULL` or not in progressMap)
		if (!selectedArtwork) {
			const undiscovered = artworks.filter((art) => {
				const p = progressMap.get(art.id);
				return !p || !p.last_presented_daily_at;
			});
			if (undiscovered.length > 0) {
				selectedArtwork = undiscovered[0];
			}
		}

		// Priority 3: Fallback to lowest `box_level` item with oldest `last_presented_daily_at`
		if (!selectedArtwork) {
			const sortedFallback = [...artworks].sort((a, b) => {
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

	// Prepare result lesson payload
	let lesson: ActiveLessonView | null = null;
	if (selectedArtwork) {
		const movement = movementsMap.get(selectedArtwork.id_courant);
		const content = contentsMap[selectedArtwork.id];

		lesson = {
			...selectedArtwork,
			nom_courant: movement?.nom || 'Mouvement Artistique',
			oklch_token: movement?.oklch_token || 'var(--movement-theme)',
			anecdote_accroche: content?.anecdote_accroche || 'Explorez l\'histoire remarquable et la composition de ce chef-d\'œuvre intemporel.',
			anecdote_technique: content?.anecdote_technique || 'Analysez les détails techniques, le travail au pinceau et la signification historique de cette œuvre.',
			anecdote_secrete: content?.anecdote_secrete || 'Découvrez le symbolisme caché et les mystères historiques préservés à travers les siècles.',
			qcm: content?.qcm || {
				question: `Quel mouvement artistique ou période est le mieux représenté par "${selectedArtwork.titre}" ?`,
				options: [
					movement?.nom || 'Impressionnisme',
					'Expressionnisme abstrait',
					'Néoclassicisme',
					'Surréalisme'
				],
				correctIndex: 0,
				explanation: `"${selectedArtwork.titre}" créé par ${selectedArtwork.artiste} est un exemple fondamental de ${movement?.nom || 'Impressionnisme'}.`
			}
		};
	}

	return {
		lesson,
		isOffline: !isOnline
	};
};
