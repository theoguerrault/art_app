-- Migration: 0004_add_artwork_musee.sql
-- Description: Add exhibition location / museum column to artworks table

ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS musee VARCHAR(250) NULL;
