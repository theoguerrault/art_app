const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getMuseumsForBatch(batch) {
  const prompt = `Tu es un conservateur de musée et expert renommé en histoire de l'art mondial.
Pour chaque œuvre d'art listée ci-dessous, indique avec la plus grande précision le musée, la galerie ou le lieu d'exposition actuel (avec la ville) en français.
Règles :
1. Format : "Nom du musée / lieu, Ville" (Exemples : "Musée du Louvre, Paris", "Musée d'Orsay, Paris", "National Gallery, Londres", "Museum of Modern Art (MoMA), New York", "Galleria degli Uffizi, Florence", "Rijksmuseum, Amsterdam", "Alte Pinakothek, Munich", "Musée du Prado, Madrid", "Art Institute of Chicago, Chicago").
2. Si l'œuvre est dans une église/chapelle : "Nom de l'église, Ville" (ex: "Église Sainte-Marie-des-Grâces, Milan", "Chapelle Sixtine, Vatican").
3. Si c'est du Street Art in situ : "Lieu in situ, Ville" (ex: "Mur public, Bristol", "Lower East Side, New York") ou "Localisation variable / Street Art".
4. Si c'est dans une collection privée : "Collection privée" ou "Collection particulière".
5. Si détruite ou perdue : "Œuvre détruite" ou "Localisation inconnue".

Liste des œuvres :
${batch.map((a, i) => `${i + 1}. Titre: "${a.artwork_translations[0]?.title || a.slug}" | Artiste: "${a.artists?.artist_translations[0]?.name || a.artists?.slug}" | Date: "${a.creation_date}" | Slug: "${a.slug}"`).join('\n')}

Réponds STRICTEMENT au format JSON :
{
  "results": [
    { "slug": "slug-de-l-oeuvre", "musee": "Nom du musée, Ville" }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  const parsed = JSON.parse(response.text);
  return parsed.results || [];
}

async function main() {
  console.log('Fetching all artworks from DB...');
  const artworks = await prisma.artworks.findMany({
    include: {
      artists: { include: { artist_translations: { where: { language_code: 'fr' } } } },
      artwork_translations: { where: { language_code: 'fr' } },
      movements: { include: { movement_translations: { where: { language_code: 'fr' } } } }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${artworks.length} artworks to process.`);
  const batchSize = 25;
  const museumMap = new Map();

  for (let i = 0; i < artworks.length; i += batchSize) {
    const batch = artworks.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(artworks.length / batchSize);
    process.stdout.write(`Processing batch ${batchNum}/${totalBatches} (${batch.length} items)... `);
    
    try {
      const results = await getMuseumsForBatch(batch);
      for (const res of results) {
        if (res && res.slug && res.musee) {
          museumMap.set(res.slug, res.musee);
        }
      }
      console.log(`OK (got ${results.length} results)`);
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
    }
  }

  console.log(`\nSuccessfully resolved ${museumMap.size}/${artworks.length} artwork locations.`);

  // 1. Update Database
  console.log('Updating database records...');
  let updatedDbCount = 0;
  for (const art of artworks) {
    const musee = museumMap.get(art.slug) || 'Collection particulière';
    await prisma.artworks.update({
      where: { id: art.id },
      data: { musee }
    });
    updatedDbCount++;
  }
  console.log(`Updated ${updatedDbCount} records in database.`);

  // 2. Update reference_artworks.json
  const refPath = path.join(__dirname, '../reference_artworks.json');
  if (fs.existsSync(refPath)) {
    const refData = JSON.parse(fs.readFileSync(refPath, 'utf8'));
    let updatedRefCount = 0;
    for (const item of refData) {
      if (museumMap.has(item.slug)) {
        item.musee = museumMap.get(item.slug);
        updatedRefCount++;
      }
    }
    fs.writeFileSync(refPath, JSON.stringify(refData, null, 2) + '\n');
    console.log(`Updated ${updatedRefCount} items in reference_artworks.json.`);
  }

  console.log('\nAll artworks successfully enriched with museum location!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
