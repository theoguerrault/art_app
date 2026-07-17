import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, UserProgress } from '$lib/types/database';

export const ssr = false;

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let artworks: Partial<Artwork>[] = [];
	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];

	if (!isOnline) {
		const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		artworks = fullArtworks.map((a) => ({
			id: a.id,
			slug: a.slug,
			id_courant: a.id_courant,
			titre: a.titre,
			artiste: a.artiste,
			date_creation: a.date_creation,
			image_url_thumb: a.image_url_thumb || a.image_url_full,
			aspect_ratio: a.aspect_ratio
		}));
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
	} else {
		try {
			// Query specific lightweight fields under 10 KB to optimize network payloads
			const [artworksRes, movementsRes, progressRes] = await Promise.all([
				supabase
					.from('oeuvres')
					.select('id, slug, id_courant, titre, artiste, date_creation, image_url_thumb, aspect_ratio')
					.eq('is_active', true),
				supabase.from('courants').select('*').order('ordre_chronologique', { ascending: true }),
				supabase.from('user_artwork_progress').select('id_oeuvre, box_level, consecutive_correct')
			]);

			if (artworksRes.data && artworksRes.data.length > 0) {
				artworks = artworksRes.data as unknown as Partial<Artwork>[];
			} else {
				const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
				artworks = fullArtworks.map((a) => ({
					id: a.id,
					slug: a.slug,
					id_courant: a.id_courant,
					titre: a.titre,
					artiste: a.artiste,
					date_creation: a.date_creation,
					image_url_thumb: a.image_url_thumb || a.image_url_full,
					aspect_ratio: a.aspect_ratio
				}));
			}

			if (movementsRes.data) {
				movements = movementsRes.data;
			}

			if (progressRes.data) {
				progressList = progressRes.data as unknown as UserProgress[];
				await saveToLocalCache('user_progress_cache', progressList);
			} else {
				progressList = (await readFromLocalCache('user_progress_cache')) || [];
			}
		} catch (err) {
			console.warn('[CatalogLoad] Supabase query error, falling back to cache:', err);
			const fullArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			artworks = fullArtworks.map((a) => ({
				id: a.id,
				slug: a.slug,
				id_courant: a.id_courant,
				titre: a.titre,
				artiste: a.artiste,
				date_creation: a.date_creation,
				image_url_thumb: a.image_url_thumb || a.image_url_full,
				aspect_ratio: a.aspect_ratio
			}));
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
		}
	}

	return {
		artworks,
		movements,
		progressList
	};
};
