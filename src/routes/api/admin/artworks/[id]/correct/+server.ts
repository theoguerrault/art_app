import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { correctArtworkContentPortion, factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {}

    const { portionId } = body;
    if (!portionId) {
      return json({ error: 'portionId is required' }, { status: 400 });
    }

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { contenus_oeuvres: true }
    });

    if (!artwork || !artwork.contenus_oeuvres) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    let updatedPortions = artwork.contenus_oeuvres.article_portions as any[] || [];
    const portionToCorrect = updatedPortions.find(p => p.id === portionId);
    
    if (!portionToCorrect) {
      return json({ error: 'Portion not found' }, { status: 404 });
    }

    const wikiExtract = await scrapeWikipediaArticle(artwork.titre, artwork.artiste, 'fr', artwork.wikipedia_title);
    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia text required for correction' }, { status: 500 });
    }

    const correctedText = await correctArtworkContentPortion(
      artwork.titre,
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
      artwork.titre,
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

    let report = artwork.contenus_oeuvres.verification_report as any;
    if (report && report.statements) {
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
      const validCount = updatedPortions.filter(p => p.status === 'VERIFIED').length;
      const totalCount = updatedPortions.length;
      if (totalCount > 0) {
        report.global_score = Math.round((validCount / totalCount) * 100);
      }
    }

    const newArticlePrincipal = updatedPortions
      .filter(p => !p.type || p.type === 'article')
      .map(p => `### ${p.title || 'Partie'}\n\n${p.text}`)
      .join('\n\n');

    const newAnecdotes = updatedPortions
      .filter(p => p.type === 'anecdote')
      .map(p => p.text);

    // Update global status
    const hasFalse = updatedPortions.some(p => p.status === 'FALSE');
    const hasUnverified = updatedPortions.some(p => p.status === 'UNVERIFIED' || p.status === 'PENDING');
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    const updated = await prisma.contenus_oeuvres.update({
      where: { id_oeuvre: id },
      data: {
        article_portions: updatedPortions,
        article_principal: newArticlePrincipal,
        anecdotes_secretes: newAnecdotes,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/correct] Error:', error);
    
    const errorMessage = error.message || String(error);
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429')) {
      return json({ error: 'Le quota quotidien Gemini a été atteint. Veuillez réessayer demain.' }, { status: 429 });
    }
    
    return json({ error: errorMessage }, { status: 500 });
  }
}
