import { generateContentWithRetry, GEMINI_DEFAULT_MODELS } from '../clients/gemini';
import { Type } from '@google/genai';

export function trimWikipediaText(text: string): string {
  return text.length > 150000
    ? text.substring(0, 150000) + '\n\n[... article tronqué pour concision]'
    : text;
}

export interface ContentPortion {
  id: string;
  type?: 'article' | 'anecdote';
  title?: string;
  text: string;
  status: 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'FALSE';
  explanation?: string;
  source_quote?: string;
}

export interface GeneratedArtworkContent {
  introduction?: string;
  portions: { title: string; content: string; }[];
  anecdotes_secretes?: string[];
}



export interface FactCheckReport {
  statements: {
    text: string;
    status: 'VERIFIED' | 'FALSE' | 'UNVERIFIED';
    explanation: string;
    source_quote?: string;
  }[];
  global_score: number;
}

/**
 * Service to generate a rich set of editorial content (description, anecdotes, history)
 * based on the title and artist.
 */
export async function generateArtworkContent(
  title: string,
  artist: string | null
): Promise<GeneratedArtworkContent | null> {
  const systemInstruction = `Tu es un rédacteur pour une application mobile artistique. Ton but est de rendre l'art accessible et passionnant.
Adopte un ton moderne, simple et pédagogique, qui soit à la fois professionnel et décontracté.
RÈGLE ABSOLUE : Rédige une description factuelle et encyclopédique, mais N'INTERPELLE JAMAIS le lecteur (interdit d'utiliser "vous", "tu", "Savez-vous que", etc.).
Privilégie une structure aérée : utilise des titres pour les grandes parties, et liste les faits de manière concise et percutante (donne un maximum d'informations avec un minimum de texte).`;

  const userPrompt = `Pourquoi l'oeuvre "${title}"${artist ? ` par ${artist}` : ''} est-elle connue ?`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      introduction: {
        type: Type.STRING,
        description: "Une description/introduction sobre et concise présentant l'œuvre (ce que c'est, date, technique, contexte de création, etc.)."
      },
      portions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Titre de la partie (sans numéro)" },
            content: { type: Type.STRING, description: "Le contenu de la partie au format Markdown (liste à puces, très concis)" }
          },
          required: ["title", "content"]
        },
        description: "L'Article Principal découpé en grandes parties thématiques (le nombre de parties est libre). L'objectif est d'être très informatif et concis."
      },
      anecdotes_secretes: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: "Le savais-tu : 2 à 3 fun facts (mystères, scandales). Chaque anecdote doit commencer par un titre accrocheur en gras."
      }
    },
    required: ['portions', 'anecdotes_secretes']
  };

  try {
    console.log(`[DescriptionService] Generating storytelling content for "${title}"...`);
    const result = await generateContentWithRetry<GeneratedArtworkContent>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.2
    });
    return result;
  } catch (err) {
    console.error(`[DescriptionService] Failed generating content for "${title}":`, err);
    return null;
  }
}

/**
 * Service to fact-check generated content against Wikipedia.
 * Returns a detailed report of verified, false, and unverified statements.
 */
export async function factCheckArtworkContent(
  title: string,
  portionsToVerify: ContentPortion[],
  wikipediaText: string,
  wikipediaLang: string = 'fr'
): Promise<FactCheckReport | null> {
  const trimmedText = trimWikipediaText(wikipediaText);

const systemInstruction = `Tu es un Fact-Checker impitoyable et expert en art.

MISSION : Tu vas recevoir un tableau de "portions" (paragraphes) d'un texte généré par une IA sur une œuvre d'art, ainsi que l'article Wikipédia correspondant (Source de Vérité). Ton rôle est d'analyser chaque portion pour vérifier si les affirmations qu'elle contient sont confirmées, contredites, ou absentes de Wikipédia.

RÈGLES ABSOLUES :
1. Pour chaque portion fournie, vérifie STRICTEMENT ses affirmations dans le texte Wikipédia.
2. Attribue un statut à la portion globale :
   - VERIFIED : L'ensemble des faits de la portion est explicitement confirmé par Wikipédia.
   - FALSE : Au moins une information factuelle de la portion est contredite par Wikipédia.
   - UNVERIFIED : L'information n'est pas mentionnée dans l'article Wikipédia (ni vraie ni fausse).
3. Fournis une courte explication et, si possible, une citation de Wikipédia pour justifier ("source_quote").
4. Ne modifie pas le texte de la portion, contente-toi de l'évaluer.`;

  const userPrompt = `[PORTIONS À VÉRIFIER]\n${JSON.stringify(portionsToVerify, null, 2)}\n\n${wikipediaLang === 'en' ? '[ARTICLE WIKIPEDIA (Source de Vérité en anglais)]' : '[ARTICLE WIKIPEDIA (Source de Vérité en français)]'}\n${trimmedText}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      statements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "L'identifiant exact (id) de la portion évaluée" },
            text: { type: Type.STRING, description: "Le texte exact de la portion évaluée" },
            status: { type: Type.STRING, enum: ["VERIFIED", "FALSE", "UNVERIFIED"], description: "Statut de l'affirmation" },
            explanation: { type: Type.STRING, description: "Courte explication du jugement" },
            source_quote: { type: Type.STRING, description: "Citation exacte de Wikipédia prouvant le jugement (laisser vide si introuvable)" }
          },
          required: ["id", "text", "status", "explanation"]
        }
      },
      global_score: {
        type: Type.INTEGER,
        description: "Score de fiabilité globale sur 100"
      }
    },
    required: ["statements", "global_score"]
  };

  try {
    console.log(`[DescriptionService] Fact-checking content for "${title}" against Wikipedia...`);
    const report = await generateContentWithRetry<FactCheckReport>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.1
    });
    
    return report;
  } catch (err) {
    console.error(`[DescriptionService] Failed fact-checking for "${title}":`, err);
    return null;
  }
}

export async function correctArtworkContentPortion(
  title: string,
  falsePortion: ContentPortion,
  wikipediaText: string,
  wikipediaLang: string = 'fr'
): Promise<string | null> {
  const trimmedText = trimWikipediaText(wikipediaText);

  const systemInstruction = `Tu es un éditeur expert en art. 
Ton rôle est de corriger UN SEUL PARAGRAPHE existant sur une œuvre d'art, car un fact-checker y a identifié des informations fausses.
Tu dois réécrire le paragraphe fourni en supprimant ou corrigeant STRICTEMENT ET UNIQUEMENT les affirmations listées comme fausses selon l'article Wikipédia fourni.
Garde le même ton, le même style et la même longueur approximative que le texte original.`;

  const userPrompt = `ŒUVRE : ${title}

[PARAGRAPHE À CORRIGER]
"${falsePortion.text}"

[DIAGNOSTIC DU FACT-CHECKER (Pourquoi c'est faux)]
${falsePortion.explanation}
${falsePortion.source_quote ? `Citation Wikipédia pertinente : "${falsePortion.source_quote}"` : ''}

[ARTICLE WIKIPEDIA]
${trimmedText}

Mission : Réécris le paragraphe original en corrigeant ces erreurs en te basant sur l'article Wikipédia.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      corrected_text: {
        type: Type.STRING,
        description: "Le paragraphe corrigé."
      }
    },
    required: ['corrected_text']
  };

  try {
    console.log(`[DescriptionService] Auto-correcting portion for "${title}"...`);
    const result = await generateContentWithRetry<{ corrected_text: string }>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.2
    });
    
    return result?.corrected_text || null;
  } catch (err) {
    console.error(`[DescriptionService] Failed auto-correcting portion for "${title}":`, err);
    return null;
  }
}
