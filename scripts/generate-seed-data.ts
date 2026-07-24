import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Existing artworks to avoid duplicates
const EXISTING_ARTWORKS = [
  "La Naissance de Vénus", "Le Printemps", "La Joconde", "La Cène", "La Création d'Adam",
  "L'École d'Athènes", "Les Époux Arnolfini", "Le Jardin des délices", "Les Ménines",
  "La Jeune Fille à la perle", "La Laitière", "La Ronde de nuit", "Le Radeau de la Méduse",
  "La Liberté guidant le peuple", "Le Voyageur contemplant une mer de nuages", "Tres de Mayo",
  "Le Déjeuner sur l'herbe", "Impression, soleil levant", "Les Nymphéas", "Bal du moulin de la Galette",
  "La Nuit étoilée", "Un dimanche après-midi à l'Île de la Grande Jatte", "Le Cri", "Le Baiser",
  "Les Demoiselles d'Avignon", "Guernica", "La Persistance de la mémoire", "Le Fils de l'homme",
  "American Gothic", "Nighthawks", "Girl with Balloon", "La Fille à la bombe", "Love is in the Air", 
  "Radiant Baby", "Crack is Wack", "Pez Dispenser", "Untitled (Skull)"
];

const COURANTS_MAP = {
  "Première Renaissance": 1,
  "Haute Renaissance": 2,
  "Renaissance nordique": 3,
  "Baroque": 4,
  "Âge d'or néerlandais": 5,
  "Romantisme": 6,
  "Réalisme": 7,
  "Impressionnisme": 8,
  "Post-Impressionnisme": 9,
  "Expressionnisme": 10,
  "Art Nouveau / Symbolisme": 11,
  "Cubisme": 12,
  "Surréalisme": 13,
  "Réalisme américain / Régionalisme": 14,
  "Street Art": 15
};

const BATCH_SIZE = 15;
const TOTAL_NEEDED = 15;

