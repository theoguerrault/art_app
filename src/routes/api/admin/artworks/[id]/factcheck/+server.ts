import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { factCheckArtworkContent } from '$lib/server/ingestion/services/description';
import { scrapeWikipediaArticle } from '$lib/server/ingestion/clients/wikipedia';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { contenus_oeuvres: true }
    });

    if (!artwork || !artwork.contenus_oeuvres) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    // Extract portions from the DB
    let articlePortions = (artwork.contenus_oeuvres.article_portions || []) as any[];
    
    // Fallback if no article_portions exist yet (e.g. old data)
    if (articlePortions.length === 0 && artwork.contenus_oeuvres.article_principal) {
      articlePortions.push({
        id: `p-${Date.now()}-fallback`,
        type: 'article',
        text: artwork.contenus_oeuvres.article_principal,
        status: 'PENDING'
      });
    }

    // Fallback to include anecdotes if they are missing from articlePortions
    const hasAnecdotePortions = articlePortions.some(p => p.type === 'anecdote');
    if (!hasAnecdotePortions && artwork.contenus_oeuvres.anecdotes_secretes && artwork.contenus_oeuvres.anecdotes_secretes.length > 0) {
      const anecdotePortions = artwork.contenus_oeuvres.anecdotes_secretes.map((text, index) => ({
        id: `p-${Date.now()}-legacy-anecdote-${index}`,
        type: 'anecdote',
        text,
        status: 'PENDING'
      }));
      articlePortions = [...articlePortions, ...anecdotePortions];
    }

    // Scrape wikipedia
    const wikiExtract = await scrapeWikipediaArticle(artwork.titre, artwork.artiste, 'fr', artwork.wikipedia_title);

    if (!wikiExtract || !wikiExtract.text) {
      return json({ error: 'Wikipedia article not found for fact checking' }, { status: 404 });
    }

    const report = await factCheckArtworkContent(artwork.titre, articlePortions, wikiExtract.text, wikiExtract.lang);

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

    const updated = await prisma.contenus_oeuvres.update({
      where: { id_oeuvre: id },
      data: {
        article_portions: updatedPortions as any,
        verification_report: report as any,
        verification_status: status
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

