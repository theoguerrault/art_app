# Database Schema & Security Architecture (PostgreSQL, Supabase & Prisma) - AI Art Coach

> [!IMPORTANT]
> **Persistence Architecture:** The application uses **Supabase PostgreSQL** as the authoritative relational database accessed via **Prisma ORM**. Local IndexedDB storage operates as an offline failover buffer for catalog items and user favorites.

---

## 1. Data Model Overview
The relational schema of **AI Art Coach** is normalized into four primary domain tiers:
1. **Core Entities (`courants`, `oeuvres`, `artistes` tables):** Slugs, chronological sequence, aspect ratios, CDN URLs, and foreign keys.
2. **Multilingual Translations & Verified Content (`oeuvre_translations`, `courant_translations`, `artiste_translations` tables):** i18n child tables indexed by `[id, language_code]`. `oeuvre_translations` stores localized titles (`titre`), main articles (`article_principal`), intros (`introduction`), article portions (`article_portions`), verification status (`verification_status`), and interactive MCQs (`qcm`).
3. **User Progress & Leitner SRS (`user_artwork_progress` table):** Tracks daily presentation cooldowns (`last_presented_daily_at`, `times_presented_daily`) and Leitner Box SRS scheduling (`box_level`, `next_review_at`, `last_score`, `consecutive_correct`).
4. **User Favorites & Response History (`user_favorites`, `historique_reponses` tables):** Bookmarked user items and audit records of user quiz answers.

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
    siecle VARCHAR(100) NOT NULL,
    oklch_token VARCHAR(50) NOT NULL,
    ordre_chronologique INT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courant_translations (
    id_courant INT NOT NULL REFERENCES public.courants(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    nom VARCHAR(150) NOT NULL,
    description_courte TEXT NOT NULL,
    caracteristiques_cles JSONB NOT NULL,
    contexte_historique TEXT NOT NULL,
    qcm_synthese JSONB NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_courant, language_code)
);

CREATE TABLE IF NOT EXISTS public.artistes (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.artiste_translations (
    id_artiste INT NOT NULL REFERENCES public.artistes(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    nom VARCHAR(150) NOT NULL,
    description_courte TEXT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_artiste, language_code)
);

-- ==============================================================================
-- 2. ARTWORKS & TRANSLATION CONTENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.oeuvres (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    id_courant INT NOT NULL REFERENCES public.courants(id) ON DELETE RESTRICT,
    id_artiste INT NOT NULL REFERENCES public.artistes(id) ON DELETE RESTRICT,
    date_creation VARCHAR(100) NOT NULL,
    image_url_full TEXT NOT NULL,
    image_url_thumb TEXT NOT NULL,
    aspect_ratio FLOAT NOT NULL DEFAULT 1.33,
    ordre_dans_courant INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_courant, ordre_dans_courant)
);

CREATE TABLE IF NOT EXISTS public.oeuvre_translations (
    id_oeuvre INT NOT NULL REFERENCES public.oeuvres(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    titre VARCHAR(200) NOT NULL,
    article_principal TEXT NOT NULL,
    introduction TEXT NULL,
    article_portions JSONB NULL,
    qcm JSONB NOT NULL,
    mots_cles JSONB NOT NULL DEFAULT '[]',
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verification_report JSONB NULL,
    generated_by_model VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-pro',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_oeuvre, language_code)
);

-- ==============================================================================
-- 3. USER FAVORITES & LEITNER SRS PROGRESS LOGS
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
    box_level SMALLINT NOT NULL DEFAULT 1,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_score SMALLINT NULL,
    consecutive_correct SMALLINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id_oeuvre)
);
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.courants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courant_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artistes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artiste_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oeuvres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oeuvre_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_artwork_progress ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public read movements" ON public.courants FOR SELECT USING (true);
CREATE POLICY "Public read movement translations" ON public.courant_translations FOR SELECT USING (true);
CREATE POLICY "Public read artists" ON public.artistes FOR SELECT USING (true);
CREATE POLICY "Public read artist translations" ON public.artiste_translations FOR SELECT USING (true);
CREATE POLICY "Public read active artworks" ON public.oeuvres FOR SELECT USING (is_active = true);
CREATE POLICY "Public read artwork translations" ON public.oeuvre_translations FOR SELECT USING (true);

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
      oeuvre_translations: {
        some: {
          language_code: 'fr',
          verification_status: 'VERIFIED'
        }
      }
    },
    include: {
      oeuvre_translations: { where: { language_code: 'fr' } },
      courants: { include: { courant_translations: { where: { language_code: 'fr' } } } },
      artistes: { include: { artiste_translations: { where: { language_code: 'fr' } } } }
    }
  });

  return { lesson };
}
```
