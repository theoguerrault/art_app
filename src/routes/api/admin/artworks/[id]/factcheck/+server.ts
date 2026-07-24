import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';
import { calculateGlobalScore } from '$lib/server/utils/score';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { 
        oeuvre_translations: { where: { language_code: 'fr' } }, 
        artistes: { include: { artiste_translations: { where: { language_code: 'fr' } } } } 
      }
    });

    if (!artwork || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    // Extract text from the DB
    const dbPortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];
    let articlePortions = [...dbPortions];
    
    // Fallback if no portions exist (shouldn't happen with new generation logic)
    if (articlePortions.length === 0 && artwork.oeuvre_translations[0].article_principal) {
      articlePortions = [{
        id: `p-${Date.now()}-article`,
        type: 'article',
        text: artwork.oeuvre_translations[0].article_principal,
        status: 'PENDING'
      }];
    }

    // Scrape wikipedia
    const titre = artwork.oeuvre_translations[0].titre;
    const nomArtiste = artwork.artistes?.artiste_translations?.[0]?.nom || 'Inconnu';
    const wikiExtract = await scrapeWikipediaArticle(titre, nomArtiste, 'fr');

    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia article not found for fact checking' }, { status: 404 });
    }

    const report = await factCheckArtworkContent(titre, articlePortions, wikiExtract.text, wikiExtract.lang);

    if (!report) {
      return json({ error: 'Failed to generate fact check report' }, { status: 500 });
    }

    const hasFalse = report.statements.some((s: any) => s.status === 'FALSE');
    const hasUnverified = report.statements.some((s: any) => s.status === 'UNVERIFIED');

    let status = 'VERIFIED';
    if (hasFalse) {
      status = 'FALSE'; // Indicate it needs correction
    } else if (hasUnverified) {
      status = 'PENDING_VALIDATION';
    }

    // Map factcheck statuses back to articlePortions
    const updatedPortions = articlePortions.map(portion => {
      const match = report.statements.find((s: any) => s.id === portion.id);
      if (match) {
        return {
          ...portion,
          status: match.status,
          explanation: match.explanation,
          source_quote: match.source_quote
        };
      }
      return portion;
    });

    const existingTranslation = await prisma.oeuvre_translations.findUnique({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } }
    });
    const existingReport = (existingTranslation?.verification_report || {}) as any;

    const mergedReport = {
      ...report,                           // statements + global_score du factcheck actuel
      introduction: existingReport.introduction // on préserve le factcheck intro s'il existe
    };
    mergedReport.global_score = calculateGlobalScore(mergedReport, updatedPortions, artwork.oeuvre_translations[0].introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        verification_report: mergedReport as any,
        verification_status: status,
        article_portions: updatedPortions as any
      }
    });

    return json({ success: true, report, content: updated });
  } catch (error: any) {
    console.error('[API/admin/factcheck] Error:', error);
    
    const errorMessage = error.message || String(error);
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('429')) {
      return json({ error: 'Le quota quotidien Gemini a été atteint. Veuillez réessayer demain.' }, { status: 429 });
    }
    
    return json({ error: errorMessage }, { status: 500 });
  }
}

