import { generateContentWithRetry, GEMINI_DEFAULT_MODELS } from '../clients/gemini';
import { Type } from '@google/genai';
import { scrapeWikipediaArticle } from '../clients/wikipedia';

/**
 * Service to generate a short, informative description for an artist.
 */
export async function generateArtistDefinition(
  artistName: string
): Promise<string | null> {
  const wikiData = await scrapeWikipediaArticle(artistName, null, 'fr');
  const wikiText = wikiData?.summary || wikiData?.text || '';

  const systemInstruction = `Tu es un rédacteur pour une application mobile artistique. Ton but est de rendre l'art accessible et passionnant pour des novices.
Adopte un ton moderne, simple et pédagogique.
Rédige une description très courte (2 à 3 phrases maximum) de cet artiste. Elle doit être informative, percutante, et résumer son importance historique et son style. N'utilise pas de jargon technique sans l'expliquer rapidement.`;

  const prompt = wikiText 
    ? `Artiste : ${artistName}\n\nEn te basant UNIQUEMENT sur l'extrait Wikipédia suivant, rédige ta description :\n\n${wikiText.substring(0, 5000)}`
    : `Artiste : ${artistName}`;

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
    console.error(`[AI:Artist] Error generating definition for ${artistName}:`, error);
    return null;
  }
}
