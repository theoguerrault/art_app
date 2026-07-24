import { getWikidataImageUrl } from '../clients/wikidata';
import type { ImageProvider, ImageProviderResult } from './ImageProvider';

export class WikidataProvider implements ImageProvider {
  name = 'WIKIDATA';

  async findImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null> {
    const url = await getWikidataImageUrl(title, artist, internationalTitle);
    
    // getWikidataImageUrl returns DEFAULT_IMAGE if it fails
    if (!url || url.includes('No_image_available.svg')) {
      return null;
    }

    return {
      fullUrl: url,
      thumbUrl: url, // Wikimedia Commons URLs can be used for both, or we can assume it scales.
      source: this.name,
      rights: 'Public Domain / CC-BY-SA (Wikimedia Commons)'
    };
  }
}
