import type { Artwork } from '$lib/types/database';
import { parseMarkdown } from '$lib/utils/markdown';
import md5 from 'md5';

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
 * Intelligently optimizes an image URL depending on its provider.
 * For Wikipedia `Special:FilePath`, it ensures a `width` parameter is added so we fetch
 * a smaller thumbnail instead of the massive original file (often 50MB+).
 */
function getOptimizedImageUrl(url: string | null | undefined, targetWidth: number): string | null {
	if (!url) return null;

	try {
		const parsed = new URL(url);

		// Optimize Wikimedia Special:FilePath URLs by calculating the direct thumbnail URL
		if (parsed.hostname.includes('wikimedia.org') && parsed.pathname.includes('Special:FilePath')) {
			// Extract filename from the URL, decode URL encoding, and replace spaces with underscores
			const rawFilename = parsed.pathname.split('/').pop() || '';
			const filename = decodeURIComponent(rawFilename).replace(/ /g, '_');
			
			// Wikimedia Commons uses MD5 of the filename for folder sharding
			const hash = md5(filename);
			const a = hash.substring(0, 1);
			const a2 = hash.substring(0, 2);
			
			// Build the direct thumbnail URL, bypassing the slow 302 Redirect
			const encodedFilename = encodeURIComponent(filename);
			return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${a2}/${encodedFilename}/${targetWidth}px-${encodedFilename}`;
		}

		// (Future) Add more providers like Supabase storage here...

		return url;
	} catch (e) {
		// If the URL is invalid, just return it as is
		return url;
	}
}

/**
 * Sanitizes and corrects artwork image URLs.
 * Ensures the UI always displays authentic masterpieces even with stale cache or un-reseeded DB.
 * It also dynamically optimizes ANY artwork image URL for performance.
 */
export function sanitizeArtwork<T extends Partial<Artwork>>(art: T): T {
	if (!art || !art.slug) return art;

	// First, prioritize our hardcoded authentic high-quality overrides
	const authentic = AUTHENTIC_URLS[art.slug];
	if (authentic) {
		return {
			...art,
			image_url_full: getOptimizedImageUrl(authentic.full, 1280) || authentic.full,
			image_url_thumb: getOptimizedImageUrl(authentic.thumb, 500) || authentic.thumb
		};
	}

	// If it's a dynamic artwork from DB, optimize its raw URLs
	const sanitized = {
		...art,
		image_url_full: getOptimizedImageUrl(art.image_url_full, 1280) || art.image_url_full,
		image_url_thumb: getOptimizedImageUrl(art.image_url_thumb || art.image_url_full, 500) || art.image_url_thumb || art.image_url_full
	};

	// Parse Markdown on the server to avoid shipping `marked` library to the client
	const anySanitized = sanitized as any;
	if (anySanitized.introduction) {
		anySanitized.introduction = parseMarkdown(anySanitized.introduction);
	}
	if (anySanitized.main_article) {
		anySanitized.main_article = parseMarkdown(anySanitized.main_article);
	}
	if (anySanitized.portions && Array.isArray(anySanitized.portions)) {
		anySanitized.portions = anySanitized.portions.map((p: any) => ({
			...p,
			text: p.text ? parseMarkdown(p.text) : p.text
		}));
	}

	return anySanitized as T;
}

export function sanitizeArtworks<T extends Partial<Artwork>>(artworks: T[] | null | undefined): T[] {
	if (!artworks || !Array.isArray(artworks)) return [];
	return artworks.map((art) => sanitizeArtwork(art));
}
