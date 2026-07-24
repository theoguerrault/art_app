# MVP Implementation Roadmap & Feature Roadmap - AI Art Coach

## 1. Autonomous Agent Execution Protocol
When the user instructs the agent to `"continue implementation"`, `"continue l'implémentation"`, or any equivalent directive, the agent MUST execute the following protocol without requiring manual intervention between steps:

1. **Read Roadmap State:** Open this document (`doc/04_project_management/mvp_roadmap.md`) and check the phase checklist below.
2. **Locate Active or Next Step:**
   - Locate the item currently marked `[/]` (In Progress).
   - If no item is marked `[/]`, locate the first item marked `[ ]` (Uncompleted) and update its checkbox to `[/]` using a file edit tool before starting execution.
3. **Execute Scope:** Perform the file creations, modifications, and shell commands defined in the **Scope & Required Files** section for that step.
4. **Verify Checkpoint:** Run the exact checks specified under **Verification Criteria**.
5. **Mark Completion & Proceed Autonomously:**
   - Once verification succeeds, update the current step's checkbox from `[/]` to `[x]` (Completed).
   - Locate the next sequential `[ ]` step, mark it as `[/]`, and proceed to execute it.

---

## 2. Implementation Phases & Step-by-Step Checklist

### Phase 1: Project Scaffolding & Configuration
- [x] **Step 1.1: Initialize SvelteKit PWA Project Structure**
  - Configured SvelteKit with Svelte 5 and `@vite-pwa/sveltekit`.
  - Configured `vite.config.ts` and `svelte.config.js`.

---

### Phase 2: Database Schema & Supabase / Prisma Integration
- [x] **Step 2.1: Execute PostgreSQL DDL Schema & RLS Policies**
  - Created initial DDL schema for `courants`, `oeuvres`, `contenus_oeuvres`, `artistes`, and `user_favorites`.
  - Implemented Row Level Security (RLS) policies for public catalog read access and authenticated user operations.
- [x] **Step 2.2: Prisma ORM Integration & Supabase Client**
  - Configured `prisma/schema.prisma` with multi-schema access.
  - Implemented `src/lib/server/prisma.ts` for server-side queries.

---

### Phase 3: Core Design System & Native CSS Architecture
- [x] **Step 3.1: Implement OKLCH Color Tokens & Responsive Layout Utilities**
  - Created global CSS design system (`src/app.css`) with OKLCH color spaces, dark mode canvas (`#121212`), and pill shape utilities.
  - Built core layout shell (`src/routes/+layout.svelte`) and mobile viewport rules.

---

### Phase 4: Core Interactive Components (Svelte 5 Runes)
- [x] **Step 4.1: Build Artwork Flip Card Component (`ArtworkCard.svelte`)**
  - Implemented 3D flip card with front imagery and back structured anecdotes.
  - Enforced explicit `aspect-ratio` CSS declarations to prevent layout shift.
- [x] **Step 4.2: Build Bottom Navigation Bar (`BottomNav.svelte`) & Liquid Glass Styling**
  - Implemented 4-tab liquid glass bottom navigation (`/` Today, `/catalogue` Catalog, `/admin/oeuvres` Admin, `/settings` Settings).
  - Added active pill state indicator and mobile keyboard auto-hide listener.
- [x] **Step 4.3: Build Interactive Glossary Bottom Sheet (`GlossaryBottomSheet.svelte`)**
  - Implemented modal bottom sheet for displaying artist biographies and movement characteristics on demand.

---

### Phase 5: Offline Caching & Favorites System
- [x] **Step 5.1: Implement IndexedDB Storage & Favorites Cache (`src/lib/offline/storage.ts`)**
  - Implemented IndexedDB stores for caching artwork metadata, movements, and user favorites.
- [x] **Step 5.2: Build User Favorites API & State Synchronization**
  - Created `/api/favorites` API endpoint and reactive heart button toggle.

---

### Phase 6: Primary Application Views & Navigation Routes
- [x] **Step 6.1: Implement "Today" Tab (`src/routes/+page.svelte`)**
  - Built daily discovery view featuring 100% verified artworks (`verification_status = 'VERIFIED'`).
  - Integrated 3D artwork flip card, favorite button, and interactive glossary triggers.
- [x] **Step 6.2: Implement "Catalog" Tab (`src/routes/catalogue/+page.svelte` & `[slug]/+page.svelte`)**
  - Built movement overview grid and artwork search & filtering.
  - Implemented infinite scroll / paginated dynamic loading for fast catalog rendering.
  - Built artwork detail view displaying complete visual analyses and historical context.
- [x] **Step 6.3: Implement "Settings" Tab (`src/routes/settings/+page.svelte`)**
  - Built theme configuration and local cache management controls.

---

### Phase 7: AI Ingestion & Wikipedia Fact-Checking Pipeline
- [x] **Step 7.1: Automated Artwork Content Generation**
  - Implemented Gemini AI editorial content generation service (`generateArtworkContent`).
- [x] **Step 7.2: Automated Wikipedia Fact-Checking & Auto-Correction Engine**
  - Implemented `factCheckArtworkContent` comparing generated paragraphs against Wikipedia source text (`VERIFIED`, `FALSE`, `UNVERIFIED`).
  - Integrated fact-checking workflow and single-paragraph AI auto-correction into the Admin dashboard (`/admin/oeuvres/[id]`).
- [x] **Step 7.3: Global Verification Trigger**
  - Configured global status updates (`verification_status = 'VERIFIED'`) upon completing full verification.

---

### Phase 8: Future Enhancements & Feature Extensions
- [ ] **Step 8.1: Advanced Search & Attribute Filtering**
  - **Scope & Required Files:**
    - Extend catalog search to filter by century, artistic medium (oil on canvas, wood, marble), and museum location.
  - **Verification Criteria:**
    - Verify filtering operates smoothly across large artwork lists.
- [ ] **Step 8.2: Custom User Collections & Playlists**
  - **Scope & Required Files:**
    - Allow authenticated users to create named artwork collections (e.g., "Renaissance Portraits", "Impressionist Landscapes").
  - **Verification Criteria:**
    - Verify users can create, edit, and share custom artwork lists.
- [ ] **Step 8.3: Multi-Language Support**
  - **Scope & Required Files:**
    - Integrate i18n support for switching interface labels and artwork summaries between English, French, and Spanish.
  - **Verification Criteria:**
    - Verify seamless locale switching across UI elements.
