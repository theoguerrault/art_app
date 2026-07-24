import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const updated = await prisma.courant_translations.update({
      where: { id_courant_language_code: { id_courant: id, language_code: 'fr' } },
      data: { verification_status: 'VERIFIED' }
    });

    return json({ success: true, content: updated });
  } catch (error: any) {
    console.error('[API/admin/courants/validate] Error:', error);
    return json({ error: error.message || String(error) }, { status: 500 });
  }
}
