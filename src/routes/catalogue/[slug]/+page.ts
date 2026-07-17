import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, ContentArtwork, UserProgress, ActiveLessonView } from '$lib/types/database';

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
		artwork = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;

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
				artwork = artData;
			} else {
				const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
				artwork = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
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
			artwork = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
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
		nom_courant: movement?.nom || 'Art Movement',
		oklch_token: movement?.oklch_token || 'var(--movement-theme)',
		anecdote_accroche: content?.anecdote_accroche || 'Explore the profound story and composition of this timeless piece.',
		anecdote_technique: content?.anecdote_technique || 'Analyze the technical mastery, color harmony, and historical significance.',
		anecdote_secrete: content?.anecdote_secrete || 'Uncover the hidden details and historical anecdotes behind this creation.',
		qcm: content?.qcm || {
			question: `What artistic era or period characterizes "${artwork.titre}"?`,
			options: [movement?.nom || 'Historical Period', 'Surrealism', 'Cubism', 'Baroque'],
			correctIndex: 0,
			explanation: `"${artwork.titre}" by ${artwork.artiste} exemplifies ${movement?.nom || 'Historical Period'}.`
		}
	};

	return {
		lesson,
		progress
	};
};
