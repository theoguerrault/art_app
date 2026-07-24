import { scrapeWikipediaArticle } from '../clients/wikipedia';
import type { ImageProvider, ImageProviderResult } from './ImageProvider';

export class WikipediaProvider implements ImageProvider {
  name = 'WIKIPEDIA';

  async findImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null> {
    // Wikipedia client might need the exact title if available, but the script currently uses null for wikipedia_title 
    // unless it's provided. We'll pass null for exactWikiTitle to force a search.
    const wikiData = await scrapeWikipediaArticle(title, artist, 'fr', null, internationalTitle);

    if (wikiData && (wikiData.originalImageUrl || wikiData.thumbnailUrl)) {
      const full = wikiData.originalImageUrl || wikiData.thumbnailUrl;
      const thumb = wikiData.thumbnailUrl || wikiData.originalImageUrl;
      
      if (full && thumb) {
        return {
          fullUrl: full,
          thumbUrl: thumb,
          source: this.name,
          rights: 'Fair Use / Wikipedia'
        };
      }
    }

    return null;
  }
}
