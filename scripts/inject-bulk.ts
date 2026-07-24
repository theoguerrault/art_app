import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



const ARTWORKS_TO_ADD = [
  // STREET ART
  { titre: "Girl with Balloon", artiste_nom: "Banksy", courant_nom: "Street Art", date_creation: "2002" },
  { titre: "Love is in the Air", artiste_nom: "Banksy", courant_nom: "Street Art", date_creation: "2003" },
  { titre: "Napalm", artiste_nom: "Banksy", courant_nom: "Street Art", date_creation: "2004" },
  { titre: "Radiant Baby", artiste_nom: "Keith Haring", courant_nom: "Street Art", date_creation: "1990" },
  { titre: "Crack is Wack", artiste_nom: "Keith Haring", courant_nom: "Street Art", date_creation: "1986" },
  { titre: "Untitled (Skull)", artiste_nom: "Jean-Michel Basquiat", courant_nom: "Street Art", date_creation: "1981" },
  { titre: "Pez Dispenser", artiste_nom: "Jean-Michel Basquiat", courant_nom: "Street Art", date_creation: "1984" },
  { titre: "Hope", artiste_nom: "Shepard Fairey", courant_nom: "Street Art", date_creation: "2008" },
  { titre: "Space Invader", artiste_nom: "Invader", courant_nom: "Street Art", date_creation: "1998" },
  { titre: "The Flower Thrower", artiste_nom: "Banksy", courant_nom: "Street Art", date_creation: "2003" },
  { titre: "Sweep It Under The Carpet", artiste_nom: "Banksy", courant_nom: "Street Art", date_creation: "2006" },
  
  // RENAISSANCE
  { titre: "Le Printemps", artiste_nom: "Sandro Botticelli", courant_nom: "Première Renaissance", date_creation: "1482" },
  { titre: "La Naissance de Vénus", artiste_nom: "Sandro Botticelli", courant_nom: "Première Renaissance", date_creation: "1485" },
  { titre: "L'Annonciation", artiste_nom: "Fra Angelico", courant_nom: "Première Renaissance", date_creation: "1440" },
  { titre: "La Vierge aux rochers", artiste_nom: "Léonard de Vinci", courant_nom: "Haute Renaissance", date_creation: "1483" },
  { titre: "L'Homme de Vitruve", artiste_nom: "Léonard de Vinci", courant_nom: "Haute Renaissance", date_creation: "1490" },
  { titre: "La Création d'Adam", artiste_nom: "Michel-Ange", courant_nom: "Haute Renaissance", date_creation: "1512" },
  { titre: "L'École d'Athènes", artiste_nom: "Raphaël", courant_nom: "Haute Renaissance", date_creation: "1511" },
  { titre: "La Transfiguration", artiste_nom: "Raphaël", courant_nom: "Haute Renaissance", date_creation: "1520" },
  
  // RENAISSANCE NORDIQUE
  { titre: "Les Époux Arnolfini", artiste_nom: "Jan van Eyck", courant_nom: "Renaissance nordique", date_creation: "1434" },
  { titre: "Le Jardin des délices", artiste_nom: "Jérôme Bosch", courant_nom: "Renaissance nordique", date_creation: "1503" },
  { titre: "Les Ambassadeurs", artiste_nom: "Hans Holbein le Jeune", courant_nom: "Renaissance nordique", date_creation: "1533" },
  { titre: "La Tour de Babel", artiste_nom: "Pieter Brueghel l'Ancien", courant_nom: "Renaissance nordique", date_creation: "1563" },
  { titre: "Chasseurs dans la neige", artiste_nom: "Pieter Brueghel l'Ancien", courant_nom: "Renaissance nordique", date_creation: "1565" },

  // BAROQUE
  { titre: "L'Appel de saint Matthieu", artiste_nom: "Le Caravage", courant_nom: "Baroque", date_creation: "1600" },
  { titre: "Judith décapitant Holopherne", artiste_nom: "Artemisia Gentileschi", courant_nom: "Baroque", date_creation: "1620" },
  { titre: "Les Ménines", artiste_nom: "Diego Vélasquez", courant_nom: "Baroque", date_creation: "1656" },
  { titre: "L'Enlèvement des filles de Leucippe", artiste_nom: "Pierre Paul Rubens", courant_nom: "Baroque", date_creation: "1618" },
  { titre: "Apollon et Daphné", artiste_nom: "Le Bernin", courant_nom: "Baroque", date_creation: "1625" },

  // AGE D'OR NEERLANDAIS
  { titre: "La Jeune Fille à la perle", artiste_nom: "Johannes Vermeer", courant_nom: "Âge d'or néerlandais", date_creation: "1665" },
  { titre: "La Laitière", artiste_nom: "Johannes Vermeer", courant_nom: "Âge d'or néerlandais", date_creation: "1658" },
  { titre: "La Ronde de nuit", artiste_nom: "Rembrandt", courant_nom: "Âge d'or néerlandais", date_creation: "1642" },
  { titre: "La Leçon d'anatomie du docteur Tulp", artiste_nom: "Rembrandt", courant_nom: "Âge d'or néerlandais", date_creation: "1632" },
  { titre: "Le Chardonneret", artiste_nom: "Carel Fabritius", courant_nom: "Âge d'or néerlandais", date_creation: "1654" },

  // ROMANTISME
  { titre: "Le Radeau de la Méduse", artiste_nom: "Théodore Géricault", courant_nom: "Romantisme", date_creation: "1819" },
  { titre: "La Liberté guidant le peuple", artiste_nom: "Eugène Delacroix", courant_nom: "Romantisme", date_creation: "1830" },
  { titre: "Le Voyageur contemplant une mer de nuages", artiste_nom: "Caspar David Friedrich", courant_nom: "Romantisme", date_creation: "1818" },
  { titre: "Tres de Mayo", artiste_nom: "Francisco de Goya", courant_nom: "Romantisme", date_creation: "1814" },
  { titre: "Le Cauchemar", artiste_nom: "Johann Heinrich Füssli", courant_nom: "Romantisme", date_creation: "1781" },
  { titre: "Le Dernier Voyage du Téméraire", artiste_nom: "J. M. W. Turner", courant_nom: "Romantisme", date_creation: "1839" },

  // REALISME
  { titre: "Un enterrement à Ornans", artiste_nom: "Gustave Courbet", courant_nom: "Réalisme", date_creation: "1850" },
  { titre: "Le Déjeuner sur l'herbe", artiste_nom: "Édouard Manet", courant_nom: "Réalisme", date_creation: "1863" },
  { titre: "Olympia", artiste_nom: "Édouard Manet", courant_nom: "Réalisme", date_creation: "1863" },
  { titre: "Bonjour Monsieur Courbet", artiste_nom: "Gustave Courbet", courant_nom: "Réalisme", date_creation: "1854" },
  
  // IMPRESSIONNISME
  { titre: "Impression, soleil levant", artiste_nom: "Claude Monet", courant_nom: "Impressionnisme", date_creation: "1872" },
  { titre: "Les Nymphéas", artiste_nom: "Claude Monet", courant_nom: "Impressionnisme", date_creation: "1920" },
  { titre: "Bal du moulin de la Galette", artiste_nom: "Auguste Renoir", courant_nom: "Impressionnisme", date_creation: "1876" },
  { titre: "Le Déjeuner des canotiers", artiste_nom: "Auguste Renoir", courant_nom: "Impressionnisme", date_creation: "1881" },
  { titre: "La Classe de danse", artiste_nom: "Edgar Degas", courant_nom: "Impressionnisme", date_creation: "1874" },
  { titre: "L'Absinthe", artiste_nom: "Edgar Degas", courant_nom: "Impressionnisme", date_creation: "1876" },
  { titre: "Boulevard Montmartre, effet de nuit", artiste_nom: "Camille Pissarro", courant_nom: "Impressionnisme", date_creation: "1897" },
  { titre: "Le Berceau", artiste_nom: "Berthe Morisot", courant_nom: "Impressionnisme", date_creation: "1872" },

  // POST-IMPRESSIONNISME
  { titre: "La Nuit étoilée", artiste_nom: "Vincent van Gogh", courant_nom: "Post-Impressionnisme", date_creation: "1889" },
  { titre: "Terrasse du café le soir", artiste_nom: "Vincent van Gogh", courant_nom: "Post-Impressionnisme", date_creation: "1888" },
  { titre: "La Chambre à coucher", artiste_nom: "Vincent van Gogh", courant_nom: "Post-Impressionnisme", date_creation: "1888" },
  { titre: "Un dimanche après-midi à l'Île de la Grande Jatte", artiste_nom: "Georges Seurat", courant_nom: "Post-Impressionnisme", date_creation: "1886" },
  { titre: "La Montagne Sainte-Victoire", artiste_nom: "Paul Cézanne", courant_nom: "Post-Impressionnisme", date_creation: "1904" },
  { titre: "Les Joueurs de cartes", artiste_nom: "Paul Cézanne", courant_nom: "Post-Impressionnisme", date_creation: "1895" },
  { titre: "D'où venons-nous ? Que sommes-nous ? Où allons-nous ?", artiste_nom: "Paul Gauguin", courant_nom: "Post-Impressionnisme", date_creation: "1897" },

  // EXPRESSIONNISME
  { titre: "Le Cri", artiste_nom: "Edvard Munch", courant_nom: "Expressionnisme", date_creation: "1893" },
  { titre: "Le Cavalier bleu", artiste_nom: "Vassily Kandinsky", courant_nom: "Expressionnisme", date_creation: "1903" },
  { titre: "La Danse de la vie", artiste_nom: "Edvard Munch", courant_nom: "Expressionnisme", date_creation: "1900" },
  { titre: "Cinq femmes dans la rue", artiste_nom: "Ernst Ludwig Kirchner", courant_nom: "Expressionnisme", date_creation: "1913" },
  { titre: "Les Grands Chevaux bleus", artiste_nom: "Franz Marc", courant_nom: "Expressionnisme", date_creation: "1911" },

  // ART NOUVEAU / SYMBOLISME
  { titre: "Le Baiser", artiste_nom: "Gustav Klimt", courant_nom: "Art Nouveau / Symbolisme", date_creation: "1908" },
  { titre: "Portrait d'Adele Bloch-Bauer I", artiste_nom: "Gustav Klimt", courant_nom: "Art Nouveau / Symbolisme", date_creation: "1907" },
  { titre: "L'Arbre de vie", artiste_nom: "Gustav Klimt", courant_nom: "Art Nouveau / Symbolisme", date_creation: "1909" },
  { titre: "L'Île des morts", artiste_nom: "Arnold Böcklin", courant_nom: "Art Nouveau / Symbolisme", date_creation: "1883" },
  { titre: "L'Apparition", artiste_nom: "Gustave Moreau", courant_nom: "Art Nouveau / Symbolisme", date_creation: "1876" },

  // CUBISME
  { titre: "Les Demoiselles d'Avignon", artiste_nom: "Pablo Picasso", courant_nom: "Cubisme", date_creation: "1907" },
  { titre: "Guernica", artiste_nom: "Pablo Picasso", courant_nom: "Cubisme", date_creation: "1937" },
  { titre: "Le Portugais", artiste_nom: "Georges Braque", courant_nom: "Cubisme", date_creation: "1911" },
  { titre: "Nu descendant un escalier", artiste_nom: "Marcel Duchamp", courant_nom: "Cubisme", date_creation: "1912" },
  { titre: "Portrait de Pablo Picasso", artiste_nom: "Juan Gris", courant_nom: "Cubisme", date_creation: "1912" },
  { titre: "Trois Musiciens", artiste_nom: "Pablo Picasso", courant_nom: "Cubisme", date_creation: "1921" },

  // SURREALISME
  { titre: "La Persistance de la mémoire", artiste_nom: "Salvador Dalí", courant_nom: "Surréalisme", date_creation: "1931" },
  { titre: "Le Fils de l'homme", artiste_nom: "René Magritte", courant_nom: "Surréalisme", date_creation: "1964" },
  { titre: "Golconde", artiste_nom: "René Magritte", courant_nom: "Surréalisme", date_creation: "1953" },
  { titre: "Le Carnaval d'Arlequin", artiste_nom: "Joan Miró", courant_nom: "Surréalisme", date_creation: "1925" },
  { titre: "La Tentation de saint Antoine", artiste_nom: "Salvador Dalí", courant_nom: "Surréalisme", date_creation: "1946" },
  { titre: "Les Éléphants", artiste_nom: "Salvador Dalí", courant_nom: "Surréalisme", date_creation: "1948" },

  // REALISME AMERICAIN
  { titre: "American Gothic", artiste_nom: "Grant Wood", courant_nom: "Réalisme américain / Régionalisme", date_creation: "1930" },
  { titre: "Nighthawks", artiste_nom: "Edward Hopper", courant_nom: "Réalisme américain / Régionalisme", date_creation: "1942" },
  { titre: "Le Monde de Christina", artiste_nom: "Andrew Wyeth", courant_nom: "Réalisme américain / Régionalisme", date_creation: "1948" },
  { titre: "Chop Suey", artiste_nom: "Edward Hopper", courant_nom: "Réalisme américain / Régionalisme", date_creation: "1929" },
  { titre: "Automat", artiste_nom: "Edward Hopper", courant_nom: "Réalisme américain / Régionalisme", date_creation: "1927" }
];

