import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

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
      include: { contenus_oeuvres: true }
    });

    if (!artwork || !artwork.contenus_oeuvres) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    let updatedPortions = artwork.contenus_oeuvres.article_portions as any[] || [];
    let report = artwork.contenus_oeuvres.verification_report as any;

    if (portionId) {
      // Validate specific portion
      updatedPortions = updatedPortions.map(p => {
        if (p.id === portionId) {
          return { ...p, status: 'VERIFIED' };
        }
        return p;
      });

      if (report && report.statements) {
        report.statements = report.statements.map((s: any) => {
          if (s.id === portionId) {
            return { ...s, status: 'VERIFIED' };
          }
          return s;
        });
      }
    } else {
      // Fallback: Validate all unverified
      updatedPortions = updatedPortions.map(p => ({ ...p, status: 'VERIFIED' }));
    }

    // Determine global status
    const hasFalse = updatedPortions.some(p => p.status === 'FALSE');
    const hasUnverified = updatedPortions.some(p => p.status === 'UNVERIFIED' || p.status === 'PENDING');
    let globalStatus = 'VERIFIED';
    if (hasFalse) globalStatus = 'FALSE';
    else if (hasUnverified) globalStatus = 'PENDING_VALIDATION';

    if (report && report.statements) {
      const validCount = updatedPortions.filter(p => p.status === 'VERIFIED').length;
      const totalCount = updatedPortions.length;
      if (totalCount > 0) {
        report.global_score = Math.round((validCount / totalCount) * 100);
      }
    }

    const updated = await prisma.contenus_oeuvres.update({
      where: { id_oeuvre: id },
      data: {
        article_portions: updatedPortions,
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
