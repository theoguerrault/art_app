const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';
const DEFAULT_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

/**
 * Queries Wikidata to find the exact official P18 (Image) property for an artwork.
 * This guarantees the image is the artwork itself and is 100% free (Wikimedia Commons).
 */
export async function getWikidataImageUrl(title: string, artist: string, title_international?: string | null): Promise<string> {
  const query = `${title} ${artist}`;

  /** Strips diacritics so "Füssli" matches "fuseli", "Dürer" matches "durer", etc. */
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  try {
    let entityId: string | null = null;
    const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
    const nameParts = artist.split(' ').map(normalize);
    const lastName = nameParts.at(-1);
    const normalizedArtist = normalize(artist);

    /** Returns true if the Wikidata description contains the artist or any of their name parts. */
    const matchesArtist = (desc: string) => {
      const d = normalize(desc);
      return d.includes(normalizedArtist) || nameParts.some(p => p.length > 3 && d.includes(p));
    };

    // 0. Primary English Search if title_international is provided
    if (title_international) {
      const cleanTitleEn = title_international.replace(/\([^)]*\)/g, '').trim();
      const wdUrlTitleEn = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanTitleEn)}&language=en&format=json`;
      const wdResTitleEn = await fetch(wdUrlTitleEn, { headers: { 'User-Agent': USER_AGENT } });
      if (wdResTitleEn.ok) {
        const wdDataTitleEn = await wdResTitleEn.json();
        if (wdDataTitleEn.search && wdDataTitleEn.search.length > 0) {
          for (const result of wdDataTitleEn.search) {
            const desc = result.description || '';
            if (matchesArtist(desc)) {
              entityId = result.id;
              break;
            }
          }
        }
      }
    }
    
    // 1. Primary search: Wikidata API by title, looking for artist match in description
    const wdUrlTitle = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanTitle)}&language=fr&uselang=en&format=json`;
    const wdResTitle = await fetch(wdUrlTitle, { headers: { 'User-Agent': USER_AGENT } });
    
    if (wdResTitle.ok) {
      const wdDataTitle = await wdResTitle.json();
      if (wdDataTitle.search && wdDataTitle.search.length > 0) {
        for (const result of wdDataTitle.search) {
          const desc = result.description || '';

          if (matchesArtist(desc)) {
            entityId = result.id;
            break;
          }
        }
      }
    }

    // 1b. Try English search if French failed
    if (!entityId) {
      const wdUrlTitleEn = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cleanTitle)}&language=en&format=json`;
      const wdResTitleEn = await fetch(wdUrlTitleEn, { headers: { 'User-Agent': USER_AGENT } });
      if (wdResTitleEn.ok) {
        const wdDataTitleEn = await wdResTitleEn.json();
        if (wdDataTitleEn.search && wdDataTitleEn.search.length > 0) {
          for (const result of wdDataTitleEn.search) {
            const desc = result.description || '';
            if (matchesArtist(desc)) {
              entityId = result.id;
              break;
            }
          }
        }
      }
    }

    if (!entityId) {
      console.warn(`[WikidataClient] No Wikidata ID found for "${title}"`);
      return DEFAULT_IMAGE;
    }

    // 2. Get the entity claims from Wikidata
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json`;
    const entityRes = await fetch(entityUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!entityRes.ok) return DEFAULT_IMAGE;
    const entityData = await entityRes.json();

    const entity = entityData.entities[entityId];
    if (!entity || !entity.claims) return DEFAULT_IMAGE;

    // 3. Ensure it is not a human (Q5)
    const p31 = entity.claims.P31;
    if (p31 && p31.length > 0) {
      const isHuman = p31.some((claim: any) => claim.mainsnak?.datavalue?.value?.id === 'Q5');
      if (isHuman) {
        console.warn(`[WikidataClient] Search returned a human (artist) instead of the artwork for "${title}"`);
        return DEFAULT_IMAGE;
      }
    }

    // 4. Look for P18 (image property)
    const p18 = entity.claims.P18;
    if (p18 && p18.length > 0 && p18[0].mainsnak && p18[0].mainsnak.datavalue) {
      const filename = p18[0].mainsnak.datavalue.value;
      if (filename) {
        // Construct Wikimedia Commons URL
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
      }
    }
    
    return DEFAULT_IMAGE;
  } catch (err) {
    console.warn(`[WikidataClient] Failed to fetch image for "${title}":`, err);
    return DEFAULT_IMAGE;
  }
}
