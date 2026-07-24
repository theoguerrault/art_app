import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { oeuvre_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    const existingReport = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    const articlePortions = (artwork.oeuvre_translations[0].article_portions || []) as any[];
    const introduction = artwork.oeuvre_translations[0].introduction;
    
    const newReport = {
      ...existingReport,
      introduction: {
        status: 'VERIFIED',
        explanation: 'Validé manuellement',
        source_quote: ''
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
    console.error('[API/admin/validate-intro] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
