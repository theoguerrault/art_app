const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const artworkSlugsToDelete = [
  // Photography
  'moonrise-hernandez-new-mexico',
  'afghan-girl',
  'serra-pelada-gold-mine',
  '99-cent-ii-diptychon',
  'rhein-ii',
  // Contemporary Art
  'three-studies-for-figures',
  'osiris-and-isis',
  'study-after-velazquezs-portrait-of-pope-innocent-x',
  'balloon-dog-blue',
  'benefits-supervisor-sleeping'
];

const movementSlugsToDelete = [
  'photographie',
  'photograph',
  'art-contemporain',
  'art-global',
  'art-global-art-contemporain'
];

const artistSlugsToDelete = [
  'ansel-adams',
  'steve-mccurry',
  'sebastiao-salgado',
  'andreas-gursky',
  'francis-bacon',
  'anselm-kiefer',
  'jeff-koons',
  'lucian-freud'
];

async function cleanup() {
  console.log('Starting cleanup of photography and contemporary artworks...');

  // 1. Delete artworks
  for (const slug of artworkSlugsToDelete) {
    const art = await prisma.artworks.findUnique({ where: { slug } });
    if (art) {
      // Delete child records first if not cascaded by prisma client
      await prisma.artwork_translations.deleteMany({ where: { artwork_id: art.id } });
      await prisma.user_artwork_progress.deleteMany({ where: { artwork_id: art.id } });
      await prisma.user_favorites.deleteMany({ where: { artwork_id: art.id } });
      await prisma.user_reactions.deleteMany({ where: { artwork_id: art.id } });
      await prisma.artworks.delete({ where: { id: art.id } });
      console.log(`Deleted artwork: ${slug} (id: ${art.id})`);
    } else {
      console.log(`Artwork not found: ${slug}`);
    }
  }

  // 2. Delete empty movements
  for (const slug of movementSlugsToDelete) {
    const mov = await prisma.movements.findUnique({ where: { slug } });
    if (mov) {
      // Check if any artworks left
      const count = await prisma.artworks.count({ where: { movement_id: mov.id } });
      if (count === 0) {
        await prisma.movement_translations.deleteMany({ where: { movement_id: mov.id } });
        await prisma.movements.delete({ where: { id: mov.id } });
        console.log(`Deleted movement: ${slug} (id: ${mov.id})`);
      } else {
        console.log(`Movement ${slug} still has ${count} artworks, skipping delete.`);
      }
    }
  }

  // 3. Delete artists with 0 artworks
  for (const slug of artistSlugsToDelete) {
    const art = await prisma.artists.findUnique({ where: { slug } });
    if (art) {
      const count = await prisma.artworks.count({ where: { artist_id: art.id } });
      if (count === 0) {
        await prisma.artist_translations.deleteMany({ where: { artist_id: art.id } });
        await prisma.artists.delete({ where: { id: art.id } });
        console.log(`Deleted artist: ${slug} (id: ${art.id})`);
      } else {
        console.log(`Artist ${slug} still has ${count} artworks, skipping delete.`);
      }
    }
  }

  // 4. Update reference_artworks.json
  const refArtworksPath = path.join(__dirname, 'reference_artworks.json');
  if (fs.existsSync(refArtworksPath)) {
    const refArts = JSON.parse(fs.readFileSync(refArtworksPath, 'utf8'));
    const filteredArts = refArts.filter(a => !artworkSlugsToDelete.includes(a.slug));
    fs.writeFileSync(refArtworksPath, JSON.stringify(filteredArts, null, 2) + '\n');
    console.log(`Updated reference_artworks.json: removed ${refArts.length - filteredArts.length} items (${filteredArts.length} remaining)`);
  }

  // 5. Update reference_artists.json
  const refArtistsPath = path.join(__dirname, 'reference_artists.json');
  if (fs.existsSync(refArtistsPath)) {
    const refArtists = JSON.parse(fs.readFileSync(refArtistsPath, 'utf8'));
    const filteredArtists = refArtists.filter(a => !artistSlugsToDelete.includes(a.slug));
    fs.writeFileSync(refArtistsPath, JSON.stringify(filteredArtists, null, 2) + '\n');
    console.log(`Updated reference_artists.json: removed ${refArtists.length - filteredArtists.length} items (${filteredArtists.length} remaining)`);
  }

  // 6. Update reference_movements.json
  const refMovementsPath = path.join(__dirname, 'reference_movements.json');
  if (fs.existsSync(refMovementsPath)) {
    const refMovs = JSON.parse(fs.readFileSync(refMovementsPath, 'utf8'));
    const filteredMovs = refMovs.filter(m => !movementSlugsToDelete.includes(m.slug));
    fs.writeFileSync(refMovementsPath, JSON.stringify(filteredMovs, null, 2) + '\n');
    console.log(`Updated reference_movements.json: removed ${refMovs.length - filteredMovs.length} items (${filteredMovs.length} remaining)`);
  }

  const remainingCount = await prisma.artworks.count();
  console.log(`Total remaining artworks in DB: ${remainingCount}`);
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
