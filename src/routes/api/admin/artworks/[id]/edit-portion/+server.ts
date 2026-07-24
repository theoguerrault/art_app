import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateGlobalScore } from '$lib/server/utils/score';

export async function POST({ params, request }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { portionId, title, text } = await request.json();
    if (!portionId || !text) return json({ error: 'Missing required fields' }, { status: 400 });

    const artwork = await prisma.oeuvres.findUnique({
      where: { id },
      include: { oeuvre_translations: { where: { language_code: 'fr' } } }
    });

    if (!artwork || !artwork.oeuvre_translations || !artwork.oeuvre_translations[0]) {
      return json({ error: 'Artwork not found' }, { status: 404 });
    }

    let updatedPortions = artwork.oeuvre_translations[0].article_portions as any[] || [];
    
    updatedPortions = updatedPortions.map(p => {
      if (p.id === portionId) {
        return {
          ...p,
          title: title || p.title,
          text,
          status: 'PENDING',
          explanation: null,
          source_quote: null
        };
      }
      return p;
    });

    const newArticlePrincipal = updatedPortions
      .filter(p => !p.type || p.type === 'article')
      .map(p => `### ${p.title || 'Partie'}\n\n${p.text}`)
      .join('\n\n');

    const newAnecdotes = updatedPortions
      .filter(p => p.type === 'anecdote')
      .map(p => p.text);
      
    // Clear the specific statement from fact-checking report to force re-check
    let report = (artwork.oeuvre_translations[0].verification_report || {}) as any;
    if (report && report.statements) {
       report.statements = report.statements.filter((s:any) => s.id !== portionId);
    }
    report.global_score = calculateGlobalScore(report, updatedPortions, artwork.oeuvre_translations[0].introduction);

    const updated = await prisma.oeuvre_translations.update({
      where: { id_oeuvre_language_code: { id_oeuvre: id, language_code: 'fr' } },
      data: {
        article_portions: updatedPortions,
        article_principal: newArticlePrincipal,
        anecdotes_secretes: newAnecdotes,
        verification_report: report,
        verification_status: 'PENDING_VALIDATION'
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/edit-portion] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
