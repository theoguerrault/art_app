import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { ArtworkData } from './wikidata-client.js';

/**
 * External Zod Schema for the final MCQ (Multiple Choice Question) returned to callers
 */
export const QcmSchema = z.object({
  sourceQuote: z.string().min(5).max(400).describe("Literal quote or exact field from the raw JSON that justifies and proves the correct answer"),
  sourceField: z.string().optional().describe("Exact JSON key from raw_metadata used for the quote"),
  conceptTag: z.string().describe("Normalized concept identifier for Leitner tracking (e.g. 'subject_identification', 'technique_analysis')"),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("Question difficulty level"),
  question: z.string().min(15).max(250).describe("Clear and engaging question about the artwork, its artist, or movement"),
  options: z.array(z.string().min(2).max(120)).length(4).describe("Exactly 4 concise answer options of similar length and grammatical structure (< 80-120 characters)"),
  correctIndex: z.number().int().min(0).max(3).describe("0-3 index of the correct answer"),
  explanation: z.string().min(15).max(450).describe("Short pedagogical explanation (~60-70 words) explaining the correct answer and providing context")
});

/**
 * Internal Zod Schema for Gemini output to eliminate correctIndex positional bias
 */
const RawGeminiQcmSchema = z.object({
  sourceField: z.string().describe("Exact JSON key from the provided metadata used as the factual proof"),
  sourceQuote: z.string().min(2).max(400).describe("Literal quote from sourceField that justifies and proves the correct answer"),
  question: z.string().min(15).max(250).describe("Clear and engaging question about the artwork, its artist, or movement"),
  correctAnswer: z.string().min(2).max(120).describe("The exact correct answer option (< 80-120 characters)"),
  distractors: z.array(z.string().min(2).max(120)).length(3).describe("Exactly 3 plausible but factually incorrect options of similar length and syntax to correctAnswer"),
  explanation: z.string().min(15).max(450).describe("Short pedagogical explanation (~60-70 words) explaining the correct answer and historical context")
});

export class MaxQuestionsReachedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MaxQuestionsReachedError';
  }
}

export interface QuizGenerationContext {
  forcedAngle?: string;
  targetDifficulty?: 'easy' | 'medium' | 'hard';
  previousQuestions?: string[];
  previousSourceQuotes?: string[];
  previousSourceFields?: string[];
  forbiddenConceptTags?: string[];
  maxQuestionsPerArtwork?: number;
  maxQuestionsPerAngle?: number;
}

export type QcmData = z.infer<typeof QcmSchema>;
export type ChicagoArtworkData = ArtworkData;

interface QuizAngle {
  id: string;
  aliases?: string[];
  name: string;
  targetFields: string[];
  description: string;
}

const POSSIBLE_ANGLES: QuizAngle[] = [
  {
    id: 'subject',
    aliases: ['sujet'],
    name: 'Subject, Symbols, or Depicted Characters',
    targetFields: ['depicts', 'symbols', 'description_clean'],
    description: "Focus on the identity of the person, model, character, objects/symbols depicted, or the scene represented in the artwork."
  },
  {
    id: 'artist_or_creation',
    aliases: ['auteur_ou_creation'],
    name: 'Artist, Date, or Place of Creation / Discovery',
    targetFields: ['artist_title', 'creation_place', 'place_of_origin', 'discovery_place', 'date_display'],
    description: "Focus on the master or artist who created the artwork, their city/country of origin, the archaeological site of discovery, or the period of creation."
  },
  {
    id: 'style_or_technique',
    aliases: ['style_ou_technique'],
    name: 'Artistic Movement, Technique, or Inspiration',
    targetFields: ['style_title', 'technique', 'genre', 'inspired_by', 'influenced_by', 'series'],
    description: "Focus on the artistic movement or style (e.g., Renaissance), precise painting/sculpting technique (e.g., sfumato), series, or artistic inspiration."
  },
  {
    id: 'patronage_or_history',
    aliases: ['mecenat_ou_histoire'],
    name: 'Patron, Historical Owners, or Notable Exhibitions',
    targetFields: ['patron', 'exhibitions', 'significant_events', 'historic_owners'],
    description: "Focus on the historical patron who commissioned the artwork, past owners, major exhibitions, or notable historical events surrounding it."
  },
  {
    id: 'conservation_or_museum',
    aliases: ['conservation_ou_musee'],
    name: 'Place of Conservation and Collection',
    targetFields: ['museum', 'collection'],
    description: "Focus on the famous museum, department, or gallery where the artwork is currently preserved and exhibited."
  }
];

/**
 * Fisher-Yates shuffle algorithm to randomly order multiple choice options
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates an MCQ strictly derived from artwork metadata without external hallucinations.
 * Supports context with question caps (MAX_QUESTIONS_PER_ARTWORK) and anti-duplication exclusions.
 */
