export interface ArtworkData {
  id: string | number;
  title: string;
  artist_title: string | null;
  date_display: string | null;
  medium_display: string | null;
  dimensions: string | null;
  style_title: string | null;
  department_title: string | null; // Museum / Location
  place_of_origin: string | null;
  description_clean: string;
  image_url_full: string | null;
  image_url_thumb: string | null;
  is_public_domain: boolean;
  article_extract?: string | null;
  raw_metadata: Record<string, any>;
}

const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Executes a SPARQL query against Wikidata and returns the raw JSON bindings with exponential backoff retry
 */
async function executeSparqlQuery(query: string, maxRetries: number = 3): Promise<any[]> {
  const url = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/sparql-results+json'
        }
      });

      if (response.status === 429 || response.status === 503 || response.status === 504) {
        const delayMs = attempt * 2000;
        console.warn(`[Wikidata SPARQL] ⚠️ HTTP ${response.status} rate limit/timeout (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Wikidata SPARQL API Error (${response.status}): Failed to execute query.`);
      }

      const json = await response.json();
      return json?.results?.bindings || [];
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = attempt * 2000;
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  throw new Error(`Wikidata SPARQL query failed after ${maxRetries} attempts: ${lastError?.message || lastError}`);
}

/**
 * Normalizes raw SPARQL binding row (or array of rows) into our clean ArtworkData interface
 */
