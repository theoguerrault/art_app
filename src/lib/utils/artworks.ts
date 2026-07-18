import type { Artwork } from '$lib/types/database';

const AUTHENTIC_URLS: Record<string, { full: string; thumb: string }> = {
	'mona-lisa': {
		full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=1280',
		thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=500'
	},
	'water-lilies': {
		full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg?width=1280',
		thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg?width=500'
	},
	'the-starry-night': {
		full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=1280',
		thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=500'
	},
	'a-sunday-on-la-grande-jatte': {
		full: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg?width=1280',
		thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg?width=500'
	}
};

/**
 * Sanitizes and corrects artwork image URLs using canonical Special:FilePath endpoints.
 * Ensures the UI always displays authentic masterpieces even with stale cache or un-reseeded DB.
 */
export function sanitizeArtwork<T extends Partial<Artwork>>(art: T): T {
	if (!art || !art.slug) return art;

	const authentic = AUTHENTIC_URLS[art.slug];
	if (authentic) {
		return {
			...art,
			image_url_full: authentic.full,
			image_url_thumb: authentic.thumb
		};
	}
	return art;
}

export function sanitizeArtworks<T extends Partial<Artwork>>(artworks: T[] | null | undefined): T[] {
	if (!artworks || !Array.isArray(artworks)) return [];
	return artworks.map((art) => sanitizeArtwork(art));
}
