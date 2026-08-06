import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(event: RequestEvent) {
  const userId = ANONYMOUS_USER_ID;

  const { artwork_id, reaction } = await event.request.json();

  if (!artwork_id || !reaction || !['like', 'dislike'].includes(reaction)) {
    return json({ error: 'Missing or invalid artwork_id / reaction' }, { status: 400 });
  }

  const artworkId = parseInt(artwork_id);

  try {
    const existing = await prisma.user_reactions.findUnique({
      where: { user_id_artwork_id: { user_id: userId, artwork_id: artworkId } }
    });

    if (existing) {
      if (existing.reaction === reaction) {
        // Same reaction — toggle off (remove)
        await prisma.user_reactions.delete({
          where: { user_id_artwork_id: { user_id: userId, artwork_id: artworkId } }
        });
        return json({ status: 'removed', reaction: null });
      } else {
        // Different reaction — switch
        await prisma.user_reactions.update({
          where: { user_id_artwork_id: { user_id: userId, artwork_id: artworkId } },
          data: { reaction }
        });
        return json({ status: 'switched', reaction });
      }
    } else {
      // No existing reaction — create
      await prisma.user_reactions.create({
        data: { user_id: userId, artwork_id: artworkId, reaction }
      });
      return json({ status: 'added', reaction });
    }
  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(_event: RequestEvent) {
  const userId = ANONYMOUS_USER_ID;

  try {
    const reactions = await prisma.user_reactions.findMany({
      where: { user_id: userId },
      select: { artwork_id: true, reaction: true }
    });

    const likes = reactions.filter((r) => r.reaction === 'like').map((r) => r.artwork_id);
    const dislikes = reactions.filter((r) => r.reaction === 'dislike').map((r) => r.artwork_id);

    return json({ likes, dislikes });
  } catch (err) {
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
