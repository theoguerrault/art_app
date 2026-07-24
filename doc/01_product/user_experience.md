# User Experience & Ergonomic Principles - AI Art Coach

## 1. Engagement Workflows & Micro-Learning Principles
**AI Art Coach** is structured for mobile micro-learning and open exploration, allowing users to discover art history through daily content sessions or extended browsing.

### 1.1 The Daily Discovery Routine ("Today")
1. **Visual Discovery:** The user opens the application (`/`) and views the daily featured artwork rendered in high resolution.
2. **Interactive Anecdotes:** Tapping the card triggers a 3D flip animation, revealing structured historical anecdotes (`anecdote_accroche`, `anecdote_technique`, `anecdote_secrete`).
3. **Glossary Inspection:** Tapping movement tags or artist names opens a modal bottom sheet displaying short pedagogical definitions.
4. **Favorites Management:** Tapping the heart icon toggles favorite state, persisting locally for offline availability and synchronizing with account storage.

### 1.2 Catalog Exploration
For users studying beyond the daily recommendation:
- **Chronological Movement Navigation:** The `/catalogue` view displays an ordered grid of artistic movements (`courants`), showing historical sequence and artwork counts.
- **Dynamic Search & Filtering:** Client-side keyword, title, and artist filtering executes instantly across the cached catalog without requiring network requests.
- **Artwork Detail View (`/catalogue/[slug]`):** Displays high-resolution imagery along with deep formal analysis (`extended_analysis`) and historical context (`historical_context`).

---

## 2. Accessibility & Layout Specifications

### 2.1 Color System & Theme Configuration
- The interface defines colors using perceptual OKLCH color spaces to maintain uniform visual weight and WCAG AA contrast compliance across light and dark modes.
- **Default Theme:** By default, the application displays in **Dark Mode** (`#121212` canvas background) to create an immersive gallery aesthetic.
- **Design System Reference:** Refer to [`ui_design_system.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/ui_design_system.md) for complete visual specs.

### 2.2 Animated Transitions & Layout Stability
- **View Transitions:** Navigation across views (`/`, `/catalogue`, `/admin/oeuvres`, `/settings`) applies smooth view transitions.
- **Zero Layout Shift:** Image containers pre-allocate exact aspect ratios prior to image loading, preventing Cumulative Layout Shift (CLS = 0.00).

### 2.3 One-Handed Mobile Ergonomics
- Interactive controls (bottom navigation bar, interactive cards, glossary modal triggers) reside within the lower two-thirds of the viewport to support one-handed thumb navigation on mobile screens.
