import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateMovementDefinition } from '$lib/server/ingestion/services/courant';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const courant = await prisma.courants.findUnique({ 
      where: { id },
      include: { courant_translations: { where: { language_code: 'fr' } } }
    });
    if (!courant) return json({ error: 'Courant not found' }, { status: 404 });

    const movementName = courant.courant_translations?.[0]?.nom || courant.slug.replace(/-/g, ' ');
    const description = await generateMovementDefinition(movementName);
    if (!description) return json({ error: 'Failed to generate content' }, { status: 500 });

    const updated = await prisma.courant_translations.upsert({
      where: { id_courant_language_code: { id_courant: id, language_code: 'fr' } },
      update: { description_courte: description, verification_status: 'VERIFIED' },
      create: {
        id_courant: id,
        language_code: 'fr',
        nom: courant.courant_translations?.[0]?.nom || courant.slug.replace(/-/g, ' '),
        description_courte: description,
        verification_status: 'VERIFIED',
        caracteristiques_cles: {},
        contexte_historique: '',
        qcm_synthese: {}
      }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/courants/generate] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