import { getWikidataImageUrl } from '../src/lib/server/ingestion/clients/wikidata';

async function main() {
  console.log(`Démarrage de l'insertion en masse de ${ARTWORKS_TO_ADD.length} œuvres...`);

  const artistsMap = new Map();
  let oeuvresCreated = 0;

  for (const aw of ARTWORKS_TO_ADD) {
    let artiste = await prisma.artistes.findFirst({
      where: { nom: aw.artiste_nom }
    });

    if (!artiste) {
      const nextArtisteId = (await prisma.artistes.aggregate({ _max: { id: true } }))._max.id || 0;
      artiste = await prisma.artistes.create({
        data: {
          id: nextArtisteId + 1,
          nom: aw.artiste_nom,
          slug: aw.artiste_nom.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          contenus_artistes: {
            create: {
              description_courte: "Contenu en attente de génération.",
              verification_status: "PENDING"
            }
          }
        }
      });
    }
    
    artistsMap.set(aw.artiste_nom, artiste.id);

    let courant = await prisma.courants.findFirst({
      where: { nom: aw.courant_nom }
    });

    if (!courant) {
      if (aw.courant_nom === "Street Art") {
        courant = await prisma.courants.create({
          data: {
            nom: 'Street Art',
            slug: 'street-art',
            ordre_chronologique: 1500,
            siecle: 'XXe-XXIe siècle',
            oklch_token: 'var(--color-slate-500)',
            contenus_courants: {
              create: {
                description: 'Le Street Art est un mouvement d\'art contemporain...',
                description_courte: 'Art urbain',
                verification_status: 'VERIFIED'
              }
            }
          }
        });
      } else {
        console.warn(`Courant ${aw.courant_nom} non trouvé.`);
        continue;
      }
    }

    const oeuvreSlug = aw.titre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = await prisma.oeuvres.findUnique({ where: { slug: oeuvreSlug } });
    if (existing) {
      console.log(`L'œuvre ${aw.titre} existe déjà, passage...`);
      continue;
    }

    const imageUrl = await getWikidataImageUrl(aw.titre, aw.artiste_nom, aw.titre_international);

    let nextOeuvreId = (await prisma.oeuvres.aggregate({ _max: { id: true } }))._max.id || 0;
    nextOeuvreId++;

    await prisma.oeuvres.create({
      data: {
        id: nextOeuvreId,
        titre: aw.titre,
        titre_international: aw.titre_international || null,
        slug: oeuvreSlug,
        id_courant: courant.id,
        id_artiste: artiste.id,
        date_creation: aw.date_creation,
        image_url_full: imageUrl,
        image_url_thumb: imageUrl,
        aspect_ratio: 1.0,
        is_active: true,
        ordre_dans_courant: Math.floor(Math.random() * 1000),
        contenus_oeuvres: {
          create: {
            article_principal: "Contenu en attente de génération. Vous pouvez générer l'analyse depuis le panel administrateur.",
            anecdotes_secretes: [],
            extended_analysis: "",
            historical_context: "",
            qcm: {
                question: "Question en attente",
                options: ["Option 1", "Option 2"],
                correctIndex: 0,
                explanation: ""
            },
            mots_cles: [],
            generated_by_model: 'manual-bulk',
            verification_status: 'PENDING'
          }
        }
      }
    });
    oeuvresCreated++;
    console.log(`✅ Ajouté : ${aw.titre} (Image trouvée: ${imageUrl.includes('No_image') ? 'Non' : 'Oui'})`);
  }

  console.log(`Terminé ! ${oeuvresCreated} œuvres ont été ajoutées avec succès au catalogue.`);
}

main().catch(e => {
  console.error("Erreur :", e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
