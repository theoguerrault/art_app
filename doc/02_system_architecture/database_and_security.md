# Database Schema & Security Architecture (PostgreSQL, Supabase & Prisma) - AI Art Coach

> [!IMPORTANT]
> **Persistence Architecture:** The application uses **Supabase PostgreSQL** as the authoritative relational database accessed via **Prisma ORM**. Local IndexedDB storage operates as an offline failover buffer for catalog items and user favorites.

---

## 1. Data Model Overview
The relational schema of **AI Art Coach** is normalized into four primary domain tiers:
1. **Structural Metadata (`courants`, `oeuvres`, `artistes` tables):** Core entities containing titles, slugs, chronological sequence, artist details, and image CDN URLs.
2. **AI-Generated & Verified Pedagogical Content (`contenus_oeuvres` table):** 1:1 child table storing historical descriptions, anecdotes (`anecdote_accroche`, `anecdote_technique`, `anecdote_secrete`), deep visual analyses (`extended_analysis`, `historical_context`), verification status (`verification_status`), and proof metadata.
3. **Interactive Glossaries (`artistes`, `courants` definition fields):** Short AI-generated definitions for artist biographies and movement characteristics used by the bottom sheet UI.
4. **User Favorites & Cooldown Tracking (`user_favorites`, `user_artwork_progress` tables):** Saved bookmarks and daily artwork presentation logs (`last_presented_daily_at`, `times_presented_daily`).

---

## 2. Complete SQL DDL Schema

```sql
-- ==============================================================================
-- 0. EXTENSIONS & PARAMETERS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ARTISTIC MOVEMENTS & ARTISTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.courants (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    siecle VARCHAR(100) NOT NULL,
    oklch_token VARCHAR(50) NOT NULL,
    ordre_chronologique INT NOT NULL UNIQUE,
    description_courte TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.artistes (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    biographie_courte TEXT NULL,
    annee_naissance INT NULL,
    annee_deces INT NULL,
    nationalite VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. ARTWORKS & ASSOCIATED CONTENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.oeuvres (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    id_courant INT NOT NULL REFERENCES public.courants(id) ON DELETE RESTRICT,
    id_artiste INT NULL REFERENCES public.artistes(id) ON DELETE SET NULL,
    titre VARCHAR(200) NOT NULL,
    titre_international VARCHAR(200) NULL,
    artiste VARCHAR(150) NOT NULL,
    date_creation VARCHAR(100) NOT NULL,
    image_url_full TEXT NOT NULL,
    image_url_thumb TEXT NOT NULL,
    aspect_ratio FLOAT NOT NULL DEFAULT 1.33,
    ordre_dans_courant INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    musee VARCHAR(200) NULL,
    dimensions VARCHAR(100) NULL,
    medium VARCHAR(200) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contenus_oeuvres (
    id_oeuvre INT PRIMARY KEY REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    anecdote_accroche TEXT NOT NULL,
    anecdote_technique TEXT NOT NULL,
    anecdote_secrete TEXT NOT NULL,
    extended_analysis TEXT NULL,
    historical_context TEXT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'FALSE', 'UNVERIFIED')),
    verification_report JSONB NULL,
    generated_by_model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-pro',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. USER FAVORITES & PROGRESS LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id_oeuvre INT NOT NULL REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id_oeuvre)
);

CREATE TABLE IF NOT EXISTS public.user_artwork_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id_oeuvre INT NOT NULL REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    last_presented_daily_at TIMESTAMPTZ NULL,
    times_presented_daily INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id_oeuvre)
);
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.courants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artistes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oeuvres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenus_oeuvres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read movements" ON public.courants FOR SELECT USING (true);
CREATE POLICY "Public read artists" ON public.artistes FOR SELECT USING (true);
CREATE POLICY "Public read active artworks" ON public.oeuvres FOR SELECT USING (is_active = true);
CREATE POLICY "Public read contents" ON public.contenus_oeuvres FOR SELECT USING (true);

-- User Favorites Security Policy
CREATE POLICY "User manage favorites" ON public.user_favorites
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 4. Prisma ORM Integration
Server-side data routes (`+page.server.ts`, `+server.ts`) query the database using **Prisma ORM**.

### 4.1 Prisma Client Setup (`src/lib/server/prisma.ts`)
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

### 4.2 Query Example: Fetching Daily Featured Artwork
```typescript
import { prisma } from '$lib/server/prisma';

export async function load() {
  const lesson = await prisma.oeuvres.findFirst({
    where: {
      is_active: true,
      contenus_oeuvres: {
        verification_status: 'VERIFIED'
      }
    },
    include: {
      contenus_oeuvres: true,
      courants: true,
      artistes: true
    }
  });

  return { lesson };
}
```
