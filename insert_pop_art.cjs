const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const artworksToAdd = [
  { slug: 'marilyn-diptych', fr_title: 'Marilyn Diptych', en_title: 'Marilyn Diptych', artistSlug: 'andy-warhol', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Marilyndiptych.jpg', creationDate: '1962' },
  { slug: 'eight-elvises', fr_title: 'Eight Elvises', en_title: 'Eight Elvises', artistSlug: 'andy-warhol', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Eight%20Elvises.jpg', creationDate: '1963' },
  { slug: 'gold-marilyn-monroe', fr_title: 'Gold Marilyn Monroe', en_title: 'Gold Marilyn Monroe', artistSlug: 'andy-warhol', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Warhol%20-%20Gold%20Marilyn%20Monroe%20(1962).jpg', creationDate: '1962' },
  { slug: 'campbells-soup-cans', fr_title: 'Campbell\'s Soup Cans', en_title: 'Campbell\'s Soup Cans', artistSlug: 'andy-warhol', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/20070624%20Campbell\'s%20Soup%20Cans%20-%20Milwaukee%20Art%20Museum.JPG', creationDate: '1962' },
  { slug: 'a-bigger-splash', fr_title: 'A Bigger Splash', en_title: 'A Bigger Splash', artistSlug: 'david-hockney', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Hockney,%20A%20Bigger%20Splash.jpg', creationDate: '1967' },
  { slug: 'mr-and-mrs-clark-and-percy', fr_title: 'Mr and Mrs Clark and Percy', en_title: 'Mr and Mrs Clark and Percy', artistSlug: 'david-hockney', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Hockney.clark-percy.jpg', creationDate: '1971' },
  { slug: 'portrait-of-an-artist-pool-with-two-figures', fr_title: 'Portrait of an Artist (Pool with Two Figures)', en_title: 'Portrait of an Artist (Pool with Two Figures)', artistSlug: 'david-hockney', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Hockney_Pool_Figures.jpg', creationDate: '1972' },
  { slug: 'hopeless', fr_title: 'Hopeless', en_title: 'Hopeless', artistSlug: 'roy-lichtenstein', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Hopeless_(Lichtenstein).jpg', creationDate: '1963' },
  { slug: 'look-mickey', fr_title: 'Look Mickey', en_title: 'Look Mickey', artistSlug: 'roy-lichtenstein', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Look_Mickey.jpg', creationDate: '1961' },
  { slug: 'whaam', fr_title: 'Whaam!', en_title: 'Whaam!', artistSlug: 'roy-lichtenstein', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Roy_Lichtenstein_Whaam.jpg', creationDate: '1963' }
];

async function main() {
  const movement = await prisma.movements.findUnique({ where: { slug: 'pop-art' } });
  if (!movement) {
    console.error("Pop Art movement not found in DB.");
    return;
  }

  // Load existing json
  const refArtworksPath = path.join(__dirname, 'reference_artworks.json');
  let refArtworks = [];
  try {
    refArtworks = JSON.parse(fs.readFileSync(refArtworksPath, 'utf8'));
  } catch (e) {
    console.error("Failed to load reference_artworks.json from", refArtworksPath);
  }

  for (const art of artworksToAdd) {
    const artist = await prisma.artists.findUnique({ where: { slug: art.artistSlug } });
    if (!artist) {
      console.error(`Artist ${art.artistSlug} not found in DB.`);
      continue;
    }

    const existing = await prisma.artworks.findUnique({ where: { slug: art.slug } });
    if (existing) {
      console.log(`${art.slug} already exists in DB.`);
      continue;
    }

    console.log(`Inserting ${art.slug}...`);
    const newArt = await prisma.artworks.create({
      data: {
        slug: art.slug,
        movement_id: movement.id,
        artist_id: artist.id,
        creation_date: art.creationDate,
        image_url_full: art.imageUrl,
        image_url_thumb: art.imageUrl,
        image_source: 'Wikipedia (Fair Use)',
        image_verified: true,
        artwork_translations: {
          create: [
            { language_code: 'en', title: art.en_title, main_article: '', verification_status: 'PENDING' },
            { language_code: 'fr', title: art.fr_title, main_article: '', verification_status: 'PENDING' }
          ]
        }
      }
    });
    
    // add to reference JSON
    const refEntry = {
      original_name: art.slug,
      slug: art.slug,
      fr_title: art.fr_title,
      en_title: art.en_title,
      image_verified: true,
      image_url: art.imageUrl
    };
    
    const idx = refArtworks.findIndex(r => r.slug === art.slug);
    if (idx === -1) {
      refArtworks.push(refEntry);
    }
  }

  fs.writeFileSync(refArtworksPath, JSON.stringify(refArtworks, null, 2) + "\n");
  console.log("Done inserting to DB and updating JSON.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
