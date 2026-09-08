const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'art-nouveau', fr: 'Art Nouveau', en: 'Art Nouveau', century: 'Fin XIXe - Début XXe siècle' },
  { slug: 'art-deco', fr: 'Art Déco', en: 'Art Deco', century: '1920–1939' },
  { slug: 'baroque', fr: 'Baroque', en: 'Baroque', century: 'XVIIe siècle' }
];

const artists = [
  { slug: 'alphonse-mucha', fr: 'Alphonse Mucha', en: 'Alphonse Mucha', dates: '1860-1939' },
  { slug: 'j-c-leyendecker', fr: 'J. C. Leyendecker', en: 'J. C. Leyendecker', dates: '1874-1951' },
  { slug: 'gian-lorenzo-bernini', fr: 'Gian Lorenzo Bernini', en: 'Gian Lorenzo Bernini', dates: '1598-1680' }
];

const artworks = [
  // Alphonse Mucha
  {
    slug: 'zodiac',
    fr: 'Zodiaque',
    en: 'Zodiac',
    artistSlug: 'alphonse-mucha',
    movementSlug: 'art-nouveau',
    date: '1896',
    musee: 'Mucha Museum, Prague',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Alphonse_Mucha_-_Zodiac%2C_1869.jpg',
    aspectRatio: 0.72
  },
  {
    slug: 'gismonda',
    fr: 'Gismonda',
    en: 'Gismonda',
    artistSlug: 'alphonse-mucha',
    movementSlug: 'art-nouveau',
    date: '1894',
    musee: 'Musée d\'Orsay, Paris',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Alfons_Mucha_-_1894_-_Gismonda.jpg',
    aspectRatio: 0.35
  },
  {
    slug: 'job',
    fr: 'Job',
    en: 'Job',
    artistSlug: 'alphonse-mucha',
    movementSlug: 'art-nouveau',
    date: '1896',
    musee: 'Musée des Arts Décoratifs, Paris',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Mucha-job.jpg',
    aspectRatio: 0.73
  },
  // J. C. Leyendecker
  {
    slug: 'arrow-collar-man',
    fr: 'L\'Homme Arrow Collar',
    en: 'The Arrow Collar Man',
    artistSlug: 'j-c-leyendecker',
    movementSlug: 'art-deco',
    date: '1927',
    musee: 'National Museum of American Illustration, Newport',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Arrow_Collars_and_Shirts_-1927A.jpg',
    aspectRatio: 0.77
  },
  {
    slug: 'baby-new-year-1930',
    fr: 'Bébé du Nouvel An 1930 (Saturday Evening Post)',
    en: 'Baby New Year 1930 (Saturday Evening Post)',
    artistSlug: 'j-c-leyendecker',
    movementSlug: 'art-deco',
    date: '1929',
    musee: 'National Museum of American Illustration, Newport',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Saturday_Evening_Post_Baby_New_Year_1930.jpg',
    aspectRatio: 0.73
  },
  {
    slug: 'football-players',
    fr: 'Joueurs de football américain',
    en: 'Football Players',
    artistSlug: 'j-c-leyendecker',
    movementSlug: 'art-deco',
    date: '1909',
    musee: 'National Museum of American Illustration, Newport',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Leyendecker_Football.jpg',
    aspectRatio: 0.75
  },
  // Gian Lorenzo Bernini
  {
    slug: 'the-rape-of-proserpina',
    fr: 'Le Rapt de Proserpine',
    en: 'The Rape of Proserpina',
    artistSlug: 'gian-lorenzo-bernini',
    movementSlug: 'baroque',
    date: '1621-1622',
    musee: 'Galerie Borghèse, Rome',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Rape_of_Prosepina_September_2015-3a.jpg',
    aspectRatio: 0.65
  },
  {
    slug: 'david-bernini',
    fr: 'David',
    en: 'David',
    artistSlug: 'gian-lorenzo-bernini',
    movementSlug: 'baroque',
    date: '1623-1624',
    musee: 'Galerie Borghèse, Rome',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/David_by_Bernini%2C_1623-1624%2C_Villa_Borghese%2C_Rome.jpg',
    aspectRatio: 1.33
  },
  {
    slug: 'medusa-bernini',
    fr: 'Méduse',
    en: 'Medusa',
    artistSlug: 'gian-lorenzo-bernini',
    movementSlug: 'baroque',
    date: '1640',
    musee: 'Musées du Capitole, Rome',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Medusa_by_Bernini.jpg',
    aspectRatio: 0.67
  }
];

async function updateJson(filepath, newItem) {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch(e) {}
  const idx = data.findIndex(i => i.slug === newItem.slug);
  if (idx === -1) {
    data.push(newItem);
  } else {
    data[idx] = { ...data[idx], ...newItem };
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + "\n");
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
          dates: a.dates,
          artist_translations: {
            create: [
              { language_code: 'en', name: a.en, short_description: '' },
              { language_code: 'fr', name: a.fr, short_description: '' }
            ]
          }
        }
      });
      console.log(`Created artist ${a.slug}`);
    } else {
      console.log(`Artist already exists: ${a.slug}`);
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
    
    if (!artist || !movement) {
      console.error(`Missing artist (${w.artistSlug}) or movement (${w.movementSlug}) for ${w.slug}`);
      continue;
    }

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
          image_source: 'Wikimedia Commons',
          image_verified: true,
          is_active: true,
          musee: w.musee,
          aspect_ratio: w.aspectRatio || 1.33,
          artwork_translations: {
            create: [
              { language_code: 'en', title: w.en, main_article: '', verification_status: 'PENDING' },
              { language_code: 'fr', title: w.fr, main_article: '', verification_status: 'PENDING' }
            ]
          }
        }
      });
      console.log(`Created artwork ${w.slug}`);
    } else {
      console.log(`Artwork already exists: ${w.slug}`);
    }
    await updateJson(path.join(__dirname, 'reference_artworks.json'), {
      original_name: w.slug,
      slug: w.slug,
      fr_title: w.fr,
      en_title: w.en,
      image_verified: true,
      image_url: w.imageUrl,
      musee: w.musee
    });
  }
}

main().then(async () => await prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
