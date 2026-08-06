import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, UserProgress } from '$lib/types/database';
import { sanitizeArtworks } from '$lib/utils/artworks';
import { getLocalizedText } from '$lib/utils/i18n';

// The catalogue is fully user-specific (progress, favorites). Disabling SSR
// avoids a Supabase client cold-start that would block TTFB by several seconds.
export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	let artworks: Partial<Artwork>[] = [];
	let movements: Movement[] = [];
	let progressList: UserProgress[] = [];
	let favoritesList: number[] = [];
	let likesList: number[] = [];
	let dislikesList: number[] = [];


	if (!isOnline) {
		const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
		const sortedArtworks = fullArtworks.sort((a, b) => {
			if (a.movement_id !== b.movement_id) return (a.movement_id || 0) - (b.movement_id || 0);
			if ((a.creation_date || '') !== (b.creation_date || '')) {
				return (a.creation_date || '') > (b.creation_date || '') ? 1 : -1;
			}
			return (a.id || 0) - (b.id || 0);
		});
		artworks = sortedArtworks.map((a) => ({
			id: a.id,
			slug: a.slug,
			movement_id: a.movement_id,
			artist_id: a.artist_id,
			title: a.title,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			artists: a.artists || ({ name: 'Inconnu' } as any),
			creation_date: a.creation_date,
			image_url_thumb: a.image_url_thumb || a.image_url_full,
			aspect_ratio: a.aspect_ratio
		}));
		progressList = (await readFromLocalCache('user_progress_cache')) || [];
		const favCache = await readFromLocalCache('user_favorites_cache', 'favorites');
		favoritesList = favCache ? favCache.data : [];
	} else {
		try {
			const [artworksRes, movementsRes, progressRes, favoritesRes, reactionsRes] = await Promise.all([
				supabase.from('artworks').select('id, slug, movement_id, artist_id, creation_date, image_url_full, image_url_thumb, aspect_ratio, artists(artist_translations(name, language_code)), artwork_translations(title, language_code)')
					.eq('is_active', true)
					.order('movement_id', { ascending: true })
					.order('creation_date', { ascending: true })
					.order('id', { ascending: true }),
				supabase.from('movements').select('*, movement_translations(name, language_code)').order('chronological_order', { ascending: true }),
				supabase.from('user_artwork_progress').select('artwork_id, box_level, consecutive_correct'),
				fetch('/api/favorites').then((res) => (res.ok ? res.json() : { favorites: [] })),
				fetch('/api/reactions').then((res) => (res.ok ? res.json() : { likes: [], dislikes: [] }))
			]);


			if (artworksRes.data && artworksRes.data.length > 0) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				artworks = sanitizeArtworks(artworksRes.data.map((a: any) => ({ ...a, title: getLocalizedText(a.artwork_translations, 'title') || 'Inconnu', artists: { name: getLocalizedText(a.artists?.artist_translations, 'name') || 'Inconnu' } })) as unknown as Partial<Artwork>[]);
			} else {
				const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
				const sortedArtworks = fullArtworks.sort((a, b) => {
					if (a.movement_id !== b.movement_id) return (a.movement_id || 0) - (b.movement_id || 0);
					return (a.creation_date || '') > (b.creation_date || '') ? 1 : -1;
				});
				artworks = sortedArtworks.map((a) => ({
					...a,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					artists: a.artists || ({ name: 'Inconnu' } as any)
				}));
			}

			if (movementsRes.data) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				movements = movementsRes.data.map((m: any) => ({ ...m, name: getLocalizedText(m.movement_translations, 'name') || 'Inconnu' }));
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

			if (reactionsRes && reactionsRes.likes) {
				likesList = reactionsRes.likes;
				dislikesList = reactionsRes.dislikes || [];
			}

		} catch (err) {
			const fullArtworks: Artwork[] = sanitizeArtworks((await readFromLocalCache('cached_artworks')) || []);
			const sortedArtworks = fullArtworks.sort((a, b) => {
				if (a.movement_id !== b.movement_id) return (a.movement_id || 0) - (b.movement_id || 0);
				return (a.creation_date || '') > (b.creation_date || '') ? 1 : -1;
			});
			artworks = sortedArtworks.map((a) => ({
				...a,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				artists: a.artists || ({ name: 'Inconnu' } as any),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				movements: (a as any).movements || { name: 'Inconnu' }
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
		favoritesList,
		likesList,
		dislikesList
	};

};
