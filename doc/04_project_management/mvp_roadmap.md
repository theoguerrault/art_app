# MVP Implementation Roadmap & Autonomous Agent Checklist - AI Art Coach

## 1. Autonomous Agent Execution Protocol
When the user instructs the agent to `"continue implementation"`, `"continue l'implémentation"`, or any equivalent directive, the agent MUST execute the following protocol without requiring manual intervention between steps:

1. **Read Roadmap State:** Open this document (`doc/04_project_management/mvp_roadmap.md`) and check the phase checklist below.
2. **Locate Active or Next Step:**
   - Locate the item currently marked `[/]` (In Progress).
   - If no item is marked `[/]`, locate the first item marked `[ ]` (Uncompleted) and update its checkbox to `[/]` using a file edit tool before starting execution.
3. **Execute Scope:** Perform the file creations, modifications, and shell commands defined in the **Scope & Required Files** section for that step. Do NOT write automated tests unless noted in the verification criteria or requested by the user.
4. **Verify Checkpoint:** Run the exact checks specified under **Verification Criteria**.
5. **Mark Completion & Proceed Autonomously:**
   - Once verification succeeds, update the current step's checkbox from `[/]` to `[x]` (Completed).
   - Locate the next sequential `[ ]` step, mark it as `[/]`, and proceed to execute it.
   - Stop only upon completing all tasks in a major Phase or if a terminal error/user decision blocks progress.

---

## 2. Implementation Phases & Step-by-Step Checklist

### Phase 1: Project Scaffolding & Configuration
- [x] **Step 1.1: Initialize SvelteKit PWA Project Structure**
  - **Scope & Required Files:**
    - Initialize SvelteKit with Svelte 5 (`npx sv create . --template minimal --types ts --no-add-ons`) inside the project root (`/`), or configure within `src/` if preserving existing documentation and scripts.
    - Install core dependencies: `@sveltejs/kit`, `svelte`, `vite`, and `@vite-pwa/sveltekit`.
    - Configure `vite.config.ts` with `SvelteKitPWA()` plugin using `adapter-static` or `adapter-auto`. Ensure `devOptions: { enabled: false }` is set by default during development to prevent Service Worker caching from interfering with Vite hot-module replacement (HMR).
    - Create `svelte.config.js` with TypeScript support.
  - **Verification Criteria:**
    - Run `npm run check` and verify zero TypeScript or configuration errors.
    - Verify `npm run build` succeeds and produces the `.svelte-kit` build artifact.

---

### Phase 2: Database Schema & Supabase Client Integration
- [x] **Step 2.1: Execute Supabase DDL Schema & RLS Policies**
  - **Scope & Required Files:**
    - Create `supabase/migrations/0001_initial_schema.sql` containing the SQL tables (`courants`, `contenus_courants`, `oeuvres`, `contenus_oeuvres`, `historique_reponses`, `user_artwork_progress`) and RLS policies defined in [`doc/02_system_architecture/database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md).
    - If local Supabase CLI is active, apply the migration; otherwise, prepare the script for Supabase SQL Editor execution.
    - Create `supabase/seed.sql` (or use the `scripts/test-chicago-quiz/` generator harness) to insert 3 to 5 sample movements, artworks, and `qcm_synthese` records for UI testing in Phases 4 through 6.
  - **Verification Criteria:**
    - Verify SQL syntax validity.
    - Verify all foreign key constraints (`ON DELETE CASCADE`) and index declarations match [`database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md).
    - Verify sample seed data inserts without error and returns via SQL queries.

- [x] **Step 2.2: Initialize Supabase Client & TypeScript Definitions**
  - **Scope & Required Files:**
    - Install `@supabase/supabase-js`.
    - Create `src/lib/supabase/client.ts` exporting the initialized Supabase client configured via `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`.
    - Create `src/lib/types/database.ts` with TypeScript interface definitions for all database tables (`Artwork`, `Movement`, `UserProgress`, `MCQ`).
  - **Verification Criteria:**
    - Run `npm run check` to verify types compile without `any` fallbacks.
    - Verify `src/lib/supabase/client.ts` loads environment variables cleanly.

---

