import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { portionId } = await request.json();
    if (!portionId) return json({ error: 'Missing portionId' }, { status: 400 });

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

    const articlePortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];
    const portionToVerify = articlePortions.find(p => p.id === portionId);

    if (!portionToVerify) {
      return json({ error: 'Portion not found' }, { status: 404 });
    }

    const titre = artwork.oeuvre_translations[0].titre;
    const nomArtiste = artwork.artistes?.artiste_translations?.[0]?.nom || 'Inconnu';
    const wikiExtract = await scrapeWikipediaArticle(titre, nomArtiste, 'fr');

    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia article not found for fact checking' }, { status: 404 });
    }

    const report = await factCheckArtworkContent(titre, [portionToVerify], wikiExtract.text, wikiExtract.lang);

    if (!report || !report.statements || report.statements.length === 0) {
      return json({ error: 'Failed to generate fact check report' }, { status: 500 });
    }

    const match = report.statements[0];
    const updatedPortions = articlePortions.map(p => {
      if (p.id === portionId) {
        return {
          ...p,
          status: match.status,
          explanation: match.explanation,
          source_quote: match.source_quote
        };
      }
      return p;
    });

    let existingReport = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    if (existingReport && existingReport.statements) {
      existingReport.statements = existingReport.statements.map((s: any) => {
        if (s.id === portionId) {
          return {
            ...s,
            status: match.status,
            explanation: match.explanation,
            source_quote: match.source_quote
          };
        }
        return s;
      });
    }
    existingReport.global_score = calculateGlobalScore(existingReport, updatedPortions, artwork.oeuvre_translations[0].introduction);
    const globalStatus = calculateGlobalStatus(existingReport, updatedPortions, artwork.oeuvre_translations[0].introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions as any,
        verification_report: existingReport,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/factcheck-portion] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
