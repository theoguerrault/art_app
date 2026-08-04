import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, ContentArtwork, UserProgress, ActiveLessonView, RawArtwork, RawCourant, RawContentArtwork } from '$lib/types/database';
import { sanitizeArtwork } from '$lib/utils/artworks';

export interface GlossaryContent {
	artiste_description?: string;
	courant_description?: string;
}

export const load: PageLoad = async ({ params }) => {
	const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
	const slugOrId = params.slug;

	let artwork: Artwork | null = null;
	let movement: Movement | null = null;
	let content: ContentArtwork | null = null;
	let progress: UserProgress | null = null;

	if (!isOnline) {
		const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
		const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
		artwork = found ? sanitizeArtwork(found) : null;

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
			let query = supabase.from('oeuvres').select('*, artistes(artiste_translations(nom)), oeuvre_translations(titre)').eq('is_active', true);
			if (isNumeric) {
				query = query.eq('id', parseInt(slugOrId, 10));
			} else {
				query = query.eq('slug', slugOrId);
			}

			const { data: artData } = await query.maybeSingle();

			if (artData) {
				const typedArtData = artData as RawArtwork;
				if (typedArtData.oeuvre_translations?.[0]?.titre) {
					typedArtData.titre = typedArtData.oeuvre_translations[0].titre;
				}
				if (typedArtData.artistes) {
					const artisteName = typedArtData.artistes.artiste_translations?.[0]?.nom;
					if (artisteName) {
						typedArtData.artistes.nom = artisteName;
					}
				}
				artwork = sanitizeArtwork(artData);
			} else {
				const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
				const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
				artwork = found ? sanitizeArtwork(found) : null;
			}

			if (artwork) {
				const [movRes, contRes, progRes, contArtisteRes, contCourantRes] = await Promise.all([
					supabase.from('courants').select('id, slug, oklch_token, courant_translations(nom)').eq('id', artwork.id_courant).maybeSingle(),
					supabase.from('oeuvre_translations').select('id_oeuvre, introduction, article_principal, article_portions, qcm, verification_status').eq('id_oeuvre', artwork.id).eq('language_code', 'fr').maybeSingle(),
					supabase.from('user_artwork_progress').select('id_oeuvre, box_level, next_review_at').eq('id_oeuvre', artwork.id).maybeSingle(),
					supabase.from('artiste_translations').select('id_artiste, description_courte').eq('id_artiste', artwork.id_artiste).eq('language_code', 'fr').eq('verification_status', 'VERIFIED').maybeSingle(),
					supabase.from('courant_translations').select('id_courant, description_courte').eq('id_courant', artwork.id_courant).eq('language_code', 'fr').eq('verification_status', 'VERIFIED').maybeSingle()
				]);

				if (movRes.data) {
					movement = { ...(movRes.data as RawCourant), nom: (movRes.data as RawCourant).courant_translations?.[0]?.nom || (movRes.data as RawCourant).slug } as unknown as Movement;
				} else {
					movement = null;
				}
				content = (contRes.data as unknown as ContentArtwork) || null;
				progress = (progRes.data as unknown as UserProgress) || null;
				
				// Attached Glossary Content
				artwork.glossary = {
					artiste_description: ((contArtisteRes.data || {}) as Record<string, unknown>)?.description_courte as string || null,
					courant_description: ((contCourantRes.data || {}) as Record<string, unknown>)?.description_courte as string || null
				};

				if (content) {
					const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
					const filtered = cachedMcqs.filter((c) => c.id_oeuvre !== artwork?.id);
					filtered.push(content);
					await saveToLocalCache('cached_mcqs', filtered);
				}
			}
		} catch (err) {
			void('[DetailLoad] Supabase query failed, checking cache:', err);
			const cachedArtworks: Artwork[] = (await readFromLocalCache('cached_artworks')) || [];
			const found = cachedArtworks.find((a) => a.slug === slugOrId || a.id.toString() === slugOrId) || null;
			artwork = found ? sanitizeArtwork(found) : null;
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

	let fullArticle = content?.article_principal || '';
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
		nom_courant: movement?.nom || 'Mouvement Artistique',
		oklch_token: movement?.oklch_token || 'var(--movement-theme)',
		introduction: (content as RawContentArtwork)?.introduction || null,
		verification_status: (content as RawContentArtwork)?.verification_status || null,
		article_principal: fullArticle.trim() || 'Explorez l\'histoire profonde et la composition de cette pièce intemporelle.',
		article_portions: (content as RawContentArtwork)?.article_portions || [],
		qcm: content?.qcm || {
			question: `Quelle ère ou période artistique caractérise "${artwork.titre}" ?`,
			options: [movement?.nom || 'Période historique', 'Surréalisme', 'Cubisme', 'Baroque'],
			correctIndex: 0,
			explanation: `"${artwork.titre}" par ${artwork.artistes?.nom || 'Inconnu'} illustre parfaitement ${movement?.nom || 'Période historique'}.`
		},
		mots_cles: content?.mots_cles || [],
		glossary: artwork.glossary || {}
	} as ActiveLessonView & { glossary?: GlossaryContent; article_portions?: { title?: string; text: string; type?: string }[] };

	return {
		lesson,
		progress
	};
};
