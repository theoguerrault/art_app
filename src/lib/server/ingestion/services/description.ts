import { generateContentWithRetry, GEMINI_DEFAULT_MODELS, type GeminiRequestOptions } from '../clients/gemini';
import { Type } from '@google/genai';

export interface GeneratedArtworkContent {
  detailed_description?: string;
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
3. Si le contenu Wikipédia est insuffisant pour une section, laisse-la vide ou ne dis rien plutôt que d'inventer.
4. Si l'article fourni est en anglais, traduis et rédige ta réponse finale en français.

FORMAT REQUIS (Objet JSON) :
1. "detailed_description" : Description globale et cohérente de l'œuvre (~300-500 mots, couvrant présentation, visuel, technique, historique et analyse).
2. "anecdote_accroche" : Une accroche captivante en 1 à 2 phrases (~25-35 mots) qui éveille la curiosité.
3. "anecdote_technique" : Une description technique concise (composition, lumière, médium, ~45-60 mots) pour la carte visuelle.
4. "anecdote_secrete" : Une anecdote insolite, un détail caché, symbolique ou historique fascinant (~45-60 mots).

STYLE : Français limpide, cultivé mais accessible, particulièrement soigné pour une lecture sur mobile.`;

  const userPrompt = `${wikipediaLang === 'en' ? '[Article Wikipedia source en anglais]\n\n' : '[Article Wikipedia source en français]\n\n'}${trimmedText}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      detailed_description: {
        type: Type.STRING,
        description: "Description globale détaillée, contexte historique et analyse visuelle (~300-500 mots)"
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
      'detailed_description',
      'anecdote_accroche',
      'anecdote_technique',
      'anecdote_secrete'
    ]
  };

  try {
    const result = await generateContentWithRetry<GeneratedArtworkContent>({
      systemInstruction,
      userPrompt,
      responseSchema,
      models: GEMINI_DEFAULT_MODELS, // Use default models which has flash versions
      temperature: 0.25
    });
    
    return result;
  } catch (err) {
    console.error(`[DescriptionService] Failed to generate rich content for "${title}":`, err);
    return null;
  }
}
