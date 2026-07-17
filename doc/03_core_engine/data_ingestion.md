# Open Data Sources & Ingestion Clients - AI Art Coach

## 1. Direct-Data Philosophy & Open Data Licensing
Rather than relying on closed proprietary databases or static manual data entry, **AI Art Coach** connects directly to authoritative public museum APIs and global knowledge bases.

All ingested metadata, historical facts, and artwork imagery adhere strictly to **CC0 (Creative Commons Zero - Public Domain)** or equivalent open-access licenses. This architecture guarantees long-term zero-cost operations, high data authenticity, and legal compliance when serving content across mobile Progressive Web Apps (PWAs).

---

## 2. Wikidata SPARQL Client (`src/wikidata-client.ts`)
The primary engine for querying global art history metadata on-demand is the **Wikidata SPARQL API** (`https://query.wikidata.org/sparql`).

### 2.1 Exponential Backoff & Retry Resilience
Public SPARQL endpoints enforce strict concurrency limits and frequently return HTTP errors under heavy load (`HTTP 429 Too Many Requests`, `HTTP 503 Service Unavailable`, or `HTTP 504 Gateway Timeout`).

To ensure continuous, fault-tolerant ingestion, the `wikidata-client.ts` module implements **exponential backoff retry logic**:
- Automatically intercepts `429`, `503`, and `504` responses.
- Retries failed SPARQL queries with progressive delays (`2000ms`, `4000ms`, `6000ms`, up to configurable max attempts).
- Adds randomized jitter to prevent thundering herd requests when multiple client tasks run concurrently.

### 2.2 Comprehensive SPARQL Query Scope
The client executes detailed SPARQL queries extracting deep semantic relationships across art entities (`?item wdt:P31 wd:Q3305213 ...` for paintings or `wd:Q860861` for sculptures):
- **Core Identifiers:** Wikidata QID (`slug`), official titles in multiple languages (`rdfs:label`), and Wikipedia article handles.
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
  qid: string;                 // e.g., "Q12418"
  slug: string;                // Normalized URL slug: "mona-lisa-q12418"
  title: string;               // e.g., "Mona Lisa"
  artist: string;              // e.g., "Leonardo da Vinci"
  creationDate: string;        // e.g., "c. 1503–1519"
  movementSlug?: string;       // Normalized movement relation e.g., "haute-renaissance"
  mediumDisplay: string;       // e.g., "Oil on poplar panel"
  dimensionsDisplay: string;   // e.g., "77 cm × 53 cm"
  museumLocation: string;      // e.g., "Louvre Museum, Paris"
  imageUrlFull: string;        // Full HD WebP CDN URL
  imageUrlThumb: string;       // 300px WebP thumbnail CDN URL
  aspectRatio: number;         // Computed width/height ratio (e.g., 0.688)
  raw_metadata: Record<string, string>; // Complete flat key-value map for LLM quote verification
}
```

---

## 5. Image Management & CDN Strategy
High-resolution art images can exceed 15 MB, which would stall mobile PWA loading if served directly in catalog lists. The ingestion layer enforces a **Dual-URL CDN Strategy**:

### 5.1 `image_url_full` (High-Resolution Detail View)
- Serves 1200px to 2000px WebP images from high-speed Content Delivery Networks (Wikimedia Commons CDN or IIIF servers).
- Used exclusively on the front of the daily `ArtworkCard` (`/`) and inside individual artwork detail views (`/catalogue/[slug]`), where zooming and visual inspection occur.

### 5.2 `image_url_thumb` (Lightweight Catalog Grid Loading)
- Serves compressed 300px to 400px WebP thumbnails (typically < 15 KB per file).
- Used across the catalog movement grids (`/catalogue`) and list overviews (`v_lecons_actives`).
- Enforces exact `aspect_ratio` properties to pre-allocate DOM containers, ensuring **sub-15ms grid rendering** and zero Cumulative Layout Shift (**CLS = 0.00**).
