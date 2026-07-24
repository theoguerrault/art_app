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

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { oeuvre_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.oeuvre_translations || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    let updatedPortions = artwork.oeuvre_translations[0].article_portions as any[] || [];
    
    // Filter out the deleted portion
    updatedPortions = updatedPortions.filter(p => p.id !== portionId);

    // Rebuild article_principal and anecdotes_secretes
    const newArticlePrincipal = updatedPortions
      .filter(p => !p.type || p.type === 'article')
      .map(p => `### ${p.title || 'Partie'}\n\n${p.text}`)
      .join('\n\n');

    const newAnecdotes = updatedPortions
      .filter(p => p.type === 'anecdote')
      .map(p => p.text);

    // Update global status
    const hasFalse = updatedPortions.some(p => p.status === 'FALSE');
    const hasUnverified = updatedPortions.some(p => p.status === 'UNVERIFIED' || p.status === 'PENDING');
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    let report = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    if (report && report.statements) {
      report.statements = report.statements.filter((s: any) => s.id !== portionId);
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.oeuvre_translations[0].introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions,
        article_principal: newArticlePrincipal,
        anecdotes_secretes: newAnecdotes,
        verification_report: report,
        verification_status: globalStatus
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/delete-portion] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
