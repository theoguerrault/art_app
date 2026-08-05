import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/client';
import { generateContentWithRetry } from '$lib/server/ingestion/clients/gemini';
import { Type } from '@google/genai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const artworkId = params.id;

	try {
		// 1. Fetch artwork details
		const { data: artwork, error } = await supabase
			.from('artworks')
			.select('*, artwork_translations(title), artists(artist_translations(name))')
			.eq('id', parseInt(artworkId))
			.maybeSingle();

		if (error || !artwork) {
			return json({ error: 'Artwork introuvable' }, { status: 404 });
		}

		if (!artwork.image_url_full) {
			return json({ error: "L'œuvre n'a pas d'image enregistrée à analyser." }, { status: 400 });
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const typedArtwork = artwork as any;
		const title = typedArtwork.artwork_translations?.[0]?.title || 'Titre inconnu';
		const artistName = typedArtwork.artists?.artist_translations?.[0]?.name || 'Artiste inconnu';

		// 2. Prepare Gemini prompt
		const systemInstruction = `Tu es un expert en histoire de l'art. Ton rôle est de vérifier visuellement si une image donnée correspond bien à l'œuvre d'art mentionnée. Sois objectif.`;
		
		const userPrompt = `Analyse l'image fournie. Est-ce qu'elle correspond à l'œuvre "${title}" de l'artiste "${artistName}" ?`;

		const responseSchema = {
			type: Type.OBJECT,
			properties: {
				isValid: {
					type: Type.BOOLEAN,
					description: "true si l'image correspond bien à l'œuvre et à l'artiste, false sinon."
				},
				explanation: {
					type: Type.STRING,
					description: "Une brève explication (1 à 2 phrases maximum) justifiant ta décision."
				}
			},
			required: ['isValid', 'explanation']
		};

		// 3. Call Gemini
		const result = await generateContentWithRetry({
			systemInstruction,
			userPrompt,
			imageUrl: artwork.image_url_full,
			responseSchema,
			temperature: 0.2 // Low temp for factual check
		});

		return json({
			success: true,
			result
		});

	} catch (err: unknown) {
		return json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
	}
};
