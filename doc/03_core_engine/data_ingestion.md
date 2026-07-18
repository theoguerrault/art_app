# Open Data Sources & Ingestion Clients - AI Art Coach

## 1. Direct-Data Philosophy & Open Data Licensing
Rather than relying on closed proprietary databases or static manual data entry, **AI Art Coach** connects directly to authoritative public museum APIs and global knowledge bases.

All ingested metadata, historical facts, and artwork imagery adhere strictly to **CC0 (Creative Commons Zero - Public Domain)** or equivalent open-access licenses. This architecture guarantees long-term zero-cost operations, high data authenticity, and legal compliance when serving content across mobile Progressive Web Apps (PWAs).

---

## 2. Wikidata SPARQL Client (`src/lib/server/ingestion/wikidata-client.ts`)
The primary engine for querying global art history metadata on-demand is the **Wikidata SPARQL API** (`https://query.wikidata.org/sparql`).

### 2.1 Exponential Backoff & Retry Resilience
Public SPARQL endpoints enforce strict concurrency limits and frequently return HTTP errors under heavy load (`HTTP 429 Too Many Requests`, `HTTP 503 Service Unavailable`, or `HTTP 504 Gateway Timeout`).

To ensure continuous, fault-tolerant ingestion, the `wikidata-client.ts` module implements **exponential backoff retry logic**:
- Automatically intercepts `429`, `503`, and `504` responses.
- Retries failed SPARQL queries with progressive delays (`2000ms`, `4000ms`, `6000ms`, up to configurable max attempts).
- Adds randomized jitter to prevent thundering herd requests when multiple client tasks run concurrently.

### 2.2 Comprehensive SPARQL Query Scope
The client executes detailed SPARQL queries extracting deep semantic relationships across art entities (`?item wdt:P31 wd:Q3305213 ...` for paintings or `wd:Q860861` for sculptures):
- **Core Identifiers:** Wikidata QID (`slug`), official titles in multiple languages (`rdfs:label`), and Wikipedia article handles (`<https://fr.wikipedia.org/>` as primary).
- **Automatic Browser Language Localization (`getPreferredLanguage`):** All queries dynamically resolve the target language based on the browser's `navigator.language` (e.g., `'fr'`, `'en'`, `'es'`) with fallback to `'fr'`. Explicit multi-language selection options have been suppressed for now (`SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }`).
- **Creator Attribution:** Artist name (`wdt:P170`), artist QID, and biographical timeline.
- **Chronology & Provenance:** Exact creation date/year (`wdt:P571`), discovery location (`wdt:P189`), and historical commissioning (`wdt:P88`).
- **Stylistic Classification:** Associated artistic movement or period (`wdt:P135`), material and medium (`wdt:P186` -> `medium_display`), and physical dimensions (`wdt:P2048` height, `wdt:P2049` width).
- **Institutional Custody:** Current hosting museum or collection (`wdt:P195`) and inventory number (`wdt:P217`).
- **Subject Depiction:** Key entities, mythological figures, or scenes depicted within the artwork (`wdt:P180`).

---

## 3. Art Institute of Chicago API Integration (`src/artic-client.ts`)
For specialized North American collections and ultra-high-resolution CC0 imagery, the pipeline integrates directly with the **Art Institute of Chicago REST API** (`https://api.artic.edu/api/v1/artworks`).

### 3.1 REST Ingestion Capabilities
- **Unauthenticated Open Access:** Direct JSON queries to `/artworks/{id}` retrieving comprehensive curatorial essays, exhibition histories, and physical condition notes.
- **IIIF Image Pipeline:** Dynamically retrieves high-fidelity image URLs directly from the museum's International Image Interoperability Framework (IIIF) image server (`https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg`).

---

## 4. Data Normalization (`ArtworkData` Interface)
Raw SPARQL JSON bindings and museum REST responses contain disparate, highly nested structures. Before passing data into the AI QCM Engine ([`ai_mcq_engine.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/ai_mcq_engine.md)) or inserting into Supabase tables ([`database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md)), the ingestion module normalizes all inputs into a clean, unified `ArtworkData` interface:

