import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { portionId } = await request.json();

    const artwork = await prisma.artworks.findUnique({
      where: { id },
      include: { artwork_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.artwork_translations || !artwork.artwork_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatedPortions = artwork.artwork_translations[0].article_portions as any[] || [];
    
    // Filter out the deleted portion
    updatedPortions = updatedPortions.filter(p => p.id !== portionId);

    // Rebuild main_article and anecdotes_secretes
    const newArticlePrincipal = updatedPortions
      .filter(p => !p.type || p.type === 'article')
      .map(p => `### ${p.title || 'Partie'}\n\n${p.text}`)
      .join('\n\n');


    // Update global status
    const hasFalse = updatedPortions.some(p => p.status === 'FALSE');
    const hasUnverified = updatedPortions.some(p => p.status === 'UNVERIFIED' || p.status === 'PENDING');
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (artwork.artwork_translations[0].verification_report || {}) as any;
    if (report && report.statements) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      report.statements = report.statements.filter((s: any) => s.id !== portionId);
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.artwork_translations[0].introduction);

    const updated = await prisma.artwork_translations.update({
      where: { artwork_id_language_code: { artwork_id: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions,
        main_article: newArticlePrincipal,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
