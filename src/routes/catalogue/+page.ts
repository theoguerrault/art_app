import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, UserProgress } from '$lib/types/database';
import { sanitizeArtworks } from '$lib/utils/artworks';

export const ssr = false;

export const load: PageLoad = async () => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let artworks: Partial<Artwork>[] = [];
	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let favoritesList: number[] = [];

	if (!isOnline) {
		const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
		artworks = fullArtworks.map((a) => ({
			id: a.id,
			slug: a.slug,
			id_courant: a.id_courant,
			id_artiste: a.id_artiste,
			titre: a.titre,
			artistes: a.artistes || ({ nom: 'Inconnu' } as any),
			date_creation: a.date_creation,
			image_url_thumb: a.image_url_thumb || a.image_url_full,
			aspect_ratio: a.aspect_ratio
		}));
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
		const favCache = await readFromLocalCache('user_favorites_cache', 'favorites');
		favoritesList = favCache ? favCache.data : [];
	} else {
		try {
			// Query specific lightweight fields under 10 KB to optimize network payloads
			const [artworksRes, movementsRes, progressRes, favoritesRes] = await Promise.all([
				supabase.from('oeuvres').select('id, slug, id_courant, id_artiste, date_creation, image_url_thumb, aspect_ratio, artistes(artiste_translations(nom)), oeuvre_translations(titre)')
					.eq('is_active', true),
				supabase.from('courants').select('*, courant_translations(nom)').order('ordre_chronologique', { ascending: true }),
				supabase.from('user_artwork_progress').select('id_oeuvre, box_level, consecutive_correct'),
				fetch('/api/favorites').then((res) => (res.ok ? res.json() : { favorites: [] }))
			]);

			if (artworksRes.data && artworksRes.data.length > 0) {
				artworks = sanitizeArtworks(artworksRes.data.map((a: any) => ({ ...a, titre: a.oeuvre_translations?.[0]?.titre || 'Inconnu', artistes: { nom: a.artistes?.artiste_translations?.[0]?.nom || 'Inconnu' } })) as unknown as Partial<Artwork>[]);
			} else {
				const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
				artworks = fullArtworks.map((a) => ({
					...a,
					artistes: a.artistes || ({ nom: 'Inconnu' } as any)
				}));
			}

			if (movementsRes.data) {
				movements = movementsRes.data.map((m: any) => ({ ...m, nom: m.courant_translations?.[0]?.nom || 'Inconnu' }));
			}

			if (progressRes.data) {
				progressList = progressRes.data as unknown as UserProgress[];
				await saveToLocalCache('user_progress_cache', progressList);
			} else {
				progressList = (await readFromLocalCache('user_progress_cache')) || [];
			}

			if (favoritesRes && favoritesRes.favorites) {
				favoritesList = favoritesRes.favorites;
				await saveToLocalCache('user_favorites_cache', { id: 'favorites', data: favoritesList });
			} else {
				const favCache = await readFromLocalCache('user_favorites_cache', 'favorites');
				favoritesList = favCache ? favCache.data : [];
			}
		} catch (err) {
			console.warn('[CatalogLoad] Supabase query error, falling back to cache:', err);
			const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
			artworks = fullArtworks.map((a) => ({
				...a,
				artistes: a.artistes || ({ nom: 'Inconnu' } as any),
				courants: (a as any).courants || { nom: 'Inconnu' }
			}));
			progressList = (await readFromLocalCache('user_progress_cache')) || [];
			const favCache = await readFromLocalCache('user_favorites_cache', 'favorites');
			favoritesList = favCache ? favCache.data : [];
		}
	}

	return {
		artworks,
		movements,
		progressList,
		favoritesList
	};
};
