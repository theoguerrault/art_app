# UI Design System & Aesthetic Principles

This document defines the user interface design system and aesthetic principles for the application.

> [!IMPORTANT]
> **Core Principle**: The user interface recedes to highlight artwork content. Design choices prioritize content legibility and visual immersion without unnecessary interface distraction.

---

## 1. Fundamental Design Principles: Content-First

- **High-Resolution Artwork Presentation:** Artwork imagery occupies the maximum viewport area possible.
- **Structural Neutrality:** Interface controls use desaturated neutral background tones to avoid competing with artwork colors.
- **Minimalist Surface Detailing:** Avoid complex gradients on action elements or excessive outer borders. Surface styling remains restrained and editorial.

---

## 2. Palette & Color Tokens

### 2.1 Immersive Dark Theme
Dark mode is the primary theme of the application, evoking a dark gallery or museum environment.
- **Primary Background:** `#121212` (Deep Charcoal Ink).
- **Surface Elevation:** `#1E1E1E` (Dark Grey Card background).
- **Accent Color:** Vibrant magenta/purple (`#FA47FF` or HSL/OKLCH equivalents) used strictly for primary action buttons, active navigation indicators, or active states.
- **Text Color Hierarchy:** High-contrast white (`#FFFFFF`) for primary headings, medium-light grey (`#A1A1AA`) for secondary metadata, and muted grey (`#71717A`) for auxiliary labels.

---

## 3. Component Geometry & Typography

### 3.1 Capsule & Pill Shapes
- Primary buttons, status badges, movement tags, and active navigation indicators use fully rounded pill geometries (`border-radius: 9999px` or `2rem`).
- Soft rounded edges distinguish interactive interface controls from the rectangular geometry of traditional fine art canvases.

### 3.2 Containers & Cards
- Artwork cards and recommendation containers use rounded corners (`border-radius: 1rem` to `1.5rem`) to frame artwork previews cleanly.

### 3.3 Typography & Hierarchy
- **Single Universal Sans-Serif:** The entire application and admin interface use a single geometric sans-serif typeface (`Geist` / `Inter`) across all headings, titles, body copy, metadata, and buttons for maximum modern visual consistency and legibility.
- **Heading Weight & Tracking:** Headings use bold to extra-bold weights (`font-weight: 700` to `800`) with tight line heights (`line-height: 1.15` to `1.2`) and subtle letter spacing where appropriate.

---

## 4. Layout & Navigation

### 4.1 Wireframe Iconography
- Interface controls use single-weight line icons (1.5px to 2px stroke weight).
- Filled icon variants indicate active or toggled states (e.g., filled heart for saved favorites).

### 4.2 Grid Consistency & Alignment
- Movement overviews and artwork catalogs use a strict multi-column responsive grid layout with consistent gap spacing.

### 4.3 Cold-Boot Splash Screen (`app.html` & `SplashScreen.svelte`)
- **Instant Paint (0ms FOUC Prevention):** Critical splash screen HTML & CSS is pre-inlined in `app.html` to guarantee instant paint on cold boot before any page components render.
- **Minimalist Logo Presentation:** Displays exclusively the centered app logo icon badge (`96px`) over a dark `#121212` canvas with ambient magenta glow (`#FA47FF`).
- **Cold Boot Only:** Shown strictly once per session during cold startup (1.5 seconds duration); never shown during in-app navigation.
- **Smooth Dissolve:** Dissolves via a hardware-accelerated 400ms cross-fade once initial assets and cache warmup complete.
