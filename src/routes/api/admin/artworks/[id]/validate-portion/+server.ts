import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';


export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { portionId } = await request.json();
    if (!portionId) return json({ error: 'Missing portionId' }, { status: 400 });

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { oeuvre_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    const articlePortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];
    const updatedPortions = articlePortions.map(p => {
      if (p.id === portionId) {
        return {
          ...p,
          status: 'VERIFIED',
          explanation: 'Validé manuellement',
          source_quote: ''
        };
      }
      return p;
    });
    
    let report = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    if (report && report.statements) {
      report.statements = report.statements.map((s: any) => {
        if (s.id === portionId) {
          return { ...s, status: 'VERIFIED', explanation: 'Validé manuellement', source_quote: '' };
        }
        return s;
      });
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.oeuvre_translations[0].introduction);
    const globalStatus = calculateGlobalStatus(report, updatedPortions, artwork.oeuvre_translations[0].introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions as any,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/validate-portion] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
