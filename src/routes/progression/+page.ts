import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache } from '$lib/offline/storage';
import type { Movement, UserProgress, AnswerHistory, Artwork } from '$lib/types/database';

export const ssr = false;

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let historyList: AnswerHistory[] = [];
	let artworkToMovement: Record<number, number> = {};

	if (!isOnline) {
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
		historyList = (await readFromLocalCache('offline_sync_queue')) || [];
		const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		for (const a of fullArtworks) {
			artworkToMovement[a.id] = a.id_courant;
		}
	} else {
		try {
			const [movementsRes, progressRes, historyRes, oeuvresRes] = await Promise.all([
				supabase.from('courants').select('id, nom, oklch_token').order('ordre_chronologique', { ascending: true }),
				supabase.from('user_artwork_progress').select('id_oeuvre, box_level'),
				supabase.from('historique_reponses').select('id, is_correct').order('answered_at', { ascending: false }),
				supabase.from('oeuvres').select('id, id_courant').eq('is_active', true)
			]);

			movements = (movementsRes.data as unknown as Movement[]) || [];
			
			if (oeuvresRes.data) {
				for (const o of oeuvresRes.data as {id: number; id_courant: number}[]) {
					artworkToMovement[o.id] = o.id_courant;
				}
			}
			
			// Fallback to local cache if Supabase returns empty (e.g. anonymous user blocked by RLS)
			const localProgress = (await readFromLocalCache('user_progress_cache')) || [];
			progressList = progressRes.data && progressRes.data.length > 0 ? (progressRes.data as unknown as UserProgress[]) : localProgress;
			
			const localHistory = (await readFromLocalCache('offline_sync_queue')) || [];
			historyList = historyRes.data && historyRes.data.length > 0 ? (historyRes.data as unknown as AnswerHistory[]) : localHistory;
		} catch (err) {
			console.warn('[ProgressLoad] Supabase query error, reading cache:', err);
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
			historyList = (await readFromLocalCache('offline_sync_queue')) || [];
			const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			for (const a of fullArtworks) {
				artworkToMovement[a.id] = a.id_courant;
			}
		}
	}

	return {
		movements,
		progressList,
		historyList,
		artworkToMovement
	};
};
