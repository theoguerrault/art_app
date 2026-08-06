/**
 * Utility functions for internationalization and browser locale matching.
 */

/**
 * Detects the user's browser language (e.g., 'fr', 'en', 'es'), returning lowercased 2-letter ISO code.
 * Defaults to 'fr' if non-browser context or unresolvable.
 */
export function getBrowserLanguage(): string {
	if (typeof window !== 'undefined' && window.navigator && window.navigator.language) {
		const code = window.navigator.language.split('-')[0].toLowerCase();
		if (code) return code;
	}
	return 'fr';
}

/**
 * Returns localized property text from a translations array based on target language or browser locale.
 * Fallbacks: target language -> 'fr' -> 'en' -> first available translation -> empty string.
 */
export function getLocalizedText<T extends { language_code?: string; [key: string]: any }>(
	translations: T[] | null | undefined,
	field: keyof T,
	targetLang?: string
): string {
	if (!translations || !Array.isArray(translations) || translations.length === 0) {
		return '';
	}

	const lang = targetLang || getBrowserLanguage();

	const exactMatch = translations.find((t) => t.language_code === lang);
	if (exactMatch && exactMatch[field]) {
		return String(exactMatch[field]);
	}

	const frMatch = translations.find((t) => t.language_code === 'fr');
	if (frMatch && frMatch[field]) {
		return String(frMatch[field]);
	}

	const enMatch = translations.find((t) => t.language_code === 'en');
	if (enMatch && enMatch[field]) {
		return String(enMatch[field]);
	}

	const first = translations[0];
	return first && first[field] ? String(first[field]) : '';
}
