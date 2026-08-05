import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateMovementDefinition } from '$lib/server/ingestion/services/movement';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const movement = await prisma.movements.findUnique({ 
      where: { id },
      include: { movement_translations: { where: { language_code: 'fr' } } }
    });
    if (!movement) return json({ error: 'Movement not found' }, { status: 404 });

    const movementName = movement.movement_translations?.[0]?.name || movement.slug.replace(/-/g, ' ');
    const description = await generateMovementDefinition(movementName);
    if (!description) return json({ error: 'Failed to generate content' }, { status: 500 });

    const updated = await prisma.movement_translations.upsert({
      where: { movement_id_language_code: { movement_id: id, language_code: 'fr' } },
      update: { short_description: description, verification_status: 'VERIFIED' },
      create: {
        movement_id: id,
        language_code: 'fr',
        name: movement.movement_translations?.[0]?.name || movement.slug.replace(/-/g, ' '),
        short_description: description,
        verification_status: 'VERIFIED'
      }
    });

    return json({ success: true, content: updated });
  } catch (error: unknown) {
    return json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
