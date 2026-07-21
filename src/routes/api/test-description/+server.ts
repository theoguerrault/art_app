import { json } from '@sveltejs/kit';
import { generateRichArtworkContent } from '$lib/server/ingestion/services/description';

async function fetchWikipediaText(title: string): Promise<string> {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(title)}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  return pages[pageId].extract || '';
}

export async function GET() {
  const artworks = [
    { title: "La Joconde", artist: "Léonard de Vinci" },
    { title: "La Nuit étoilée (1889)", artist: "Vincent van Gogh" }, // better wiki title
    { title: "Guernica (Picasso)", artist: "Pablo Picasso" }
  ];

  let markdownOutput = "# Test de Génération de Descriptions Détaillées\n\n";

  for (const art of artworks) {
    const wikiText = await fetchWikipediaText(art.title);
    
    if (!wikiText) {
      markdownOutput += `Failed to fetch text for ${art.title}\n\n`;
      continue;
    }
    
    const result = await generateRichArtworkContent(art.title, art.artist, wikiText, 'fr');
    
    markdownOutput += `## ${art.title} (${art.artist})\n\n`;
    if (result && result.detailed_description) {
      markdownOutput += result.detailed_description + "\n\n";
      markdownOutput += `**Accroche:** ${result.anecdote_accroche}\n\n`;
      markdownOutput += `**Technique:** ${result.anecdote_technique}\n\n`;
      markdownOutput += `**Secrète:** ${result.anecdote_secrete}\n\n`;
    } else {
      markdownOutput += "Échec de la génération.\n\n";
    }
    markdownOutput += "---\n\n";
  }

  return new Response(markdownOutput, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
