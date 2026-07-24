import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore } from '$lib/server/utils/score';

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

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { oeuvre_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    let report = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    const articlePortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];

    if (report && report.statements) {
      if (portionId) {
        report.statements = report.statements.map((s: any) => {
          if (s.id === portionId) {
            return { ...s, status: 'VERIFIED' };
          }
          return s;
        });
      } else {
        report.statements = report.statements.map((s: any) => ({ ...s, status: 'VERIFIED' }));
      }
    }

    report.global_score = calculateGlobalScore(report, articlePortions, artwork.oeuvre_translations[0].introduction);

    const hasFalse = report?.statements?.some((s: any) => s.status === 'FALSE') || false;
    const hasUnverified = report?.statements?.some((s: any) => s.status === 'UNVERIFIED' || s.status === 'PENDING') || false;
    
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/validate] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
