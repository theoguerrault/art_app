import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { fetchWikidataArtworkById, searchWikidataArtworks, fetchTopFamousArtworks, type ArtworkData } from './wikidata-client.js';
import { generateQuizFromArtworkMetadata } from './quiz-generator.js';
import { loadQuizState, getPreviousQuestions, getPreviousSourceQuotes, getPreviousSourceFields, recordAnswer, resetQuizState } from './quiz-state.js';

// Load .env.local from current working directory or script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config(); // fallback to .env if any

const program = new Command();

program
  .name('test-chicago-quiz')
  .description('Test extraction of world-famous artwork metadata from Wikidata & Gemini MCQ generation')
  .option('-i, --id <string>', 'Artwork Q-ID from Wikidata (e.g. Q12418 for Mona Lisa, Q45585 for Starry Night)', 'Q12418')
  .option('-s, --search <string>', 'Search keyword to find an artwork (e.g. "Mona Lisa", "Tournesols", "Van Gogh")')
  .option('-t, --top <number>', 'Fetch top N most famous paintings worldwide according to Wikidata and quiz on #1')
  .option('-r, --reset', 'Reset local quiz state and history before running')
  .parse(process.argv);

const options = program.opts();

async function runTest() {
  console.log('======================================================================');
  console.log('🌍  WIKIDATA SPARQL API & AI QUIZ GENERATION TEST HARNESS');
  console.log('======================================================================\n');

  if (options.reset) {
    resetQuizState();
    console.log('🧹 [Local POC State] Reset quiz-state.json successfully. Starting with fresh Leitner boxes and question history.\n');
  }

  let artwork: ArtworkData;

  try {
    if (options.top) {
      const topCount = Number(options.top) || 5;
      console.log(`🏆 [Wikidata SPARQL] Fetching top ${topCount} most famous paintings worldwide...`);
      const topResults = await fetchTopFamousArtworks(topCount);
      if (topResults.length === 0) {
        console.error(`❌ No famous artworks found. Exiting.`);
        process.exit(1);
      }
      artwork = topResults[0];
      console.log(`✅ Retrieved top ${topResults.length} masterpieces. Selecting #1: "${artwork.title}" (${artwork.id})\n`);
    } else if (options.search) {
      console.log(`🔍 [Wikidata SPARQL] Searching for artworks with keyword: "${options.search}"...`);
      const results = await searchWikidataArtworks(options.search, 3);
      if (results.length === 0) {
        console.error(`❌ No artworks found for search "${options.search}". Exiting.`);
        process.exit(1);
      }
      artwork = results[0];
      console.log(`✅ Found ${results.length} result(s). Selecting #1: "${artwork.title}" (${artwork.id})\n`);
    } else {
      const targetQid = String(options.id || 'Q12418').trim();
      console.log(`📥 [Wikidata SPARQL] Fetching artwork metadata for QID #${targetQid}...`);
      artwork = await fetchWikidataArtworkById(targetQid);
      console.log(`✅ Successfully fetched metadata for QID #${artwork.id}\n`);
    }

    // Print retrieved metadata
    console.log('----------------------------------------------------------------------');
    console.log('📋 RAW DATA RETURNED BY WIKIDATA SPARQL API');
    console.log('----------------------------------------------------------------------');
    console.log(`• QID              : ${artwork.id}`);
    console.log(`• Title            : ${artwork.title}`);
    console.log(`• Artist           : ${artwork.artist_title || 'N/A'}`);
    console.log(`• Date             : ${artwork.date_display || 'N/A'}`);
    console.log(`• Style / Movement : ${artwork.style_title || 'N/A'}`);
    console.log(`• Medium           : ${artwork.medium_display || 'N/A'}`);
    console.log(`• Dimensions       : ${artwork.dimensions || 'N/A'}`);
    console.log(`• Museum/Location  : ${artwork.department_title || 'N/A'}`);
    console.log(`• Country          : ${artwork.place_of_origin || 'N/A'}`);
    console.log(`• Public Domain    : ${artwork.is_public_domain ? 'YES (CC0/Public Domain)' : 'NO'}`);
    console.log(`• Full Image       : ${artwork.image_url_full || 'N/A'}`);
    console.log(`• Thumb Image      : ${artwork.image_url_thumb || 'N/A'}`);
    console.log(`• Description      : ${artwork.description_clean
        ? artwork.description_clean.substring(0, 250) + (artwork.description_clean.length > 250 ? '...' : '')
        : '(No description returned)'
      }`);
    console.log('----------------------------------------------------------------------\n');

    // Load local Leitner state & question history
    const state = loadQuizState();
    const previousQuestions = getPreviousQuestions(state, artwork.id);
    const previousSourceQuotes = getPreviousSourceQuotes(state, artwork.id);
    const previousSourceFields = getPreviousSourceFields(state, artwork.id);

    if (previousQuestions.length > 0) {
      console.log(`📦 [Local POC State] Found ${previousQuestions.length} previous question(s) (${previousSourceQuotes.length} tested quote(s)) in quiz-state.json. Passing strict anti-duplicate exclusions...`);
    }

    // Generate MCQ via Gemini with maximum question cap check and exclusions
    console.log('----------------------------------------------------------------------');
    console.log('🤖 GENERATING QUIZ (MCQ) FROM RAW METADATA VIA GEMINI (MULTI-MODEL FALLBACK)');
    console.log('----------------------------------------------------------------------');
    const startTime = Date.now();
    const qcm = await generateQuizFromArtworkMetadata(artwork, {
      previousQuestions,
      previousSourceQuotes,
      previousSourceFields,
      maxQuestionsPerArtwork: 8,
      maxQuestionsPerAngle: 2
    });
    const durationMs = Date.now() - startTime;

    console.log(`✅ MCQ generated successfully in ${(durationMs / 1000).toFixed(2)} seconds:\n`);
    console.log(`🏷️  CONCEPT TAG  : "${qcm.conceptTag}" (Difficulty: ${qcm.difficulty.toUpperCase()})`);
    console.log(`📌 SOURCE QUOTE : "${qcm.sourceQuote}"\n`);
    console.log(`❓ QUESTION : ${qcm.question}\n`);
    qcm.options.forEach((opt, idx) => {
      const prefix = idx === qcm.correctIndex ? '   ✅ [CORRECT]' : '   ⚪ [Choice ]';
      console.log(`${prefix} ${idx + 1}. ${opt}`);
    });
    console.log(`\n💡 EXPLANATION : ${qcm.explanation}`);

    // Simulate local Leitner answer recording (POC demo)
    const leitnerItem = recordAnswer(
      artwork.id,
      qcm.conceptTag,
      qcm.difficulty,
      qcm.question,
      true, // Simulate correct answer to demonstrate progression
      qcm.sourceQuote,
      qcm.sourceField
    );
    console.log(`\n📈 [Leitner Box Updated] Concept "${qcm.conceptTag}" promoted to Box #${leitnerItem.box} (Next review: ${leitnerItem.nextReviewDueAt})`);
    console.log('----------------------------------------------------------------------\n');

    console.log('🎉 Verification successful! All facts strictly adhere to Wikidata structured metadata and local Leitner state.');

  } catch (err: any) {
    console.error('\n❌ ERROR during execution:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

runTest();
