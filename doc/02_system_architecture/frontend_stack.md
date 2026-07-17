# Frontend Architecture & Tech Stack - AI Art Coach

## 1. System Architecture Overview
The **AI Art Coach** client architecture operates within standard browser APIs, responsive layout rules, and offline caching mechanisms.

```text
+-----------------------------------------------------------------------------------+
|                           FRONTEND PWA (Mobile Client)                            |
|  [ Svelte 5 (Runes) + SvelteKit + Native CSS (OKLCH, View Transitions) ]          |
|  + Service Worker (@vite-pwa/sveltekit) offline storage & Cache Storage (IndexedDB)|
+-----------------------------------------------------------------------------------+
                                         │
                   SPARQL Queries / REST API (Supabase SQL)
                                         │
+------------------------------------+   │   +--------------------------------------+
|        EXTERNAL DATA SOURCE        |◀──┼──▶|      AUTHORITATIVE DATABASE          |
|   [ Wikidata SPARQL API / CC0 ]    |   │   |    [ Supabase PostgreSQL BDD ]       |
|   [ Art Institute of Chicago API ] |   │   |    (Detailed in database_and_sec...) |
+------------------------------------+   │   +--------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|               OFFLINE CACHE & BUFFER (Service Worker & IndexedDB)                 |
|         [ Active during disconnection / Sync Queue Failover ]                     |
|         (Detailed in doc/03_core_engine/offline_synchronization.md)               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Frontend Stack: Svelte 5 & SvelteKit PWA

### 2.1 Svelte 5 & Runes Reactivity
Svelte 5 functions as the UI engine, utilizing **Runes** (`$state`, `$derived`, `$effect`, `$props`) for state management:
- **Direct DOM Manipulation:** The Svelte compiler generates direct DOM update instructions. When state mutates (e.g., during quiz interactions or card flips), only the specific DOM nodes dependent on that `$state` update.
- **Bundle Size Footprint:** The compiled JavaScript bundle remains under 30 KB (gzipped), reducing parse and execution times on mobile devices.

### 2.2 SvelteKit & Service Worker (`@vite-pwa/sveltekit`)
- **Hybrid Rendering (`adapter-static` / `adapter-auto`):** Pre-renders static UI shells and layout routes (`+layout.svelte`) at build time to reduce initial Time to First Byte (TTFB). For dynamic routes relying on client storage (`user_artwork_progress`) such as `/` and `/catalogue/[slug]`, routes configure explicit client rendering (`export const prerender = false` or `fallback: 'app.html'`) to ensure seamless build-time generation (`npm run build`).
- **Workbox Service Worker Integration:** Precaches static assets (JS, CSS, HTML shell, fonts) on PWA installation and applies runtime caching (`Stale-While-Revalidate` and `Cache-First`) to API payloads and artwork thumbnails.

---

## 3. Native CSS Architecture (`index.css` & `app.css`)
The styling layer utilizes native browser CSS specifications:

### 3.1 OKLCH Color Space & Custom Properties
- Colors are declared in `:root` using `color(oklch ...)` (`L` Lightness, `C` Chroma, `H` Hue) to maintain uniform lightness distribution across color shifts.
- Each artistic movement (`courants`) assigns an `oklch_token` value to CSS custom properties (`--movement-theme`), updating border colors, badges, and state highlights accordingly.

### 3.2 View Transitions API
- Executes `document.startViewTransition()` during route changes between the daily view (`/`), the catalog grid (`/catalogue`), and individual artwork detail routes (`/catalogue/[slug]`).

### 3.3 CSS Container Queries & Subgrid
- **Container Queries (`@container`):** Components (`ArtworkCard`, `QuickMCQ`) compute layout dimensions based on their parent container width rather than viewport width (`@media`), supporting reuse across different layout grids.
- **CSS Subgrid (`display: grid; grid-template-rows: subgrid;`):** Aligns child rows (headers, image containers, badges, buttons) across multi-column parent grids without JavaScript layout calculations.

---

## 4. Performance & Web Vitals Targets
The application sets the following performance budgets and technical implementations:

| Web Vital Metric | Target Budget | Architectural Implementation Strategy |
| :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | **< 0.8s** | `<link rel="preload">` for daily hero image, WebP CDN format, `adapter-static` pre-rendered HTML shell, < 30 KB JS bundle. |
| **INP** (Interaction to Next Paint) | **< 16ms** | Direct Svelte 5 Runes `$state` mutations without Virtual DOM diff calculations or synchronous main-thread blocking operations. |
| **CLS** (Cumulative Layout Shift) | **0.00** | Explicit `aspect-ratio` CSS declarations on image containers and skeleton placeholders prior to image load. |
| **Lighthouse Score** | **100/100** | PWA manifest (`manifest.json`), Workbox caching, semantic HTML5 elements, ARIA labels, and WCAG AA OKLCH contrast ratios. |
