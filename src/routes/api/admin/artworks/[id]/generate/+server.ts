import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import { generateArtworkContent } from '$lib/server/ingestion/services/description';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { 
        artists: { include: { artist_translations: { where: { language_code: 'fr' } } } },
        artwork_translations: { where: { language_code: 'fr' } }
      }
    });

    if (!artwork) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    const titre = artwork.artwork_translations?.[0]?.title || 'Inconnu';
    const nomArtiste = artwork.artists?.artist_translations?.[0]?.name || 'Inconnu';
    const generatedContent = await generateArtworkContent(titre, nomArtiste);

    if (!generatedContent) {
      return json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePortions = (generatedContent.portions || []).map((p: any, index: number) => ({
      id: `p-${Date.now()}-article-${index}`,
      type: 'article',
      title: p.title,
      text: p.content,
      status: 'PENDING'
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {
      introduction: generatedContent.introduction || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      main_article: (generatedContent.portions || []).map((p: any) => `### ${p.title}\n\n${p.content}`).join('\n\n') || "Contenu introuvable",
      article_portions: [...articlePortions],
      verification_status: 'PENDING'
    };

    // To reset verification_report, set it to Prisma.JsonNull, but since we don't have Prisma object here easily, we can omit it or use undefined or an empty object.
    // Let's just pass undefined so Prisma ignores it, or if creating, it defaults to null.
    // Actually, setting it to undefined will not overwrite existing. To overwrite, use `{}` or `null` cast as any. Let's cast as any to bypass.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updatePayload as any).verification_report = Prisma.JsonNull;

    const updated = await prisma.artwork_translations.upsert({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      update: updatePayload,
      create: {
        artwork_id: id,
        language_code: 'fr',
        title: titre,
        ...updatePayload
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429')) {
      return json({ error: 'Le quota quotidien de génération Gemini a été atteint. Veuillez réessayer demain.' }, { status: 429 });
    }

    return json({ error: errorMessage }, { status: 500 });
  }
}
