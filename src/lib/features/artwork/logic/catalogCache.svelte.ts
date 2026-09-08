import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, UserProgress } from '$lib/types/database';
import { sanitizeArtworks } from '$lib/utils/artworks';
import { getLocalizedText } from '$lib/utils/i18n';

export interface CatalogData {
	artworks: Partial<Artwork>[];
	movements: Movement[];
	progressList: UserProgress[];
	favoritesList: number[];
	likesList: number[];
	dislikesList: number[];
}

let memoryCatalogCache: CatalogData | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory freshness before background revalidation
let isFetchingPromise: Promise<CatalogData> | null = null;

/**
 * Normalizes and formats raw database artworks into partial Artwork objects for catalogue view.
 */
function processArtworksData(rawArtworks: unknown[]): Partial<Artwork>[] {
	if (!rawArtworks || rawArtworks.length === 0) return [];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const formatted = rawArtworks.map((a: any) => ({
		...a,
		title: getLocalizedText(a.artwork_translations, 'title') || a.title || 'Inconnu',
		artists: {
			name: getLocalizedText(a.artists?.artist_translations, 'name') || a.artists?.name || 'Inconnu'
		}
	}));
	return sanitizeArtworks(formatted) as unknown as Partial<Artwork>[];
}

/**
 * Loads catalogue data from local IndexedDB cache.
 */
