const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const movements = [
  { slug: 'photographie', fr: 'Photographie', en: 'Photography', century: '19th-20th' },
  { slug: 'art-global-art-contemporain', fr: 'Art Global & Art Contemporain', en: 'Global & Contemporary Art', century: 'Late 20th - 21st' },
  { slug: 'street-art', fr: 'Street Art', en: 'Street Art', century: '20th-21st' }
];

const artists = [
  { slug: 'ansel-adams', fr: 'Ansel Adams', en: 'Ansel Adams', dates: '1902-1984' },
  { slug: 'steve-mccurry', fr: 'Steve McCurry', en: 'Steve McCurry', dates: '1950-' },
  { slug: 'sebastiao-salgado', fr: 'Sebastião Salgado', en: 'Sebastião Salgado', dates: '1944-' },
  { slug: 'francis-bacon', fr: 'Francis Bacon', en: 'Francis Bacon', dates: '1909-1992' },
  { slug: 'jean-michel-basquiat', fr: 'Jean-Michel Basquiat', en: 'Jean-Michel Basquiat', dates: '1960-1988' }
];

const artworks = [
  { slug: 'moonrise-hernandez-new-mexico', fr: 'Moonrise, Hernandez, New Mexico', en: 'Moonrise, Hernandez, New Mexico', artistSlug: 'ansel-adams', movementSlug: 'photographie', date: '1941', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Moonrise%2C_Hernandez%2C_New_Mexico_%28cropped%29.jpg/960px-Moonrise%2C_Hernandez%2C_New_Mexico_%28cropped%29.jpg' },
  { slug: 'afghan-girl', fr: 'Afghan Girl', en: 'Afghan Girl', artistSlug: 'steve-mccurry', movementSlug: 'photographie', date: '1984', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Sharbat_Gula.jpg' },
  { slug: 'serra-pelada-gold-mine', fr: 'Serra Pelada Gold Mine', en: 'Serra Pelada Gold Mine', artistSlug: 'sebastiao-salgado', movementSlug: 'photographie', date: '1986', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Serra_Pelada.jpg/960px-Serra_Pelada.jpg' },
  { slug: 'three-studies-for-figures', fr: 'Three Studies for Figures at the Base of a Crucifixion', en: 'Three Studies for Figures at the Base of a Crucifixion', artistSlug: 'francis-bacon', movementSlug: 'art-global-art-contemporain', date: '1944', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/11/Three_Studies_for_Figures_at_the_Base_of_a_Crucifixion.jpg' },
  { slug: 'boy-and-dog-in-a-johnnypump', fr: 'Boy and Dog in a Johnnypump', en: 'Boy and Dog in a Johnnypump', artistSlug: 'jean-michel-basquiat', movementSlug: 'street-art', date: '1982', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/78/Boy-and-Dog-in-Johnnypump-1982.jpg' },
  { slug: 'irony-of-negro-policeman', fr: 'Irony of Negro Policeman', en: 'Irony of Negro Policeman', artistSlug: 'jean-michel-basquiat', movementSlug: 'street-art', date: '1981', imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Basquiat-irony-of-negro-policeman-1981.jpg' }
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
