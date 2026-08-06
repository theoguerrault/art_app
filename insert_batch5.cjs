const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'haute-renaissance', fr: 'Haute Renaissance', en: 'High Renaissance', century: '16th' },
  { slug: 'romantisme', fr: 'Romantisme', en: 'Romanticism', century: '19th' },
  { slug: 'neoclassicisme', fr: 'Néoclassicisme', en: 'Neoclassicism', century: '18th-19th' },
  { slug: 'renaissance', fr: 'Renaissance', en: 'Renaissance', century: '15th-16th' },
  { slug: 'realisme', fr: 'Réalisme', en: 'Realism', century: '19th' }
];

const artists = [
  { slug: 'titian', fr: 'Titien', en: 'Titian', dates: '1488-1576' },
  { slug: 'ilya-repin', fr: 'Ilia Répine', en: 'Ilya Repin', dates: '1844-1930' },
  { slug: 'jacques-louis-david', fr: 'Jacques-Louis David', en: 'Jacques-Louis David', dates: '1748-1825' },
  { slug: 'albrecht-durer', fr: 'Albrecht Dürer', en: 'Albrecht Dürer', dates: '1471-1528' }
];

const artworks = [
  { slug: 'venus-of-urbino', fr: 'La Vénus d\'Urbino', en: 'Venus of Urbino', artistSlug: 'titian', movementSlug: 'haute-renaissance', date: '1538', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tiziano_-_Venere_di_Urbino_-_Google_Art_Project.jpg/960px-Tiziano_-_Venere_di_Urbino_-_Google_Art_Project.jpg' },
  { slug: 'autoportrait-fourrure-durer', fr: 'Autoportrait à la fourrure', en: 'Self-Portrait, Munich', artistSlug: 'albrecht-durer', movementSlug: 'renaissance', date: '1500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/D%C3%BCrer_Alte_Pinakothek.jpg/960px-D%C3%BCrer_Alte_Pinakothek.jpg' },
  { slug: 'intervention-des-sabines', fr: 'L\'Intervention des Sabines', en: 'The Intervention of the Sabine Women', artistSlug: 'jacques-louis-david', movementSlug: 'neoclassicisme', date: '1799', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/The_Intervention_of_the_Sabine_Women_-_David_%28Louvre_INV_3691%29.jpg/960px-The_Intervention_of_the_Sabine_Women_-_David_%28Louvre_INV_3691%29.jpg' },
  { slug: 'haleurs-de-la-volga', fr: 'Les Haleurs de la Volga', en: 'Barge Haulers on the Volga', artistSlug: 'ilya-repin', movementSlug: 'romantisme', date: '1873', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Ilia_Efimovich_Repin_%281844-1930%29_-_Volga_Boatmen_%281870-1873%29.jpg/960px-Ilia_Efimovich_Repin_%281844-1930%29_-_Volga_Boatmen_%281870-1873%29.jpg' },
  { slug: 'enterrement-a-ornans', fr: 'Un enterrement à Ornans', en: 'A Burial at Ornans', artistSlug: 'gustave-courbet', movementSlug: 'realisme', date: '1850', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Gustave_Courbet_-_A_Burial_at_Ornans_-_Google_Art_Project_2.jpg/960px-Gustave_Courbet_-_A_Burial_at_Ornans_-_Google_Art_Project_2.jpg' },
  { slug: 'absinthe-degas', fr: 'L\'Absinthe', en: 'L\'Absinthe', artistSlug: 'edgar-degas', movementSlug: 'impressionnisme', date: '1876', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Edgar_Degas_-_In_a_Caf%C3%A9_-_Google_Art_Project_2.jpg/960px-Edgar_Degas_-_In_a_Caf%C3%A9_-_Google_Art_Project_2.jpg' },
  { slug: 'grandes-baigneuses-cezanne', fr: 'Les Grandes Baigneuses', en: 'The Bathers', artistSlug: 'paul-cezanne', movementSlug: 'post-impressionnisme', date: '1906', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Paul_C%C3%A9zanne%2C_French_-_The_Large_Bathers_-_Google_Art_Project.jpg/960px-Paul_C%C3%A9zanne%2C_French_-_The_Large_Bathers_-_Google_Art_Project.jpg' },
  { slug: 'dou-venons-nous', fr: 'D\'où venons-nous ? Que sommes-nous ? Où allons-nous ?', en: 'Where Do We Come From? What Are We? Where Are We Going?', artistSlug: 'paul-gauguin', movementSlug: 'post-impressionnisme', date: '1897', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Gauguin_-_Where_Do_We_Come_From%3F_What_Are_We%3F_Where_Are_We_Going%3F_%281897-98%29.jpg/960px-Gauguin_-_Where_Do_We_Come_From%3F_What_Are_We%3F_Where_Are_We_Going%3F_%281897-98%29.jpg' }
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
