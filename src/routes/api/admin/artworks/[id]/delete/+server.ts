import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params }: RequestEvent) {
	const id = parseInt(params.id ?? '', 10);
	if (isNaN(id)) {
		return json({ error: 'Identifiant d\'œuvre invalide' }, { status: 400 });
	}

	try {
		const artwork = await prisma.artworks.findUnique({
			where: { id }
		});

		if (!artwork) {
			return json({ error: 'Œuvre introuvable' }, { status: 404 });
		}

		// Delete all associated records and the artwork atomically
		await prisma.$transaction([
			prisma.artwork_translations.deleteMany({ where: { artwork_id: id } }),
			prisma.user_artwork_progress.deleteMany({ where: { artwork_id: id } }),
			prisma.user_favorites.deleteMany({ where: { artwork_id: id } }),
			prisma.user_reactions.deleteMany({ where: { artwork_id: id } }),
			prisma.artworks.delete({ where: { id } })
		]);

		return json({ success: true, deletedId: id });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return json({ error: `Erreur lors de la suppression: ${message}` }, { status: 500 });
	}
}