```typescript
export interface ArtworkData {
  id: string | number;         // e.g., "Q12418"
  title: string;               // e.g., "Mona Lisa"
  artist_title: string | null; // e.g., "Leonardo da Vinci"
  date_display: string | null; // e.g., "c. 1503–1519"
  style_title: string | null;  // e.g., "Haute Renaissance"
  medium_display: string | null; // e.g., "Huile sur panneau de bois de peuplier" -> mapped to `oeuvres.medium`
  dimensions: string | null;   // e.g., "77 × 53 cm" -> mapped to `oeuvres.dimensions`
  department_title: string | null; // e.g., "Musée du Louvre, Paris" -> mapped to `oeuvres.musee`
  image_url_full: string | null; // Full HD WebP CDN URL
  image_url_thumb: string | null; // 300px WebP thumbnail CDN URL
  is_public_domain: boolean;   // True for CC0
  article_extract?: string | null; // Lead paragraph extract retrieved from Wikipedia API
  extended_analysis?: string | null; // Rich "Analyse / Composition / Technique" section retrieved from Wikipedia API
  historical_context?: string | null; // "Historique / Provenance" section retrieved from Wikipedia API
  raw_metadata: Record<string, any>; // Complete flat key-value map for LLM quote verification
}
```

### 4.1 AI-Powered Wikipedia Curation, Homonymy Resolution & Database Persistence (`/api/wikipedia`)
To overcome Wikidata's limitation of only providing 1-line label descriptions (`?itemDescription`), `fetchWikipediaExtendedExtract` in `wikidata-client.ts` queries the **Wikipedia Mobile Sections REST API** (`/api/rest_v1/page/mobile-sections/{title}`).
- **OpenSearch & Homonymy Resolution:** If the exact database title (`lesson.titre`, e.g., `"La Nuit étoilée"`) returns HTTP 404 OR points to a disambiguation page (`homonymie`, `"peut faire référence à"`), `fetchWikipediaExtendedExtract` automatically queries the Wikipedia OpenSearch API (`w/api.php?action=query&list=search&srsearch=...`), combining `title` and `artist` (`lesson.artiste`, e.g., `"La Nuit étoilée Vincent van Gogh"`) to resolve the exact canonical page title (e.g., `"La Nuit étoilée (1889)"`).
- **AI-Powered Curatorial Synthesis (`synthesizeWikipediaExtractsWithAI`):** When Wikipedia sections are retrieved, `wikidata-client.ts` invokes Gemini AI (`gemini-2.5-pro` via `@google/genai`) to read all raw section texts (`allRawSections`) plus the Wikipedia lead summary. Gemini intelligently selects, structures, and synthesizes **five** high-quality, mobile-optimized French content blocks:
  1. `anecdote_accroche` ("Accroche captivante") ~25-35 words — a curiosity-sparking hook displayed on the artwork card.
  2. `anecdote_technique` ("Description technique concise") ~45-60 words — the primary description shown on the artwork card, covering composition, light, and medium.
  3. `anecdote_secrete` ("Détail insolite / secret") ~45-60 words — a hidden detail, symbol, or fascinating historical anecdote.
  4. `extended_analysis` ("Analyse visuelle, composition, technique et symbolisme") ~150-250 words — deep visual and formal analysis.
  5. `historical_context` ("Historique, création, provenance et contexte") ~150-250 words — complete creation history and provenance.
