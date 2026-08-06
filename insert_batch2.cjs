const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'pop-art', fr: 'Pop Art', en: 'Pop Art', century: '20th' },
  { slug: 'antiquite-art-classique', fr: 'Antiquité & Art classique', en: 'Antiquity & Classical Art', century: 'Antiquity' },
  { slug: 'baroque', fr: 'Baroque', en: 'Baroque', century: '17th' },
  { slug: 'haute-renaissance', fr: 'Haute Renaissance', en: 'High Renaissance', century: '16th' }
];

const artists = [
  { slug: 'jasper-johns', fr: 'Jasper Johns', en: 'Jasper Johns', dates: '1930-' },
  { slug: 'claes-oldenburg', fr: 'Claes Oldenburg', en: 'Claes Oldenburg', dates: '1929-2022' },
  { slug: 'anonyme-grece-antique', fr: 'Anonyme (Grèce antique)', en: 'Anonymous (Ancient Greece)', dates: 'Antiquity' },
  { slug: 'anonyme-egypte-antique', fr: 'Anonyme (Égypte antique)', en: 'Anonymous (Ancient Egypt)', dates: 'Antiquity' },
  { slug: 'caravaggio', fr: 'Caravaggio', en: 'Caravaggio', dates: '1571-1610' },
  { slug: 'peter-paul-rubens', fr: 'Peter Paul Rubens', en: 'Peter Paul Rubens', dates: '1577-1640' },
  { slug: 'gian-lorenzo-bernini', fr: 'Gian Lorenzo Bernini', en: 'Gian Lorenzo Bernini', dates: '1598-1680' },
  { slug: 'michel-ange', fr: 'Michel-Ange', en: 'Michelangelo', dates: '1475-1564' }
];

