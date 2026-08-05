import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore, calculateGlobalStatus } from '$lib/server/utils/score';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork or content not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingReport = (artwork.artwork_translations[0].verification_report || {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePortions = (artwork.artwork_translations[0].article_portions || []) as any[];
    const introduction = artwork.artwork_translations[0].introduction;
    
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