- **Multi-Lingual & Regex Fallbacks:** If `GEMINI_API_KEY` is not present or if AI synthesis fails, `fetchWikipediaExtendedExtract` seamlessly falls back to regex header checks (`Analyse`, `Composition`, `Technique`, `Histoire`, `Provenance`) and multi-lingual queries against English Wikipedia (`en.wikipedia.org`). For `anecdote_technique`, the Wikipedia lead summary is used as fallback; for `anecdote_accroche`, the first sentence of the summary.
- **Placeholder Detection & Smart Persistence ("Once-and-Done" Flow):** The `/api/wikipedia` endpoint and the Svelte client both detect **placeholder content** (e.g., `"Explore the profound story..."`, `"Analyze the technical mastery..."`) using `isMissingOrPlaceholder()`. When any of the 5 fields is empty or contains a generic English placeholder, loading the detail view (`/catalogue/[slug]`) triggers `GET /api/wikipedia?title={title}&artist={artist}&id_oeuvre={id}`:
  1. **Check-then-Persist:** `/api/wikipedia` first queries `contenus_oeuvres` for the existing row. If found, it selectively updates only the missing/placeholder fields. If no row exists, it performs a full `upsert` with all 5 AI-generated fields plus a default QCM.
  2. **Instant Client-Side Cache:** The Svelte client writes the newly synthesized extracts directly to the local IndexedDB offline store (`cached_mcqs`), and updates reactive state variables (`dynamicAnecdoteAccroche`, `dynamicAnecdoteTechnique`, `dynamicAnecdoteSecrete`, `extendedAnalysis`, `historicalContext`) so the UI renders immediately without a page reload.
  3. **Future Visits:** Because `contenus_oeuvres` is now permanently populated with real AI-curated content, any subsequent visit across any client or session loads directly from Supabase/IndexedDB (`0ms`), completely bypassing Wikipedia and Gemini API calls forever.

### 4.2 Wikipedia Detailed Description Service (`src/lib/server/ingestion/wikipedia-description.ts`)
An additional, dedicated service generates a **coherent, long-form detailed description** (~300-500 words, always in French) for each artwork's detail page. Unlike the 5-field micro-synthesis above, this produces a single structured narrative.

- **Cache-First Pattern:** `getDetailedDescription(slug, supabase, apiKey)` always checks `contenus_oeuvres.detailed_description` first. If a non-empty cached description exists (>100 chars), it returns immediately with `source: "cache"`.
- **Wikipedia Scraping:** On cache miss, the service scrapes the full plain-text Wikipedia article via MediaWiki Action API (`action=query&prop=extracts&explaintext=1`). Falls back from French to English if the article is missing or too short (<200 chars). Includes disambiguation/homonymy resolution using OpenSearch.
- **Gemini Synthesis (Strict No-Hallucination):** Sends the scraped text to `gemini-2.5-pro` with an explicit system instruction forbidding any fact not present in the source. Output is a structured 5-paragraph description: general presentation → visual description → technical analysis → historical context → provenance.
- **DB Persistence:** The generated description is written to `contenus_oeuvres.detailed_description` via upsert, ensuring one-time generation cost.
- **API Endpoint:** Exposed at `GET /api/artwork-description/[slug]`, returning `{ detailed_description: string, source: "cache" | "generated" }`.
- **Frontend Integration:** The detail page (`/catalogue/[slug]`) displays the description in a dedicated section with skeleton loading animation. If the description exists in DB at load time, it renders instantly; otherwise, it fetches on-demand from the API.

---

## 5. Image Management & CDN Strategy
High-resolution art images can exceed 15 MB, which would stall mobile PWA loading if served directly in catalog lists. The ingestion layer enforces a **Dual-URL CDN Strategy**:

### 5.1 `image_url_full` (High-Resolution Detail View)
- Serves 1280px to 2000px images from Wikimedia Commons CDN (`https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=1280` or IIIF servers).
- Using canonical `Special:FilePath` endpoints ensures reliable HTTP 200 responses and automatic redirection to valid CDN buckets without hardcoding static thumb step paths (`800px-`, `1024px-`) that get rejected by Varnish (HTTP 400).
- Used exclusively on the front of the daily `ArtworkCard` (`/`) and inside individual artwork detail views (`/catalogue/[slug]`), where zooming and visual inspection occur.

### 5.2 `image_url_thumb` (Lightweight Catalog Grid Loading)
- Serves compressed 300px to 500px thumbnails via canonical `Special:FilePath` URLs (`https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=500`).
- Used across the catalog movement grids (`/catalogue`) and list overviews (`v_lecons_actives`).
- Enforces exact `aspect_ratio` properties to pre-allocate DOM containers, ensuring **sub-15ms grid rendering** and zero Cumulative Layout Shift (**CLS = 0.00**).