export function normalizeWikidataArtwork(input: any | any[], fallbackId?: string): ArtworkData {
  const rows = Array.isArray(input) ? input : [input];
  if (rows.length === 0) throw new Error("Empty bindings row");
  const binding = rows[0];

  const qidRaw = binding.item?.value || fallbackId || 'Unknown';
  const qid = qidRaw.includes('/') ? qidRaw.split('/').pop()! : qidRaw;

  const title = binding.itemLabel?.value || binding.title?.value || 'Untitled Artwork';
  const artist_title = binding.artistLabel?.value || binding.artist?.value || binding.creatorLabel?.value || 'Unknown Artist';
  
  let date_display = binding.dateStr?.value || binding.date?.value || null;
  if (date_display && date_display.includes('T')) {
    date_display = date_display.split('T')[0]; // Format YYYY-MM-DD or YYYY
  }

  const mediums = Array.from(new Set(rows.map(r => r.medium?.value || r.materialLabel?.value).filter(Boolean)));
  const medium_display = mediums.length > 0 ? mediums.join(', ') : null;

  const styles = Array.from(new Set(rows.map(r => r.style?.value || r.movementLabel?.value).filter(Boolean)));
  const style_title = styles.length > 0 ? styles.join(', ') : null;

  const department_title = binding.museum?.value || binding.locationLabel?.value || null;
  const place_of_origin = binding.country?.value || binding.countryLabel?.value || null;
  
  let dimensions: string | null = null;
  if (binding.height?.value && binding.width?.value) {
    dimensions = `${binding.height.value} × ${binding.width.value} cm`;
  } else if (binding.heightVal?.value && binding.widthVal?.value) {
    dimensions = `${binding.heightVal.value} × ${binding.widthVal.value} cm`;
  }

  const depicts = Array.from(new Set(rows.map(r => r.depictsLabel?.value).filter(Boolean)));
  const depicts_display = depicts.length > 0 ? depicts.join(', ') : null;

  const genres = Array.from(new Set(rows.map(r => r.genreLabel?.value).filter(Boolean)));
  const genre_display = genres.length > 0 ? genres.join(', ') : null;

  const patrons = Array.from(new Set(rows.map(r => r.patronLabel?.value).filter(Boolean)));
  const patron_display = patrons.length > 0 ? patrons.join(', ') : null;

  const events = Array.from(new Set(rows.map(r => r.eventLabel?.value).filter(Boolean)));
  const event_display = events.length > 0 ? events.join(', ') : null;

  const owners = Array.from(new Set(rows.map(r => r.ownerLabel?.value).filter(Boolean)));
  const owner_display = owners.length > 0 ? owners.join(', ') : null;

  const collections = Array.from(new Set(rows.map(r => r.collectionLabel?.value).filter(Boolean)));
  const collection_display = collections.length > 0 ? collections.join(', ') : null;

  const creationPlaces = Array.from(new Set(rows.map(r => r.creationPlaceLabel?.value).filter(Boolean)));
  const creation_place_display = creationPlaces.length > 0 ? creationPlaces.join(', ') : null;

  const inspiredBys = Array.from(new Set(rows.map(r => r.inspiredByLabel?.value).filter(Boolean)));
  const inspired_by_display = inspiredBys.length > 0 ? inspiredBys.join(', ') : null;

  const techniques = Array.from(new Set(rows.map(r => r.techniqueLabel?.value).filter(Boolean)));
  const technique_display = techniques.length > 0 ? techniques.join(', ') : null;

  const exhibitions = Array.from(new Set(rows.map(r => r.exhibitionLabel?.value).filter(Boolean)));
  const exhibition_display = exhibitions.length > 0 ? exhibitions.join(', ') : null;

  const series = Array.from(new Set(rows.map(r => r.seriesLabel?.value).filter(Boolean)));
  const series_display = series.length > 0 ? series.join(', ') : null;

  const discoveryPlaces = Array.from(new Set(rows.map(r => r.discoveryPlaceLabel?.value).filter(Boolean)));
  const discovery_place_display = discoveryPlaces.length > 0 ? discoveryPlaces.join(', ') : null;

  const symbols = Array.from(new Set(rows.map(r => r.symbolLabel?.value).filter(Boolean)));
  const symbol_display = symbols.length > 0 ? symbols.join(', ') : null;

  const influencedBys = Array.from(new Set(rows.map(r => r.influencedByLabel?.value).filter(Boolean)));
  const influenced_by_display = influencedBys.length > 0 ? influencedBys.join(', ') : null;

  const wiki_title = binding.wikiTitle?.value || null;

  const description_clean = binding.itemDescription?.value || `${title} by ${artist_title}${department_title ? ` (${department_title})` : ''}`;

  const imageRaw = binding.imageUrl?.value || binding.image?.value || null;
  let image_url_full: string | null = null;
  let image_url_thumb: string | null = null;

  if (imageRaw) {
    if (imageRaw.includes('Special:FilePath')) {
      image_url_full = imageRaw;
      image_url_thumb = `${imageRaw}?width=300`;
    } else if (imageRaw.includes('commons/')) {
      const filename = decodeURIComponent(imageRaw.split('/').pop()!);
      image_url_full = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
      image_url_thumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=300`;
    } else {
      image_url_full = imageRaw;
      image_url_thumb = imageRaw;
    }
  }

  const raw_metadata: Record<string, any> = {
    id: qid,
    title,
    artist_title,
    date_display,
    medium_display,
    technique: technique_display,
    dimensions,
    style_title,
    museum: department_title || collection_display,
    collection: collection_display,
    place_of_origin,
    creation_place: creation_place_display,
    discovery_place: discovery_place_display,
    description_clean,
    depicts: depicts_display,
    symbols: symbol_display,
    genre: genre_display,
    series: series_display,
    patron: patron_display,
    exhibitions: exhibition_display,
    significant_events: event_display,
    historic_owners: owner_display,
    inspired_by: inspired_by_display,
    influenced_by: influenced_by_display,
    wiki_title,
    is_public_domain: true
  };

  return {
    id: qid,
    title,
    artist_title,
    date_display,
    medium_display,
    dimensions,
    style_title,
    department_title,
    place_of_origin,
    description_clean,
    image_url_full,
    image_url_thumb,
    is_public_domain: true,
    raw_metadata
  };
}

/**
 * Fast (< 50ms) fetch of the English Wikipedia article summary/intro extract (~3-4 sentences, < 1 KB JSON)
 */
export async function fetchWikipediaSummary(title: string, lang: string = 'en'): Promise<string | null> {
  if (!title) return null;
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.extract || null;
  } catch (err) {
    console.warn(`[Wikipedia API] Failed to fetch summary for ${title}:`, err);
    return null;
  }
}

/**
 * Fetches exact artwork metadata and CC0 image from Wikidata using its QID (e.g., Q12418 for Mona Lisa)
 */
export async function fetchWikidataArtworkById(idOrQid: string | number): Promise<ArtworkData> {
  let qid = String(idOrQid).trim();
  if (/^\d+$/.test(qid)) {
    qid = `Q${qid}`;
  } else if (!qid.toUpperCase().startsWith('Q')) {
    throw new Error(`Invalid Wikidata ID format: ${qid}. Expected Q-ID (e.g. Q12418).`);
  } else {
    qid = qid.toUpperCase();
  }

  // Comprehensive query capturing rich historical and artistic properties without join explosion
  const query = `
SELECT ?itemLabel ?itemDescription ?creatorLabel ?dateStr ?materialLabel ?movementLabel ?locationLabel ?countryLabel ?heightVal ?widthVal ?imageUrl ?depictsLabel ?genreLabel ?patronLabel ?eventLabel ?ownerLabel ?collectionLabel ?creationPlaceLabel ?inspiredByLabel ?techniqueLabel ?exhibitionLabel ?seriesLabel ?discoveryPlaceLabel ?symbolLabel ?influencedByLabel ?wikiTitle
WHERE {
  BIND(wd:${qid} AS ?item)
  OPTIONAL { ?item wdt:P170 ?creator. }
  OPTIONAL { ?item wdt:P571 ?dateStr. }
  OPTIONAL { ?item wdt:P186 ?material. }
  OPTIONAL { ?item wdt:P135 ?movement. }
  OPTIONAL { ?item wdt:P276 ?location. }
  OPTIONAL { ?item wdt:P495 ?country. }
  OPTIONAL { ?item wdt:P2048 ?heightVal. }
  OPTIONAL { ?item wdt:P2049 ?widthVal. }
  OPTIONAL { ?item wdt:P18 ?imageUrl. }
  OPTIONAL { ?item wdt:P921 ?depicts. }
  OPTIONAL { ?item wdt:P136 ?genre. }
  OPTIONAL { ?item wdt:P88 ?patron. }
  OPTIONAL { ?item wdt:P793 ?event. }
  OPTIONAL { ?item wdt:P114 ?owner. }
  OPTIONAL { ?item wdt:P195 ?collection. }
  OPTIONAL { ?item wdt:P1071 ?creationPlace. }
  OPTIONAL { ?item wdt:P144 ?inspiredBy. }
  OPTIONAL { ?item wdt:P2094 ?technique. }
  OPTIONAL { ?item wdt:P608 ?exhibition. }
  OPTIONAL { ?item wdt:P361 ?series. }
  OPTIONAL { ?item wdt:P189 ?discoveryPlace. }
  OPTIONAL { ?item wdt:P180 ?symbol. }
  OPTIONAL { ?item wdt:P737 ?influencedBy. }
  OPTIONAL { 
    ?article schema:about ?item ; 
             schema:isPartOf <https://en.wikipedia.org/> ; 
             schema:name ?wikiTitle . 
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
LIMIT 50
  `;

  const bindings = await executeSparqlQuery(query);
  if (!bindings || bindings.length === 0) {
    throw new Error(`Wikidata API Error: No data returned for QID ${qid}`);
  }

  return normalizeWikidataArtwork(bindings, qid);
}

/**
 * Searches artworks by keyword (painting title or artist name) across Wikidata
 */
export async function searchWikidataArtworks(query: string, limit: number = 5): Promise<ArtworkData[]> {
  const cleanQuery = query.replace(/["\\]/g, ' ').trim();
  if (!cleanQuery) return [];

  const sparql = `
SELECT DISTINCT ?item ?itemLabel ?itemDescription ?artistLabel ?dateStr ?museum ?imageUrl ?sitelinks WHERE {
  {
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org";
                      wikibase:api "EntitySearch";
                      mwapi:search "${cleanQuery}";
                      mwapi:language "en".
      ?item wikibase:apiOutputItem mwapi:item.
    }
    ?item wdt:P31/wdt:P279* wd:Q3305213.
    OPTIONAL { ?item wikibase:sitelinks ?sitelinks. }
  } UNION {
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org";
                      wikibase:api "EntitySearch";
                      mwapi:search "${cleanQuery}";
                      mwapi:language "en".
      ?artistEntity wikibase:apiOutputItem mwapi:item.
    }
    ?artistEntity wdt:P31 wd:Q5.
    ?item wdt:P170 ?artistEntity;
          wdt:P31/wdt:P279* wd:Q3305213.
    OPTIONAL { ?item wikibase:sitelinks ?sitelinks. }
  }
  OPTIONAL { ?item wdt:P170 ?creator. ?creator rdfs:label ?artistLabel. FILTER(LANG(?artistLabel) = "en" || LANG(?artistLabel) = "fr") }
  OPTIONAL { ?item wdt:P571 ?dateStr. }
  OPTIONAL { ?item wdt:P276 ?loc. ?loc rdfs:label ?museum. FILTER(LANG(?museum) = "en" || LANG(?museum) = "fr") }
  OPTIONAL { ?item wdt:P18 ?imageUrl. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
ORDER BY DESC(?sitelinks)
LIMIT ${limit}
  `;

  const bindings = await executeSparqlQuery(sparql);
  return bindings.map(b => normalizeWikidataArtwork([b]));
}

/**
 * Retrieves the top most famous paintings worldwide according to Wikipedia sitelinks/popularity
 */
export async function fetchTopFamousArtworks(limit: number = 10): Promise<ArtworkData[]> {
  const sparql = `
SELECT ?item ?itemLabel ?itemDescription ?artistLabel ?dateStr ?museum ?imageUrl ?sitelinks WHERE {
  ?item wdt:P31 wd:Q3305213;
        wikibase:sitelinks ?sitelinks.
  FILTER(?sitelinks > 40)
  OPTIONAL { ?item wdt:P170 ?creator. ?creator rdfs:label ?artistLabel. FILTER(LANG(?artistLabel) = "en" || LANG(?artistLabel) = "fr") }
  OPTIONAL { ?item wdt:P571 ?dateStr. }
  OPTIONAL { ?item wdt:P276 ?loc. ?loc rdfs:label ?museum. FILTER(LANG(?museum) = "en" || LANG(?museum) = "fr") }
  OPTIONAL { ?item wdt:P18 ?imageUrl. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
ORDER BY DESC(?sitelinks)
LIMIT ${limit}
  `;

  const bindings = await executeSparqlQuery(sparql);
  return bindings.map(b => normalizeWikidataArtwork([b]));
}
