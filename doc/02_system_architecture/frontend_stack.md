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
                   SPARQL Queries / Database Client (Supabase SQL)
                                         │
+------------------------------------+   │   +--------------------------------------+
|        EXTERNAL DATA SOURCE        |◀──┼──▶|      AUTHORITATIVE DATABASE          |
|   [ Wikidata SPARQL API / CC0 ]    |   │   |    [ Supabase PostgreSQL BDD ]       |
|                                    |   │   |    (Detailed in database_and_sec...) |
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

### 2.2 Feature-Sliced Design (FSD) Architecture
The frontend codebase is strictly structured using a Domain-Driven / Feature-Sliced approach to ensure clean architecture and scalability:
- **`src/lib/features/`**: The core of the application. Contains domain-specific modules (e.g., `artwork/`, `quiz/`). Each feature folder encapsulates its own:
  - `components/`: UI components specific to the feature (e.g., `ArtworkCard.svelte`).
  - `logic/`: Headless logic and state management using Svelte 5 Runes (e.g., `useQuizSession.svelte.ts`).
- **`src/lib/ui/`**: Generic, "dumb", and highly reusable components (e.g., buttons, badges).
- **`src/lib/core/`**: Application-wide configurations and transverse utilities (e.g., `theme.svelte.ts`).

### 2.3 SvelteKit & Service Worker (`@vite-pwa/sveltekit`)
- **Hybrid Rendering (`adapter-static` / `adapter-auto`):** Pre-renders static UI shells and layout routes (`+layout.svelte`) at build time to reduce initial Time to First Byte (TTFB). For dynamic routes relying on client storage (`user_artwork_progress`) such as `/` and `/catalogue/[slug]`, routes configure explicit client rendering (`export const prerender = false` or `fallback: 'app.html'`) to ensure seamless build-time generation (`npm run build`).
- **Workbox Service Worker Integration:** Precaches static assets (JS, CSS, HTML shell, fonts) on PWA installation and applies runtime caching (`Stale-While-Revalidate` and `Cache-First`) to API payloads and artwork thumbnails.

---

## 3. Design Direction & Native CSS Architecture ("Ambient Digital Canvas")
The styling layer enforces an innovative, ultra-minimalist art-gallery aesthetic:

### 3.1 Dynamic Ambient Color Fields & Theme Management (`ThemeStore`)
- The application background dynamically shifts tone based on the current artwork (`--artwork-hue`).
- Colors are declared in `:root` using `oklch(...)` (`L` Lightness, `C` Chroma, `H` Hue) to maintain uniform lightness across states.
- **Light Mode (`data-theme="light"` / `:root`)**: Uses a desaturated warm paper base `oklch(0.985 0.008 var(--artwork-hue))` by default.
- **Dark Mode (`data-theme="dark"` / `:root[data-theme="dark"]`)**: Uses a deep ink canvas (`#121212`) enhanced with vibrant, neon "pop" accents (e.g., `#FA47FF`) for borders, shadows, and interactive elements.
- **Reactive State (`$lib/theme.svelte.ts`)**: Managed by a Svelte 5 Runes class `ThemeStore` (`$state`) integrated into `/settings`. It prevents FOUC via an initial inline script in `app.html` that reads `localStorage` (defaulting to `'light'`), sets `data-theme` on the `<html>` root element, and updates the browser `<meta name="theme-color">` dynamically.

### 3.2 Editorial Typography
- **Headings & Titles:** Pair with a high-end serif font such as `Instrument Serif` or `Cormorant Garamond` to produce a classical, editorial publication style.
- **Interface & Body:** Pair with a clean, low-contrast geometric typeface with a technical layout touch like `Geist` or `Inter`.

### 3.3 Minimalist Blueprint Elements
- **Layout & Spacing:** Generous whitespace with thin borders (`0.5px` border thickness with low opacity).
- **Interactive Elements:** Zero heavy card wrappers or traditional buttons. Actions use fine text underlines that animate on hover and focus.
- **Canvas Overlay:** A subtle, soft-blend noise texture is applied to the main wrapper to evoke a natural paper medium feel.

### 3.4 View Transitions API & Container Queries
- **View Transitions:** Executes `document.startViewTransition()` to morph assets smoothly during routing.
- **Container Queries (`@container`):** Adapts components (`ArtworkCard`, `QuickMCQ`) based on parent container width rather than viewport size.
- **CSS Subgrid:** Aligns grid rows dynamically without JavaScript calculations.

---

## 4. Performance & Web Vitals Targets
The application sets the following performance budgets and technical implementations:

| Web Vital Metric | Target Budget | Architectural Implementation Strategy |
| :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | **< 0.8s** | `<link rel="preload">` for daily hero image, WebP CDN format, `adapter-static` pre-rendered HTML shell, < 30 KB JS bundle. |
| **INP** (Interaction to Next Paint) | **< 16ms** | Direct Svelte 5 Runes `$state` mutations without Virtual DOM diff calculations or synchronous main-thread blocking operations. |
| **CLS** (Cumulative Layout Shift) | **0.00** | Explicit `aspect-ratio` CSS declarations on image containers and skeleton placeholders prior to image load. |
| **Lighthouse Score** | **100/100** | PWA manifest (`manifest.json`), Workbox caching, semantic HTML5 elements, ARIA labels, and WCAG AA OKLCH contrast ratios. |

