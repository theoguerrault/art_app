import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  // Temporary: use anonymous user since auth isn't fully integrated in event.locals
  const userId = '00000000-0000-0000-0000-000000000001';
  
  const { id_oeuvre } = await event.request.json();

  if (!id_oeuvre) {
    return json({ error: 'Missing id_oeuvre' }, { status: 400 });
  }

  try {
    const existingFavorite = await prisma.user_favorites.findUnique({
      where: {
        user_id_id_oeuvre: {
          user_id: userId,
          id_oeuvre: parseInt(id_oeuvre),
        },
      },
    });

    if (existingFavorite) {
      await prisma.user_favorites.delete({
        where: {
          user_id_id_oeuvre: {
            user_id: userId,
            id_oeuvre: parseInt(id_oeuvre),
          },
        },
      });
      return json({ status: 'removed' });
    } else {
      await prisma.user_favorites.create({
        data: {
          user_id: userId,
          id_oeuvre: parseInt(id_oeuvre),
        },
      });
      return json({ status: 'added' });
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(event: RequestEvent) {
  // Temporary: use anonymous user since auth isn't fully integrated in event.locals
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    const favorites = await prisma.user_favorites.findMany({
      where: { user_id: userId },
      select: { id_oeuvre: true }
    });
    
    return json({ favorites: favorites.map(f => f.id_oeuvre) });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
