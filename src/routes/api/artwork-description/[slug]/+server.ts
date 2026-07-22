import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncArtworkEnrichment } from '$lib/server/ingestion/pipeline/sync-artwork';

/**
 * GET /api/artwork-description/[slug]
 *
 * Returns a detailed description for an artwork.
 * Cache-first: returns from DB if available, generates from Wikipedia + Gemini otherwise.
 */
export const GET: RequestHandler = async ({ params }) => {
	const slug = params.slug;

	if (!slug) {
		return json({ error: 'Missing slug parameter' }, { status: 400 });
	}

	try {
		const result = await syncArtworkEnrichment(slug);

		if (result.error) {
			return json(
				{ error: result.error },
				{ status: 404 }
			);
		}

		// Map to expected shape
		return json({
			detailed_description: result.content?.detailed_description,
			article_principal: result.content?.article_principal,
			anecdotes_secretes: result.content?.anecdotes_secretes,
			source: result.updated?.includes('detailed_description') ? 'generated' : 'cache'
		});
	} catch (err: any) {
		console.error(`[/api/artwork-description] Error for slug "${slug}":`, err);
		return json(
			{ error: 'Failed to get artwork description', details: err?.message || String(err) },
			{ status: 500 }
		);
	}
};
