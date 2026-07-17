# Core Features & Functional Behavior - AI Art Coach

## 1. General Description & Scope
**AI Art Coach** is a mobile-first Progressive Web App (PWA) designed for daily micro-learning in Art History. 
The application transforms open-data museum archives into interactive pedagogical modules by combining visual discovery with active recall testing (Multiple-Choice Questions / MCQs).

The application provides two complementary user engagement modes:
- **Daily "Snack Learning" Session:** A 5-minute daily routine where the user discovers a curated featured artwork, reads an introductory analysis, and completes an associated pedagogical MCQ to reinforce memory retention (governed by the Leitner algorithm defined in [`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md)).
- **"Binge Learning" Free Exploration Mode:** An open exploration mode allowing users to browse the chronological catalog of artistic movements, search for specific artworks or artists, and complete knowledge tests at their own pace.

---

## 2. Navigation & Application Structure (3 Primary Tabs)
The mobile interface relies on a bottom navigation bar divided into 3 tabs, structured for one-handed mobile ergonomics.

```text
+-----------------------------------------------------------------------------------+
|                            MOBILE VIEWPORT (App Shell)                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   [ Tab 1: Today / ]         [ Tab 2: Catalog /catalogue ]    [ Tab 3: Progress ] |
|   Daily Card & Quick MCQ     Movement Grid & Search           Mastery & Stats     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|        [ Today ]                  [ Catalog ]                [ Progress ]         |
+-----------------------------------------------------------------------------------+
```

### 2.1 "Today" Tab (`/`)
The primary entry point of the application, focused on the daily micro-learning routine:
- **Daily Artwork Card:** Displays the featured artwork selected by the daily recommendation algorithm.
  - **Front Side:** High-resolution image of the artwork, title, artist name, creation date, and colored badge indicating the artistic movement.
  - **Back Side (on tap/click):** A 3D flip animation reveals a concise description of the artwork along with one historical or cultural anecdote (`anecdote_accroche`).
- **Quick MCQ:** Located directly beneath the artwork card (or unlocked after flipping).
  - Presents 1 multiple-choice question covering the artwork, its creator, or the artistic movement, accompanied by 4 options.
  - **Instant Validation & Feedback:** Client-side evaluation provides immediate interaction response, highlighting correct vs. incorrect options with distinct visual colors and displaying a pedagogical explanation (~60-70 words).

### 2.2 "Catalog" Tab (`/catalogue`)
The exploration library allowing users to navigate art history chronologically:
- **Movement Overview:** A structured grid of artistic movements (`courants`), each displaying a dynamic progress indicator (e.g., "3/5 artworks discovered" and mastery badge).
- **Search and Filters:** A reactive client-side search bar enabling filtering across artwork titles, artist names, or descriptive keywords.
- **Movement Detail View (`/catalogue/[slug]`):** Displays the chronological list of artworks belonging to a movement, indicating the individual status of each piece:
  - *Discovered:* Artwork viewed by the user.
  - *MCQ Passed:* Associated quiz successfully completed.
  - *To Discover:* Unvisited artwork available for exploration.

### 2.3 "Progress" Tab (`/progression`)
The user dashboard summarizing learning achievements and retention metrics:
- **Movement Mastery Gauge:** Visual gauges displaying the distribution of learned concepts across Leitner retention boxes (`box_level` 1 to 5) for each artistic movement.
- **Global Performance Statistics:** Displays overall MCQ success rates (`is_correct` ratio), total artworks discovered, and current streak statistics.

---

## 3. High-Level Data & Architecture Overview
To guarantee instant visual rendering and full offline availability, the application separates data concerns across architectural layers:
- **Pedagogical Progression & Spaced Repetition:** The Leitner 5-box intervals and daily selection logic are detailed in [`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md).
- **Frontend Tech Stack & Performance:** The UI framework, styling specifications, and client architecture are detailed in [`02_system_architecture/frontend_stack.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/frontend_stack.md).
- **Database & Security:** Authoritative Supabase SQL DDL, views, and RLS policies are detailed in [`02_system_architecture/database_and_security.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/02_system_architecture/database_and_security.md).
- **Core Engine & Data Pipeline:** Data ingestion (`ArtworkData`), AI MCQ generation (`QcmSchema`), and offline synchronization queues are detailed inside [`03_core_engine/`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine).
