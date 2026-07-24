import type { ImageProvider, ImageProviderResult } from './ImageProvider';
import { WikidataProvider } from './WikidataProvider';
import { WikipediaProvider } from './WikipediaProvider';
import { MetMuseumProvider } from './MetMuseumProvider';
import { ArticProvider } from './ArticProvider';

export class ImageOrchestrator {
  private providers: ImageProvider[] = [];

  constructor() {
    // The order of providers dictates the fallback sequence.
    // User preference: Wikipedia is primary because it covers many artworks.
    // We try Wikidata first (Public Domain images on Commons), then Wikipedia (Fair Use).
    // If both fail, we fallback to museum APIs.
    this.providers = [
      new WikidataProvider(),
      new WikipediaProvider(),
      new MetMuseumProvider(),
      new ArticProvider()
    ];
  }

  async findBestImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null> {
    for (const provider of this.providers) {
      console.log(`[ImageOrchestrator] Trying provider: ${provider.name} for "${title}"...`);
      const result = await provider.findImage(title, artist, internationalTitle);
      
      if (result) {
        console.log(`[ImageOrchestrator] ✅ Found image on ${provider.name}!`);
        return result;
      }
    }
    
    console.log(`[ImageOrchestrator] ❌ Exhausted all providers for "${title}". No image found.`);
    return null;
  }
}

export const imageOrchestrator = new ImageOrchestrator();
