import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, ContentArtwork, UserProgress, ActiveLessonView } from '$lib/types/database';
import { sanitizeArtwork } from '$lib/utils/artworks';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
	const slugOrId = params.slug;

	let artwork: Artwork | null = null;
	let movement: Movement | null = null;
	let content: ContentArtwork | null = null;
	let progress: UserProgress | null = null;

	if (!isOnline) {
		const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
		artwork = found ? sanitizeArtwork(found) : null;

		if (artwork) {
			const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
			content = cachedMcqs.find((c) => c.id_oeuvre === artwork?.id) || null;

			const cachedProgress: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];
			progress = cachedProgress.find((p) => p.id_oeuvre === artwork?.id) || null;
		}
	} else {
		try {
			// Query by slug or id
			const isNumeric = /^\d+$/.test(slugOrId);
			let query = supabase.from('oeuvres').select('*').eq('is_active', true);
			if (isNumeric) {
				query = query.eq('id', parseInt(slugOrId, 10));
			} else {
				query = query.eq('slug', slugOrId);
			}

			const { data: artData, error: artError } = await query.maybeSingle();

			if (artData) {
				artwork = sanitizeArtwork(artData);
			} else {
				const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
				const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
				artwork = found ? sanitizeArtwork(found) : null;
			}

			if (artwork) {
				const [movRes, contRes, progRes] = await Promise.all([
					supabase.from('courants').select('*').eq('id', artwork.id_courant).maybeSingle(),
					supabase.from('contenus_oeuvres').select('*').eq('id_oeuvre', artwork.id).maybeSingle(),
					supabase.from('user_artwork_progress').select('*').eq('id_oeuvre', artwork.id).maybeSingle()
				]);

				movement = (movRes.data as unknown as Movement) || null;
				content = (contRes.data as unknown as ContentArtwork) || null;
				progress = (progRes.data as unknown as UserProgress) || null;

				if (content) {
					const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
					const filtered = cachedMcqs.filter((c) => c.id_oeuvre !== artwork?.id);
					filtered.push(content);
					await saveToLocalCache('cached_mcqs', filtered);
				}
			}
		} catch (err) {
			console.warn('[DetailLoad] Supabase query failed, checking cache:', err);
			const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
			artwork = found ? sanitizeArtwork(found) : null;
			if (artwork) {
				const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
				content = cachedMcqs.find((c) => c.id_oeuvre === artwork?.id) || null;
				const cachedProgress: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];
				progress = cachedProgress.find((p) => p.id_oeuvre === artwork?.id) || null;
			}
		}
	}

	if (!artwork) {
		throw error(404, 'Artwork not found');
	}

	const lesson: ActiveLessonView = {
		...artwork,
		nom_courant: movement?.nom || 'Mouvement Artistique',
		oklch_token: movement?.oklch_token || 'var(--movement-theme)',
		anecdote_accroche: content?.anecdote_accroche || 'Explorez l\'histoire profonde et la composition de cette pièce intemporelle.',
		anecdote_technique: content?.anecdote_technique || 'Analysez la maîtrise technique, l\'harmonie des couleurs et la signification historique.',
		anecdote_secrete: content?.anecdote_secrete || 'Découvrez les détails cachés et les anecdotes historiques derrière cette création.',
		detailed_description: content?.detailed_description || null,
		qcm: content?.qcm || {
			question: `Quelle ère ou période artistique caractérise "${artwork.titre}" ?`,
			options: [movement?.nom || 'Période historique', 'Surréalisme', 'Cubisme', 'Baroque'],
			correctIndex: 0,
			explanation: `"${artwork.titre}" par ${artwork.artiste} illustre parfaitement ${movement?.nom || 'Période historique'}.`
		},
		mots_cles: content?.mots_cles || []
	};

	return {
		lesson,
		progress
	};
};
