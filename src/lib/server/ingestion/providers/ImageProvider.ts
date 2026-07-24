export interface ImageProviderResult {
  fullUrl: string;
  thumbUrl: string;
  source: string;
  rights: string;
}

export interface ImageProvider {
  name: string;
  findImage(title: string, artist: string, internationalTitle?: string | null): Promise<ImageProviderResult | null>;
}
