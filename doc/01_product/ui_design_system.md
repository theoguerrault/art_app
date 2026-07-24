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
- **Editorial Headings:** Artwork titles and primary section headers use high-contrast serif typography in sentence case or uppercase with subtle letter spacing (`letter-spacing: 0.05em`).
- **Interface & Body Text:** Labels, metadata, and body text use a clean, geometric sans-serif font for maximum legibility at small sizes.

---

## 4. Layout & Navigation

### 4.1 Wireframe Iconography
- Interface controls use single-weight line icons (1.5px to 2px stroke weight).
- Filled icon variants indicate active or toggled states (e.g., filled heart for saved favorites).

### 4.2 Grid Consistency & Alignment
- Movement overviews and artwork catalogs use a strict multi-column responsive grid layout with consistent gap spacing.
