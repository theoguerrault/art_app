import { GoogleGenAI, Type } from '@google/genai';
import { env } from '$env/dynamic/private';

export const GEMINI_DEFAULT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.0-flash',
  'gemini-pro-latest'
];

export const GEMINI_PRO_MODELS = [
  'gemini-2.5-pro',
  'gemini-pro-latest',
  'gemini-2.0-pro-exp',
  'gemini-1.5-pro'
];

export interface GeminiRequestOptions {
  systemInstruction: string;
  userPrompt: string;
  responseSchema?: any;
  models?: string[];
  temperature?: number;
  apiKey?: string;
}

/**
 * Executes a Gemini request with automatic fallback across multiple models
 * and exponential backoff for transient errors (429, 503).
 */
export async function generateContentWithRetry<T = any>(options: GeminiRequestOptions): Promise<T> {
  const apiKey = options.apiKey || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment or .env.local file.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = options.models || GEMINI_DEFAULT_MODELS;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    console.log(`[GenAI] Sending request to Gemini (${modelName})...`);
    let attempts = 0;
    const maxRetriesPerModel = 2;

    while (attempts < maxRetriesPerModel) {
      attempts++;
      try {
        const config: any = {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.5,
        };

        if (options.responseSchema) {
          config.responseMimeType = 'application/json';
          config.responseSchema = options.responseSchema;
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.userPrompt,
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
          } catch (err) {
            throw new Error(`Failed to parse JSON from model ${modelName}: ${responseText}`);
          }
        }

        return responseText as any as T;

      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.error?.status || '';
        const code = error?.code || error?.error?.code || 0;
        const errorMessage = error?.message || String(error);

        const isTransient = status === 'UNAVAILABLE' || code === 503 || status === 'RESOURCE_EXHAUSTED' || code === 429;
        const isModelNotFoundOrUnsupported = status === 'NOT_FOUND' || code === 404 || errorMessage.includes('not found') || errorMessage.includes('is not supported');
        const isValidationOrParsingError = errorMessage.includes('Failed to parse JSON');

        if (isModelNotFoundOrUnsupported) {
          console.warn(`[GenAI] ⚠️ Model "${modelName}" unavailable (${status || code}). Switching immediately to next model...`);
          break; // Break the retry loop, try next model
        }

        if ((isTransient || isValidationOrParsingError) && attempts < maxRetriesPerModel) {
          const delayMs = isTransient ? Math.pow(2, attempts) * 1000 : 500;
          console.warn(`[GenAI] ⚠️ Error on "${modelName}" (${errorMessage}) (attempt ${attempts}/${maxRetriesPerModel}). Retrying in ${delayMs / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        console.warn(`[GenAI] ⚠️ Failed with model "${modelName}" (${errorMessage}). Switching to next fallback model...`);
        break; // Max retries reached for this model, move to next
      }
    }
  }

  throw new Error(`All Gemini models in fallback list failed. Last error: ${lastError?.message || lastError}`);
}
