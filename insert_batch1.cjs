const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'sculpture-moderne', fr: 'Sculpture Moderne', en: 'Modern Sculpture', century: '19th-20th' },
  { slug: 'art-deco', fr: 'Art Déco', en: 'Art Deco', century: '20th' },
  { slug: 'suprematisme', fr: 'Suprématisme', en: 'Suprematism', century: '20th' },
  { slug: 'modernisme-americain', fr: 'Modernisme Américain', en: 'American Modernism', century: '20th' }
];

const artists = [
  { slug: 'auguste-rodin', fr: 'Auguste Rodin', en: 'Auguste Rodin', dates: '1840-1917' },
  { slug: 'louise-bourgeois', fr: 'Louise Bourgeois', en: 'Louise Bourgeois', dates: '1911-2010' },
  { slug: 'tamara-de-lempicka', fr: 'Tamara de Lempicka', en: 'Tamara de Lempicka', dates: '1898-1980' },
  { slug: 'kazimir-malevitch', fr: 'Kazimir Malevitch', en: 'Kazimir Malevich', dates: '1879-1935' },
  { slug: 'georgia-okeeffe', fr: 'Georgia O\'Keeffe', en: 'Georgia O\'Keeffe', dates: '1887-1986' }
];

const artworks = [
  { slug: 'le-penseur', fr: 'Le Penseur', en: 'The Thinker', artistSlug: 'auguste-rodin', movementSlug: 'sculpture-moderne', date: '1904', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Le_Penseur_by_Rodin_%28Kunsthalle_Bielefeld%29_2014-04-10.JPG/960px-Le_Penseur_by_Rodin_%28Kunsthalle_Bielefeld%29_2014-04-10.JPG' },
  { slug: 'le-baiser-rodin', fr: 'Le Baiser', en: 'The Kiss', artistSlug: 'auguste-rodin', movementSlug: 'sculpture-moderne', date: '1882', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Rodin_-_Le_Baiser_06.jpg/960px-Rodin_-_Le_Baiser_06.jpg' },
  { slug: 'les-bourgeois-de-calais', fr: 'Les Bourgeois de Calais', en: 'The Burghers of Calais', artistSlug: 'auguste-rodin', movementSlug: 'sculpture-moderne', date: '1889', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Statue_bourgeois_calais_rodin.jpg/960px-Statue_bourgeois_calais_rodin.jpg' },
  { slug: 'maman', fr: 'Maman', en: 'Maman', artistSlug: 'louise-bourgeois', movementSlug: 'sculpture-moderne', date: '1999', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Giant_spider_strikes_again%21.jpg/960px-Giant_spider_strikes_again%21.jpg' },
  { slug: 'autoportrait-bugatti-verte', fr: 'Autoportrait dans la Bugatti verte', en: 'Self-Portrait in the Green Bugatti', artistSlug: 'tamara-de-lempicka', movementSlug: 'art-deco', date: '1929', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Tamara_de_Lempicka%2C_Autoportrait_%28Tamara_in_a_Green_Bugatti%29.jpeg' },
  { slug: 'carre-noir-sur-fond-blanc', fr: 'Carré noir sur fond blanc', en: 'Black Square', artistSlug: 'kazimir-malevitch', movementSlug: 'suprematisme', date: '1915', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Kazimir_Malevich%2C_1915%2C_Black_Suprematic_Square%2C_oil_on_linen_canvas%2C_79.5_x_79.5_cm%2C_Tretyakov_Gallery%2C_Moscow.jpg/1280px-Kazimir_Malevich%2C_1915%2C_Black_Suprematic_Square%2C_oil_on_linen_canvas%2C_79.5_x_79.5_cm%2C_Tretyakov_Gallery%2C_Moscow.jpg' },
  { slug: 'jimson-weed-white-flower-no-1', fr: 'Jimson Weed/White Flower No. 1', en: 'Jimson Weed/White Flower No. 1', artistSlug: 'georgia-okeeffe', movementSlug: 'modernisme-americain', date: '1932', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/07/Jimson_Weed_by_Georgia_O%27Keeffe.jpg' }
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
  // Movements
  let maxOrder = 0;
  const maxMv = await prisma.movements.findFirst({ orderBy: { chronological_order: 'desc' } });
  if (maxMv) maxOrder = maxMv.chronological_order;

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
      en_name: m.en
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
