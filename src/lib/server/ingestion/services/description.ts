import { generateContentWithRetry, GEMINI_DEFAULT_MODELS, type GeminiRequestOptions } from '../clients/gemini';
import { Type } from '@google/genai';

export interface GeneratedArtworkContent {
  detailed_description?: { title: string; content: string }[] | null;
  anecdote_accroche?: string;
  anecdote_technique?: string;
  anecdote_secrete?: string;
}

interface RawGeminiOutput {
  detailed_description_sections?: { title: string; content: string }[];
  anecdote_accroche?: string;
  anecdote_technique?: string;
  anecdote_secrete?: string;
}

/**
 * Service to generate a rich set of editorial content (description, anecdotes, history)
 * based strictly on scraped Wikipedia text to avoid AI hallucinations.
 */
export async function generateRichArtworkContent(
  title: string,
  artist: string | null,
  wikipediaText: string,
  wikipediaLang: string = 'fr'
): Promise<GeneratedArtworkContent | null> {
  // Trim Wikipedia text to avoid token overflow (keep first ~8000 chars)
  const trimmedText = wikipediaText.length > 8000
    ? wikipediaText.substring(0, 8000) + '\n\n[... article tronqué pour concision]'
    : wikipediaText;

  const systemInstruction = `Tu es un historien de l'art expert et conservateur de musée, rédacteur pour une application mobile éducative d'Histoire de l'Art.

MISSION : Rédige une analyse riche et complète de l'œuvre "${title}"${artist ? ` par ${artist}` : ''}, en FRANÇAIS, en te basant EXCLUSIVEMENT sur les informations (introduction et sections de l'article Wikipédia) fournies ci-dessous.

RÈGLES ABSOLUES :
1. Utilise EXCLUSIVEMENT les faits présents dans le contenu Wikipédia fourni.
2. N'invente AUCUN fait historique, date, attribution ou détail technique qui ne figure pas dans la source.
3. Si l'information pour l'une de ces 4 sections est absente ou insuffisante, retourne un contenu vide ou omet la section plutôt que d'inventer avec du "contenu restant".
4. Si l'article fourni est en anglais, traduis et rédige ta réponse finale en français.

TON ET STYLE (TRÈS IMPORTANT) :
Tu dois adopter un ton "d'historien de l'art passionné et conteur". Le style doit être :
- Limpide et accessible (pas de jargon inutile sans l'expliquer).
- Cultivé et élégant, avec un vocabulaire riche.
- Légèrement narratif pour captiver l'utilisateur (on raconte une histoire).
- Parfaitement adapté à une lecture sur mobile (phrases pas trop longues).

FORMAT REQUIS (Objet JSON) :
1. "detailed_description_sections" : Un tableau STRICT de 4 sections d'analyse ("Contexte historique", "Analyse visuelle", "Technique", "Postérité"). Pour chaque section, donne le "title" correspondant et le "content". Si l'information manque, laisse le content vide.
2. "anecdote_accroche" : Une accroche captivante en 1 à 2 phrases (~25-35 mots) qui éveille la curiosité.
3. "anecdote_technique" : Une description technique concise (composition, lumière, médium, ~45-60 mots) pour la carte visuelle.
4. "anecdote_secrete" : Une anecdote insolite, un détail caché, symbolique ou historique fascinant (~45-60 mots).`;

  const userPrompt = `${wikipediaLang === 'en' ? '[Article Wikipedia source en anglais]\n\n' : '[Article Wikipedia source en français]\n\n'}${trimmedText}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      detailed_description_sections: {
        type: Type.ARRAY,
        description: "Analyse structurée de l'œuvre en 4 points clés (Contexte, Visuel, Technique, Sens).",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Titre de la section ('Contexte historique', 'Analyse visuelle', 'Technique', 'Postérité')" },
            content: { type: Type.STRING, description: "Contenu de la section rédigé avec le ton demandé (~80-120 mots). Laisse vide si aucune information." }
          },
          required: ['title', 'content']
        }
      },
      anecdote_accroche: {
        type: Type.STRING,
        description: "Accroche captivante (~25-35 mots)"
      },
      anecdote_technique: {
        type: Type.STRING,
        description: "Description technique concise (~45-60 mots)"
      },
      anecdote_secrete: {
        type: Type.STRING,
        description: "Anecdote insolite ou historique (~45-60 mots)"
      }
    },
    required: [
      'detailed_description_sections',
      'anecdote_accroche',
      'anecdote_technique',
      'anecdote_secrete'
    ]
  };

  try {
    const rawResult = await generateContentWithRetry<RawGeminiOutput>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS, // Use default models which has flash versions
      temperature: 0.35 // Slightly higher temperature for better storytelling tone
    });
    
    if (!rawResult) return null;

    const result: GeneratedArtworkContent = {
      detailed_description: rawResult.detailed_description_sections,
      anecdote_accroche: rawResult.anecdote_accroche,
      anecdote_technique: rawResult.anecdote_technique,
      anecdote_secrete: rawResult.anecdote_secrete
    };

    return result;
  } catch (err) {
    console.error(`[DescriptionService] Failed to generate rich content for "${title}":`, err);
    return null;
  }
}
