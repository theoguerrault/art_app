import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, ContentArtwork, UserProgress, ActiveLessonView, RawArtwork, RawCourant, RawContentArtwork } from '$lib/types/database';
import { sanitizeArtwork } from '$lib/utils/artworks';

export interface GlossaryContent {
	artist_description?: string;
	movement_description?: string;
}

export const load: PageLoad = async ({ params, fetch }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
	const slugOrId = params.slug;

	let artwork: Artwork | null = null;
	let movement: Movement | null = null;
	let content: ContentArtwork | null = null;
	let progress: UserProgress | null = null;
	let currentReaction: 'like' | 'dislike' | null = null;


	if (!isOnline) {
		const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
		artwork = found ? sanitizeArtwork(found) : null;

		if (artwork) {
			const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
			content = cachedMcqs.find((c) => c.artwork_id === artwork?.id) || null;

			const cachedProgress: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];
			progress = cachedProgress.find((p) => p.artwork_id === artwork?.id) || null;
		}
	} else {
		try {
			// Query by slug or id
			const isNumeric = /^\d+$/.test(slugOrId);
			let query = supabase.from('artworks').select('*, artists(dates, artist_translations(name)), artwork_translations(title)').eq('is_active', true);
			if (isNumeric) {
				query = query.eq('id', parseInt(slugOrId, 10));
			} else {
				query = query.eq('slug', slugOrId);
			}

			const { data: artData, error: dbErr } = await query.maybeSingle();
			if (dbErr) console.error("Database error fetching artwork:", dbErr);

			if (artData) {
				const typedArtData = artData as RawArtwork;
				if (typedArtData.artwork_translations?.[0]?.title) {
					typedArtData.title = typedArtData.artwork_translations[0].title;
				}
				if (typedArtData.artists) {
					const artisteName = typedArtData.artists.artist_translations?.[0]?.name;
					if (artisteName) {
						typedArtData.artists.name = artisteName;
					}
				}
				artwork = sanitizeArtwork(typedArtData) as Artwork;
			} else {
				throw error(500, `Debug: artData is null for slugOrId='${slugOrId}', isNumeric=${isNumeric}, isOnline=${isOnline}`);
			}

			if (artwork) {
				const [movRes, contRes, progRes, contArtisteRes, contCourantRes, reactionsData] = await Promise.all([
					supabase.from('movements').select('id, slug, century, oklch_token, movement_translations(name)').eq('id', artwork.movement_id).maybeSingle(),
					supabase.from('artwork_translations').select('artwork_id, introduction, main_article, article_portions, verification_status').eq('artwork_id', artwork.id).eq('language_code', 'fr').maybeSingle(),
					supabase.from('user_artwork_progress').select('artwork_id, box_level, next_review_at').eq('artwork_id', artwork.id).maybeSingle(),
					supabase.from('artist_translations').select('artist_id, short_description').eq('artist_id', artwork.artist_id).eq('language_code', 'fr').eq('verification_status', 'VERIFIED').maybeSingle(),
					supabase.from('movement_translations').select('movement_id, short_description').eq('movement_id', artwork.movement_id).eq('language_code', 'fr').eq('verification_status', 'VERIFIED').maybeSingle(),
					fetch('/api/reactions').then((r) => r.ok ? r.json() : { likes: [], dislikes: [] }).catch(() => ({ likes: [], dislikes: [] }))
				]);



				if (movRes.data) {
					movement = { ...(movRes.data as RawCourant), name: (movRes.data as RawCourant).movement_translations?.[0]?.name || (movRes.data as RawCourant).slug } as unknown as Movement;
				} else {
					movement = null;
				}
				content = (contRes.data as unknown as ContentArtwork) || null;
				progress = (progRes.data as unknown as UserProgress) || null;
				const artworkId = artwork.id;
				const likes: number[] = (reactionsData as { likes?: number[]; dislikes?: number[] })?.likes || [];
				const dislikes: number[] = (reactionsData as { likes?: number[]; dislikes?: number[] })?.dislikes || [];
				currentReaction = likes.includes(artworkId) ? 'like' : dislikes.includes(artworkId) ? 'dislike' : null;



				
				// Attached Glossary Content
				artwork.glossary = {
					artist_description: ((contArtisteRes.data || {}) as Record<string, unknown>)?.short_description as string || null,
					movement_description: ((contCourantRes.data || {}) as Record<string, unknown>)?.short_description as string || null,
					artist_dates: artwork.artists?.dates || null,
					movement_century: movement?.century || null
				};

				if (content) {
					const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
					// Filter out both the current artwork AND any corrupted items without artwork_id
					const filtered = cachedMcqs.filter((c) => c && c.artwork_id && c.artwork_id !== artwork?.id);
					// Ensure content itself has an artwork_id before pushing (maybeSingle() guarantees object, but just in case)
					if (content.artwork_id) {
						filtered.push(content);
						try {
							await saveToLocalCache('cached_mcqs', filtered);
						} catch (e) {
						}
					}
				}
			}
		} catch (err) {
			const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
			artwork = found ? sanitizeArtwork(found) : null;
			if (artwork) {
				const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
				content = cachedMcqs.find((c) => c.artwork_id === artwork?.id) || null;
				const cachedProgress: UserProgress[] = (await readFromLocalCache('user_progress_cache')) || [];
				progress = cachedProgress.find((p) => p.artwork_id === artwork?.id) || null;
			}
		}
	}

	if (!artwork) {
		throw error(404, 'Artwork not found');
	}

	let fullArticle = content?.main_article || '';
	if ((content as RawContentArtwork)?.introduction) {
		fullArticle = `**${(content as RawContentArtwork).introduction}**\n\n${fullArticle}`;
	}
	if ((content as RawContentArtwork)?.article_portions && Array.isArray((content as RawContentArtwork).article_portions)) {
		const portions = (content as RawContentArtwork).article_portions!
			.filter((p: { title?: string; text: string; type?: string }) => p.text)
			.map((p: { title?: string; text: string; type?: string }) => p.title ? `### ${p.title}\n${p.text}` : p.text)
			.join('\n\n');
		if (portions) {
			fullArticle = `${fullArticle}\n\n${portions}`;
		}
	}

	const lesson: ActiveLessonView = {
		...artwork,
		movement_name: movement?.name || 'Mouvement Artistique',
		movement_century: movement?.century || null,
		oklch_token: movement?.oklch_token || 'var(--movement-theme)',
		introduction: (content as RawContentArtwork)?.introduction || null,
		verification_status: (content as RawContentArtwork)?.verification_status || null,
		main_article: fullArticle.trim() || 'Explorez l\'histoire profonde et la composition de cette pièce intemporelle.',
		article_portions: (content as RawContentArtwork)?.article_portions || [],
		glossary: artwork.glossary || {}
	} as ActiveLessonView & { glossary?: GlossaryContent; article_portions?: { title?: string; text: string; type?: string }[] };

	return {
		lesson,
		progress,
		currentReaction
	};


};
