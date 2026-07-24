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
  const systemInstruction = `
RÈGLES ABSOLUES :
1. N'INTERPELLE JAMAIS le lecteur (interdit d'utiliser "vous", "tu", "Savez-vous que", etc.).
2. Ne répète pas les informations de base de l'"introduction" dans la description principale ("portions").`;

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
            content: { type: Type.STRING, description: "Le contenu de la partie au format Markdown." }
          },
          required: ["title", "content"]
        },
        description: "Pourquoi l'oeuvre est elle connue."
      }
    },
    required: ['introduction', 'portions']
  };

  try {
    console.log(`[DescriptionService] Generating storytelling content for "${title}"...`);
    const result = await generateContentWithRetry<GeneratedArtworkContent>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.7
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

export async function regenerateArtworkIntroduction(title: string, artist: string | null, existingContext: string = ''): Promise<string | null> {
  const systemInstruction = `Tu es un expert en histoire de l'art. Rédige une courte introduction sobre et concise présentant l'œuvre (ce que c'est, date, technique, contexte de création, etc.). N'utilise jamais de vouvoiement ou de tutoiement ("vous", "tu", "Savez-vous que"). Ne répète pas les informations suivantes :\n${existingContext}`;

  const userPrompt = `Rédige l'introduction pour l'œuvre "${title}"${artist ? ` par ${artist}` : ''}.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      introduction: { type: Type.STRING }
    },
    required: ['introduction']
  };

  try {
    console.log(`[DescriptionService] Regenerating intro for "${title}"...`);
    const result = await generateContentWithRetry<{ introduction: string }>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.7
    });
    return result?.introduction || null;
  } catch (err) {
    console.error(`[DescriptionService] Failed regenerating intro for "${title}":`, err);
    return null;
  }
}

export async function regenerateArtworkPortion(title: string, artist: string | null, portionTitle: string, portionContext: string): Promise<{title: string, content: string} | null> {
  const systemInstruction = `Tu es un expert en histoire de l'art. Réécris cette partie spécifique de la description de l'œuvre tout en gardant son sens principal, mais en améliorant la fluidité ou en développant légèrement. N'utilise jamais de vouvoiement ou de tutoiement. Formate le contenu en Markdown.`;

  const userPrompt = `Œuvre : "${title}"${artist ? ` par ${artist}` : ''}. 
Titre de la partie : "${portionTitle}"
Contenu actuel : "${portionContext}"

Réécris cette partie en te concentrant sur ce même sujet.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Titre de la partie (sans numéro)" },
      content: { type: Type.STRING, description: "Le contenu de la partie au format Markdown." }
    },
    required: ['title', 'content']
  };

  try {
    console.log(`[DescriptionService] Regenerating portion "${portionTitle}" for "${title}"...`);
    const result = await generateContentWithRetry<{ title: string, content: string }>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.7
    });
    return result || null;
  } catch (err) {
    console.error(`[DescriptionService] Failed regenerating portion for "${title}":`, err);
    return null;
  }
}

export async function generateAdditionalArtworkPortion(title: string, artist: string | null, instruction: string, existingContentStr: string): Promise<{title: string, content: string} | null> {
  const systemInstruction = `Tu es un expert en histoire de l'art. Tu dois ajouter une nouvelle partie à la description de l'œuvre en respectant l'instruction de l'utilisateur. 
RÈGLES :
1. N'utilise jamais de vouvoiement ou de tutoiement.
2. NE RÉPÈTE AUCUNE INFORMATION DÉJÀ PRÉSENTE dans le contenu existant de l'œuvre. Formate le contenu en Markdown.`;

  const userPrompt = `Œuvre : "${title}"${artist ? ` par ${artist}` : ''}.

[CONTENU EXISTANT DE L'ŒUVRE (À ne pas répéter)]
${existingContentStr}

[INSTRUCTION POUR LA NOUVELLE PARTIE]
${instruction}

Rédige la nouvelle partie avec un titre pertinent en lien avec l'instruction fournie.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Titre de la partie (sans numéro)" },
      content: { type: Type.STRING, description: "Le contenu de la partie au format Markdown." }
    },
    required: ['title', 'content']
  };

  try {
    console.log(`[DescriptionService] Generating additional portion for "${title}"...`);
    const result = await generateContentWithRetry<{ title: string, content: string }>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS,
      temperature: 0.7
    });
    return result || null;
  } catch (err) {
    console.error(`[DescriptionService] Failed generating additional portion for "${title}":`, err);
    return null;
  }
}
