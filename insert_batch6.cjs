const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'peinture-metaphysique', fr: 'Peinture métaphysique', en: 'Metaphysical Art', century: '20th' },
  { slug: 'surrealisme', fr: 'Surréalisme', en: 'Surrealism', century: '20th' },
  { slug: 'dadaisme', fr: 'Dadaïsme', en: 'Dadaism', century: '20th' },
  { slug: 'fauvisme', fr: 'Fauvisme', en: 'Fauvism', century: '20th' },
  { slug: 'expressionnisme', fr: 'Expressionnisme', en: 'Expressionism', century: '19th-20th' },
  { slug: 'pop-art', fr: 'Pop Art', en: 'Pop Art', century: '20th' }
];

const artists = [
  { slug: 'giorgio-de-chirico', fr: 'Giorgio de Chirico', en: 'Giorgio de Chirico', dates: '1888-1978' },
  { slug: 'max-ernst', fr: 'Max Ernst', en: 'Max Ernst', dates: '1891-1976' },
  { slug: 'rene-magritte', fr: 'René Magritte', en: 'René Magritte', dates: '1898-1967' },
  { slug: 'yves-tanguy', fr: 'Yves Tanguy', en: 'Yves Tanguy', dates: '1900-1955' },
  { slug: 'man-ray', fr: 'Man Ray', en: 'Man Ray', dates: '1890-1976' },
  { slug: 'marcel-duchamp', fr: 'Marcel Duchamp', en: 'Marcel Duchamp', dates: '1887-1968' },
  { slug: 'henri-matisse', fr: 'Henri Matisse', en: 'Henri Matisse', dates: '1869-1954' },
  { slug: 'oskar-kokoschka', fr: 'Oskar Kokoschka', en: 'Oskar Kokoschka', dates: '1886-1980' },
  { slug: 'richard-hamilton', fr: 'Richard Hamilton', en: 'Richard Hamilton', dates: '1922-2011' }
];

const artworks = [
  { slug: 'mystery-melancholy-street', fr: 'Mystère et mélancolie d\'une rue', en: 'Mystery and Melancholy of a Street', artistSlug: 'giorgio-de-chirico', movementSlug: 'peinture-metaphysique', date: '1914', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Giorgio_de_Chirico_-_Mystery_and_Melancholy_of_a_Street_%281914%29.jpg' },
  { slug: 'the-elephant-celebes', fr: 'L\'Éléphant Célèbes', en: 'The Elephant Celebes', artistSlug: 'max-ernst', movementSlug: 'surrealisme', date: '1921', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/The_Elephant_Celebes.jpg/960px-The_Elephant_Celebes.jpg' },
  { slug: 'empire-of-lights', fr: 'L\'Empire des lumières', en: 'The Empire of Lights', artistSlug: 'rene-magritte', movementSlug: 'surrealisme', date: '1954', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8f/The_Empire_of_Light_Belgium.jpg' },
  { slug: 'mama-papa-is-wounded', fr: 'Maman, Papa est blessé !', en: 'Mama, Papa is Wounded!', artistSlug: 'yves-tanguy', movementSlug: 'surrealisme', date: '1927', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mama%2C_Papa_is_Wounded%21.jpg/960px-Mama%2C_Papa_is_Wounded%21.jpg' },
  { slug: 'ingres-violin', fr: 'Le Violon d\'Ingres', en: 'Ingres\'s Violin', artistSlug: 'man-ray', movementSlug: 'dadaisme', date: '1924', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Le_Violon_d%27Ingres.png/960px-Le_Violon_d%27Ingres.png' },
  { slug: 'l-h-o-o-q', fr: 'L.H.O.O.Q.', en: 'L.H.O.O.Q.', artistSlug: 'marcel-duchamp', movementSlug: 'dadaisme', date: '1919', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Marcel_Duchamp%2C_1919%2C_L.H.O.O.Q.jpg/960px-Marcel_Duchamp%2C_1919%2C_L.H.O.O.Q.jpg' },
  { slug: 'blue-nude-ii', fr: 'Nu bleu II', en: 'Blue Nude II', artistSlug: 'henri-matisse', movementSlug: 'fauvisme', date: '1952', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/78/Blue_Nudes_Henri_Matisse.jpg' },
  { slug: 'bride-of-the-wind', fr: 'La Fiancée du vent', en: 'The Bride of the Wind', artistSlug: 'oskar-kokoschka', movementSlug: 'expressionnisme', date: '1913', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/%27Bride_of_the_Wind%27%2C_oil_on_canvas_painting_by_Oskar_Kokoschka%2C_a_self-portrait_expressing_his_unrequited_love_for_Alma_Mahler_%28widow_of_composer_Gustav_Mahler%29%2C_1913.jpg/960px-thumbnail.jpg' },
  { slug: 'just-what-is-it-that-makes-todays-homes-so-different', fr: 'Qu\'est-ce qui rend exactement les maisons d\'aujourd\'hui si différentes, si séduisantes ?', en: 'Just what is it that makes today\'s homes so different, so appealing?', artistSlug: 'richard-hamilton', movementSlug: 'pop-art', date: '1956', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/ff/Hamilton-appealing2.jpg' }
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
