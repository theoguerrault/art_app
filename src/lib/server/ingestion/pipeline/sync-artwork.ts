import { supabase } from '$lib/supabase/client';
import { scrapeWikipediaArticle } from '../clients/wikipedia';
import { generateRichArtworkContent } from '../services/description';
import { generateQuizFromArtworkMetadata } from '../services/quiz';

/**
 * Main pipeline to orchestrate the enrichment of an artwork's content.
 * 1. Checks if rich content is already present in DB
 * 2. Scrapes Wikipedia
 * 3. Synthesizes description and anecdotes via Gemini
 * 4. Generates a Quiz if missing
 * 5. Safely upserts to Supabase without destroying existing data or injecting fake placeholders
 */
export async function syncArtworkEnrichment(artworkIdOrSlug: string | number) {
  // Step 1: Resolve artwork metadata
  const isNumeric = typeof artworkIdOrSlug === 'number' || /^\\d+$/.test(String(artworkIdOrSlug));

  let artworkQuery = (supabase.from('oeuvres') as any)
    .select('*, courants(*)')
    .eq('is_active', true);

  if (isNumeric) {
    artworkQuery = artworkQuery.eq('id', typeof artworkIdOrSlug === 'number' ? artworkIdOrSlug : parseInt(String(artworkIdOrSlug), 10));
  } else {
    artworkQuery = artworkQuery.eq('slug', String(artworkIdOrSlug));
  }

  const { data: artwork, error: artworkErr } = await artworkQuery.maybeSingle();

  if (artworkErr || !artwork) {
    console.warn(`[SyncPipeline] Artwork not found: ${artworkIdOrSlug}`);
    return { error: 'Artwork not found' };
  }

  // Step 2: Check current content state
  const { data: currentContent } = await (supabase.from('contenus_oeuvres') as any)
    .select('*')
    .eq('id_oeuvre', artwork.id)
    .maybeSingle();

  const hasDescriptionArray = Array.isArray(currentContent?.detailed_description) && currentContent.detailed_description.length > 0;
  const hasDescriptionString = typeof currentContent?.detailed_description === 'string' && currentContent.detailed_description.trim().length >= 50;
  const needsDescription = !(hasDescriptionArray || hasDescriptionString);
  const needsAnecdotes = !currentContent?.anecdote_accroche || currentContent.anecdote_accroche.includes('Découvrez');
  const needsQuiz = !currentContent?.qcm || currentContent.qcm.question.includes('Question placeholder');

  if (!needsDescription && !needsAnecdotes && !needsQuiz) {
    console.log(`[SyncPipeline] Artwork "${artwork.titre}" is already fully enriched.`);
    return { success: true, cached: true, content: currentContent };
  }

  const updatePayload: Record<string, any> = {};

  // Step 3: Scrape & Generate Wikipedia Content
  if (needsDescription || needsAnecdotes) {
    console.log(`[SyncPipeline] Fetching Wikipedia data for "${artwork.titre}"...`);
    const wikiExtract = await scrapeWikipediaArticle(artwork.titre, artwork.artiste, 'fr', artwork.wikipedia_title);

    if (wikiExtract && wikiExtract.text) {
      console.log(`[SyncPipeline] Generating rich content via Gemini...`);
      const richContent = await generateRichArtworkContent(artwork.titre, artwork.artiste, wikiExtract.text, wikiExtract.lang);

      if (richContent) {
        if (needsDescription) updatePayload.detailed_description = richContent.detailed_description;
        if (!currentContent?.anecdote_accroche || currentContent.anecdote_accroche.includes('Découvrez')) updatePayload.anecdote_accroche = richContent.anecdote_accroche;
        if (!currentContent?.anecdote_technique || currentContent.anecdote_technique.includes('Analyse')) updatePayload.anecdote_technique = richContent.anecdote_technique;
        if (!currentContent?.anecdote_secrete || currentContent.anecdote_secrete.includes('Un secret')) updatePayload.anecdote_secrete = richContent.anecdote_secrete;
      }
    } else {
      console.warn(`[SyncPipeline] No Wikipedia article found for "${artwork.titre}". Cannot generate description/anecdotes.`);
    }
  }

  // Step 4: Generate Quiz
  if (needsQuiz) {
    console.log(`[SyncPipeline] Generating Quiz via Gemini...`);
    try {
      // Map current DB artwork to ArtworkData interface expected by quiz generator
      const mappedArtworkForQuiz = {
        id: artwork.id,
        title: artwork.titre,
        artist_title: artwork.artiste,
        date_display: artwork.date_creation,
        medium_display: artwork.medium,
        dimensions: artwork.dimensions,
        style_title: artwork.courants?.nom || null,
        department_title: artwork.musee,
        place_of_origin: artwork.pays || null,
        description_clean: Array.isArray(updatePayload.detailed_description || currentContent?.detailed_description) ? (updatePayload.detailed_description || currentContent?.detailed_description).map((s: any) => s.content).join('\n') : (updatePayload.detailed_description || currentContent?.detailed_description || ''),
        image_url_full: artwork.image_url_full,
        image_url_thumb: artwork.image_url_thumb,
        is_public_domain: true,
        raw_metadata: artwork // pass the raw DB row as metadata
      };
      
      const generatedQuiz = await generateQuizFromArtworkMetadata(mappedArtworkForQuiz);
      if (generatedQuiz) {
        updatePayload.qcm = generatedQuiz;
        // In the DB, the main quiz is stored in `qcm_synthese` for the Leitner system, but also `qcm` in contenus.
        // I will map it to both if needed, but normally `qcm` in `contenus_oeuvres` is what the app uses.
      }
    } catch (err) {
      console.error(`[SyncPipeline] Failed to generate Quiz for "${artwork.titre}":`, err);
    }
  }

  // Step 5: Save to DB securely
  if (Object.keys(updatePayload).length > 0) {
    updatePayload.updated_at = new Date().toISOString();
    updatePayload.generated_by_model = "gemini-ingestion-pipeline";

    const { prisma } = await import('$lib/server/prisma');

    if (currentContent) {
      console.log(`[SyncPipeline] Updating existing content for "${artwork.titre}"...`);
      try {
        await prisma.contenus_oeuvres.update({
          where: { id_oeuvre: artwork.id },
          data: updatePayload
        });
      } catch (updateErr: any) {
        console.error(`[SyncPipeline] DB Update Error:`, updateErr);
        return { error: 'Failed to update DB', details: updateErr?.message || String(updateErr) };
      }
    } else {
      console.log(`[SyncPipeline] Inserting new content for "${artwork.titre}"...`);
      updatePayload.id_oeuvre = artwork.id;
      // Provide clean defaults if completely missing (no fake placeholders anymore, just null or empty arrays if allowed)
      try {
        await prisma.contenus_oeuvres.create({
          data: updatePayload as any
        });
      } catch (insertErr: any) {
        console.error(`[SyncPipeline] DB Insert Error:`, insertErr);
        return { error: 'Failed to insert into DB', details: insertErr?.message || String(insertErr) };
      }
    }

    return { success: true, updated: Object.keys(updatePayload), content: { ...currentContent, ...updatePayload } };
  }

  return { success: true, message: 'Nothing to update', content: currentContent };
}
