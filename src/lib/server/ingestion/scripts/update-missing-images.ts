import { PrismaClient } from '@prisma/client';
import { imageOrchestrator } from '../providers/ImageOrchestrator';

const prisma = new PrismaClient();

const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Démarrage de la vérification des images manquantes ou invalides...');
  
  const oeuvresRaw = await prisma.oeuvres.findMany({
    select: {
      id: true,
      date_creation: true,
      image_url_full: true,
      image_url_thumb: true,
      oeuvre_translations: { where: { language_code: 'fr' }, select: { titre: true } },
      artistes: { select: { artiste_translations: { where: { language_code: 'fr' }, select: { nom: true } } } }
    }
  });

  const oeuvres = oeuvresRaw.map(o => ({
    id: o.id,
    titre: o.oeuvre_translations[0]?.titre || 'Inconnu',
    titre_international: o.oeuvre_translations[0]?.titre || 'Inconnu',
    date_creation: o.date_creation,
    image_url_full: o.image_url_full,
    image_url_thumb: o.image_url_thumb,
    artistes: { nom: o.artistes?.artiste_translations[0]?.nom || '' }
  }));

  let updatedCount = 0;

  for (const oeuvre of oeuvres) {
    let isImageMissingOrBroken = false;
    let isLowResFairUse = false;

    if (!oeuvre.image_url_full || oeuvre.image_url_full.trim() === '') {
      isImageMissingOrBroken = true;
    } else if (
      oeuvre.image_url_full.includes('No_image_available.svg') ||
      oeuvre.image_url_full.includes('Defaut.svg') ||
      oeuvre.image_url_full.includes('Defaut_2.svg')
    ) {
      isImageMissingOrBroken = true;
      console.log(`[ID: ${oeuvre.id}] Placeholder par défaut détecté pour "${oeuvre.titre}".`);
    } else if (
      oeuvre.image_url_full.includes('wikipedia.org') &&
      !oeuvre.image_url_full.includes('commons')
    ) {
      isLowResFairUse = true;
      console.log(`[ID: ${oeuvre.id}] Miniature "Fair Use" détectée pour "${oeuvre.titre}".`);
    } else {
      // Check if image link is broken (404). We wait 500ms to avoid rate limits (429).
      try {
        const res = await fetch(oeuvre.image_url_full, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
        if (res.status === 404) {
          isImageMissingOrBroken = true;
          console.log(`[ID: ${oeuvre.id}] Lien mort (404) détecté pour "${oeuvre.titre}".`);
        } else if (res.status === 429) {
          // Rate limited, assume valid to not falsely overwrite
        }
      } catch (err) {
        // Network error, assume broken
        isImageMissingOrBroken = true;
        console.log(`[ID: ${oeuvre.id}] Erreur réseau lors du test de "${oeuvre.titre}".`);
      }
      await sleep(500); // 500ms delay between HEAD requests
    }

    if (isImageMissingOrBroken || isLowResFairUse) {
      let newFull: string | null = null;
      let newThumb: string | null = null;
      let newSource: string | null = null;
      let newRights: string | null = null;

      console.log(`[ID: ${oeuvre.id}] ❌ Recherche d'une image via l'Orchestrateur...`);
      const imageResult = await imageOrchestrator.findBestImage(
        oeuvre.titre,
        oeuvre.artistes?.nom || '',
        oeuvre.titre_international
      );

      if (imageResult) {
        newFull = imageResult.fullUrl;
        newThumb = imageResult.thumbUrl;
        newSource = imageResult.source;
        newRights = imageResult.rights;
      }

      if (newFull && newThumb) {
        await prisma.oeuvres.update({
          where: { id: oeuvre.id },
          data: {
            image_url_full: newFull,
            image_url_thumb: newThumb,
            image_source: newSource,
            image_rights: newRights
          }
        });
        
        console.log(`✅ Image mise à jour pour "${oeuvre.titre}".`);
        await sleep(2000);
        updatedCount++;
      } else {
        console.log(`❌ Impossible de trouver une image pour "${oeuvre.titre}".`);
        await sleep(2000);
      }
    }
  }

  console.log(`\nTerminé ! ${updatedCount} œuvre(s) mise(s) à jour.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
