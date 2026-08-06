const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const artworksToAdd = [
  { slug: 'girl-with-balloon', fr_title: 'Girl with Balloon', en_title: 'Girl with Balloon', artistSlug: 'banksy', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Girl_with_balloon.jpg', creationDate: '2002', verified: true },
  { slug: 'love-is-in-the-air-flower-thrower', fr_title: 'L\'Amour est dans l\'air (Le Lanceur de fleurs)', en_title: 'Love is in the Air (Flower Thrower)', artistSlug: 'banksy', imageUrl: null, creationDate: '2003', verified: false },
  
  { slug: 'le-secret-de-la-grande-pyramide', fr_title: 'Le Secret de la Grande Pyramide', en_title: 'The Secret of the Great Pyramid', artistSlug: 'jr', imageUrl: null, creationDate: '2019', verified: false },
  { slug: 'women-are-heroes', fr_title: 'Women Are Heroes', en_title: 'Women Are Heroes', artistSlug: 'jr', imageUrl: null, creationDate: '2008', verified: false },
  
  { slug: 'boy-and-dog-in-a-johnnypump', fr_title: 'Boy and Dog in a Johnnypump', en_title: 'Boy and Dog in a Johnnypump', artistSlug: 'jean-michel-basquiat', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Boy-and-Dog-in-Johnnypump-1982.jpg', creationDate: '1982', verified: true },
  { slug: 'irony-of-negro-policeman', fr_title: 'Irony of Negro Policeman', en_title: 'Irony of Negro Policeman', artistSlug: 'jean-michel-basquiat', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Basquiat-irony-of-negro-policeman-1981.jpg', creationDate: '1981', verified: true },
  { slug: 'untitled-skull', fr_title: 'Sans titre (Crâne)', en_title: 'Untitled (Skull)', artistSlug: 'jean-michel-basquiat', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Untitled-Head-Jean-Michel_Basquiat-1981.jpg', creationDate: '1981', verified: true },
  
  { slug: 'companion', fr_title: 'Companion', en_title: 'Companion', artistSlug: 'kaws', imageUrl: null, creationDate: '1999', verified: false },
  
  { slug: 'crack-is-wack', fr_title: 'Crack is Wack', en_title: 'Crack is Wack', artistSlug: 'keith-haring', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Crack_is_wack_-_Keith_Haring.jpg', creationDate: '1986', verified: true },
  { slug: 'tuttomondo', fr_title: 'Tuttomondo', en_title: 'Tuttomondo', artistSlug: 'keith-haring', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tuttomondo_-_Keith_Haring_1.jpg', creationDate: '1989', verified: true },
  { slug: 'radiant-baby', fr_title: 'Radiant Baby', en_title: 'Radiant Baby', artistSlug: 'keith-haring', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Radiantbaby.png', creationDate: '1990', verified: true },
  
  { slug: 'hope-poster', fr_title: 'Affiche Hope (Barack Obama)', en_title: 'Hope Poster (Barack Obama)', artistSlug: 'shepard-fairey-obey', imageUrl: 'https://en.wikipedia.org/wiki/Special:FilePath/Barack_Obama_Hope_poster.jpg', creationDate: '2008', verified: true },
  { slug: 'marianne', fr_title: 'Marianne', en_title: 'Marianne', artistSlug: 'shepard-fairey-obey', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/MariannedeTheodoreDoriot.JPG', creationDate: '2015', verified: true }
];

async function main() {
  const movement = await prisma.movements.findUnique({ where: { slug: 'street-art' } });
  if (!movement) {
    console.error("Street Art movement not found in DB.");
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
        image_url_full: art.imageUrl || '',
        image_url_thumb: art.imageUrl || '',
        image_source: art.imageUrl ? 'Wikipedia (Fair Use)' : '',
        image_verified: art.verified,
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
      image_verified: art.verified,
      image_url: art.imageUrl || ""
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
