import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { correctArtworkContentPortion, factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';
import { calculateGlobalScore } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {}

    const { portionId } = body;
    if (!portionId) {
      return json({ error: 'portionId is required' }, { status: 400 });
    }

    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } }, artists: { include: { artist_translations: { where: { language_code: 'fr' } } } } }
    });

    if (!artwork || !artwork.artwork_translations || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatedPortions = artwork.artwork_translations[0].article_portions as any[] || [];
    const portionToCorrect = updatedPortions.find(p => p.id === portionId);
    
    if (!portionToCorrect) {
      return json({ error: 'Portion not found' }, { status: 404 });
    }

    const titre = artwork.artwork_translations[0].title;
    const artisteNom = artwork.artists?.artist_translations?.[0]?.name || 'Inconnu';
    const wikiExtract = await scrapeWikipediaArticle(titre, artisteNom, 'fr');
    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia text required for correction' }, { status: 500 });
    }

    const correctedText = await correctArtworkContentPortion(
      titre,
      portionToCorrect,
      wikiExtract.text,
      wikiExtract.lang
    );

    if (!correctedText) {
      return json({ error: 'Failed to correct portion' }, { status: 500 });
    }

    const correctedPortion = {
      ...portionToCorrect,
      text: correctedText,
      status: 'PENDING'
    };

    const factCheckResult = await factCheckArtworkContent(
      titre,
      [correctedPortion],
      wikiExtract.text,
      wikiExtract.lang
    );

    let finalStatus = 'PENDING';
    let finalExplanation = '';
    let finalSourceQuote = '';

    if (factCheckResult && factCheckResult.statements.length > 0) {
      const match = factCheckResult.statements[0];
      finalStatus = match.status;
      finalExplanation = match.explanation;
      finalSourceQuote = match.source_quote || '';
    }

    // Update the portion
    updatedPortions = updatedPortions.map(p => {
      if (p.id === portionId) {
        return {
          ...p,
          text: correctedText,
          status: finalStatus,
          explanation: finalExplanation,
          source_quote: finalSourceQuote
        };
      }
      return p;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (artwork.artwork_translations[0].verification_report || {}) as any;
    if (report && report.statements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      report.statements = report.statements.map((s: any) => {
        if (s.id === portionId) {
          return {
            ...s,
            text: correctedText,
            status: finalStatus,
            explanation: finalExplanation,
            source_quote: finalSourceQuote
          };
        }
        return s;
      });
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.artwork_translations[0].introduction);

    const newArticlePrincipal = updatedPortions
      .filter(p => !p.type || p.type === 'article')
      .map(p => `### ${p.title || 'Partie'}\n\n${p.text}`)
      .join('\n\n');


    // Update global status
    const hasFalse = updatedPortions.some(p => p.status === 'FALSE');
    const hasUnverified = updatedPortions.some(p => p.status === 'UNVERIFIED' || p.status === 'PENDING');
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions,
        main_article: newArticlePrincipal,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429')) {
      return json({ error: 'Le quota quotidien Gemini a été atteint. Veuillez réessayer demain.' }, { status: 429 });
    }
    
    return json({ error: errorMessage }, { status: 500 });
  }
}
