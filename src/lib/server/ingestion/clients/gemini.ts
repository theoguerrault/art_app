import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';

// Ordre de priorité basé sur test live du 2026-07-23 :
// gemini-3.1-flash-lite = OK | gemini-2.5-* = 404 | gemini-2.0-* = quota 429
export const GEMINI_DEFAULT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash'
];

const GEMINI_PRO_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite'
];

export interface GeminiRequestOptions {
  systemInstruction: string;
  userPrompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema?: any;
  models?: string[];
  temperature?: number;
  apiKey?: string;
  imageUrl?: string;
}

/**
 * Executes a Gemini request with automatic fallback across multiple models
 * and exponential backoff for transient errors (429, 503).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateContentWithRetry<T = any>(options: GeminiRequestOptions): Promise<T> {
  const apiKey = options.apiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment or .env.local file.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = options.models || GEMINI_DEFAULT_MODELS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any = null;

  let inlineData: { data: string; mimeType: string } | undefined = undefined;
  if (options.imageUrl) {
    try {
      const imgRes = await fetch(options.imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch image from URL: ${imgRes.statusText}`);
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      inlineData = {
        data: buffer.toString('base64'),
        mimeType
      };
    } catch (e) {
      throw new Error(`Could not fetch image to send to Gemini: ${e}`);
    }
  }

  for (const modelName of modelsToTry) {
    let attempts = 0;
    const maxRetriesPerModel = 2;

    while (attempts < maxRetriesPerModel) {
      attempts++;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.5,
        };

        if (options.responseSchema) {
          config.responseMimeType = 'application/json';
          config.responseSchema = options.responseSchema;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let finalContents: any = options.userPrompt;
        if (inlineData) {
          finalContents = [
            options.userPrompt,
            { inlineData }
          ];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: finalContents,
          config
        });

        const responseText = response?.text;
        if (!responseText) {
          throw new Error(`Model ${modelName} returned an empty response.`);
        }

        if (options.responseSchema) {
          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(responseText);
            return parsedJson as T;
          } catch {
            throw new Error(`Failed to parse JSON from model ${modelName}: ${responseText}`);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return responseText as any as T;

      } catch (error: unknown) {
        lastError = error;
        const err = error as Record<string, any>;
        const status = err?.status || err?.error?.status || '';
        const code = err?.code || err?.error?.code || 0;
        const errorMessage = err?.message || String(error);

        const isTransient = status === 'UNAVAILABLE' || code === 503 || status === 'RESOURCE_EXHAUSTED' || code === 429;
        const isModelNotFoundOrUnsupported = status === 'NOT_FOUND' || code === 404 || errorMessage.includes('not found') || errorMessage.includes('is not supported');
        const isValidationOrParsingError = errorMessage.includes('Failed to parse JSON');

        if (isModelNotFoundOrUnsupported) {
          break; // Break the retry loop, try next model
        }

        if ((isTransient || isValidationOrParsingError) && attempts < maxRetriesPerModel) {
          const delayMs = isTransient ? Math.pow(2, attempts) * 1000 : 500;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        break; // Max retries reached for this model, move to next
      }
    }
  }

  throw new Error(`All Gemini models in fallback list failed. Last error: ${lastError?.message || lastError}`);
}
