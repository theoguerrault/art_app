import { generateContentWithRetry, GEMINI_DEFAULT_MODELS } from '../clients/gemini';
import { Type } from '@google/genai';
import { scrapeWikipediaArticle } from '../clients/wikipedia';

/**
 * Service to generate a short, informative description for an art movement.
 */
export async function generateMovementDefinition(
  movementName: string
): Promise<string | null> {
  const wikiData = await scrapeWikipediaArticle(movementName, null, 'fr');
  const wikiText = wikiData?.summary || wikiData?.text || '';

  const systemInstruction = `Tu es un rédacteur pour une application mobile artistique. Ton but est de rendre l'art accessible et passionnant pour des novices.
Adopte un ton moderne, simple et pédagogique.
Rédige une description très courte (2 à 3 phrases maximum) de ce mouvement artistique. Elle doit être informative, percutante, et résumer ses caractéristiques principales et son contexte historique. N'utilise pas de jargon technique sans l'expliquer rapidement.`;

  const prompt = wikiText
    ? `Mouvement artistique : ${movementName}\n\nEn te basant UNIQUEMENT sur l'extrait Wikipédia suivant, rédige ta description :\n\n${wikiText.substring(0, 5000)}`
    : `Mouvement artistique : ${movementName}`;

  try {
    const response = await generateContentWithRetry<{ description: string }>({
      models: GEMINI_DEFAULT_MODELS,
      userPrompt: prompt,
      systemInstruction,
      temperature: 0.3,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: 'Une courte description de 2 à 3 phrases.'
          }
        },
        required: ['description']
      }
    });

    if (!response || !response.description) return null;
    
    return response.description;
  } catch (error) {
    console.error(`[AI:Movement] Error generating definition for ${movementName}:`, error);
    return null;
  }
}
