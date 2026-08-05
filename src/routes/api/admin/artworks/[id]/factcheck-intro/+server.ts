import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { 
        artwork_translations: { where: { language_code: 'fr' } }, 
        artists: { include: { artist_translations: { where: { language_code: 'fr' } } } } 
      }
    });

    if (!artwork || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    const introduction = artwork.artwork_translations[0].introduction;
    if (!introduction) {
      return json({ error: 'No introduction to verify' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakePortion: any = { id: 'intro', text: introduction, type: 'article', status: 'UNVERIFIED' };

    const titre = artwork.artwork_translations[0].title;
    const nomArtiste = artwork.artists?.artist_translations?.[0]?.name || 'Inconnu';
    const wikiExtract = await scrapeWikipediaArticle(titre, nomArtiste, 'fr');

    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia article not found for fact checking' }, { status: 404 });
    }

    const report = await factCheckArtworkContent(titre, [fakePortion], wikiExtract.text, wikiExtract.lang);

    if (!report || !report.statements || report.statements.length === 0) {
      return json({ error: 'Failed to generate fact check report' }, { status: 500 });
    }

    const match = report.statements[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingReport = (artwork.artwork_translations[0].verification_report || {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePortions = (artwork.artwork_translations[0].article_portions || []) as any[];

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

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        verification_report: newReport as any,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