export async function generateQuizFromArtworkMetadata(
  artwork: ArtworkData,
  contextOrAngle?: string | QuizGenerationContext
): Promise<QcmData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment or .env.local file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const context: QuizGenerationContext =
    typeof contextOrAngle === 'string'
      ? { forcedAngle: contextOrAngle }
      : (contextOrAngle || {});

  const maxQuestions = context.maxQuestionsPerArtwork ?? 8;
  if (context.previousQuestions && context.previousQuestions.length >= maxQuestions) {
    throw new MaxQuestionsReachedError(
      `Artwork #${artwork.id} ("${artwork.title}") has reached its maximum question cap (${maxQuestions}) to prevent factual exhaustion and hallucinations.`
    );
  }

  const forbiddenTags = new Set(context.forbiddenConceptTags || []);
  const usedQuotes = new Set(context.previousSourceQuotes?.map(q => q.toLowerCase().replace(/\s+/g, ' ').trim()) || []);

  // Filter available angles: exclude forbidden tags, exhausted fields, and angles whose quotes have all been consumed
  const availableAngles = POSSIBLE_ANGLES.filter(angle => {
    if (forbiddenTags.has(angle.id)) return false;
    const validFields = angle.targetFields.filter(field => {
      const val = artwork.raw_metadata?.[field] || (artwork as any)[field];
      if (val === null || val === undefined || val === '' || val === 'N/A') return false;
      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const normVal = strVal.toLowerCase().replace(/\s+/g, ' ').trim();
      // If the entire field value was already cited as a quote, or quote matches, consider consumed if short (< 40 chars)
      if (normVal.length < 40 && usedQuotes.has(normVal)) return false;
      return true;
    });
    return validFields.length > 0;
  });

  if (availableAngles.length === 0) {
    throw new MaxQuestionsReachedError(
      `All available thematic angles for artwork #${artwork.id} ("${artwork.title}") have been exhausted or mastered.`
    );
  }

  let selectedAngle: QuizAngle;
  if (context.forcedAngle) {
    const found = POSSIBLE_ANGLES.find(a => a.id === context.forcedAngle || a.aliases?.includes(context.forcedAngle!));
    if (found && availableAngles.some(a => a.id === found.id)) {
      selectedAngle = found;
    } else {
      console.warn(`[GenAI] ⚠️ Forced angle "${context.forcedAngle}" has no populated fields or is exhausted. Falling back to available angle.`);
      selectedAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
    }
  } else {
    selectedAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
  }

  // Token optimization & normalization: clean metadata of null/empty values and focus on core + angle fields
  const cleanMetadata: Record<string, any> = {};
  const coreFields = ['id', 'title', 'artist_title', 'date_display', 'is_public_domain', 'description_clean', 'medium_display'];
  const fieldsToInclude = new Set([...coreFields, ...selectedAngle.targetFields]);

  for (const [key, value] of Object.entries(artwork.raw_metadata || {})) {
    if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
      if (fieldsToInclude.has(key)) {
        if (Array.isArray(value)) {
          const cleanArray = value.filter(v => v !== null && v !== undefined && v !== '' && v !== 'N/A');
          if (cleanArray.length > 0) {
            cleanMetadata[key] = cleanArray.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
          }
        } else if (typeof value === 'object') {
          cleanMetadata[key] = JSON.stringify(value);
        } else {
          cleanMetadata[key] = value;
        }
      }
    }
  }

  const exclusionPrompt = context.previousQuestions?.length
    ? `\n4. ANTI-DUPLICATE EXCLUSIONS: Do not ask about concepts or facts already covered in previous questions:\n${context.previousQuestions.map(q => `- "${q.slice(0, 80)}${q.length > 80 ? '...' : ''}"`).join('\n')}\nChoose a completely different detail, target field, or nuance from the metadata.`
    : '';

  const exclusionQuotePrompt = context.previousSourceQuotes?.length
    ? `\n9. FORBIDDEN SOURCE QUOTES: You MUST NOT use or cite any of these exact quotes as 'sourceQuote' (already tested):\n${context.previousSourceQuotes.map(q => `- "${q.slice(0, 60)}${q.length > 60 ? '...' : ''}"`).join('\n')}\nYou MUST select a fresh fact and quote from a different field.`
    : '';

  const difficultyPrompt = context.targetDifficulty
    ? `\nTARGET DIFFICULTY: Generate the question at exactly '${context.targetDifficulty.toUpperCase()}' difficulty level.`
    : '';

  const systemPrompt = `You are an educational expert and MCQ (Multiple Choice Question) designer for a micro-learning Art History application.
Your STRICT mission: Generate EXACTLY ONE multiple-choice question (MCQ) about the provided artwork, based EXCLUSIVELY on the official Wikidata metadata below.

Imperative FIDELITY rules (Zero Hallucination & Proof by citation):
1. ZERO HALLUCINATION FOR FACTS: You must not invent historical facts, dates, or attributes about this specific artwork that do not explicitly appear in the provided JSON metadata.
2. MANDATORY CITATION ("sourceField" & "sourceQuote"): You must specify the exact JSON key ("sourceField") and literal quote ("sourceQuote") from that field proving the correct answer.
3. THEMATIC DIVERSIFICATION: You MUST formulate your question around this angle: "${selectedAngle.name}" (target fields: ${selectedAngle.targetFields.join(', ')}). ${selectedAngle.description}${exclusionPrompt}${difficultyPrompt}

Imperative rules for INCORRECT OPTIONS (Anti-Deduction & Plausibility):
4. STRICT HOMOGENEITY OF OPTIONS: The 3 incorrect options ("distractors") must belong to the EXACT SAME semantic and thematic category as the correct answer (e.g., if the correct answer is a real museum, all 3 distractors must be real museums; if it is an artist, all 3 must be artists).
5. EXTERNAL PLAUSIBILITY FOR DISTRACTORS: While facts about the artwork MUST come from metadata, for distractors you MUST use well-known, real historical entities or concepts from general knowledge that are credible to an art enthusiast but factually incorrect for this specific artwork.
6. COMPARABLE LENGTH AND SYNTAX: The correct answer must NOT be longer, more detailed, or structured differently than the distractors to prevent deduction by elimination.
7. PEDAGOGICAL EXPLANATION: Write a 2-sentence explanation (~60-70 words): the first sentence proving the correct answer from the metadata, and the second providing engaging context or briefly explaining why distractors don't apply.
8. All text (question, correctAnswer, distractors, explanation) MUST be written in natural, engaging, and precise English.${exclusionQuotePrompt}`;

  const userPrompt = `Here is the focused official metadata for artwork "${artwork.title}" (ID #${artwork.id}):
${JSON.stringify(cleanMetadata)}

🎯 THEMATIC ANGLE: "${selectedAngle.name}"
Recommended JSON target fields: ${selectedAngle.targetFields.join(', ')}

Generate an engaging MCQ adhering strictly to the schema and fidelity rules.`;

  // Ordered list of models validated and available for the current API key / account
  const OPTIMIZED_MODELS = [
    'gemini-flash-lite-latest',  // Lightweight model with high rate limits / free quota
    'gemini-2.5-flash-lite',     // Gemini 2.5 Flash Lite
    'gemini-2.0-flash-lite',     // Gemini 2.0 Flash Lite
    'gemini-flash-latest',       // Standard Flash fallback
    'gemini-3.5-flash',          // Gemini 3.5 Flash
    'gemini-2.0-flash',          // Gemini 2.0 Flash
    'gemini-pro-latest'          // Pro model as final fallback
  ];

  let lastError: any = null;

  for (const modelName of OPTIMIZED_MODELS) {
    console.log(`[GenAI] Sending request to Gemini (${modelName})...`);
    let attempts = 0;
    const maxRetriesPerModel = 2;

    while (attempts < maxRetriesPerModel) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.5, // Balanced for factual extraction + distractor variety
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sourceField: {
                  type: Type.STRING,
                  description: "Exact JSON key from the provided metadata used as the factual proof"
                },
                sourceQuote: {
                  type: Type.STRING,
                  description: "Literal quote from sourceField that justifies and proves the correct answer"
                },
                question: {
                  type: Type.STRING,
                  description: "Clear and engaging question about the artwork, its artist, or movement"
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: "The exact correct answer option (< 80-120 characters)"
                },
                distractors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 3 plausible but factually incorrect options of similar length and syntax"
                },
                explanation: {
                  type: Type.STRING,
                  description: "Short pedagogical explanation (~60-70 words) explaining the correct answer and context"
                }
              },
              required: ["sourceField", "sourceQuote", "question", "correctAnswer", "distractors", "explanation"]
            }
          }
        });

        const responseText = response?.text;
        if (!responseText) {
          throw new Error(`Model ${modelName} returned an empty response.`);
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(responseText);
        } catch (err) {
          throw new Error(`Failed to parse JSON from model ${modelName}: ${responseText}`);
        }

        // Pre-sanitize lengths and whitespace to prevent strict Zod boundary rejections
        if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
          const obj = parsedJson as Record<string, any>;
          if (typeof obj.correctAnswer === 'string') {
            obj.correctAnswer = obj.correctAnswer.trim().slice(0, 120);
          }
          if (Array.isArray(obj.distractors)) {
            obj.distractors = obj.distractors
              .filter(d => typeof d === 'string')
              .map(d => d.trim().slice(0, 120));
          }
          if (typeof obj.question === 'string') {
            obj.question = obj.question.trim().slice(0, 250);
          }
          if (typeof obj.explanation === 'string') {
            obj.explanation = obj.explanation.trim().slice(0, 450);
          }
          if (typeof obj.sourceQuote === 'string') {
            obj.sourceQuote = obj.sourceQuote.trim().slice(0, 400);
          }
          // conceptTag and difficulty are injected directly from TypeScript context below
        }

        const rawQcm = RawGeminiQcmSchema.parse(parsedJson);

        // Ensure options are strictly unique
        const uniqueOptions = Array.from(new Set([rawQcm.correctAnswer, ...rawQcm.distractors].map(opt => opt.trim())));
        if (uniqueOptions.length < 4) {
          throw new Error(`Model ${modelName} generated duplicate answer options.`);
        }

        // Programmatic strict check of sourceField vs metadata to prevent hallucinations
        if (!rawQcm.sourceField || !(rawQcm.sourceField in cleanMetadata)) {
          throw new Error(`Model ${modelName} cited a non-existent sourceField: "${rawQcm.sourceField}"`);
        }
        const actualVal = String(cleanMetadata[rawQcm.sourceField]);
        const normalizedVal = actualVal.toLowerCase().replace(/\s+/g, ' ');
        const normalizedQuote = rawQcm.sourceQuote.toLowerCase().replace(/\s+/g, ' ');
        if (!normalizedVal.includes(normalizedQuote) && !normalizedQuote.includes(normalizedVal)) {
          console.warn(`[GenAI] ⚠️ sourceQuote "${rawQcm.sourceQuote}" not found exactly in field "${rawQcm.sourceField}" ("${actualVal}"). Rejecting answer.`);
          throw new Error(`Hallucination detected: quote not found in source field "${rawQcm.sourceField}".`);
        }

        if (context.previousSourceQuotes && context.previousSourceQuotes.some(q => {
          const normQ = q.toLowerCase().replace(/\s+/g, ' ').trim();
          return normalizedQuote.includes(normQ) || normQ.includes(normalizedQuote);
        })) {
          console.warn(`[GenAI] ⚠️ sourceQuote "${rawQcm.sourceQuote}" was already used in a previous question. Rejecting output to enforce semantic uniqueness.`);
          throw new Error(`Duplicate quote detected: "${rawQcm.sourceQuote}" was already used.`);
        }

        // Shuffle options and assign correctIndex programmatically to eliminate LLM positional bias
        const shuffledOptions = shuffleArray(uniqueOptions.slice(0, 4));
        const newCorrectIndex = shuffledOptions.indexOf(rawQcm.correctAnswer);

        const validatedQcm = QcmSchema.parse({
          sourceQuote: rawQcm.sourceQuote,
          sourceField: rawQcm.sourceField,
          conceptTag: selectedAngle.id,
          difficulty: context.targetDifficulty || 'medium',
          question: rawQcm.question,
          options: shuffledOptions,
          correctIndex: newCorrectIndex,
          explanation: rawQcm.explanation
        });

        console.log(`[GenAI] ✅ MCQ generated and randomized successfully using model: ${modelName}`);
        return validatedQcm;

      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.error?.status || '';
        const code = error?.code || error?.error?.code || 0;
        const errorMessage = error?.message || String(error);

        const isTransient = status === 'UNAVAILABLE' || code === 503 || status === 'RESOURCE_EXHAUSTED' || code === 429;
        const isModelNotFoundOrUnsupported = status === 'NOT_FOUND' || code === 404 || errorMessage.includes('not found') || errorMessage.includes('is not supported');
        const isValidationOrParsingError = error instanceof z.ZodError || errorMessage.includes('Failed to parse JSON') || errorMessage.includes('Hallucination detected') || errorMessage.includes('duplicate answer options');

        if (isModelNotFoundOrUnsupported) {
          console.warn(`[GenAI] ⚠️ Model "${modelName}" unavailable (${status || code}). Switching immediately to next model...`);
          break;
        }

        if ((isTransient || isValidationOrParsingError) && attempts < maxRetriesPerModel) {
          const delayMs = isTransient ? Math.pow(2, attempts) * 1000 : 500;
          console.warn(`[GenAI] ⚠️ Error on "${modelName}" (${errorMessage}) (attempt ${attempts}/${maxRetriesPerModel}). Retrying in ${delayMs / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        console.warn(`[GenAI] ⚠️ Failed with model "${modelName}" (${errorMessage}). Switching to next fallback model...`);
        break;
      }
    }
  }

  throw new Error(`All Gemini models in fallback list failed. Last error: ${lastError?.message || lastError}`);
}

export const generateQuizFromChicagoMetadata = generateQuizFromArtworkMetadata;


