import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { portionId } = await request.json();

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { contenus_oeuvres: true }
    });

    if (!artwork || !artwork.contenus_oeuvres) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    let updatedPortions = artwork.contenus_oeuvres.article_portions as any[] || [];
    
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

    let report = artwork.contenus_oeuvres.verification_report as any;
    if (report && report.statements) {
      report.statements = report.statements.filter((s: any) => s.id !== portionId);
      const validCount = updatedPortions.filter(p => p.status === 'VERIFIED').length;
      const totalCount = updatedPortions.length;
      if (totalCount > 0) {
        report.global_score = Math.round((validCount / totalCount) * 100);
      } else {
        report.global_score = 0;
      }
    }

    const updated = await prisma.contenus_oeuvres.update({
      where: { id_oeuvre: id },
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
