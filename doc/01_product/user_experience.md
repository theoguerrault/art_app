# User Experience & Engagement Principles - AI Art Coach

## 1. Engagement Workflows & Micro-Learning Principles
**AI Art Coach** is structured for mobile micro-learning, enabling users to complete daily learning sessions within 5 minutes.

### 1.1 The Daily Micro-Learning Loop ("Snack Learning")
1. **Discovery:** The user opens the application (`/`) and views the daily artwork card rendered in high resolution.
2. **Active Inquiry:** Tapping the card triggers a smooth 3D flip animation, displaying the artwork analysis (`anecdote_accroche`).
3. **Active Recall Testing:** Immediately below or upon flipping, the user answers a 4-option multiple-choice question targeting the artwork or its movement.
4. **Immediate Reinforcement:** Instant client evaluation displays correct or incorrect status along with a pedagogical correction (~60 words), and updates the item's position inside the Leitner Spaced Repetition engine ([`learning_mechanics.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/learning_mechanics.md)).

### 1.2 "Binge Learning" Free Exploration
For users studying beyond the daily recommendation:
- **Chronological Movement Navigation:** The `/catalogue` tab displays an ordered grid of artistic movements (`courants`), showing historical progression and user completion metrics.
- **Dynamic Search & Filtering:** Instant client-side keyword, title, and artist filtering across the locally cached catalog without network requests.

---

## 2. UI & Accessibility Specifications
The application applies standard browser CSS specifications and accessibility criteria:

> [!IMPORTANT]
> Pour toute implémentation UI/CSS (couleurs, bordures, boutons), référez-vous au document complet : [`ui_design_system.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/01_product/ui_design_system.md).

### 2.1 Perceptual Color System & Theme Configuration
- The interface defines colors using a perceptual OKLCH color model to maintain uniform visual weight and exact WCAG AA contrast compliance across light and dark modes.
- **Default Theme:** By default, the application displays in **Dark Mode** (`data-theme="dark"` ou fond `#121212`) pour une expérience immersive Content-First. L'UI s'efface au profit des oeuvres.
- **Dynamic Backgrounds :** Au lieu de couleurs de mouvements statiques, l'application privilégie des effets d'extraction de couleurs (halo/glow) obtenus via l'ombre portée de l'image (CSS Blur Trick).

### 2.2 Animated Transitions & Layout Stability
- **Animated Transitions:** Navigating across views (`/`, `/catalogue`, `/progression`, `/settings`) applies seamless visual transitions using the View Transitions API between interface states.
- **Zero Layout Shift:** Image containers pre-allocate exact aspect ratios prior to image loading, preventing visual jumps during rendering.

### 2.3 One-Handed Mobile Ergonomics
- Interactive controls (bottom navigation bar across all 4 main tabs, quiz option buttons, card flip targets) reside within the lower two-thirds of the viewport to support one-handed thumb navigation on mobile screens.
