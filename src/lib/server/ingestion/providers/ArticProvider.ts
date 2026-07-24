import type { ImageProvider, ImageProviderResult } from './ImageProvider';

const USER_AGENT = 'ArtCoachApp/1.0 (mailto:contact@artcoach.app)';

export class ArticProvider implements ImageProvider {
  name = 'ARTIC';

  async findImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null> {
    try {
      // 1. Search for the artwork
      const searchQuery = internationalTitle ? `${internationalTitle} ${artist}` : `${title} ${artist}`;
      const searchUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(searchQuery)}&fields=id,title,image_id,artist_title,is_public_domain`;
      
      const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!searchRes.ok) return null;
      
      const searchData = await searchRes.json();
      if (!searchData || !searchData.data || searchData.data.length === 0) {
        return null;
      }

      // 2. We take the first match that is public domain and has an image_id
      const match = searchData.data.find((item: any) => item.is_public_domain && item.image_id);
      
      if (match) {
        // IIIF Image API formatting for Art Institute of Chicago
        return {
          fullUrl: `https://www.artic.edu/iiif/2/${match.image_id}/full/843,/0/default.jpg`,
          thumbUrl: `https://www.artic.edu/iiif/2/${match.image_id}/full/400,/0/default.jpg`,
          source: this.name,
          rights: 'Public Domain (CC0) / Art Institute of Chicago'
        };
      }

      return null;
    } catch (err) {
      console.warn(`[ArticProvider] Error fetching image for "${title}":`, err);
      return null;
    }
  }
}
