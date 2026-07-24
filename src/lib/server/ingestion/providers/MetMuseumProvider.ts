import type { ImageProvider, ImageProviderResult } from './ImageProvider';

const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';

export class MetMuseumProvider implements ImageProvider {
  name = 'MET_MUSEUM';

  async findImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null> {
    try {
      // 1. Search for the artwork
      const searchQuery = internationalTitle ? `${internationalTitle} ${artist}` : `${title} ${artist}`;
      const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(searchQuery)}`;
      
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!searchRes.ok) return null;
      
      const searchData = await searchRes.json();
      if (!searchData || !searchData.objectIDs || searchData.objectIDs.length === 0) {
        return null;
      }

      // 2. Fetch the first object's details
      const objectId = searchData.objectIDs[0];
      const objectUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;
      const objectRes = await fetch(objectUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!objectRes.ok) return null;

      const objectData = await objectRes.json();
      
      // 3. Verify it's in the public domain and has images
      if (objectData.isPublicDomain && objectData.primaryImage) {
        return {
          fullUrl: objectData.primaryImage,
          thumbUrl: objectData.primaryImageSmall || objectData.primaryImage,
          source: this.name,
          rights: 'Public Domain (CC0) / The Met'
        };
      }

      return null;
    } catch (err) {
      console.warn(`[MetMuseumProvider] Error fetching image for "${title}":`, err);
      return null;
    }
  }
}
