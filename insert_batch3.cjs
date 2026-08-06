const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'impressionnisme', fr: 'Impressionnisme', en: 'Impressionism', century: '19th' },
  { slug: 'post-impressionnisme', fr: 'Post-Impressionnisme', en: 'Post-Impressionism', century: '19th' },
  { slug: 'expressionnisme', fr: 'Expressionnisme', en: 'Expressionism', century: '19th-20th' },
  { slug: 'cubisme', fr: 'Cubisme', en: 'Cubism', century: '20th' },
  { slug: 'surrealisme', fr: 'Surréalisme', en: 'Surrealism', century: '20th' }
];

const artists = [
  { slug: 'claude-monet', fr: 'Claude Monet', en: 'Claude Monet', dates: '1840-1926' },
  { slug: 'vincent-van-gogh', fr: 'Vincent van Gogh', en: 'Vincent van Gogh', dates: '1853-1890' },
  { slug: 'edvard-munch', fr: 'Edvard Munch', en: 'Edvard Munch', dates: '1863-1944' },
  { slug: 'marcel-duchamp', fr: 'Marcel Duchamp', en: 'Marcel Duchamp', dates: '1887-1968' },
  { slug: 'pablo-picasso', fr: 'Pablo Picasso', en: 'Pablo Picasso', dates: '1881-1973' },
  { slug: 'salvador-dali', fr: 'Salvador Dalí', en: 'Salvador Dalí', dates: '1904-1989' },
  { slug: 'rene-magritte', fr: 'René Magritte', en: 'René Magritte', dates: '1898-1967' }
];

const artworks = [
  { slug: 'la-ronde-de-nuit', fr: 'La Ronde de nuit', en: 'The Night Watch', artistSlug: 'rembrandt', movementSlug: 'dutch-golden-age', date: '1642', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/La_ronda_de_noche%2C_por_Rembrandt_van_Rijn.jpg/960px-La_ronda_de_noche%2C_por_Rembrandt_van_Rijn.jpg' },
  { slug: 'impression-soleil-levant', fr: 'Impression, soleil levant', en: 'Impression, Sunrise', artistSlug: 'claude-monet', movementSlug: 'impressionnisme', date: '1872', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Monet_-_Impression%2C_Sunrise.jpg/960px-Monet_-_Impression%2C_Sunrise.jpg' },
  { slug: 'autoportrait-oreille-bandee', fr: 'Autoportrait à l\'oreille bandée', en: 'Self-Portrait with Bandaged Ear', artistSlug: 'vincent-van-gogh', movementSlug: 'post-impressionnisme', date: '1889', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Vincent_van_Gogh_-_Self-portrait_with_bandaged_ear_%281889%2C_Courtauld_Institute%29.jpg/960px-Vincent_van_Gogh_-_Self-portrait_with_bandaged_ear_%281889%2C_Courtauld_Institute%29.jpg' },
  { slug: 'champ-de-ble-aux-corbeaux', fr: 'Champ de blé aux corbeaux', en: 'Wheatfield with Crows', artistSlug: 'vincent-van-gogh', movementSlug: 'post-impressionnisme', date: '1890', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Korenveld_met_kraaien_-_s0149V1962_-_Van_Gogh_Museum.jpg/960px-Korenveld_met_kraaien_-_s0149V1962_-_Van_Gogh_Museum.jpg' },
  { slug: 'le-cri', fr: 'Le Cri', en: 'The Scream', artistSlug: 'edvard-munch', movementSlug: 'expressionnisme', date: '1893', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Edvard_Munch_-_The_Scream.jpg/960px-Edvard_Munch_-_The_Scream.jpg' },
  { slug: 'nu-descendant-un-escalier-n2', fr: 'Nu descendant un escalier (N°2)', en: 'Nude Descending a Staircase, No. 2', artistSlug: 'marcel-duchamp', movementSlug: 'cubisme', date: '1912', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Duchamp_-_Nude_Descending_a_Staircase.jpg/960px-Duchamp_-_Nude_Descending_a_Staircase.jpg' },
  { slug: 'les-demoiselles-davignon', fr: 'Les Demoiselles d\'Avignon', en: 'Les Demoiselles d\'Avignon', artistSlug: 'pablo-picasso', movementSlug: 'cubisme', date: '1907', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Les_Demoiselles_d%27Avignon.jpg/960px-Les_Demoiselles_d%27Avignon.jpg' },
  { slug: 'la-persistance-de-la-memoire', fr: 'La Persistance de la mémoire', en: 'The Persistence of Memory', artistSlug: 'salvador-dali', movementSlug: 'surrealisme', date: '1931', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg' },
  { slug: 'le-fils-de-lhomme', fr: 'Le Fils de l\'homme', en: 'The Son of Man', artistSlug: 'rene-magritte', movementSlug: 'surrealisme', date: '1964', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Magritte_TheSonOfMan.jpg' }
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
