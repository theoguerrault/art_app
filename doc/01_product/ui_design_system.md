# UI Design System & Principes (Content-First & Minimalisme)

Ce document est la **référence absolue** pour tout développement frontend et intégration CSS de l'application. 

> [!IMPORTANT]
> **Règle d'or pour les Agents IA** : L'interface doit *s'effacer* au profit du contenu. Avant d'ajouter toute bordure, ombre complexe ou couleur d'arrière-plan, demandez-vous : *"Est-ce que cela met en valeur l'oeuvre, ou est-ce que cela distrait l'utilisateur ?"*

## 1. Principes Fondamentaux : Content-First

L'application suit les modèles visuels d'Instagram (pour la part d'écran dédiée aux visuels) et de Spotify (pour l'ambiance sombre et immersive).

- **Affichage grand format :** Les images des oeuvres doivent occuper la plus grande partie possible de l'écran. 
- **Neutralité structurelle :** L'interface ne doit pas concurrencer l'oeuvre. Les éléments d'interface (fonds, cartes) utilisent des couleurs neutres (noir profond ou blanc).
- **Zéro fioriture :** Pas de dégradés complexes sur les boutons, pas de bordures multicolores si cela ne sert pas le contenu.

## 2. Thème & Couleurs

### 2.1 Dark Mode Natif (Immersif)
Le **Dark Mode** est le thème par défaut de l'application pour préserver l'autonomie des écrans OLED et créer une ambiance "salle obscure".
- **Background Principal :** `#121212` (Noir profond / Spotify Dark Gray).
- **Couleur Primaire (Accent) :** `#FA47FF` (Rose/Violet vif). Utilisée avec parcimonie pour les appels à l'action principaux ou les états actifs.
- **Texte :** `#FFFFFF` pour le primaire, avec des opacités réduites pour les textes secondaires.

### 2.2 Effet "Dynamic Background" (Extraction de Couleur)
Pour simuler l'extraction de la couleur dominante **côté client sans utiliser l'API Canvas (performances)** :
- Utiliser la technique de **l'ombre portée floutée** (CSS Blur Trick).
- Placer une copie de l'image (ou la même image) en arrière-plan (z-index négatif), appliquer un filtre `blur(60px)` à `blur(100px)` et réduire son opacité (ex: `opacity: 0.3`).
- Cela crée un halo coloré dynamique et naturel autour de l'image (style Spotify) sans aucun coût JS.

## 3. Formes & Composants

### 3.1 Pilules & Capsules (Pill Shape Mandatory)
Par souci de cohérence visuelle absolue sur toute l'application :
- **L'utilisation de formes en pilule (capsule) est obligatoire tout le temps** pour tous les boutons d'action (Jouer, Valider, etc.), les indicateurs de statut de validation ("VERIFIED", "FALSE", "PENDING"), les scores de fiabilité, et les badges.
- **CSS :** `border-radius: var(--radius-pill);` (ou `9999px`).

### 3.2 Cartes & Conteneurs (Rounded Corners)
Les éléments contenant des recommandations ou des oeuvres (comme dans le catalogue) doivent avoir des angles très arrondis pour contraster avec le format carré classique.
- **CSS :** Utilisation de `--radius-xl` ou `--radius-2xl` (ex: `1.5rem`).

### 3.3 Typographie & Titres Administratifs
- **Police générale :** Sobriété sans-serif (`var(--font-body)`).
- **Titres principaux & panneaux :** Privilégier la casse en **MAJUSCULES (uppercase)** avec un espacement de lettres (`letter-spacing: 0.05em`) pour hiérarchiser clairement la structure de la page.

## 4. Iconographie & Layout

### 4.1 Icônes Filaires (Phosphor Icons)
- Utilisation stricte de la librairie **Phosphor Icons**.
- Variantes : Uniquement en mode **Outline / Regular** (pas de bold, pas de fill sauf pour les états "likés" ou "actifs").
- Symboles universels et minimalistes (coeur pour favori, loupe pour recherche, etc.).

### 4.2 Grille Stricte (Grid Layout)
- Dans le catalogue ou toute vue sous forme de liste, l'utilisation de `display: grid` est obligatoire.
- Grille rigide, symétrique, sans décalage masonry aléatoire, pour un aspect très organisé et institutionnel.