async function generateArtworksBatch(genai: any, existingTitles: string[], count: number) {
  const prompt = `
Tu es un expert en histoire de l'art.
Génère une liste JSON de \${count} œuvres d'art parmi les PLUS CONNUES au monde (des chefs d'oeuvre absolus) qui NE SONT PAS dans cette liste : 
\${existingTitles.map(t => '- ' + t).join('\\n')}

Pour chaque œuvre, fournis cet objet JSON exact :
{
  "titre": "Nom de l'œuvre",
  "artiste_nom": "Nom de l'artiste",
  "courant_nom": "Nom du courant (choisir PARMI CETTE LISTE EXACTE: Première Renaissance, Haute Renaissance, Renaissance nordique, Baroque, Âge d'or néerlandais, Romantisme, Réalisme, Impressionnisme, Post-Impressionnisme, Expressionnisme, Art Nouveau / Symbolisme, Cubisme, Surréalisme, Réalisme américain / Régionalisme, Street Art)",
  "date_creation": "Année ou période",
  "image_url_full": "Une URL d'image valide de wikipedia commons (très important)",
  "article_principal": "Description riche et bien écrite de 2-3 paragraphes",
  "anecdotes_secretes": ["Anecdote 1", "Anecdote 2"],
  "extended_analysis": "Analyse étendue d'un paragraphe",
  "historical_context": "Contexte historique d'un paragraphe",
  "mots_cles": ["mot1", "mot2", "mot3"],
  "qcm": {
    "sourceQuote": "Lieu de conservation (ex: Musée du Louvre)",
    "conceptTag": "un_tag_conceptuel_en_anglais",
    "difficulty": "easy",
    "question": "Une question intéressante sur l'oeuvre ?",
    "options": ["Bonne réponse", "Fausse 1", "Fausse 2", "Fausse 3"],
    "correctIndex": 0,
    "explanation": "Explication de la réponse"
  }
}

Important : 
- Réponds UNIQUEMENT avec un tableau JSON valide. Pas de texte avant ou après le JSON.
- Les valeurs textuelles doivent être échappées correctement pour le JSON.
`;

  console.log(`Demande à Gemini de générer ${count} œuvres...`);
  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
        temperature: 0.7,
        responseMimeType: "application/json"
    }
  });

  let text = response.text;
  if (!text) throw new Error("No text returned");
  
  return JSON.parse(text);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Please set GEMINI_API_KEY environment variable. Ex: export GEMINI_API_KEY='...'");
    return;
  }
  
  const genai = new GoogleGenAI({ apiKey });
  const allArtworks: any[] = [];
  const currentExisting = [...EXISTING_ARTWORKS];
  
  let attempts = 0;
  while (allArtworks.length < TOTAL_NEEDED && attempts < 15) {
    attempts++;
    const needed = Math.min(BATCH_SIZE, TOTAL_NEEDED - allArtworks.length);
    try {
      const batch = await generateArtworksBatch(genai, currentExisting, needed);
      for (const aw of batch) {
        if (!currentExisting.includes(aw.titre)) {
          allArtworks.push(aw);
          currentExisting.push(aw.titre);
        }
      }
      console.log(`Progression: ${allArtworks.length}/${TOTAL_NEEDED} œuvres générées.`);
      if (allArtworks.length < TOTAL_NEEDED) {
        console.log("Attente de 20 secondes pour éviter le rate limit...");
        await new Promise(r => setTimeout(r, 20000));
      }
    } catch (err: any) {
      console.error("Error generating batch:", err.message);
      console.log("Attente de 35 secondes avant de réessayer...");
      await new Promise(r => setTimeout(r, 35000));
    }
  }

  // Generate SQL
  let sql = `\n-- AUTO-GENERATED ARTWORKS (${allArtworks.length})\n\n`;
  
  let nextArtisteId = 30;
  let nextOeuvreId = 40;
  
  const artistsMap = new Map();
  
  for (const aw of allArtworks) {
    if (!artistsMap.has(aw.artiste_nom)) {
      artistsMap.set(aw.artiste_nom, nextArtisteId++);
      const slug = aw.artiste_nom.toLowerCase().replace(/[^a-z0-9]/g, '-');
      sql += `INSERT INTO public.artistes (id, slug, nom) VALUES (${artistsMap.get(aw.artiste_nom)}, '${slug}', '${aw.artiste_nom.replace(/'/g, "''")}');\n`;
      sql += `INSERT INTO public.contenus_artistes (id_artiste, description_courte, verification_status) VALUES (${artistsMap.get(aw.artiste_nom)}, 'Généré automatiquement', 'PENDING');\n`;
    }
    
    const artisteId = artistsMap.get(aw.artiste_nom);
    const oeuvreId = nextOeuvreId++;
    const slug = aw.titre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const courantId = COURANTS_MAP[aw.courant_nom as keyof typeof COURANTS_MAP] || 1; 
    
    sql += `INSERT INTO public.oeuvres (id, slug, id_courant, titre, id_artiste, date_creation, image_url_full, image_url_thumb, aspect_ratio, ordre_dans_courant, is_active) VALUES (${oeuvreId}, '${slug}', ${courantId}, '${aw.titre.replace(/'/g, "''")}', ${artisteId}, '${aw.date_creation.replace(/'/g, "''")}', '${aw.image_url_full.replace(/'/g, "''")}', '${aw.image_url_full.replace(/'/g, "''")}?width=500', 1.0, ${oeuvreId}, true);\n`;
    
    const anecdotesArr = "ARRAY[" + aw.anecdotes_secretes.map((a: string) => `$$${a}$$`).join(',') + "]";
    
    sql += `INSERT INTO public.contenus_oeuvres (id_oeuvre, article_principal, anecdotes_secretes, extended_analysis, historical_context, qcm, mots_cles, generated_by_model, verification_status) VALUES (${oeuvreId}, $$${aw.article_principal}$$, ${anecdotesArr}, $$${aw.extended_analysis}$$, $$${aw.historical_context}$$, $$${JSON.stringify(aw.qcm)}$$::jsonb, $$${JSON.stringify(aw.mots_cles)}$$::jsonb, 'gemini-script', 'PENDING');\n\n`;
  }
  
  fs.writeFileSync(path.join(process.cwd(), 'supabase', 'generated_artworks.sql'), sql);
  console.log("SQL généré dans supabase/generated_artworks.sql !");
}

main().catch(console.error);