const artworks = [
  { slug: 'flag-jasper-johns', fr: 'Flag', en: 'Flag', artistSlug: 'jasper-johns', movementSlug: 'pop-art', date: '1955', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Jasper_Johns%27s_%27Flag%27%2C_Encaustic%2C_oil_and_collage_on_fabric_mounted_on_plywood%2C1954-55.jpg' },
  { slug: 'spoonbridge-and-cherry', fr: 'Spoonbridge and Cherry', en: 'Spoonbridge and Cherry', artistSlug: 'claes-oldenburg', movementSlug: 'pop-art', date: '1988', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/21/Spoonbridge_and_Cherry%2C_May_2008.jpg' },
  { slug: 'victoire-de-samothrace', fr: 'La Victoire de Samothrace', en: 'Winged Victory of Samothrace', artistSlug: 'anonyme-grece-antique', movementSlug: 'antiquite-art-classique', date: '-190', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Victoire_de_Samothrace_-_Musee_du_Louvre_-_20190812.jpg/960px-Victoire_de_Samothrace_-_Musee_du_Louvre_-_20190812.jpg' },
  { slug: 'venus-de-milo', fr: 'La Vénus de Milo', en: 'Venus de Milo', artistSlug: 'anonyme-grece-antique', movementSlug: 'antiquite-art-classique', date: '-100', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Front_views_of_the_Venus_de_Milo.jpg/960px-Front_views_of_the_Venus_de_Milo.jpg' },
  { slug: 'buste-de-nefertiti', fr: 'Le Buste de Néfertiti', en: 'Nefertiti Bust', artistSlug: 'anonyme-egypte-antique', movementSlug: 'antiquite-art-classique', date: '-1345', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Nofretete_Neues_Museum.jpg/960px-Nofretete_Neues_Museum.jpg' },
  { slug: 'appel-de-saint-matthieu', fr: 'L\'Appel de saint Matthieu', en: 'The Calling of St Matthew', artistSlug: 'caravaggio', movementSlug: 'baroque', date: '1600', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Caravaggio_%E2%80%94_The_Calling_of_Saint_Matthew.jpg/1280px-Caravaggio_%E2%80%94_The_Calling_of_Saint_Matthew.jpg' },
  { slug: 'massacre-des-innocents-rubens', fr: 'Le Massacre des Innocents', en: 'Massacre of the Innocents', artistSlug: 'peter-paul-rubens', movementSlug: 'baroque', date: '1612', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Rubens_-_Massacre_of_the_Innocents_-_Art_Gallery_of_Ontario_2.jpg/960px-Rubens_-_Massacre_of_the_Innocents_-_Art_Gallery_of_Ontario_2.jpg' },
  { slug: 'extase-de-sainte-therese', fr: 'L\'Extase de sainte Thérèse', en: 'Ecstasy of Saint Teresa', artistSlug: 'gian-lorenzo-bernini', movementSlug: 'baroque', date: '1652', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ecstasy_of_St._Teresa_HDR.jpg/960px-Ecstasy_of_St._Teresa_HDR.jpg' },
  { slug: 'le-jugement-dernier-michel-ange', fr: 'Le Jugement dernier', en: 'The Last Judgment', artistSlug: 'michel-ange', movementSlug: 'haute-renaissance', date: '1541', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Last_Judgement_%28Michelangelo%29.jpg/960px-Last_Judgement_%28Michelangelo%29.jpg' }
];

async function updateJson(filepath, newItem) {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch(e) {}
  const idx = data.findIndex(i => i.slug === newItem.slug);
  if (idx === -1) {
    data.push(newItem);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n");
  }
}

async function main() {
  let maxOrder = 0;
  const maxMv = await prisma.movements.findFirst({ orderBy: { chronological_order: 'desc' } });
  if (maxMv) maxOrder = maxMv.chronological_order;

  // Movements
  for (const m of movements) {
    let mv = await prisma.movements.findUnique({ where: { slug: m.slug } });
    if (!mv) {
      maxOrder += 1;
      mv = await prisma.movements.create({
        data: {
          slug: m.slug,
          century: m.century,
          oklch_token: 'var(--color-primary-500)',
          chronological_order: maxOrder,
          movement_translations: {
            create: [
              { language_code: 'en', name: m.en, short_description: '' },
              { language_code: 'fr', name: m.fr, short_description: '' }
            ]
          }
        }
      });
      console.log(`Created movement ${m.slug}`);
    }
    await updateJson(path.join(__dirname, 'reference_movements.json'), {
      original_name: m.slug,
      slug: m.slug,
      fr_name: m.fr,
      en_name: m.en,
      century: m.century
    });
  }

  // Artists
  for (const a of artists) {
    let ar = await prisma.artists.findUnique({ where: { slug: a.slug } });
    if (!ar) {
      ar = await prisma.artists.create({
        data: {
          slug: a.slug,
          artist_translations: {
            create: [
              { language_code: 'en', name: a.en, short_description: '' },
              { language_code: 'fr', name: a.fr, short_description: '' }
            ]
          }
        }
      });
      console.log(`Created artist ${a.slug}`);
    }
    await updateJson(path.join(__dirname, 'reference_artists.json'), {
      original_name: a.slug,
      slug: a.slug,
      fr_name: a.fr,
      en_name: a.en,
      fr_description: "",
      en_description: "",
      dates: a.dates
    });
  }

  // Artworks
  for (const w of artworks) {
    const artist = await prisma.artists.findUnique({ where: { slug: w.artistSlug } });
    const movement = await prisma.movements.findUnique({ where: { slug: w.movementSlug } });
    
    let aw = await prisma.artworks.findUnique({ where: { slug: w.slug } });
    if (!aw) {
      aw = await prisma.artworks.create({
        data: {
          slug: w.slug,
          artist_id: artist.id,
          movement_id: movement.id,
          creation_date: w.date,
          image_url_full: w.imageUrl,
          image_url_thumb: w.imageUrl,
          image_source: 'Wikipedia (Fair Use)',
          image_verified: true,
          artwork_translations: {
            create: [
              { language_code: 'en', title: w.en, main_article: '', verification_status: 'PENDING' },
              { language_code: 'fr', title: w.fr, main_article: '', verification_status: 'PENDING' }
            ]
          }
        }
      });
      console.log(`Created artwork ${w.slug}`);
    }
    await updateJson(path.join(__dirname, 'reference_artworks.json'), {
      original_name: w.slug,
      slug: w.slug,
      fr_title: w.fr,
      en_title: w.en,
      image_verified: true,
      image_url: w.imageUrl
    });
  }
}

main().then(async () => await prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
