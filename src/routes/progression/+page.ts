import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache } from '$lib/offline/storage';
import type { Movement, UserProgress, AnswerHistory } from '$lib/types/database';

export const ssr = false;

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let historyList: AnswerHistory[] = [];

	if (!isOnline) {
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
	} else {
		try {
			const [movementsRes, progressRes, historyRes] = await Promise.all([
				supabase.from('courants').select('*').order('ordre_chronologique', { ascending: true }),
				supabase.from('user_artwork_progress').select('*'),
				supabase.from('historique_reponses').select('*').order('answered_at', { ascending: false })
			]);

			movements = (movementsRes.data as unknown as Movement[]) || [];
			progressList = (progressRes.data as unknown as UserProgress[]) || [];
			historyList = (historyRes.data as unknown as AnswerHistory[]) || [];
		} catch (err) {
			console.warn('[ProgressLoad] Supabase query error, reading cache:', err);
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
		}
	}

	return {
		movements,
		progressList,
		historyList
	};
};
