-- Drop the view first because it depends on the columns we are modifying
DROP VIEW IF EXISTS public.v_lecons_actives;

-- Rename anecdote_accroche to article_principal
ALTER TABLE public.contenus_oeuvres 
RENAME COLUMN anecdote_accroche TO article_principal;

-- Drop anecdote_technique as it is no longer used
ALTER TABLE public.contenus_oeuvres 
DROP COLUMN anecdote_technique;

-- Recreate the view with updated column names
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
    c.id AS id_courant,
    c.nom AS nom_courant,
    c.oklch_token,
    co.article_principal,
    co.anecdotes_secretes,
    co.qcm,
    co.mots_cles
FROM public.oeuvres o
JOIN public.courants c ON o.id_courant = c.id
JOIN public.contenus_oeuvres co ON o.id = co.id_oeuvre
WHERE o.is_active = TRUE
ORDER BY c.ordre_chronologique ASC, o.ordre_dans_courant ASC;