async function loadCatalogFromLocalCache(): Promise<CatalogData> {
	const rawCachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
	const fullArtworks: Artwork[] = sanitizeArtworks(rawCachedArtworks);

	const sortedArtworks = fullArtworks.sort((a, b) => {
		if (a.movement_id !== b.movement_id) return (a.movement_id || 0) - (b.movement_id || 0);
		if ((a.creation_date || '') !== (b.creation_date || '')) {
			return (a.creation_date || '') > (b.creation_date || '') ? 1 : -1;
		}
		return (a.id || 0) - (b.id || 0);
	});

	const artworks: Partial<Artwork>[] = sortedArtworks.map((a) => ({
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

	const progressList: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];
	const favCache = await readFromLocalCache('user_favorites_cache', 'favorites');
	const favoritesList: number[] = favCache ? favCache.data : [];

	// Build unique movements from cached artworks if not separately stored
	const movementsMap = new Map<number, Movement>();
	for (const art of fullArtworks) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const artWithMov = art as any;
		if (artWithMov.movement_id && artWithMov.movements) {
			movementsMap.set(artWithMov.movement_id, {
				id: artWithMov.movement_id,
				slug: artWithMov.movements.slug || '',
				name: artWithMov.movements.name || 'Mouvement',
				century: artWithMov.movements.century || '',
				oklch_token: artWithMov.movements.oklch_token || 'var(--color-primary)',
				chronological_order: artWithMov.movement_id,
				created_at: new Date().toISOString()
			});
		}
	}
	const movements = Array.from(movementsMap.values()).sort((a, b) => (a.chronological_order || 0) - (b.chronological_order || 0));

	return {
		artworks,
		movements,
		progressList,
		favoritesList,
		likesList: [],
		dislikesList: []
	};
}

/**
 * Performs network fetch for catalog data and updates both memory and IndexedDB caches.
 */
async function fetchRemoteCatalogData(customFetch: typeof fetch = fetch): Promise<CatalogData> {
	const [artworksRes, movementsRes, progressRes, favoritesRes, reactionsRes] = await Promise.all([
		supabase
			.from('artworks')
			.select('id, slug, movement_id, artist_id, creation_date, image_url_full, image_url_thumb, aspect_ratio, artists(artist_translations(name, language_code)), artwork_translations(title, language_code)')
			.eq('is_active', true)
			.order('movement_id', { ascending: true })
			.order('creation_date', { ascending: true })
			.order('id', { ascending: true }),
		supabase
			.from('movements')
			.select('*, movement_translations(name, language_code)')
			.order('chronological_order', { ascending: true }),
		supabase.from('user_artwork_progress').select('artwork_id, box_level, consecutive_correct'),
		customFetch('/api/favorites').then((res) => (res.ok ? res.json() : { favorites: [] })).catch(() => ({ favorites: [] })),
		customFetch('/api/reactions').then((res) => (res.ok ? res.json() : { likes: [], dislikes: [] })).catch(() => ({ likes: [], dislikes: [] }))
	]);

	let artworks: Partial<Artwork>[] = [];
	if (artworksRes.data && artworksRes.data.length > 0) {
		artworks = processArtworksData(artworksRes.data);
	} else if (memoryCatalogCache?.artworks.length) {
		artworks = memoryCatalogCache.artworks;
	} else {
		const local = await loadCatalogFromLocalCache();
		artworks = local.artworks;
	}

	let movements: Movement[] = [];
	if (movementsRes.data && movementsRes.data.length > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		movements = movementsRes.data.map((m: any) => ({
			...m,
			name: getLocalizedText(m.movement_translations, 'name') || m.slug || 'Inconnu'
		}));
	} else if (memoryCatalogCache?.movements.length) {
		movements = memoryCatalogCache.movements;
	}

	let progressList: UserProgress[] = [];
	if (progressRes.data) {
		progressList = progressRes.data as unknown as UserProgress[];
		void saveToLocalCache('user_progress_cache', progressList);
	} else if (memoryCatalogCache?.progressList) {
		progressList = memoryCatalogCache.progressList;
	}

	let favoritesList: number[] = [];
	if (favoritesRes && Array.isArray(favoritesRes.favorites)) {
		favoritesList = favoritesRes.favorites;
		void saveToLocalCache('user_favorites_cache', { id: 'favorites', data: favoritesList });
	} else if (memoryCatalogCache?.favoritesList) {
		favoritesList = memoryCatalogCache.favoritesList;
	}

	const likesList: number[] = reactionsRes?.likes || memoryCatalogCache?.likesList || [];
	const dislikesList: number[] = reactionsRes?.dislikes || memoryCatalogCache?.dislikesList || [];

	const result: CatalogData = {
		artworks,
		movements,
		progressList,
		favoritesList,
		likesList,
		dislikesList
	};

	memoryCatalogCache = result;
	lastFetchedTime = Date.now();
	return result;
}

/**
 * Returns catalog data instantly from memory/IndexedDB if available (SWR),
 * and triggers background revalidation without blocking client navigation.
 */
export async function getCatalogData(customFetch: typeof fetch = fetch, forceRefresh = false): Promise<CatalogData> {
	const now = Date.now();
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

	// 1. If we have fresh in-memory data and not forced, return synchronously/instantaneously
	if (memoryCatalogCache && memoryCatalogCache.artworks.length > 0 && !forceRefresh) {
		if (isOnline && now - lastFetchedTime > CACHE_TTL_MS) {
			// Trigger background revalidation non-blocking
			if (!isFetchingPromise) {
				isFetchingPromise = fetchRemoteCatalogData(customFetch).finally(() => {
					isFetchingPromise = null;
				});
			}
		}
		return memoryCatalogCache;
	}

	// 2. If offline, read IndexedDB directly
	if (!isOnline) {
		const localData = await loadCatalogFromLocalCache();
		memoryCatalogCache = localData;
		return localData;
	}

	// 3. If in-memory is empty but IndexedDB has cached artworks, use local cache immediately for 0ms transition
	// and revalidate in background
	if (!memoryCatalogCache) {
		const localData = await loadCatalogFromLocalCache();
		if (localData.artworks.length > 0) {
			memoryCatalogCache = localData;
			// Kick off remote fetch in the background to update cache without blocking page load
			if (!isFetchingPromise) {
				isFetchingPromise = fetchRemoteCatalogData(customFetch).finally(() => {
					isFetchingPromise = null;
				});
			}
			return localData;
		}
	}

	// 4. First time cold start with no local cache: fetch over network
	if (!isFetchingPromise) {
		isFetchingPromise = fetchRemoteCatalogData(customFetch).finally(() => {
			isFetchingPromise = null;
		});
	}
	return isFetchingPromise;
}

/**
 * Finds an artwork from the active catalogue cache (for instant detail page navigation).
 */
export function getCachedArtworkByIdOrSlug(slugOrId: string): Partial<Artwork> | null {
	if (!memoryCatalogCache || !memoryCatalogCache.artworks) return null;
	const isNumeric = /^\d+$/.test(slugOrId);
	const targetId = isNumeric ? parseInt(slugOrId, 10) : null;

	return (
		memoryCatalogCache.artworks.find(
			(a) => (targetId !== null && a.id === targetId) || a.slug === slugOrId
		) || null
	);
}
