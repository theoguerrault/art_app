import type { PageLoad } from './$types';
import { getCatalogData } from '$lib/features/artwork/logic/catalogCache.svelte';

// The catalogue is fully user-specific (progress, favorites). Disabling SSR
// avoids a Supabase client cold-start that would block TTFB by several seconds.
export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	const catalogData = await getCatalogData(fetch);

	return {
		artworks: catalogData.artworks,
		movements: catalogData.movements,
		progressList: catalogData.progressList,
		favoritesList: catalogData.favoritesList,
		likesList: catalogData.likesList,
		dislikesList: catalogData.dislikesList
	};
};

