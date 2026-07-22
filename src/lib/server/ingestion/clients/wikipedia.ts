export interface WikipediaArtExtract {
  summary: string | null;
  text: string | null;
  lang: string;
}

const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';

/**
 * Resolves target data language based on browser environment (navigator.language).
 */
export function getPreferredLanguage(_preferred?: string): string {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.language) {
    const navLang = window.navigator.language.split('-')[0].toLowerCase();
    if (navLang && /^[a-z]{2}$/.test(navLang)) {
      return navLang;
    }
  }
  return 'fr';
}

/**
 * Scrapes the full plain-text content of a Wikipedia article.
 * Uses MediaWiki Action API with explaintext for clean output.
 * Tries FR first, then EN if missing or disambiguation.
 */
export async function scrapeWikipediaArticle(
  title: string,
  artist: string | null,
  lang: string = 'fr',
  exactWikiTitle?: string | null
): Promise<WikipediaArtExtract | null> {
  // First try the requested lang, then fallback to 'en'
  const langsToTry = lang === 'en' ? ['en'] : [lang, 'en'];
  
  for (const targetLang of langsToTry) {
    const result = await fetchArticleForLang(title, artist, targetLang, exactWikiTitle);
    if (result && result.text && result.text.length >= 200) {
      return result;
    }
  }
  return null;
}

async function fetchArticleForLang(
  title: string,
  artist: string | null,
  lang: string,
  exactWikiTitle?: string | null
): Promise<WikipediaArtExtract | null> {
  let cleanTitle = exactWikiTitle ? exactWikiTitle.replace(/ /g, '_') : title.replace(/ /g, '_');

  try {
    // Attempt 1: Fetch summary to detect disambiguation
    let summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
    let summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': USER_AGENT } });
    
    let summary: string | null = null;
    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      summary = summaryData?.extract || null;
    }

    // Attempt 2: If 404 or disambiguation AND no exact title was provided, search with artist name for precision
    if (!exactWikiTitle && (!summaryRes.ok || (summary && (summary.includes('peut faire référence à') || summary.includes('homonymie') || summary.includes('may refer to'))))) {
      const queryTerm = artist
        ? `${title.replace(/\([^)]*\)/g, '').trim()} ${artist}`
        : title.replace(/\([^)]*\)/g, '').trim();

      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryTerm)}&format=json`;
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const topMatch = searchData?.query?.search?.[0]?.title;
        if (topMatch) {
          cleanTitle = topMatch.replace(/ /g, '_');
          // Re-fetch summary with the correct title
          summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
          summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': USER_AGENT } });
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            summary = summaryData?.extract || null;
          }
        }
      }
    }

    // Attempt 3: Fetch full extract using MediaWiki Action API
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(cleanTitle)}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

    let text: string | null = null;
    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages || {};
      const pageObj = Object.values(pages)[0] as any;
      text = pageObj?.extract || null;
    }

    return { summary, text, lang };
  } catch (err) {
    console.warn(`[WikipediaClient] Failed to fetch article for "${title}" (${lang}):`, err);
    return null;
  }
}