### Phase 3: Core Design System & Native CSS Architecture
- [x] **Step 3.1: Implement OKLCH Color Tokens & Responsive Layout Utilities**
  - **Scope & Required Files:**
    - Create `src/app.html` defining semantic viewport tags, PWA manifest links, and Google Fonts preloading (`Inter` / `Outfit`).
    - Create `src/app.css` (or `src/index.css`) declaring `:root` OKLCH color palettes, dark mode fallbacks, CSS container query setups (`@container`), and CSS Grid/Subgrid utility classes as specified in [`doc/02_system_architecture/frontend_stack.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/frontend_stack.md).
    - Create `src/routes/+layout.svelte` importing the global CSS and establishing the core layout shell (`<main>` plus bottom navigation spacing).
  - **Verification Criteria:**
    - Verify `src/app.css` contains valid `color(oklch ...)` syntax and zero CSS lint errors.
    - Verify `+layout.svelte` renders without runtime warnings.

---

### Phase 4: Core Interactive Components (Svelte 5 Runes)
- [x] **Step 4.1: Build Daily Artwork Flip Card Component (`ArtworkCard.svelte`)**
  - **Scope & Required Files:**
    - Create `src/lib/components/ArtworkCard.svelte` using Svelte 5 Runes (`$props`, `$state`).
    - Implement 3D flip transform (front side displaying artwork image, title, artist, date, and movement badge; back side displaying text description and key anecdote).
    - Enforce explicit `aspect-ratio` CSS declarations to prevent Cumulative Layout Shift (CLS = 0.00).
  - **Verification Criteria:**
    - Verify clicking/tapping the card toggles `$state(isFlipped)` and executes CSS transitions.
    - Run `npm run check` to ensure `$props()` type check passes against `Artwork` interface.

- [x] **Step 4.2: Build Client-Side Quick MCQ Component (`QuickMCQ.svelte`)**
  - **Scope & Required Files:**
    - Create `src/lib/components/QuickMCQ.svelte` receiving the JSONB `qcm_synthese` object as `$props()`.
    - Implement answer validation (`$state` tracking selected index and verifying against `correctIndex`).
    - Implement visual feedback states (OKLCH color changes for correct vs. incorrect options) and render the pedagogical `explanation` block upon selection.
    - Dispatch `onAnswer({ score, isCorrect, selectedIndex })` event to parent component.
  - **Verification Criteria:**
    - Verify state updates complete within `< 16ms` INP budget check via clean DOM handlers.
    - Verify option selection locks after the initial click to prevent score modification.

- [x] **Step 4.3: Build Bottom Navigation Bar (`BottomNav.svelte`) & Mount in Layout**
  - **Scope & Required Files:**
    - Create `src/lib/components/BottomNav.svelte` implementing the 3 tabs (`/` Today, `/catalogue` Catalog, `/progression` Progress) defined in [`doc/01_product/core_features.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/core_features.md).
    - Implement active tab indicator (`aria-current="page"`) and CSS View Transitions trigger (`document.startViewTransition()`).
    - Mount `<BottomNav />` inside `src/routes/+layout.svelte` so all pages inherit the persistent navigation shell cleanly.
  - **Verification Criteria:**
    - Verify semantic HTML navigation elements and keyboard focus accessibility (`a11y` compliance).

---

