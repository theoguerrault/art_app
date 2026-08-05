import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { introduction } = await request.json();
    if (introduction === undefined) return json({ error: 'Missing required field' }, { status: 400 });

    const current = await prisma.artwork_translations.findUnique({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (current?.verification_report as any) || {};
    if (report.introduction) {
      report.introduction = {
        ...report.introduction,
        status: 'PENDING',
        explanation: null,
        source_quote: null
      };
    } else {
      report.introduction = {
        status: 'PENDING',
        explanation: null,
        source_quote: null
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentPortions = (current?.article_portions || []) as any[];
    report.global_score = calculateGlobalScore(report, currentPortions, introduction);

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        introduction,
        verification_report: report,
        verification_status: 'PENDING_VALIDATION'
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
