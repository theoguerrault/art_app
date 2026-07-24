# Open Data Sources & Ingestion Clients - AI Art Coach

## 1. Direct-Data Philosophy & Open Data Licensing
Rather than relying on closed proprietary databases or static manual entry, **AI Art Coach** connects directly to public museum APIs and global knowledge bases.

All ingested metadata, historical facts, and artwork imagery adhere strictly to **CC0 (Creative Commons Zero - Public Domain)** or equivalent open-access licenses.

---

## 2. Wikidata SPARQL Client (`src/lib/server/ingestion/wikidata-client.ts`)
The primary engine for querying global art history metadata on-demand is the **Wikidata SPARQL API** (`https://query.wikidata.org/sparql`).

### 2.1 Backoff & Resilience Logic
Public SPARQL endpoints enforce strict rate limits. The `wikidata-client.ts` module implements exponential backoff retry logic:
- Intercepts `429`, `503`, and `504` HTTP responses.
- Retries failed SPARQL queries with progressive delays (`2000ms`, `4000ms`, `6000ms`).

### 2.2 SPARQL Scope
SPARQL queries extract key semantic relationships:
- **Identifiers:** Wikidata QID (`slug`), official titles, and Wikipedia article handles.
- **Creator Attribution:** Artist name (`wdt:P170`), artist QID, and timeline.
- **Chronology & Location:** Creation date/year (`wdt:P571`), discovery location (`wdt:P189`), hosting museum (`wdt:P195`), and medium (`wdt:P186`).

---

## 3. Wikipedia API Integration & Homonymy Resolution (`/api/wikipedia`)
To enrich Wikidata label metadata, `fetchWikipediaExtendedExtract` queries the **Wikipedia Mobile Sections REST API** (`/api/rest_v1/page/mobile-sections/{title}`).

### 3.1 OpenSearch & Homonymy Resolution
If an exact artwork title returns HTTP 404 or points to a disambiguation page (`homonymie`), `fetchWikipediaExtendedExtract` automatically queries the Wikipedia OpenSearch API (`w/api.php?action=query&list=search&srsearch=...`), combining title and artist name to resolve canonical page titles.

### 3.2 AI Curatorial Synthesis (`synthesizeWikipediaExtractsWithAI`)
When Wikipedia sections are retrieved, Gemini AI synthesizes the raw section text into **five** structured content blocks:
1. `anecdote_accroche`: Introductory hook (~25-35 words).
2. `anecdote_technique`: Technical description (~45-60 words) covering composition, lighting, and medium.
3. `anecdote_secrete`: Hidden detail or secret anecdote (~45-60 words).
4. `extended_analysis`: Deep visual analysis (~150-250 words).
5. `historical_context`: Provenance and creation context (~150-250 words).

### 3.3 Check-Then-Persist Flow ("Once-and-Done")
When loading an artwork detail page (`/catalogue/[slug]`):
1. **Check Database:** `/api/wikipedia` queries `contenus_oeuvres` for existing rows.
2. **Selective Upsert:** If fields contain placeholders or are empty, AI synthesis populates missing fields and persists them permanently to PostgreSQL.
3. **Subsequent Visits:** Future requests read directly from PostgreSQL/IndexedDB (`0ms`), bypassing Wikipedia and Gemini API calls forever.

---

## 4. Image Management & CDN Strategy
High-resolution art images can exceed 15 MB. The ingestion layer enforces a **Dual-URL CDN Strategy**:

### 4.1 `image_url_full` (High-Resolution Detail View)
- Serves 1280px to 2000px images from Wikimedia Commons CDN via canonical `Special:FilePath` endpoints (`https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=1280`).
- Used on the daily `ArtworkCard` (`/`) and artwork detail view (`/catalogue/[slug]`).

### 4.2 `image_url_thumb` (Catalog Grid View)
- Serves compressed 300px to 500px thumbnails via canonical `Special:FilePath` URLs (`https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=500`).
- Enforces explicit `aspect_ratio` properties on grid containers, ensuring sub-15ms grid rendering and zero Cumulative Layout Shift (**CLS = 0.00**).
