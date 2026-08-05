import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
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

    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (artwork.artwork_translations[0].verification_report || {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePortions = (artwork.artwork_translations[0].article_portions || []) as any[];

    if (report && report.statements) {
      if (portionId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report.statements = report.statements.map((s: any) => {
          if (s.id === portionId) {
            return { ...s, status: 'VERIFIED' };
          }
          return s;
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report.statements = report.statements.map((s: any) => ({ ...s, status: 'VERIFIED' }));
      }
    }

    report.global_score = calculateGlobalScore(report, articlePortions, artwork.artwork_translations[0].introduction);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasFalse = report?.statements?.some((s: any) => s.status === 'FALSE') || false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasUnverified = report?.statements?.some((s: any) => s.status === 'UNVERIFIED' || s.status === 'PENDING') || false;
    
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
