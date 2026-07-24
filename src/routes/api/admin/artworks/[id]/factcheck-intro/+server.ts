import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

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

    const introduction = artwork.oeuvre_translations[0].introduction;
    if (!introduction) {
      return json({ error: 'No introduction to verify' }, { status: 400 });
    }

    const fakePortion: any = { id: 'intro', text: introduction, type: 'article', status: 'UNVERIFIED' };

    const titre = artwork.oeuvre_translations[0].titre;
    const nomArtiste = artwork.artistes?.artiste_translations?.[0]?.nom || 'Inconnu';
    const wikiExtract = await scrapeWikipediaArticle(titre, nomArtiste, 'fr');

    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia article not found for fact checking' }, { status: 404 });
    }

    const report = await factCheckArtworkContent(titre, [fakePortion], wikiExtract.text, wikiExtract.lang);

    if (!report || !report.statements || report.statements.length === 0) {
      return json({ error: 'Failed to generate fact check report' }, { status: 500 });
    }

    const match = report.statements[0];
    const existingReport = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    const articlePortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];

    const newReport = {
      ...existingReport,
      introduction: {
        status: match.status,
        explanation: match.explanation,
        source_quote: match.source_quote
      }
    };
    newReport.global_score = calculateGlobalScore(newReport, articlePortions, introduction);
    const globalStatus = calculateGlobalStatus(newReport, articlePortions, introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        verification_report: newReport as any,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/factcheck-intro] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
