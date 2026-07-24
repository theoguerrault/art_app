# Core Features & Functional Behavior - AI Art Coach

## 1. General Description & Scope
**AI Art Coach** is a mobile-first Progressive Web App (PWA) designed for daily micro-learning and open exploration in Art History. The application transforms museum archives into an accessible pedagogical experience by combining high-resolution visual discovery with AI-curated historical context and interactive definitions.

The application provides two complementary engagement modes:
- **Daily Discovery Session ("Today"):** A daily routine where the user discovers a featured, 100% verified artwork, explores curated historical anecdotes, toggles favorites, and inspects interactive artist and movement definitions.
- **Open Catalog Exploration ("Catalog"):** An exploration library allowing users to browse the catalog of artistic movements chronologically, search for specific artworks or artists, filter content, and inspect detailed artwork analyses.

---

## 2. Navigation & Application Structure (4 Primary Tabs)
The mobile interface relies on a bottom navigation bar divided into 4 primary tabs, structured for one-handed mobile ergonomics:

```text
+-----------------------------------------------------------------------------------+
|                            MOBILE VIEWPORT (App Shell)                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Tab 1: Today / ]    [ Tab 2: Catalog ]    [ Tab 3: Admin ]   [ Tab 4: Settings ]|
|  Daily Card            Movement Grid         Content Management Theme & Options   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|      [ Today ]            [ Catalog ]           [ Admin ]         [ Settings ]    |
+-----------------------------------------------------------------------------------+
```

### 2.1 "Today" Tab (`/`)
The primary entry point of the application, focused on the daily discovery routine:
- **Daily Artwork Card:** Displays the featured artwork selected by the recommendation algorithm (filtered strictly for verified content).
  - **Front Side:** High-resolution image of the artwork, title, artist name, creation date, verification badge (`SealCheck`), and movement tag.
  - **Back Side (on tap/click):** A 3D flip animation reveals structured editorial content (`anecdote_accroche`, `anecdote_technique`, `anecdote_secrete`).
- **Interactive Glossary:** Tapping an artist name or movement tag opens a modal bottom sheet displaying a concise definition.
- **Favorites System:** Users can bookmark artworks using the heart action button. Favorites persist in local storage and synchronize when authenticated.

### 2.2 "Catalog" Tab (`/catalogue`)
The exploration library allowing users to navigate art history:
- **Movement Overview:** A structured grid of artistic movements (`courants`), each displaying a visual card and chronological sequence.
- **Search and Filters:** A reactive client-side search bar enabling instant filtering across artwork titles and artist names.
- **Infinite Scroll & Virtualized Loading:** Dynamic loading of artwork items ensuring low initial payload and smooth scrolling.
- **Artwork Detail View (`/catalogue/[slug]`):** Displays full high-resolution image, complete editorial analysis (`extended_analysis`, `historical_context`), and interactive artist/movement definition bottom sheets.

### 2.3 "Admin" Tab (`/admin/oeuvres`)
The content verification and management interface for administrators:
- **Artwork Management:** Displays all ingested artworks along with their verification status (`VERIFIED`, `PENDING`, `FALSE`, `UNVERIFIED`).
- **AI Content Generation:** Triggers automated Gemini AI synthesis of editorial text and anecdotes from raw Wikidata/Wikipedia metadata.
- **Automated Wikipedia Fact-Checking:** Runs automated verification comparing generated text against Wikipedia source text, highlighting reliability scores and quotes.
- **Auto-Correction & Manual Editing:** Allows administrators to execute single-paragraph AI rewrites or manually refine content.

### 2.4 "Settings" Tab (`/settings`)
The user options panel:
- **Theme Configuration:** Toggle theme preferences (Dark Mode default).
- **Data & Cache Management:** Clear local IndexedDB cache or manage offline availability.

---

## 3. Data & Architecture Overview
To guarantee fast visual rendering and full offline availability:
- **Content Selection & Recommendation:** Selection logic is documented in [`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md).
- **Frontend Stack & Performance:** UI framework and CSS specifications are detailed in [`02_system_architecture/frontend_stack.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/frontend_stack.md).
- **Database & Security:** PostgreSQL schema, Prisma ORM integration, and Supabase RLS policies are detailed in [`02_system_architecture/database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md).
- **Core Engine & Pipeline:** Ingestion (`ArtworkData`), AI editorial generation, and Wikipedia fact-checking are detailed inside [`03_core_engine/`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine).
