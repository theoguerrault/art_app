import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { readFromLocalCache, saveToLocalCache } from '$lib/offline/storage';
import type { Artwork, Movement, ContentArtwork, UserProgress, ActiveLessonView } from '$lib/types/database';
import { sanitizeArtwork } from '$lib/utils/artworks';

export interface GlossaryContent {
	artiste_description?: string;
	courant_description?: string;
}

export const ssr = false;

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

			const { data: artData, error: artError } = await query.maybeSingle();

			if (artData) {
				if ((artData as any).oeuvre_translations?.[0]?.titre) {
					(artData as any).titre = (artData as any).oeuvre_translations[0].titre;
				}
				if ((artData as any).artistes) {
					const artisteName = (artData as any).artistes.artiste_translations?.[0]?.nom;
					if (artisteName) {
						(artData as any).artistes.nom = artisteName;
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
					movement = { ...(movRes.data as any), nom: (movRes.data as any).courant_translations?.[0]?.nom || (movRes.data as any).slug } as unknown as Movement;
				} else {
					movement = null;
				}
				content = (contRes.data as unknown as ContentArtwork) || null;
				progress = (progRes.data as unknown as UserProgress) || null;
				
				// Attached Glossary Content
				(artwork as any).glossary = {
					artiste_description: (contArtisteRes.data as any)?.description_courte || null,
					courant_description: (contCourantRes.data as any)?.description_courte || null
				};

				if (content) {
					const cachedMcqs: ContentArtwork[] = (await readFromLocalCache('cached_mcqs')) || [];
					const filtered = cachedMcqs.filter((c) => c.id_oeuvre !== artwork?.id);
					filtered.push(content);
					await saveToLocalCache('cached_mcqs', filtered);
				}
			}
		} catch (err) {
			console.warn('[DetailLoad] Supabase query failed, checking cache:', err);
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
	if ((content as any)?.introduction) {
		fullArticle = `**${(content as any).introduction}**\n\n${fullArticle}`;
	}
	if ((content as any)?.article_portions && Array.isArray((content as any).article_portions)) {
		const portions = (content as any).article_portions
			.filter((p: any) => p.text)
			.map((p: any) => p.title ? `### ${p.title}\n${p.text}` : p.text)
			.join('\n\n');
		if (portions) {
			fullArticle = `${fullArticle}\n\n${portions}`;
		}
	}

	const lesson: ActiveLessonView = {
		...artwork,
		nom_courant: movement?.nom || 'Mouvement Artistique',
		oklch_token: movement?.oklch_token || 'var(--movement-theme)',
		introduction: (content as any)?.introduction || null,
		verification_status: (content as any)?.verification_status || null,
		article_principal: fullArticle.trim() || 'Explorez l\'histoire profonde et la composition de cette pièce intemporelle.',
		article_portions: (content as any)?.article_portions || [],
		qcm: content?.qcm || {
			question: `Quelle ère ou période artistique caractérise "${artwork.titre}" ?`,
			options: [movement?.nom || 'Période historique', 'Surréalisme', 'Cubisme', 'Baroque'],
			correctIndex: 0,
			explanation: `"${artwork.titre}" par ${artwork.artistes?.nom || 'Inconnu'} illustre parfaitement ${movement?.nom || 'Période historique'}.`
		},
		mots_cles: content?.mots_cles || [],
		glossary: (artwork as any).glossary || {}
	} as ActiveLessonView & { glossary?: GlossaryContent; article_portions?: any[] };

	return {
		lesson,
		progress
	};
};
