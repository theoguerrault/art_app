import { z } from 'zod';
import { Type } from '@google/genai';
import { generateContentWithRetry } from '../clients/gemini';

export interface ArtworkData {
  id: string | number;
  title: string;
  artist_title?: string | null;
  date_display?: string | null;
  medium_display?: string | null;
  dimensions?: string | null;
  style_title?: string | null;
  department_title?: string | null;
  place_of_origin?: string | null;
  description_clean?: string | null;
  image_url_full?: string | null;
  image_url_thumb?: string | null;
  is_public_domain?: boolean;
  raw_metadata?: Record<string, any>;
}

/**
 * External Zod Schema for the final MCQ (Multiple Choice Question) returned to callers
 */
export const QcmSchema = z.object({
  sourceQuote: z.string().min(5).max(400),
  sourceField: z.string().optional(),
  conceptTag: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question: z.string().min(15).max(250),
  options: z.array(z.string().min(2).max(120)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(15).max(450)
});

const RawGeminiQcmSchema = z.object({
  sourceField: z.string(),
  sourceQuote: z.string().min(2).max(400),
  question: z.string().min(15).max(250),
  correctAnswer: z.string().min(2).max(120),
  distractors: z.array(z.string().min(2).max(120)).length(3),
  explanation: z.string().min(15).max(450)
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

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function generateQuizFromArtworkMetadata(
  artwork: ArtworkData,
  contextOrAngle?: string | QuizGenerationContext
): Promise<QcmData> {
  const context: QuizGenerationContext =
    typeof contextOrAngle === 'string'
      ? { forcedAngle: contextOrAngle }
      : (contextOrAngle || {});

  const maxQuestions = context.maxQuestionsPerArtwork ?? 8;
  if (context.previousQuestions && context.previousQuestions.length >= maxQuestions) {
    throw new MaxQuestionsReachedError(
      `Artwork #${artwork.id} ("${artwork.title}") has reached its maximum question cap (${maxQuestions}).`
    );
  }

  const forbiddenTags = new Set(context.forbiddenConceptTags || []);
  const usedQuotes = new Set(context.previousSourceQuotes?.map(q => q.toLowerCase().replace(/\\s+/g, ' ').trim()) || []);

  const availableAngles = POSSIBLE_ANGLES.filter(angle => {
    if (forbiddenTags.has(angle.id)) return false;
    const validFields = angle.targetFields.filter(field => {
      const val = artwork.raw_metadata?.[field] || (artwork as any)[field];
      if (val === null || val === undefined || val === '' || val === 'N/A') return false;
      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const normVal = strVal.toLowerCase().replace(/\\s+/g, ' ').trim();
      if (normVal.length < 40 && usedQuotes.has(normVal)) return false;
      return true;
    });
    return validFields.length > 0;
  });

  if (availableAngles.length === 0) {
    throw new MaxQuestionsReachedError(`All available thematic angles for artwork #${artwork.id} have been exhausted.`);
  }

  let selectedAngle: QuizAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
  if (context.forcedAngle) {
    const found = POSSIBLE_ANGLES.find(a => a.id === context.forcedAngle || a.aliases?.includes(context.forcedAngle!));
    if (found && availableAngles.some(a => a.id === found.id)) {
      selectedAngle = found;
    }
  }

  const cleanMetadata: Record<string, any> = {};
  const coreFields = ['id', 'title', 'artist_title', 'date_display', 'is_public_domain', 'description_clean', 'medium_display'];
  const fieldsToInclude = new Set([...coreFields, ...selectedAngle.targetFields]);

  for (const [key, value] of Object.entries(artwork.raw_metadata || {})) {
    if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
      if (fieldsToInclude.has(key)) {
        if (Array.isArray(value)) {
          const cleanArray = value.filter(v => v !== null && v !== undefined && v !== '' && v !== 'N/A');
          if (cleanArray.length > 0) cleanMetadata[key] = cleanArray.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
        } else if (typeof value === 'object') {
          cleanMetadata[key] = JSON.stringify(value);
        } else {
          cleanMetadata[key] = value;
        }
      }
    }
  }

  const exclusionPrompt = context.previousQuestions?.length
    ? `\n4. ANTI-DUPLICATE EXCLUSIONS: Do not ask about concepts or facts already covered:\n${context.previousQuestions.map(q => `- "${q.slice(0, 80)}"`).join('\n')}`
    : '';

  const exclusionQuotePrompt = context.previousSourceQuotes?.length
    ? `\n9. FORBIDDEN SOURCE QUOTES: You MUST NOT use or cite any of these exact quotes as 'sourceQuote' (already tested):\n${context.previousSourceQuotes.map(q => `- "${q.slice(0, 60)}"`).join('\n')}`
    : '';

  const difficultyPrompt = context.targetDifficulty
    ? `\nTARGET DIFFICULTY: Generate the question at exactly '${context.targetDifficulty.toUpperCase()}' difficulty level.`
    : '';

  const systemInstruction = `You are an educational expert and MCQ (Multiple Choice Question) designer for a micro-learning Art History application.
Your STRICT mission: Generate EXACTLY ONE multiple-choice question (MCQ) about the provided artwork, based EXCLUSIVELY on the official Wikidata metadata below.

Imperative FIDELITY rules (Zero Hallucination & Proof by citation):
1. ZERO HALLUCINATION FOR FACTS: You must not invent historical facts, dates, or attributes that do not explicitly appear in the provided JSON metadata.
2. MANDATORY CITATION ("sourceField" & "sourceQuote"): You must specify the exact JSON key ("sourceField") and literal quote ("sourceQuote") from that field proving the correct answer.
3. THEMATIC DIVERSIFICATION: You MUST formulate your question around this angle: "${selectedAngle.name}" (target fields: ${selectedAngle.targetFields.join(', ')}). ${selectedAngle.description}${exclusionPrompt}${difficultyPrompt}

Imperative rules for INCORRECT OPTIONS:
4. STRICT HOMOGENEITY: The 3 incorrect options ("distractors") must belong to the EXACT SAME semantic and thematic category as the correct answer.
5. EXTERNAL PLAUSIBILITY: You MUST use well-known, real historical entities or concepts from general knowledge that are credible but factually incorrect for this specific artwork.
6. COMPARABLE LENGTH AND SYNTAX: The correct answer must NOT be longer or more detailed than the distractors.
7. PEDAGOGICAL EXPLANATION: Write a 2-sentence explanation (~60-70 words): the first sentence proving the correct answer from the metadata, and the second providing engaging context.
8. All text MUST be written in FRENCH.${exclusionQuotePrompt}`;

  const userPrompt = `Here is the focused official metadata for artwork "${artwork.title}" (ID #${artwork.id}):
${JSON.stringify(cleanMetadata)}

🎯 THEMATIC ANGLE: "${selectedAngle.name}"
Recommended JSON target fields: ${selectedAngle.targetFields.join(', ')}

Generate an engaging MCQ adhering strictly to the schema and fidelity rules.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      sourceField: { type: Type.STRING },
      sourceQuote: { type: Type.STRING },
      question: { type: Type.STRING },
      correctAnswer: { type: Type.STRING },
      distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
      explanation: { type: Type.STRING }
    },
    required: ["sourceField", "sourceQuote", "question", "correctAnswer", "distractors", "explanation"]
  };

  const rawJson = await generateContentWithRetry({
    systemInstruction,
    userPrompt,
    responseSchema,
    temperature: 0.5
  });

  const obj = rawJson as Record<string, any>;
  if (typeof obj.correctAnswer === 'string') obj.correctAnswer = obj.correctAnswer.trim().slice(0, 120);
  if (Array.isArray(obj.distractors)) obj.distractors = obj.distractors.filter(d => typeof d === 'string').map(d => d.trim().slice(0, 120));
  if (typeof obj.question === 'string') obj.question = obj.question.trim().slice(0, 250);
  if (typeof obj.explanation === 'string') obj.explanation = obj.explanation.trim().slice(0, 450);
  if (typeof obj.sourceQuote === 'string') obj.sourceQuote = obj.sourceQuote.trim().slice(0, 400);

  const rawQcm = RawGeminiQcmSchema.parse(obj);

  const uniqueOptions = Array.from(new Set([rawQcm.correctAnswer, ...rawQcm.distractors].map(opt => opt.trim())));
  if (uniqueOptions.length < 4) throw new Error(`Model generated duplicate answer options.`);

  if (!rawQcm.sourceField || !(rawQcm.sourceField in cleanMetadata)) {
    throw new Error(`Model cited a non-existent sourceField: "${rawQcm.sourceField}"`);
  }

  const actualVal = String(cleanMetadata[rawQcm.sourceField]);
  const normalizedVal = actualVal.toLowerCase().replace(/\\s+/g, ' ');
  const normalizedQuote = rawQcm.sourceQuote.toLowerCase().replace(/\\s+/g, ' ');
  if (!normalizedVal.includes(normalizedQuote) && !normalizedQuote.includes(normalizedVal)) {
    throw new Error(`Hallucination detected: quote not found in source field "${rawQcm.sourceField}".`);
  }

  const shuffledOptions = shuffleArray(uniqueOptions.slice(0, 4));
  const newCorrectIndex = shuffledOptions.indexOf(rawQcm.correctAnswer);

  return QcmSchema.parse({
    sourceQuote: rawQcm.sourceQuote,
    sourceField: rawQcm.sourceField,
    conceptTag: selectedAngle.id,
    difficulty: context.targetDifficulty || 'medium',
    question: rawQcm.question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
    explanation: rawQcm.explanation
  });
}
