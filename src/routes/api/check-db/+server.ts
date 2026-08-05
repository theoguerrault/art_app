import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const artworks = await prisma.artworks.findMany({
    include: {
      artists: {
        include: {
          artist_translations: {
            where: { language_code: 'fr' }
          }
        }
      },
      artwork_translations: {
        where: { language_code: 'fr' }
      }
    }
  });

  const data = artworks.map(artwork => {
    const artisteName = artwork.artists.artist_translations[0]?.name || artwork.artists.slug;
    const oeuvreTitle = artwork.artwork_translations[0]?.title || artwork.slug;
    return `${artisteName} : ${oeuvreTitle}`;
  });

  return json(data);
}
