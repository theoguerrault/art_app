# Database Schema & Security Architecture (PostgreSQL & Supabase) - AI Art Coach

> [!IMPORTANT]
> **MVP Persistence Architecture (Supabase SQL & Offline Failover):** The MVP uses **Supabase PostgreSQL** as the authoritative database (`user_artwork_progress` and `historique_reponses`) to persist user progression, quiz scores, and multi-day daily cooldowns. Local cache and Service Worker storage (`IndexedDB`) operate strictly as a failover buffer during **offline mode**, automatically synchronizing with Supabase when connectivity is restored (detailed in [`03_core_engine/offline_synchronization.md`](file:///Users/theoguerrault/Documents/Projets/art_app/doc/03_core_engine/offline_synchronization.md)).

## 1. Data Model Overview
The relational schema of **AI Art Coach** is normalized into three functional tiers:
1. **Structural Metadata (`courants` & `oeuvres` tables):** Parent tables containing attributes, titles, slugs, and image CDN URLs. Separating these fields enables catalog list queries under 10 ms without loading text descriptions.
2. **AI-Generated Enriched Pedagogical Contents (`contenus_courants` & `contenus_oeuvres` tables):** 1:1 child tables storing historical descriptions, anecdotes (`anecdote_accroche`, `anecdote_technique`, `anecdote_secrete`), keyword arrays, and structured JSONB multiple-choice questions (`qcm`).
3. **User Progression & Experience (`historique_reponses` & `user_artwork_progress` tables):** Answer logs alongside consolidated learning state and daily cooldown tracking (`last_presented_daily_at`, `times_presented_daily`).

---

## 2. Complete SQL DDL Schema (`schema.sql`)
Full DDL script for execution in the Supabase SQL Editor or via Supabase CLI migrations:

```sql
-- ==============================================================================
-- 0. EXTENSIONS & PARAMETERS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ARTISTIC MOVEMENTS & ASSOCIATED CONTENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.courants (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    siecle VARCHAR(100) NOT NULL,
    oklch_token VARCHAR(50) NOT NULL, -- e.g., 'oklch(0.75 0.12 65)'
    ordre_chronologique INT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contenus_courants (
    id_courant INT PRIMARY KEY REFERENCES public.courants(id) ON DELETE CASCADE,
    description_courte TEXT NOT NULL,
    caracteristiques_cles JSONB NOT NULL, -- Array of strings: ["Chiaroscuro", "..."]
    contexte_historique TEXT NOT NULL,
    qcm_synthese JSONB NOT NULL, -- { "question": "...", "options": [...], "correctIndex": 0, "explanation": "..." }
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. ARTWORKS & ASSOCIATED CONTENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.oeuvres (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    id_courant INT NOT NULL REFERENCES public.courants(id) ON DELETE RESTRICT,
    titre VARCHAR(200) NOT NULL,
    artiste VARCHAR(150) NOT NULL,
    date_creation VARCHAR(100) NOT NULL,
    image_url_full TEXT NOT NULL,      -- Full HD WebP CDN
    image_url_thumb TEXT NOT NULL,     -- Thumbnail 300px WebP CDN
    aspect_ratio FLOAT NOT NULL DEFAULT 1.33,
    ordre_dans_courant INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    musee VARCHAR(200) NULL,
    dimensions VARCHAR(100) NULL,
    medium VARCHAR(200) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(id_courant, ordre_dans_courant)
);

CREATE TABLE IF NOT EXISTS public.contenus_oeuvres (
    id_oeuvre INT PRIMARY KEY REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    anecdote_accroche TEXT NOT NULL,   -- Tier 1: Visual / Pop-culture hook
    anecdote_technique TEXT NOT NULL,  -- Tier 2: Stylistic / Color analysis
    anecdote_secrete TEXT NOT NULL,    -- Tier 3: Little-known historical secret
    extended_analysis TEXT NULL,       -- Deep visual/formal analysis from Wikipedia REST API
    historical_context TEXT NULL,      -- Deep provenance/history from Wikipedia REST API
    detailed_description TEXT NULL,    -- Rich coherent artwork description (~300-500 words, FR) from Wikipedia + Gemini, cached
    qcm JSONB NOT NULL,                -- Full QcmSchema: { "sourceQuote": "...", "conceptTag": "...", "difficulty": "medium", "question": "...", "options": ["A","B","C","D"], "correctIndex": 2, "explanation": "..." }
    mots_cles JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array for keyword search
    generated_by_model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-pro',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. USER PROGRESSION & HISTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.historique_reponses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id_oeuvre INT NULL REFERENCES public.oeuvres(id) ON DELETE SET NULL,
    id_courant INT NULL REFERENCES public.courants(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL,
    reponse_choisie INT NOT NULL,
    score SMALLINT NULL,               -- Numerical score or percentage
    encounter_type VARCHAR(20) NOT NULL DEFAULT 'DAILY' CHECK (encounter_type IN ('DAILY', 'CATALOG', 'REVIEW')), -- 'DAILY' = new discovery on `/`, 'REVIEW' = Leitner spaced repetition review on `/`, 'CATALOG' = free exploration on `/catalogue`
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Integrity Constraint (XOR): answer relates to EITHER an artwork OR a movement
    CONSTRAINT chk_oeuvre_xor_courant CHECK (
        (id_oeuvre IS NOT NULL AND id_courant IS NULL) OR 
        (id_oeuvre IS NULL AND id_courant IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.user_artwork_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id_oeuvre INT NOT NULL REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    
    -- Daily Artwork Cooldown & Presentation Tracking
    last_presented_daily_at TIMESTAMPTZ NULL,
    times_presented_daily INT NOT NULL DEFAULT 0,
    
    -- Spaced Repetition / Leitner Learning System
    box_level SMALLINT NOT NULL DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_score SMALLINT NULL,
    consecutive_correct SMALLINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, id_oeuvre)
);

-- ==============================================================================
-- 4. CRITICAL PATH PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_oeuvres_courant_ordre ON public.oeuvres(id_courant, ordre_dans_courant) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_historique_user_date ON public.historique_reponses(user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_review ON public.user_artwork_progress(user_id, next_review_at, last_presented_daily_at);
```

---

## 3. Optimized SQL Views (`v_lecons_actives`)
To avoid multi-table joins on client devices when fetching catalog or daily items, SQL views consolidate active artwork and movement records:

```sql
CREATE OR REPLACE VIEW public.v_lecons_actives AS
SELECT 
    o.id AS id_oeuvre,
    o.slug,
    o.titre,
    o.artiste,
    o.date_creation,
    o.image_url_full,
    o.image_url_thumb,
    o.aspect_ratio,
    o.ordre_dans_courant,
    o.musee,
    o.dimensions,
    o.medium,
    c.id AS id_courant,
    c.nom AS nom_courant,
    c.oklch_token,
    co.anecdote_accroche,
    co.anecdote_technique,
    co.anecdote_secrete,
    co.extended_analysis,
    co.historical_context,
    co.qcm,
    co.mots_cles
FROM public.oeuvres o
JOIN public.courants c ON o.id_courant = c.id
JOIN public.contenus_oeuvres co ON o.id = co.id_oeuvre
WHERE o.is_active = TRUE
ORDER BY c.ordre_chronologique ASC, o.ordre_dans_courant ASC;
```

---

## 4. Security: Row Level Security (RLS) Policies
Supabase Row Level Security restricts endpoint access: client applications have read-only access to catalog and pedagogical content, and authenticated users can access or modify only their own individual progress and answer records.

```sql
-- Enable RLS across all tables
ALTER TABLE public.courants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenus_courants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oeuvres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenus_oeuvres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_artwork_progress ENABLE ROW LEVEL SECURITY;

-- 1. Catalog & Contents (Public Read for all, including anonymous users)
CREATE POLICY "Public read for movements" ON public.courants FOR SELECT USING (true);
CREATE POLICY "Public read for movement contents" ON public.contenus_courants FOR SELECT USING (true);
CREATE POLICY "Public read for active artworks" ON public.oeuvres FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for artwork contents" ON public.contenus_oeuvres FOR SELECT USING (true);

-- 2. MCQ Answer History & Progress (Strictly private per user)
CREATE POLICY "Individual history read" ON public.historique_reponses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Individual history insert" ON public.historique_reponses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Individual progress manage" ON public.user_artwork_progress
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 5. Architectural Rationale for 1:1 Relations
Separating `oeuvres` (parent table) from `contenus_oeuvres` (child 1:1 table) provides two technical functions:
- **Payload Optimization (`adapter-static`):** When accessing `/catalogue`, the PWA queries only `oeuvres` (`id`, `titre`, `artiste`, `image_url_thumb`), generating a JSON payload under 8 KB for 30 items. Including text descriptions (~3 KB per record) in the parent table increases the list payload by over 90 KB.
- **Isolated Content Updates:** The AI generation pipeline updates pedagogical text and structured JSONB MCQs in `contenus_oeuvres` without locking or modifying structural metadata in `oeuvres`.

---

## 6. Prisma ORM Integration

The application uses **Prisma ORM** as the server-side database access layer. It connects to the Supabase PostgreSQL database, manages schema introspection, and generates TypeScript definitions.

### 6.1 Configuration & Multi-Schema Setup
Prisma is configured in `prisma/schema.prisma`. It utilizes the `multiSchema` preview feature to access both the `public` schema (application tables) and the `auth` schema (Supabase GoTrue system tables).

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["auth", "public"]
}
```

### 6.2 Connection Environment Variables
Prisma configuration relies on two distinct database connection URIs defined in system environment variables:
- **`DATABASE_URL`**: Connects through the Supabase connection pooler (transaction mode, port 6543) for runtime queries.
- **`DIRECT_URL`**: Connects directly to the PostgreSQL database (port 5432) for schema migrations and introspection.

### 6.3 Command Reference & Code Generation
To generate the Prisma Client and compile TypeScript types:

```bash
npx prisma generate
```

To sync local schema changes with the database:

```bash
npx prisma db pull
```

### 6.4 Client Initialization & Server-Side Usage
Instantiate `PrismaClient` in `src/lib/server/prisma.ts` to ensure database access runs strictly on the server:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

*Note: Prisma Client must be imported and run exclusively in server-side load files (`+page.server.ts`, `+layout.server.ts`) or API endpoints (`+server.ts`).*

#### Query Example: Fetching Active Artworks with Relations
```typescript
import { prisma } from '$lib/server/prisma';

export async function load() {
  const activeArtworks = await prisma.oeuvres.findMany({
    where: { is_active: true },
    include: {
      contenus_oeuvres: true,
      courants: true,
    },
    orderBy: {
      ordre_dans_courant: 'asc',
    },
  });
  return { activeArtworks };
}
```