### Phase 5: Offline Cache Buffer & Synchronization Engine
- [x] **Step 5.1: Implement IndexedDB Failover Buffer (`src/lib/offline/storage.ts`)**
  - **Scope & Required Files:**
    - Create `src/lib/offline/storage.ts` encapsulating IndexedDB operations using native `idb` or vanilla `indexedDB` APIs as outlined in [`doc/03_core_engine/offline_synchronization.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/offline_synchronization.md).
    - Create Object Stores: `cached_artworks`, `cached_mcqs`, `user_progress_cache`, and `offline_sync_queue`.
    - Implement helper methods: `saveToLocalCache()`, `readFromLocalCache()`, and `queueOfflineAnswer()`.
  - **Verification Criteria:**
    - Verify operations handle database upgrade events (`onupgradeneeded`) without throwing errors.

- [x] **Step 5.2: Build Offline-to-Supabase Synchronization Queue (`src/lib/offline/sync.ts`)**
  - **Scope & Required Files:**
    - Create `src/lib/offline/sync.ts` exporting `flushOfflineQueue()`.
    - Implement network connectivity listener (`window.addEventListener('online', flushOfflineQueue)`).
    - When connectivity returns, iterate through `offline_sync_queue`, execute `supabase.from('historique_reponses').insert()` and `supabase.from('user_artwork_progress').upsert()`, and purge synchronized records from IndexedDB upon confirmation.
  - **Verification Criteria:**
    - Verify sync routine retries if Supabase returns 5xx errors.

---

### Phase 6: Primary Application Views & Navigation Routes
- [x] **Step 6.1: Implement "Today" Tab (`src/routes/+page.svelte` & `+page.ts`)**
  - **Scope & Required Files:**
    - Create `src/routes/+page.ts` implementing the daily artwork selection algorithm described in [`doc/01_product/learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md):
      1. Check Leitner items due (`next_review_at <= NOW()`) outside cooldown (`last_presented_daily_at < NOW() - INTERVAL '7 days'`).
      2. If none due, fetch next undiscovered catalog artwork (`last_presented_daily_at IS NULL`).
      3. Fallback to lowest `box_level` item.
    - Create `src/routes/+page.svelte` integrating `ArtworkCard` and `QuickMCQ`.
    - Wire MCQ answer event (`onAnswer`) to execute both `saveProgressToSupabase()` (if online) and `queueOfflineAnswer()` (if offline), updating Leitner box progression (`box_level` 1 to 5 or reset to 1).
  - **Verification Criteria:**
    - Verify data load reads cache when offline (`navigator.onLine === false`).
    - Verify Leitner calculation dates (`+1 day`, `+3 days`, `+7 days`, `+14 days`, `+30 days`) conform to [`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md).

- [x] **Step 6.2: Implement "Catalog" Tab (`src/routes/catalogue/+page.svelte` & `+page.ts`)**
  - **Scope & Required Files:**
    - Create `src/routes/catalogue/+page.ts` fetching `oeuvres` records (`id`, `titre`, `artiste`, `image_url_thumb`, `slug`) grouped by movement (`courants`), maintaining payload sizes under 10 KB as defined in [`database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md).
    - Create `src/routes/catalogue/+page.svelte` rendering the movement overview with progress badges ("3/5 discovered") and CSS Subgrid artwork layout ([`frontend_stack.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/frontend_stack.md)).
    - Create `src/routes/catalogue/[slug]/+page.svelte` displaying artwork detail and optional on-demand MCQ from `contenus_oeuvres`.
  - **Verification Criteria:**
    - Verify list query omits `qcm_synthese` and `description_courte` fields during grid render.
    - Verify search input filters across title and artist fields using `$derived()` state.

- [x] **Step 6.3: Implement "Progress" Tab (`src/routes/progression/+page.svelte`)**
  - **Scope & Required Files:**
    - Create `src/routes/progression/+page.ts` fetching aggregated user statistics (`historique_reponses` & `user_artwork_progress`).
    - Create `src/routes/progression/+page.svelte` rendering:
      1. Mastery gauge per artistic movement (`box_level` distribution).
      2. Overall MCQ success percentage calculation (`is_correct` ratio).
  - **Verification Criteria:**
    - Verify UI renders zero-state cleanly for users with no answer logs.

---

### Phase 7: AI Generator CLI & Production Pipeline Alignment
- [ ] **Step 7.1: Connect CLI Test Harness to Supabase Database (`scripts/test-chicago-quiz/`)**
  - **Scope & Required Files:**
    - Update `scripts/test-chicago-quiz/src/index.ts` to allow pushing generated JSON payloads directly into `contenus_oeuvres` and `contenus_courants` tables via Supabase Service Role key ([`doc/03_core_engine/ai_mcq_engine.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/ai_mcq_engine.md)).
    - Verify anti-duplication logic (`antiDuplicationContext`) prevents re-generation of existing facts.
  - **Verification Criteria:**
    - Run script against a test artwork ID and verify `UPSERT` execution into Supabase tables.

---

### Phase 8: Final PWA Verification & Web Vitals Auditing
- [ ] **Step 8.1: Full Production Build & Workbox Service Worker Validation**
  - **Scope & Required Files:**
    - Run `npm run build` and check output bundle sizes (`sveltekit` JS chunks under 30 KB gzipped).
    - Verify Service Worker registration (`sw.js`) and precache manifest generation.
  - **Verification Criteria:**
    - Verify offline test (`Offline` network throttling): `Today` and `Catalog` pages load from `IndexedDB` / `CacheStorage`.
    - Verify zero accessibility (`a11y`) errors across the 3 primary tabs.
