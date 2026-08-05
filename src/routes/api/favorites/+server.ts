import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  // Temporary: use anonymous user since auth isn't fully integrated in event.locals
  const userId = '00000000-0000-0000-0000-000000000001';
  
  const { artwork_id } = await event.request.json();

  if (!artwork_id) {
    return json({ error: 'Missing artwork_id' }, { status: 400 });
  }

  try {
    const existingFavorite = await prisma.user_favorites.findUnique({
      where: {
        user_id_artwork_id: {
          user_id: userId,
          artwork_id: parseInt(artwork_id),
        },
      },
    });

    if (existingFavorite) {
      await prisma.user_favorites.delete({
        where: {
          user_id_artwork_id: {
            user_id: userId,
            artwork_id: parseInt(artwork_id),
          },
        },
      });
      return json({ status: 'removed' });
    } else {
      await prisma.user_favorites.create({
        data: {
          user_id: userId,
          artwork_id: parseInt(artwork_id),
        },
      });
      return json({ status: 'added' });
    }
  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(_event: RequestEvent) {
  // Temporary: use anonymous user since auth isn't fully integrated in event.locals
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    const favorites = await prisma.user_favorites.findMany({
      where: { user_id: userId },
      select: { artwork_id: true }
    });
    
    return json({ favorites: favorites.map(f => f.artwork_id) });
  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
