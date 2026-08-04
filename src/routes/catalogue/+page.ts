import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, UserProgress } from '$lib/types/database';
import { sanitizeArtworks } from '$lib/utils/artworks';

// The catalogue is fully user-specific (progress, favorites). Disabling SSR
// avoids a Supabase client cold-start that would block TTFB by several seconds.
export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let artworks: Partial<Artwork>[] = [];
	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let favoritesList: number[] = [];

	if (!isOnline) {
		const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
		const sortedArtworks = fullArtworks.sort((a, b) => {
			if (a.id_courant !== b.id_courant) return (a.id_courant || 0) - (b.id_courant || 0);
			return (a.date_creation || '') > (b.date_creation || '') ? 1 : -1;
		});
		artworks = sortedArtworks.map((a) => ({
			id: a.id,
			slug: a.slug,
			id_courant: a.id_courant,
			id_artiste: a.id_artiste,
			titre: a.titre,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			const [artworksRes, movementsRes, progressRes, favoritesRes] = await Promise.all([
				supabase.from('oeuvres').select('id, slug, id_courant, id_artiste, date_creation, image_url_thumb, aspect_ratio, artistes(artiste_translations(nom)), oeuvre_translations(titre)')
					.eq('is_active', true)
					.order('id_courant', { ascending: true })
					.order('date_creation', { ascending: true }),
				supabase.from('courants').select('*, courant_translations(nom)').order('ordre_chronologique', { ascending: true }),
				supabase.from('user_artwork_progress').select('id_oeuvre, box_level, consecutive_correct'),
				fetch('/api/favorites').then((res) => (res.ok ? res.json() : { favorites: [] }))
			]);

			if (artworksRes.data && artworksRes.data.length > 0) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				artworks = sanitizeArtworks(artworksRes.data.map((a: any) => ({ ...a, titre: a.oeuvre_translations?.[0]?.titre || 'Inconnu', artistes: { nom: a.artistes?.artiste_translations?.[0]?.nom || 'Inconnu' } })) as unknown as Partial<Artwork>[]);
			} else {
				const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
				const sortedArtworks = fullArtworks.sort((a, b) => {
					if (a.id_courant !== b.id_courant) return (a.id_courant || 0) - (b.id_courant || 0);
					return (a.date_creation || '') > (b.date_creation || '') ? 1 : -1;
				});
				artworks = sortedArtworks.map((a) => ({
					...a,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					artistes: a.artistes || ({ nom: 'Inconnu' } as any)
				}));
			}

			if (movementsRes.data) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			void('[CatalogLoad] Supabase query error, falling back to cache:', err);
			const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
			const sortedArtworks = fullArtworks.sort((a, b) => {
				if (a.id_courant !== b.id_courant) return (a.id_courant || 0) - (b.id_courant || 0);
				return (a.date_creation || '') > (b.date_creation || '') ? 1 : -1;
			});
			artworks = sortedArtworks.map((a) => ({
				...a,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				artistes: a.artistes || ({ nom: 'Inconnu' } as any),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
