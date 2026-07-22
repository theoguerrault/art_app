import { supabase } from '$lib/supabase/client';
import { scrapeWikipediaArticle } from '../clients/wikipedia';
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

  const needsAnecdotes = !currentContent?.article_principal || currentContent.article_principal.includes('Découvrez');
  const needsQuiz = !currentContent?.qcm || currentContent.qcm.question.includes('Question placeholder');

  if (!needsAnecdotes && !needsQuiz) {
    console.log(`[SyncPipeline] Artwork "${artwork.titre}" is already fully enriched.`);
    return { success: true, cached: true, content: currentContent };
  }

  const updatePayload: Record<string, any> = {};

  // Step 3: Scrape & Generate Wikipedia Content
  // AUTOMATIC GENERATION DISABLED - Now done manually via Admin Dashboard
  if (needsAnecdotes) {
    console.log(`[SyncPipeline] Artwork "${artwork.titre}" needs description, but automatic generation is disabled.`);
    if (!currentContent) {
        updatePayload.article_principal = "";
        updatePayload.anecdotes_secretes = [];
        updatePayload.verification_status = "PENDING";
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
      } else if (!currentContent) {
        updatePayload.qcm = {
          question: `Question placeholder pour "${artwork.titre}"`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 0,
          explanation: "Ce QCM est en cours de création."
        };
      }
    } catch (err) {
      console.error(`[SyncPipeline] Failed to generate Quiz for "${artwork.titre}":`, err);
      if (!currentContent) {
        updatePayload.qcm = {
          question: `Question placeholder pour "${artwork.titre}"`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 0,
          explanation: "Ce QCM est en cours de création suite à une erreur."
        };
      }
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
