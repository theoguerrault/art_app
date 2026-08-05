import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { portionId } = await request.json();
    if (!portionId) return json({ error: 'Missing portionId' }, { status: 400 });

    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePortions = (artwork.artwork_translations[0].article_portions || []) as any[];
    const updatedPortions = articlePortions.map(p => {
      if (p.id === portionId) {
        return {
          ...p,
          status: 'PENDING_VALIDATION',
          explanation: 'Invalidé manuellement',
          source_quote: ''
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
          return { ...s, status: 'PENDING_VALIDATION', explanation: 'Invalidé manuellement', source_quote: '' };
        }
        return s;
      });
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.artwork_translations[0].introduction);
    const globalStatus = calculateGlobalStatus(report, updatedPortions, artwork.artwork_translations[0].introduction);

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        article_portions: updatedPortions as any,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
