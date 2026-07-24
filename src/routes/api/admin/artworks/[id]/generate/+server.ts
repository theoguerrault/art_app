import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateArtworkContent } from '$lib/server/ingestion/services/description';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { 
        artistes: { include: { artiste_translations: { where: { language_code: 'fr' } } } },
        oeuvre_translations: { where: { language_code: 'fr' } }
      }
    });

    if (!artwork) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    const titre = artwork.oeuvre_translations?.[0]?.titre || 'Inconnu';
    const nomArtiste = artwork.artistes?.artiste_translations?.[0]?.nom || 'Inconnu';
    const generatedContent = await generateArtworkContent(titre, nomArtiste);

    if (!generatedContent) {
      return json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const articlePortions = (generatedContent.portions || []).map((p: any, index: number) => ({
      id: `p-${Date.now()}-article-${index}`,
      type: 'article',
      title: p.title,
      text: p.content,
      status: 'PENDING'
    }));

    const anecdotePortions = (generatedContent.anecdotes_secretes || []).map((text: string, index: number) => ({
      id: `p-${Date.now()}-anecdote-${index}`,
      type: 'anecdote',
      text,
      status: 'PENDING'
    }));

    const updatePayload: any = {
      introduction: generatedContent.introduction || null,
      article_principal: (generatedContent.portions || []).map((p: any) => `### ${p.title}\n\n${p.content}`).join('\n\n') || "Contenu introuvable",
      article_portions: [...articlePortions, ...anecdotePortions],
      anecdotes_secretes: generatedContent.anecdotes_secretes || [],
      verification_status: 'PENDING'
    };

    // To reset verification_report, set it to Prisma.JsonNull, but since we don't have Prisma object here easily, we can omit it or use undefined or an empty object.
    // Let's just pass undefined so Prisma ignores it, or if creating, it defaults to null.
    // Actually, setting it to undefined will not overwrite existing. To overwrite, use `{}` or `null` cast as any. Let's cast as any to bypass.
    (updatePayload as any).verification_report = null;

    const updated = await prisma.oeuvre_translations.upsert({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      update: updatePayload,
      create: {
        id_oeuvre: id,
        language_code: 'fr',
        titre: titre,
        qcm: { question: '?', options: [], correctIndex: 0, explanation: '' }, // default if creating from scratch
        ...updatePayload
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/generate] Error:', error);

    const errorMessage = error.message || String(error);
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429')) {
      return json({ error: 'Le quota quotidien de génération Gemini a été atteint. Veuillez réessayer demain.' }, { status: 429 });
    }

    return json({ error: errorMessage }, { status: 500 });
  }
}
