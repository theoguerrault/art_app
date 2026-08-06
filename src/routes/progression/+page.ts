import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache } from '$lib/offline/storage';
import type { Movement, UserProgress, Artwork } from '$lib/types/database';
import { getLocalizedText } from '$lib/utils/i18n';

export const ssr = false;

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	const artworkToMovement: Record<number, number> = {};

	if (!isOnline) {
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
		const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		for (const a of fullArtworks) {
			artworkToMovement[a.id] = a.movement_id;
		}
	} else {
		try {
			const [movementsRes, progressRes, oeuvresRes] = await Promise.all([
				supabase.from('movements').select('id, oklch_token, movement_translations(name, language_code)').order('chronological_order', { ascending: true }),
				supabase.from('user_artwork_progress').select('artwork_id, box_level'),
				supabase.from('artworks').select('id, movement_id').eq('is_active', true)
			]);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			movements = ((movementsRes.data as any[]) || []).map(m => ({ ...m, name: getLocalizedText(m.movement_translations, 'name') || 'Inconnu' })) as unknown as Movement[];
			
			if (oeuvresRes.data) {
				for (const o of oeuvresRes.data as {id: number; movement_id: number}[]) {
					artworkToMovement[o.id] = o.movement_id;
				}
			}
			
			// Fallback to local cache if Supabase returns empty (e.g. anonymous user blocked by RLS)
			const localProgress = (await readFromLocalCache('user_progress_cache')) || [];
			progressList = progressRes.data && progressRes.data.length > 0 ? (progressRes.data as unknown as UserProgress[]) : localProgress;
		} catch (err) {
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
			const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			for (const a of fullArtworks) {
				artworkToMovement[a.id] = a.movement_id;
			}
		}
	}

	return {
		movements,
		progressList,
		artworkToMovement
	};
};
