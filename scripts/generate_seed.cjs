const fs = require('fs');
const path = require('path');

const courants = [
  {
    id: 1, slug: 'premiere-renaissance', nom: 'Première Renaissance', siecle: '15e siècle', oklch_token: 'oklch(0.75 0.12 70)', ordre_chronologique: 10,
    description_courte: "Période de renouveau artistique née en Italie, caractérisée par la redécouverte de l'Antiquité, le naturalisme et l'invention de la perspective linéaire.",
    caracteristiques_cles: ["Perspective linéaire", "Humanisme", "Naturalisme", "Retour à l'Antiquité"],
    contexte_historique: "Soutenue par de riches mécènes comme les Médicis à Florence, cette époque marque la transition entre le Moyen Âge et les temps modernes en Europe.",
    qcm_synthese: {
      question: "Quelle grande innovation picturale caractérise la Première Renaissance en Italie ?",
      options: ["L'invention de la perspective linéaire mathématique", "L'utilisation exclusive de la peinture à l'huile", "L'abstraction géométrique", "Le pointillisme"],
      correctIndex: 0,
      explanation: "Formalisée par Brunelleschi et Alberti, la perspective linéaire a permis aux artistes de créer l'illusion d'un espace tridimensionnel profond sur une surface plane."
    }
  },
  {
    id: 2, slug: 'haute-renaissance', nom: 'Haute Renaissance', siecle: '16e siècle', oklch_token: 'oklch(0.75 0.12 65)', ordre_chronologique: 20,
    description_courte: "L'apogée de l'art de la Renaissance, centrée sur Rome et Florence, dominée par les génies universels comme Léonard, Michel-Ange et Raphaël.",
    caracteristiques_cles: ["Sfumato et clair-obscur", "Perspective parfaite", "Proportions idéales", "Compositions pyramidales"],
    contexte_historique: "Mécénat papal très puissant à Rome, avec la construction de la nouvelle basilique Saint-Pierre et les fresques de la chapelle Sixtine.",
    qcm_synthese: {
      question: "Quelle technique visuelle a été perfectionnée par Léonard de Vinci pendant la Haute Renaissance ?",
      options: ["Le Sfumato", "Le Ténébrisme", "Le Cubisme", "L'Empâtement"],
      correctIndex: 0,
      explanation: "Le sfumato permet aux tons et aux couleurs de se fondre progressivement les uns dans les autres sans contours nets."
    }
  },
  {
    id: 3, slug: 'renaissance-nordique', nom: 'Renaissance nordique', siecle: '15e-16e siècle', oklch_token: 'oklch(0.72 0.10 85)', ordre_chronologique: 30,
    description_courte: "Le pendant nordique (Flandres, Allemagne) de la Renaissance italienne, célèbre pour son réalisme minutieux et l'invention de la peinture à l'huile.",
    caracteristiques_cles: ["Réalisme minutieux", "Maîtrise de la peinture à l'huile", "Symbolisme caché", "Paysages détaillés"],
    contexte_historique: "Essor commercial des Flandres, développement de l'imprimerie et prémices de la Réforme protestante.",
    qcm_synthese: {
      question: "Quelle technique picturale a été perfectionnée et popularisée par les maîtres flamands comme Jan van Eyck ?",
      options: ["La peinture à l'huile", "La fresque a fresco", "La détrempe à l'œuf", "L'aquarelle"],
      correctIndex: 0,
      explanation: "L'huile permet des glacis superposés, créant une profondeur et une luminosité inégalées pour le rendu des textures et de la lumière."
    }
  },
  {
    id: 4, slug: 'baroque', nom: 'Baroque', siecle: '17e siècle', oklch_token: 'oklch(0.65 0.15 45)', ordre_chronologique: 40,
    description_courte: "Un art théâtral, dynamique et contrasté, conçu pour susciter l'émotion et l'émerveillement, soutenu par l'Église catholique.",
    caracteristiques_cles: ["Clair-obscur dramatique", "Mouvement et diagonales", "Théâtralité", "Asymétrie"],
    contexte_historique: "Art de la Contre-Réforme, l'Église catholique utilise l'art baroque pour éblouir et ramener les fidèles face à l'austérité protestante.",
    qcm_synthese: {
      question: "Quel terme désigne le fort contraste entre les zones de lumière et d'ombre très sombres caractéristique du Baroque ?",
      options: ["Le clair-obscur (Ténébrisme)", "L'estompage", "Le sfumato", "La grisaille"],
      correctIndex: 0,
      explanation: "Popularisé par le Caravage, le ténébrisme isole violemment les figures illuminées sur un fond obscur."
    }
  },
  {
    id: 5, slug: 'age-or-neerlandais', nom: 'Âge d\'or néerlandais', siecle: '17e siècle', oklch_token: 'oklch(0.70 0.12 55)', ordre_chronologique: 50,
    description_courte: "Une période de prospérité exceptionnelle aux Pays-Bas, donnant naissance à de nouveaux genres profanes : paysages, natures mortes et scènes de genre.",
    caracteristiques_cles: ["Scènes de la vie quotidienne", "Portraits bourgeois", "Natures mortes", "Maîtrise de la lumière"],
    contexte_historique: "Les Provinces-Unies deviennent la première puissance commerciale mondiale; l'art est commandé par une riche bourgeoisie marchande.",
    qcm_synthese: {
      question: "Qu'est-ce qui caractérise le plus les sujets de peinture de l'Âge d'or néerlandais ?",
      options: ["La vie quotidienne bourgeoise et laïque", "Les scènes bibliques monumentales", "Les portraits de rois et de papes", "L'abstraction pure"],
      correctIndex: 0,
      explanation: "Pays protestant, les Pays-Bas ont délaissé l'art religieux au profit des scènes de genre, paysages et natures mortes pour décorer les maisons des riches marchands."
    }
  },
  {
    id: 6, slug: 'romantisme', nom: 'Romantisme', siecle: '19e siècle', oklch_token: 'oklch(0.60 0.18 30)', ordre_chronologique: 60,
    description_courte: "Un mouvement exaltant les passions, l'individualisme, la puissance écrasante de la nature et l'imagination face à la rationalité.",
    caracteristiques_cles: ["Exaltation des sentiments", "Nature sublime et indomptable", "Sujets dramatiques ou exotiques", "Touches passionnées"],
    contexte_historique: "Réaction contre le rationalisme des Lumières et de la révolution industrielle, et désillusions post-Révolution française.",
    qcm_synthese: {
      question: "Que cherchent principalement à exprimer les peintres romantiques face à la nature ?",
      options: ["Le sublime et la toute-puissance des éléments", "La géométrie mathématique", "L'exactitude scientifique des plantes", "La paix et l'ordre absolu"],
      correctIndex: 0,
      explanation: "Le sublime romantique est un sentiment mêlant terreur délicieuse et admiration face à l'immensité terrifiante de la nature (tempêtes, abîmes, brumes)."
    }
  },
  {
    id: 7, slug: 'realisme', nom: 'Réalisme', siecle: '19e siècle', oklch_token: 'oklch(0.65 0.10 50)', ordre_chronologique: 70,
    description_courte: "La volonté de peindre la réalité quotidienne et sociale sans l'idéaliser, en s'intéressant particulièrement au monde paysan et ouvrier.",
    caracteristiques_cles: ["Sujets de la vie ordinaire", "Critique sociale", "Refus de l'idéalisation", "Palette souvent sombre"],
    contexte_historique: "Révolution industrielle en Europe, apparition du prolétariat urbain, et événements politiques comme la Révolution de 1848.",
    qcm_synthese: {
      question: "Quel sujet devient noble et digne d'être peint en grand format avec l'apparition du Réalisme ?",
      options: ["Le travailleur et le paysan ordinaire", "Les dieux de l'Olympe", "Les rois de France", "Les anges et les démons"],
      correctIndex: 0,
      explanation: "Gustave Courbet et les réalistes ont provoqué des scandales en peignant des paysans et des casseurs de pierres sur des toiles immenses, format jusqu'alors réservé à la peinture d'histoire."
    }
  },
  {
    id: 8, slug: 'impressionnisme', nom: 'Impressionnisme', siecle: '19e siècle', oklch_token: 'oklch(0.70 0.15 220)', ordre_chronologique: 80,
    description_courte: "Un mouvement cherchant à capturer les effets optiques éphémères de la lumière naturelle par des touches rapides et vibrantes en plein air.",
    caracteristiques_cles: ["Peinture en plein air", "Touches visibles", "Saisie de la lumière instantanée", "Couleurs claires et vives"],
    contexte_historique: "Développement du chemin de fer, des loisirs modernes, invention des tubes de peinture et de la photographie.",
    qcm_synthese: {
      question: "Quelle invention technologique a grandement favorisé l'essor de l'impressionnisme ?",
      options: ["Le tube de peinture souple", "Le pinceau en poils synthétiques", "La toile en coton", "L'éclairage électrique en atelier"],
      correctIndex: 0,
      explanation: "Le tube de peinture en étain a permis aux peintres de sortir facilement de leur atelier pour peindre la nature en direct ('en plein air')."
    }
  },
  {
    id: 9, slug: 'post-impressionnisme', nom: 'Post-Impressionnisme', siecle: 'Fin du 19e siècle', oklch_token: 'oklch(0.68 0.18 140)', ordre_chronologique: 90,
    description_courte: "Divers courants qui dépassent la simple impression visuelle pour structurer l'œuvre (Cézanne, Seurat) ou exprimer des émotions intenses (Van Gogh, Gauguin).",
    caracteristiques_cles: ["Couleurs expressives ou scientifiques", "Contrôle de la composition", "Touche libérée et très visible", "Recherche de sens profond"],
    contexte_historique: "Fin de siècle marquée par des avancées scientifiques en optique et une remise en question de la modernité urbaine occidentale.",
    qcm_synthese: {
      question: "Pourquoi parle-t-on de Post-Impressionnisme plutôt que d'un mouvement unifié ?",
      options: ["C'est un terme regroupant des artistes solitaires explorant des voies très différentes au-delà de l'impressionnisme", "Parce qu'ils peignaient uniquement la nuit", "Parce qu'ils copiaient tous Van Gogh", "C'était le nom de leur galerie d'art"],
      correctIndex: 0,
      explanation: "Inventé a posteriori, le terme regroupe des recherches diverses : scientifiques (Seurat), géométriques (Cézanne), ou émotionnelles (Van Gogh)."
    }
  },
  {
    id: 10, slug: 'expressionnisme', nom: 'Expressionnisme', siecle: 'Fin 19e - début 20e siècle', oklch_token: 'oklch(0.65 0.20 30)', ordre_chronologique: 100,
    description_courte: "Mouvement visant à projeter sur la toile la subjectivité de l'artiste et son angoisse face au monde moderne, en déformant la réalité.",
    caracteristiques_cles: ["Déformation de la réalité", "Couleurs violentes et subjectives", "Expression de l'angoisse et du malaise", "Lignes torturées"],
    contexte_historique: "Tensions précédant la Première Guerre mondiale, crises morales et dures réalités de l'industrialisation dans les grandes métropoles, surtout en Allemagne.",
    qcm_synthese: {
      question: "Quelle est l'intention principale de l'artiste expressionniste ?",
      options: ["Projeter ses émotions et angoisses intérieures en déformant le monde physique", "Capturer avec exactitude la lumière du soleil", "Peindre avec une harmonie parfaite des proportions", "Ne peindre que ce que l'œil humain peut prouver scientifiquement"],
      correctIndex: 0,
      explanation: "L'expressionnisme ne décrit pas le monde tel qu'il est objectivement, mais tel que l'artiste le ressent, souvent de manière tragique et déformée."
    }
  },
  {
    id: 11, slug: 'art-nouveau-symbolisme', nom: 'Art Nouveau / Symbolisme', siecle: 'Fin 19e - début 20e siècle', oklch_token: 'oklch(0.75 0.15 85)', ordre_chronologique: 110,
    description_courte: "Une réaction esthétique contre l'académisme, mêlant onirisme, mysticisme et un goût pour l'ornementation florale stylisée.",
    caracteristiques_cles: ["Lignes courbes et végétales", "Mysticisme et rêves", "Ornementation dorée ou riche", "Sujets allégoriques et mythologiques"],
    contexte_historique: "Période de la 'Belle Époque' en Europe et à Vienne, marquée par l'émergence de la psychanalyse et un intérêt pour l'occulte.",
    qcm_synthese: {
      question: "Quelle caractéristique visuelle est emblématique de l'Art Nouveau ?",
      options: ["La ligne courbe dite en 'coup de fouet', inspirée par la nature", "L'utilisation stricte d'angles droits et de cubes", "L'absence totale de motifs décoratifs", "La palette uniquement en noir et blanc"],
      correctIndex: 0,
      explanation: "L'Art Nouveau s'inspire profondément de la biologie et de la botanique, utilisant des courbes élégantes et dynamiques qui imitent des lianes ou des tiges florales."
    }
  },
  {
    id: 12, slug: 'cubisme', nom: 'Cubisme', siecle: 'Début 20e siècle', oklch_token: 'oklch(0.70 0.10 75)', ordre_chronologique: 120,
    description_courte: "La plus grande révolution picturale depuis la Renaissance : l'objet est fracturé, analysé et réassemblé sous une multitude d'angles simultanés.",
    caracteristiques_cles: ["Multiplicité des points de vue", "Formes géométriques et facettes", "Abandon de la perspective classique", "Inclusion de vrais matériaux (collages)"],
    contexte_historique: "Inventions technologiques (cinéma, avions), découvertes de l'art tribal africain et ibérique influençant les jeunes artistes à Paris.",
    qcm_synthese: {
      question: "Quel est l'objectif de la représentation cubiste d'un objet ?",
      options: ["Le montrer sous plusieurs angles simultanément", "Le rendre le plus photoréaliste possible", "Le réduire à un simple trait de couleur pure", "Créer une illusion d'optique en 3D (trompe-l'œil)"],
      correctIndex: 0,
      explanation: "Plutôt que de figer un objet d'un seul point de vue fixe, Picasso et Braque aplatissaient ses différentes faces (de face, de profil, de haut) sur une même surface 2D."
    }
  },
  {
    id: 13, slug: 'surrealisme', nom: 'Surréalisme', siecle: '20e siècle', oklch_token: 'oklch(0.68 0.14 280)', ordre_chronologique: 130,
    description_courte: "Exploration de l'inconscient, du rêve et de l'irrationnel, libérant l'art de tout contrôle logique ou moral.",
    caracteristiques_cles: ["Associations d'objets illogiques", "Scènes de rêve (onirisme)", "Automatisme", "Hyper-réalisme pour un effet déroutant"],
    contexte_historique: "Traumatisme de la Première Guerre mondiale, rejet du rationalisme qui y a mené, et forte influence des théories de Sigmund Freud sur l'inconscient.",
    qcm_synthese: {
      question: "Quel théoricien et médecin a profondément influencé le mouvement surréaliste ?",
      options: ["Sigmund Freud et ses théories sur l'inconscient", "Albert Einstein et la relativité", "Charles Darwin et l'évolution", "Karl Marx et le manifeste communiste"],
      correctIndex: 0,
      explanation: "André Breton et les surréalistes se sont passionnés pour l'inconscient, le rêve et la psychanalyse de Freud pour libérer l'esprit créatif des contraintes logiques."
    }
  },
  {
    id: 14, slug: 'realisme-americain', nom: 'Réalisme américain / Régionalisme', siecle: '20e siècle', oklch_token: 'oklch(0.65 0.12 40)', ordre_chronologique: 140,
    description_courte: "Une peinture focalisée sur la réalité quotidienne de la vie urbaine ou rurale américaine, capturant l'isolation et la modernité.",
    caracteristiques_cles: ["Mélancolie et solitude urbaine", "Sujets vernaculaires américains", "Lumières froides et cinématographiques", "Scènes figées"],
    contexte_historique: "Grande Dépression des années 30, isolationnisme américain et développement frénétique des villes modernes.",
    qcm_synthese: {
      question: "Quelle émotion se dégage très fréquemment des toiles réalistes américaines (comme celles de Hopper) ?",
      options: ["La solitude, l'isolement et l'aliénation urbaine", "La joie de vivre festive et frénétique", "La terreur de la mort", "L'extase religieuse mystique"],
      correctIndex: 0,
      explanation: "Les œuvres de Hopper ou de ses contemporains capturent souvent le sentiment paradoxal d'être seul au milieu de la grande ville moderne."
    }
  }
];

const oeuvres = [
  // 1. Première Renaissance
  {
    id: 1, slug: 'la-naissance-de-venus', id_courant: 1, titre: 'La Naissance de Vénus', artiste: 'Sandro Botticelli', date_creation: 'vers 1485',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg?width=500', aspect_ratio: 1.55, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "L'une des premières peintures monumentales de l'Occident post-antique à célébrer le nu féminin profane.",
    anecdote_technique: "Botticelli a utilisé de la véritable poudre d'or dans la chevelure de Vénus pour capturer la lumière de manière divine.",
    anecdote_secrete: "L'œuvre a failli être détruite lors du 'Bûcher des Vanités' en 1497 par le moine extrémiste Savonarole, mais elle a été secrètement cachée.",
    extended_analysis: "La figure de Vénus incarne l'idéal de beauté néoplatonicien : une beauté physique qui élève l'esprit vers la pureté divine. Ses contours fluides et presque sinueux l'ancrent dans un univers poétique et irréel plutôt qu'anatomique.",
    historical_context: "Commandée sous l'égide de la famille Médicis pour une villa, elle illustre la réhabilitation de la mythologie païenne dans l'élite intellectuelle de Florence.",
    qcm: { sourceQuote: "Galerie des Offices, Florence", conceptTag: "mythology", difficulty: "easy", question: "Qui accueille Vénus sur le rivage avec un manteau fleuri ?", options: ["Une Heure (déesse des saisons)", "Athéna", "Héra", "Une sirène"], correctIndex: 0, explanation: "C'est l'une des Heures, divinités du temps et de la nature, qui lui tend le manteau protecteur de la civilisation." },
    mots_cles: ["botticelli", "mythologie", "vénus", "florence", "médicis"]
  },
  {
    id: 2, slug: 'le-printemps', id_courant: 1, titre: 'Le Printemps', artiste: 'Sandro Botticelli', date_creation: 'vers 1478–1482',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Botticelli-primavera.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Botticelli-primavera.jpg?width=500', aspect_ratio: 1.56, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Cette œuvre abrite un véritable herbier : les botanistes y ont identifié plus de 500 espèces de plantes et 190 fleurs différentes.",
    anecdote_technique: "Peint à la détrempe sur un grand panneau de bois, les couleurs ont conservé une clarté exceptionnelle pendant plus de 500 ans.",
    anecdote_secrete: "C'est un véritable puzzle allégorique dont le sens exact fait toujours l'objet de vifs débats entre les historiens de l'art.",
    extended_analysis: "La composition est lue de droite à gauche, illustrant la transformation de l'amour charnel (Zéphyr et Flore) en beauté (Vénus centrale), puis en élévation spirituelle (Mercure dissipant les nuages).",
    historical_context: "Offerte comme cadeau de mariage pour Laurent di Pierfrancesco de Médicis, l'œuvre devait servir de guide moral et philosophique.",
    qcm: { sourceQuote: "Galerie des Offices, Florence", conceptTag: "botany_and_symbolism", difficulty: "medium", question: "Qui est le personnage au centre du tableau vers qui convergent toutes les lignes de fuite implicites ?", options: ["Vénus", "La Vierge Marie", "Flore", "Diane la chasseresse"], correctIndex: 0, explanation: "Vénus règne au centre du jardin divin, incarnant l'Humanitas (bienveillance et amour spirituel)." },
    mots_cles: ["botticelli", "printemps", "médicis", "fleurs", "allégorie"]
  },

  // 2. Haute Renaissance
  {
    id: 3, slug: 'la-joconde', id_courant: 2, titre: 'La Joconde (Mona Lisa)', artiste: 'Léonard de Vinci', date_creation: 'vers 1503–1519',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=500', aspect_ratio: 0.67, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Sans doute le portrait le plus célèbre de l'histoire, connu pour son expression faciale énigmatique.",
    anecdote_technique: "Léonard a construit les ombres autour des yeux en utilisant des dizaines de glacis microscopiques — une classe de maître en sfumato.",
    anecdote_secrete: "La peinture est devenue une icône mondiale seulement après avoir été audacieusement volée au Louvre en 1911.",
    extended_analysis: "Léonard encadre Lisa Gherardini dans une pose de trois quarts surplombant un vaste paysage atmosphérique. Son sourire semble vivant car les ombres autour de sa bouche sont perçues différemment selon la vision périphérique de l'observateur.",
    historical_context: "Commencée à Florence, elle a été emportée en France par Léonard lorsqu'il fut invité par François Ier.",
    qcm: { sourceQuote: "Musée du Louvre, Paris", conceptTag: "sfumato", difficulty: "medium", question: "Comment s'appelle la technique de l'estompe inventée par Léonard utilisée pour le sourire de la Joconde ?", options: ["Le Sfumato", "L'Impasto", "Le Pointillisme", "La Fresque"], correctIndex: 0, explanation: "Sfumato (enfumé) désigne ces transitions si douces qu'on ne voit aucune ligne de contour nette." },
    mots_cles: ["léonard", "renaissance", "sfumato", "portrait", "louvre"]
  },
  {
    id: 4, slug: 'la-cene', id_courant: 2, titre: 'La Cène', artiste: 'Léonard de Vinci', date_creation: '1495–1498',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Leonardo_da_Vinci_(1452-1519)_-_The_Last_Supper_(1495-1498).jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Leonardo_da_Vinci_(1452-1519)_-_The_Last_Supper_(1495-1498).jpg?width=500', aspect_ratio: 2.05, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Le chef-d'œuvre le plus fragile de Léonard : l'artiste a expérimenté une technique sur mur sec qui s'est détériorée du vivant même de l'artiste.",
    anecdote_technique: "Léonard a planté un clou dans le mur au niveau du visage de Jésus pour tirer des fils, garantissant que toutes les lignes de la perspective parfaite convergent vers le Christ.",
    anecdote_secrete: "En 1652, des moines ont décidé d'agrandir une porte sous la fresque... coupant ainsi définitivement les pieds de Jésus.",
    extended_analysis: "Léonard a figé l'instant dramatique précis où Jésus annonce qu'un des apôtres va le trahir. Les réactions en chaîne des personnages, regroupés en quatre groupes de trois, montrent l'impact psychologique de l'annonce.",
    historical_context: "Peinte sur le mur du réfectoire du couvent Santa Maria delle Grazie à Milan sur commande du duc Ludovic Sforza.",
    qcm: { sourceQuote: "Santa Maria delle Grazie, Milan", conceptTag: "perspective", difficulty: "easy", question: "Quel est l'objectif géométrique principal de la perspective dans la Cène ?", options: ["Faire converger tous les regards et les lignes vers le visage de Jésus", "Créer un effet de trompe-l'œil trompeur", "Cacher le traître Judas", "Aligner le plafond avec le sol de la vraie salle"], correctIndex: 0, explanation: "Le point de fuite unique de cette perspective mathématique se trouve exactement sur l'œil droit de Jésus, centre spirituel et physique de la toile." },
    mots_cles: ["léonard", "cène", "jésus", "perspective", "milan"]
  },
  {
    id: 5, slug: 'la-creation-d-adam', id_courant: 2, titre: 'La Création d\'Adam', artiste: 'Michel-Ange', date_creation: '1508–1512',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Michelangelo_-_Creation_of_Adam_(cropped).jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Michelangelo_-_Creation_of_Adam_(cropped).jpg?width=500', aspect_ratio: 2.21, ordre_dans_courant: 3, is_active: true,
    anecdote_accroche: "La scène de doigts se touchant la plus célèbre du monde, peinte par un homme qui se considérait sculpteur, pas peintre.",
    anecdote_technique: "Michel-Ange peignait debout sur un échafaudage en se tordant le cou, peignant sur du plâtre encore frais (buon fresco) à la vitesse de l'éclair.",
    anecdote_secrete: "La forme du manteau divin entourant Dieu et les anges a la silhouette anatomique parfaite d'un cerveau humain. Michel-Ange dissimulait sa passion pour la dissection.",
    extended_analysis: "La puissante musculature de Dieu et d'Adam montre l'influence de la sculpture grecque antique. Le léger vide entre les deux doigts crée une tension électrisante, symbolisant le don de l'étincelle de vie et de l'âme.",
    historical_context: "Une commande gigantesque du pape Jules II pour décorer le plafond de la chapelle Sixtine au Vatican.",
    qcm: { sourceQuote: "Chapelle Sixtine, Vatican", conceptTag: "anatomy", difficulty: "hard", question: "Que représenterait secrètement la cape rouge entourant Dieu selon certains neurologues ?", options: ["Une coupe sagittale d'un cerveau humain", "Un cœur humain", "Le continent européen", "La forme exacte du mont Olympe"], correctIndex: 0, explanation: "Plusieurs experts affirment que le manteau correspond aux lobes d'un cerveau avec la moelle épinière, symbolisant que Dieu transmet à Adam l'intellect suprême." },
    mots_cles: ["michel-ange", "vatican", "sixtine", "fresque", "adam"]
  },
  {
    id: 6, slug: 'l-ecole-d-athenes', id_courant: 2, titre: 'L\'École d\'Athènes', artiste: 'Raphaël', date_creation: '1509–1511',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sanzio_01.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sanzio_01.jpg?width=500', aspect_ratio: 1.45, ordre_dans_courant: 4, is_active: true,
    anecdote_accroche: "Raphaël a utilisé les traits des génies de son époque pour incarner les grands philosophes grecs.",
    anecdote_technique: "Raphaël y maîtrise l'illusion d'une architecture monumentale en arc de triomphe qui 'ouvre' virtuellement le mur du Vatican.",
    anecdote_secrete: "Michel-Ange, alors qu'il peignait la chapelle Sixtine à quelques mètres de là, a été peint par Raphaël au premier plan sous les traits d'Héraclite, le philosophe grognon.",
    extended_analysis: "Platon pointe le ciel (l'idéalisme des idées pures) et Aristote la terre (le pragmatisme scientifique). Tous les autres penseurs sont répartis de part et d'autre selon ces deux visions du monde.",
    historical_context: "Fresque peinte pour décorer la bibliothèque personnelle (la Chambre de la Signature) du pape Jules II.",
    qcm: { sourceQuote: "Musées du Vatican", conceptTag: "philosophy", difficulty: "medium", question: "Sous les traits de quel philosophe grec Platon est-il représenté ?", options: ["Léonard de Vinci", "Michel-Ange", "Jules César", "Donatello"], correctIndex: 0, explanation: "Raphaël a rendu hommage à son aîné Léonard de Vinci en lui donnant le rôle principal de Platon, le patriarche barbu montrant le ciel." },
    mots_cles: ["raphaël", "vatican", "philosophie", "platon", "fresque"]
  },

  // 3. Renaissance nordique
  {
    id: 7, slug: 'les-epoux-arnolfini', id_courant: 3, titre: 'Les Époux Arnolfini', artiste: 'Jan van Eyck', date_creation: '1434',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Eyck_-_Arnolfini_Portrait.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Eyck_-_Arnolfini_Portrait.jpg?width=500', aspect_ratio: 0.74, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "L'un des tableaux les plus analysés du monde : est-ce un mariage secret, une commémoration ou un contrat d'affaires ?",
    anecdote_technique: "L'utilisation révolutionnaire de la peinture à l'huile pure a permis à Van Eyck de peindre les reflets minuscules dans les perles et le lustre métallique.",
    anecdote_secrete: "Si vous zoomez sur le petit miroir bombé au fond, vous y verrez le reflet microscopique de deux autres personnages franchissant la porte, dont possiblement le peintre lui-même.",
    extended_analysis: "L'œuvre est saturée de symbolisme : le petit chien symbolise la fidélité, les fruits près de la fenêtre la pureté ou la richesse, et l'unique bougie allumée en plein jour l'œil de Dieu ou la chandelle nuptiale.",
    historical_context: "Il représente Giovanni Arnolfini, riche marchand italien installé à Bruges, l'un des centres économiques majeurs de l'époque.",
    qcm: { sourceQuote: "National Gallery, Londres", conceptTag: "symbolism", difficulty: "hard", question: "Que fait curieusement Jan van Eyck juste au-dessus du miroir dans le tableau ?", options: ["Il a signé avec une phrase : 'Jan van Eyck fut ici, 1434'", "Il a peint un autoportrait de lui-même nu", "Il a dessiné un diable", "Il a collé une vraie pièce de monnaie"], correctIndex: 0, explanation: "Il a signé en latin flamboyant « Johannes de eyck fuit hic 1434 », suggérant qu'il a été témoin visuel ou légal de la scène." },
    mots_cles: ["van eyck", "flandres", "huile", "mariage", "miroir"]
  },
  {
    id: 8, slug: 'le-jardin-des-delices', id_courant: 3, titre: 'Le Jardin des délices', artiste: 'Jérôme Bosch', date_creation: '1490–1510',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Garden_of_earthly_delights.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Garden_of_earthly_delights.jpg?width=500', aspect_ratio: 2.05, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Un cauchemar ou un rêve fou ? Un triptyque hallucinant rempli de créatures hybrides et de fruits géants, inventé 400 ans avant le surréalisme.",
    anecdote_technique: "Peint en trois panneaux de chêne (un triptyque), il se referme pour révéler une incroyable peinture en grisaille représentant la création du monde, à l'opposé des couleurs éclatantes de l'intérieur.",
    anecdote_secrete: "Dans le panneau de l'Enfer, une partition de musique est tatouée sur les fesses d'un damné. En 2014, une étudiante a décodé la mélodie et l'a rendue audible sur Internet.",
    extended_analysis: "Lecture de gauche à droite : le Jardin d'Eden avec Adam et Ève, le panneau central foisonnant illustrant les plaisirs luxurieux (ou un monde innocent alternatif), et à droite l'Enfer musical terrifiant où la luxure est punie.",
    historical_context: "Malgré ses visions hérétiques, Bosch était membre d'une confrérie religieuse stricte. L'œuvre a été achetée très tôt par le roi ultra-catholique Philippe II d'Espagne.",
    qcm: { sourceQuote: "Musée du Prado, Madrid", conceptTag: "composition", difficulty: "medium", question: "Que représente le panneau sombre situé tout à droite du triptyque ?", options: ["L'Enfer musical, lieu de tourments cauchemardesques", "La fin du monde dominée par des extraterrestres", "L'hiver dans les Flandres", "Le purgatoire réservé aux enfants"], correctIndex: 0, explanation: "L'Enfer de Bosch dépeint les damnés torturés par des instruments de musique surdimensionnés, symbolisant les vices de la vie mondaine." },
    mots_cles: ["bosch", "enfer", "paradis", "triptyque", "folie"]
  },

  // 4. Baroque
  {
    id: 9, slug: 'les-menines', id_courant: 4, titre: 'Les Ménines', artiste: 'Diego Vélasquez', date_creation: '1656',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Las_Meninas,_by_Diego_Vel%C3%A1zquez,_from_Prado_in_Google_Earth.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Las_Meninas,_by_Diego_Vel%C3%A1zquez,_from_Prado_in_Google_Earth.jpg?width=500', aspect_ratio: 0.88, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Le 'tableau des tableaux' : l'une des œuvres les plus mystérieuses sur l'acte de peindre et sur qui regarde vraiment qui.",
    anecdote_technique: "Le génie de Vélasquez réside dans ses touches extrêmement lâches de près (taches de peinture), mais qui créent une illusion photographique parfaite de loin.",
    anecdote_secrete: "L'ordre de Santiago (la croix rouge sur le buste du peintre) a été rajouté sur son vêtement trois ans plus tard, sur ordre direct du roi pour anoblir Vélasquez post-mortem.",
    extended_analysis: "Vélasquez se représente lui-même au travail, regardant vers *nous*. Dans le petit miroir du fond, on voit le roi et la reine d'Espagne. Sommes-nous le roi et la reine posant pour le peintre ? Ou sommes-nous derrière eux ?",
    historical_context: "Peint pour le roi Philippe IV d'Espagne, il représente sa fille, l'Infante Marguerite-Thérèse, entourée de ses dames d'honneur (ménines), nains et chien de cour.",
    qcm: { sourceQuote: "Musée du Prado, Madrid", conceptTag: "perspective_illusion", difficulty: "medium", question: "Où se trouve le roi Philippe IV dans la composition de cette scène ?", options: ["Il n'est visible que dans le reflet d'un miroir au fond de la pièce", "Il est debout à droite, à côté du chien", "C'est lui qui peint la toile", "Il est caché sous la robe de la petite princesse"], correctIndex: 0, explanation: "Le reflet du roi et de la reine dans le miroir du fond suggère qu'ils se tiennent exactement à la place du spectateur physique du tableau." },
    mots_cles: ["vélasquez", "espagne", "prado", "illusion", "roi"]
  },

  // 5. Âge d'or néerlandais
  {
    id: 10, slug: 'la-jeune-fille-a-la-perle', id_courant: 5, titre: 'La Jeune Fille à la perle', artiste: 'Johannes Vermeer', date_creation: 'vers 1665',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Meisje_met_de_parel.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Meisje_met_de_parel.jpg?width=500', aspect_ratio: 0.85, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Surnommée la 'Mona Lisa du Nord', elle n'est pas un portrait mais une 'tronie' (étude de visage anonyme exotique).",
    anecdote_technique: "Vermeer utilisait abondamment l'outremer naturel pour le turban bleu, un pigment fabriqué à partir de lapis-lazuli écrasé, extrêmement cher à l'époque.",
    anecdote_secrete: "La fameuse perle géante est une illusion d'optique magistrale : elle n'a pas de contour et consiste uniquement en deux minuscules coups de pinceau blanc et gris flottant dans le noir.",
    extended_analysis: "La jeune fille tourne la tête vers nous de façon intime, la bouche entrouverte. Le fond noir plat (à l'origine vert foncé) accentue la lumière spectaculaire et tridimensionnelle qui caresse son visage.",
    historical_context: "Les peintres hollandais vendaient leurs œuvres à une bourgeoisie locale fascinée par les détails réalistes et le mystère.",
    qcm: { sourceQuote: "Mauritshuis, La Haye", conceptTag: "genre", difficulty: "medium", question: "Quel terme technique hollandais désigne ce type de peinture, qui n'est pas un portrait de commande mais une étude d'expression ?", options: ["Une tronie", "Un bodegón", "Un sfumato", "Une nature morte"], correctIndex: 0, explanation: "Une 'tronie' (visage/trogne) était une étude typique visant à explorer un costume, une expression ou une technique d'éclairage, sans chercher l'identification de la personne." },
    mots_cles: ["vermeer", "perle", "lumière", "hollande", "tronie"]
  },
  {
    id: 11, slug: 'la-laitiere', id_courant: 5, titre: 'La Laitière', artiste: 'Johannes Vermeer', date_creation: 'vers 1658–1660',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg?width=500', aspect_ratio: 0.90, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "L'art de sacraliser un geste banal du quotidien : verser du lait dans un plat à pain.",
    anecdote_technique: "Vermeer a appliqué de minuscules points de peinture blanche brillants (pointillés) sur le pain de la table pour créer l'illusion d'une texture croustillante frappée par la lumière.",
    anecdote_secrete: "Aux rayons X, on a découvert qu'un grand panier à linge et une énorme carte géographique étaient prévus au mur avant que Vermeer ne les efface pour épurer la scène au maximum.",
    extended_analysis: "Tout dans cette toile respire la concentration silencieuse. La lumière, venant de la fenêtre à gauche (typique de Vermeer), révèle les incroyables textures du pichet en grès rugueux, des vêtements épais et du mur fissuré.",
    historical_context: "Célébration des valeurs domestiques hollandaises (travail, calme, sobriété) après la longue guerre d'indépendance contre l'Espagne.",
    qcm: { sourceQuote: "Rijksmuseum, Amsterdam", conceptTag: "light", difficulty: "easy", question: "D'où provient la source de lumière dans la très grande majorité des tableaux de Vermeer ?", options: ["D'une fenêtre invisible ou partiellement visible sur la gauche", "D'une bougie posée sur la table", "D'une lucarne au plafond (éclairage zénithal)", "D'un feu de cheminée"], correctIndex: 0, explanation: "Vermeer plaçait presque toujours ses modèles dans la même pièce de sa maison, recevant la douce lumière d'une grande fenêtre latérale à gauche." },
    mots_cles: ["vermeer", "lumière", "quotidien", "pain", "amsterdam"]
  },
  {
    id: 12, slug: 'la-ronde-de-nuit', id_courant: 5, titre: 'La Ronde de nuit', artiste: 'Rembrandt', date_creation: '1642',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg?width=500', aspect_ratio: 1.20, ordre_dans_courant: 3, is_active: true,
    anecdote_accroche: "Son vrai nom n'est pas 'La Ronde de nuit', la peinture se passe en plein jour ! C'est la saleté et le vernis bruni qui l'ont assombrie pendant des siècles.",
    anecdote_technique: "Rembrandt a brisé les règles du portrait de groupe de l'époque. Au lieu d'aligner les miliciens de manière figée et équitable, il les a peints en plein mouvement, dans une pagaille organisée.",
    anecdote_secrete: "Le tableau a été amputé de larges bandes sur ses 4 côtés en 1715 pour pouvoir rentrer entre deux portes de l'Hôtel de ville d'Amsterdam.",
    extended_analysis: "La maîtrise absolue du clair-obscur dramatique dirige le regard vers le capitaine Frans Banning Cocq et l'étrange petite fille dorée (porte-bonheur de la compagnie). Les lances et les fusils donnent une dynamique cinétique violente.",
    historical_context: "Une commande de la milice civile d'Amsterdam pour leur quartier général. La garde urbaine n'avait plus de vrai rôle militaire, mais représentait la richesse bourgeoise.",
    qcm: { sourceQuote: "Rijksmuseum, Amsterdam", conceptTag: "composition", difficulty: "medium", question: "Pourquoi ce tableau de groupe a-t-il choqué à l'époque de sa révélation ?", options: ["Parce que Rembrandt n'a pas mis tous ceux qui ont payé au premier rang, préférant créer une scène d'action", "Parce que le capitaine porte un uniforme ennemi", "Parce que les personnages sont peints nus", "Parce que la toile était minuscule"], correctIndex: 0, explanation: "Habituellement, les miliciens payaient pour avoir leur visage bien visible en rang. L'approche d'action de Rembrandt a caché plusieurs donateurs dans l'ombre au profit du drame visuel." },
    mots_cles: ["rembrandt", "milice", "clair-obscur", "hollande", "groupe"]
  },

  // 6. Romantisme
  {
    id: 13, slug: 'le-radeau-de-la-meduse', id_courant: 6, titre: 'Le Radeau de la Méduse', artiste: 'Théodore Géricault', date_creation: '1818–1819',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/JEAN_LOUIS_THÉODORE_GÉRICAULT_-_La_Balsa_de_la_Medusa_(Museo_del_Louvre,_1818-19).jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/JEAN_LOUIS_THÉODORE_GÉRICAULT_-_La_Balsa_de_la_Medusa_(Museo_del_Louvre,_1818-19).jpg?width=500', aspect_ratio: 1.38, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Un manifeste choc : Géricault a élevé un fait divers macabre et un scandale politique au rang de peinture d'histoire sacrée.",
    anecdote_technique: "Le peintre a poussé le réalisme jusqu'à stocker des morceaux de cadavres et des têtes coupées volés à la morgue dans son atelier pour observer précisément les teintes de la mort.",
    anecdote_secrete: "Eugène Delacroix, futur maître du romantisme, a posé pour la figure face contre terre, le bras étendu, près du centre du tableau.",
    extended_analysis: "La composition est construite sur une puissante structure pyramidale allant de la mort (les cadavres au premier plan) à l'espoir de survie (le marin noir agitant un chiffon rouge au sommet). La nature est rendue indifférente et cruelle.",
    historical_context: "Le naufrage de la frégate française La Méduse en 1816 dû à l'incompétence d'un capitaine nommé par faveur royale. 147 personnes ont dérivé, 15 ont survécu après des épisodes de cannibalisme.",
    qcm: { sourceQuote: "Musée du Louvre, Paris", conceptTag: "history_painting", difficulty: "medium", question: "Qui est la figure héroïque placée au sommet de la pyramide d'espoir agitant le chiffon ?", options: ["Un marin noir (nommé Jean-Charles)", "Le capitaine du navire", "Un dieu marin", "Un noble aristocrate français"], correctIndex: 0, explanation: "Géricault, militant anti-esclavagiste, a placé le marin sénégalais Jean-Charles au sommet symbolique du tableau, un message politique fort pour l'époque." },
    mots_cles: ["géricault", "naufrage", "scandale", "louvre", "cadavres"]
  },
  {
    id: 14, slug: 'la-liberte-guidant-le-peuple', id_courant: 6, titre: 'La Liberté guidant le peuple', artiste: 'Eugène Delacroix', date_creation: '1830',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Eug%C3%A8ne_Delacroix_-_Le_28_Juillet._La_Libert%C3%A9_guidant_le_peuple.jpg?width=500', aspect_ratio: 1.25, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Souvent confondue avec la Révolution de 1789, cette œuvre illustre en réalité les 'Trois Glorieuses' de 1830.",
    anecdote_technique: "Delacroix utilise le drapeau tricolore comme point de fuite des couleurs : le bleu, le blanc et le rouge se retrouvent discrètement sur les vêtements de la foule.",
    anecdote_secrete: "Jugée trop incendiaire et dangereuse, la peinture a été rachetée par l'État pour être cachée dans un grenier hors de la vue du public pendant des décennies.",
    extended_analysis: "Mélange parfait de reportage réaliste (cadavres, étudiants, ouvriers armés) et d'allégorie mythologique (la figure centrale de la Liberté aux seins nus s'inspirant des statues antiques).",
    historical_context: "Le soulèvement populaire du peuple de Paris en juillet 1830 contre le roi Charles X, qui avait aboli la liberté de la presse.",
    qcm: { sourceQuote: "Musée du Louvre, Paris", conceptTag: "allegory", difficulty: "easy", question: "Que symbolise la femme au centre portant le drapeau ?", options: ["C'est une allégorie de la Liberté (et de la République)", "C'est Jeanne d'Arc", "C'est la reine de France", "C'est la femme du peintre"], correctIndex: 0, explanation: "Surnommée 'Marianne', elle est l'incarnation de la Liberté s'élevant des barricades, mi-déesse antique, mi-femme du peuple." },
    mots_cles: ["delacroix", "révolution", "paris", "drapeau", "liberté"]
  },
  {
    id: 15, slug: 'le-voyageur-contemplant-une-mer-de-nuages', id_courant: 6, titre: 'Le Voyageur contemplant une mer de nuages', artiste: 'Caspar David Friedrich', date_creation: '1818',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg?width=500', aspect_ratio: 0.77, ordre_dans_courant: 3, is_active: true,
    anecdote_accroche: "L'image ultime de l'introspection romantique : on se tient à la place du personnage pour affronter l'immensité du vide.",
    anecdote_technique: "Friedrich utilise la technique de la 'Rückenfigur' (personnage vu de dos) pour forcer le spectateur à adopter le même point de vue que le voyageur.",
    anecdote_secrete: "Bien qu'il semble très réaliste, ce paysage est un pur montage : le peintre a assemblé divers croquis de différents sommets allemands pour créer ce panorama de toutes pièces.",
    extended_analysis: "Le personnage de dos se dresse comme un monument vert sombre contre la clarté vertigineuse du brouillard. L'œuvre symbolise la petitesse de l'homme face au divin caché dans la nature sauvage, le concept même du 'Sublime'.",
    historical_context: "Peint durant l'époque romantique allemande qui privilégiait le retour à la nature face aux rationalités froides de la philosophie moderne.",
    qcm: { sourceQuote: "Hamburger Kunsthalle, Hambourg", conceptTag: "ruckenfigur", difficulty: "medium", question: "Comment s'appelle le procédé artistique consistant à placer un personnage de dos au premier plan pour forcer le spectateur à regarder le paysage à travers ses yeux ?", options: ["La Rückenfigur", "Le Chiaroscuro", "Le Repoussoir", "L'Anamorphose"], correctIndex: 0, explanation: "Rückenfigur signifie 'figure de dos' en allemand, un outil émotionnel majeur des romantiques pour inviter à l'introspection." },
    mots_cles: ["friedrich", "romantisme", "montagne", "sublime", "introspection"]
  },
  {
    id: 16, slug: 'tres-de-mayo', id_courant: 6, titre: 'Tres de Mayo', artiste: 'Francisco de Goya', date_creation: '1814',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/El_Tres_de_Mayo,_by_Francisco_de_Goya,_from_Prado_in_Google_Earth.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/El_Tres_de_Mayo,_by_Francisco_de_Goya,_from_Prado_in_Google_Earth.jpg?width=500', aspect_ratio: 1.30, ordre_dans_courant: 4, is_active: true,
    anecdote_accroche: "La première grande peinture moderne dénonçant frontalement les horreurs de la guerre sans aucune gloire héroïque.",
    anecdote_technique: "Goya utilise une lanterne carrée posée au sol comme unique source d'un éclairage dramatique, préfigurant l'éclairage de cinéma.",
    anecdote_secrete: "Sourd et profondément pessimiste, Goya a peint ce tableau (et son jumeau le Dos de Mayo) de mémoire, plusieurs années après les événements.",
    extended_analysis: "La composition oppose radicalement deux groupes : à droite, la machine de guerre sans visage (soldats français uniformes et rigides), et à gauche, l'humanité sanglante et terrifiée (insurgés espagnols). L'homme aux bras en croix rappelle l'innocence d'un martyr crucifié.",
    historical_context: "Répression sanglante par l'armée de Napoléon des insurgés madrilènes le 3 mai 1808. Goya l'a peint pour le retour de la monarchie espagnole.",
    qcm: { sourceQuote: "Musée du Prado, Madrid", conceptTag: "social_critique", difficulty: "medium", question: "Quelle caractéristique donne à la troupe de soldats français un aspect de 'machine à tuer' impitoyable ?", options: ["Leurs visages sont détournés et cachés, ils ne forment qu'un bloc de fusils", "Ils portent des masques de crânes", "Ils sont peints avec une peinture métallique", "Ils n'ont pas de jambes"], correctIndex: 0, explanation: "En masquant les visages des bourreaux et en montrant l'expression de terreur des victimes, Goya souligne l'inhumanité du peloton d'exécution." },
    mots_cles: ["goya", "guerre", "napoléon", "madrid", "martyr"]
  },

  // 7. Réalisme
  {
    id: 17, slug: 'le-dejeuner-sur-l-herbe', id_courant: 7, titre: 'Le Déjeuner sur l\'herbe', artiste: 'Édouard Manet', date_creation: '1863',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Édouard_Manet_-_Le_Déjeuner_sur_l\'herbe.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Édouard_Manet_-_Le_Déjeuner_sur_l\'herbe.jpg?width=500', aspect_ratio: 1.25, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Le plus grand scandale de l'art du 19e siècle : un nu féminin regardant le public, assis calmement avec des hommes en costumes modernes.",
    anecdote_technique: "Manet a abandonné le modelé classique des ombres progressives pour des aplats de couleurs brutaux, rendant la toile presque plate comme une affiche moderne.",
    anecdote_secrete: "L'Empereur Napoléon III en personne est venu voir l'œuvre et a publiquement déclaré qu'elle offensait la pudeur.",
    extended_analysis: "Manet reprend le thème classique de la 'fête champêtre' mais le modernise. La femme n'est pas une nymphe mythologique, mais une Parisienne réelle (Victorine Meurent) qui regarde le spectateur avec une assurance provocante, détruisant l'hypocrisie de la peinture académique.",
    historical_context: "Rejeté par le jury officiel, le tableau fut exposé au fameux 'Salon des Refusés' de 1863, marquant le point de départ de l'art moderne.",
    qcm: { sourceQuote: "Musée d'Orsay, Paris", conceptTag: "modernity", difficulty: "medium", question: "Pourquoi la nudité de la femme au centre a-t-elle fait scandale par rapport aux centaines d'autres toiles de nus de l'époque ?", options: ["Ce n'est pas une déesse antique lointaine, mais une femme contemporaine entourée de bourgeois habillés à la mode", "Elle est mal dessinée", "Elle est peinte en couleur bleue", "C'était la femme de l'Empereur"], correctIndex: 0, explanation: "La peinture académique autorisait le nu tant qu'il était caché derrière l'alibi de la mythologie. Manet a détruit cette règle en peignant un nu résolument contemporain." },
    mots_cles: ["manet", "scandale", "modernité", "nu", "paris"]
  },

  // 8. Impressionnisme
  {
    id: 18, slug: 'impression-soleil-levant', id_courant: 8, titre: 'Impression, soleil levant', artiste: 'Claude Monet', date_creation: '1872',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet,_Impression,_soleil_levant,_1872.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet,_Impression,_soleil_levant,_1872.jpg?width=500', aspect_ratio: 1.31, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "La peinture qui, à la suite d'une blague sarcastique d'un critique d'art, a donné son nom officiel à l'Impressionnisme.",
    anecdote_technique: "Si on passait le tableau en noir et blanc, le soleil orange vif disparaîtrait totalement : sa valeur de gris est mathématiquement identique à celle du ciel qui l'entoure.",
    anecdote_secrete: "Volée en plein jour en 1985 au musée Marmottan à Paris par des braqueurs armés, elle fut heureusement retrouvée intacte cinq ans plus tard en Corse.",
    extended_analysis: "L'œuvre dissout la solidité industrielle du port du Havre dans une brume colorée et éphémère. Les coups de pinceau rapides et bruts (la signature 'esquissée') deviennent l'esthétique finale de la toile.",
    historical_context: "Exposée en 1874 lors de la Première Exposition des Impressionnistes indépendante du Salon officiel de Paris.",
    qcm: { sourceQuote: "Musée Marmottan Monet, Paris", conceptTag: "history_of_art", difficulty: "easy", question: "Quel lieu et moment de la journée sont représentés dans ce tableau ?", options: ["Le port du Havre au lever du soleil au petit matin", "Le port de Venise au crépuscule", "La Seine à Paris la nuit", "L'océan Atlantique en pleine tempête"], correctIndex: 0, explanation: "Monet a peint cette vue depuis la fenêtre de sa chambre d'hôtel au Havre, capturant l'atmosphère industrielle du petit matin." },
    mots_cles: ["monet", "havre", "port", "lumière", "origine"]
  },
  {
    id: 19, slug: 'les-nympheas', id_courant: 8, titre: 'Les Nymphéas', artiste: 'Claude Monet', date_creation: '1916–1919',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg?width=500', aspect_ratio: 1.33, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "L'œuvre de la fin de vie d'un géant aveuglé : Monet a peint ces toiles monumentales malgré ses graves cataractes.",
    anecdote_technique: "La suppression radicale de l'horizon nous plonge littéralement dans la surface de l'eau, anticipant l'abstraction du 20e siècle.",
    anecdote_secrete: "Ces grandes toiles ont été offertes à la France le lendemain de l'Armistice de 1918, comme monument de paix pour apaiser les esprits blessés par la guerre.",
    extended_analysis: "L'espace pictural s'ouvre complètement. L'étang de Giverny devient un miroir cosmique reflétant le ciel invisible, les saules pleureurs et les nuages par de vibrants empâtements colorés.",
    historical_context: "Après avoir construit son jardin de Giverny, Monet passa les 30 dernières années de sa vie à peindre exclusivement son étang.",
    qcm: { sourceQuote: "Musée de l'Orangerie, Paris", conceptTag: "composition", difficulty: "medium", question: "Que ne voit-on jamais sur les grandes toiles des Nymphéas de l'Orangerie ?", options: ["La ligne d'horizon et la rive", "Les fleurs", "Le reflet du ciel", "L'eau"], correctIndex: 0, explanation: "En cadrant exclusivement la surface de l'eau plongeante, Monet bouleverse la peinture de paysage classique." },
    mots_cles: ["monet", "nymphéas", "eau", "giverny", "orangerie"]
  },
  {
    id: 20, slug: 'bal-du-moulin-de-la-galette', id_courant: 8, titre: 'Bal du moulin de la Galette', artiste: 'Auguste Renoir', date_creation: '1876',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pierre-Auguste_Renoir,_Le_Moulin_de_la_Galette.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pierre-Auguste_Renoir,_Le_Moulin_de_la_Galette.jpg?width=500', aspect_ratio: 1.34, ordre_dans_courant: 3, is_active: true,
    anecdote_accroche: "Un sommet de la joie de vivre peinte, où les taches de soleil qui percent les feuilles d'acacia dansent sur les vestes des danseurs.",
    anecdote_technique: "Contrairement à l'époque classique, les ombres de Renoir ne sont jamais noires : elles sont peintes en violet profond ou en bleu, selon la lumière ambiante.",
    anecdote_secrete: "Renoir devait chaque jour porter cette toile gigantesque avec des amis en haut de la butte Montmartre pour peindre sur place, en direct.",
    extended_analysis: "La composition est floue et coupée brusquement sur les bords comme une photographie spontanée. Renoir saisit la gaieté vibrante des classes populaires parisiennes grâce aux reflets mouchetés de la lumière.",
    historical_context: "Un témoignage de la nouvelle culture des loisirs parisiens à la Belle Époque, le dimanche après-midi dans les guinguettes de Montmartre.",
    qcm: { sourceQuote: "Musée d'Orsay, Paris", conceptTag: "light", difficulty: "medium", question: "Qu'est-ce qui caractérise le traitement de la lumière par Renoir sur les personnages dansants ?", options: ["La lumière est tachetée, filtrée par les feuilles des arbres", "L'éclairage provient de puissants projecteurs de théâtre", "Il fait nuit noire éclairée par une seule bougie", "Les personnages sont dans une obscurité totale"], correctIndex: 0, explanation: "Ces taches circulaires lumineuses sur les vêtements traduisent l'impression fugitive du soleil perçant un feuillage agité par le vent." },
    mots_cles: ["renoir", "danse", "montmartre", "lumière", "joie"]
  },

  // 9. Post-Impressionnisme
  {
    id: 21, slug: 'la-nuit-etoilee', id_courant: 9, titre: 'La Nuit étoilée', artiste: 'Vincent van Gogh', date_creation: '1889',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=500', aspect_ratio: 1.26, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Peint derrière les barreaux de la chambre d'un hôpital psychiatrique, c'est l'ultime vision tourmentée et cosmique de Vincent.",
    anecdote_technique: "Le ciel nocturne n'est pas noir mais constitué de couches épaisses et texturées de bleu cobalt, d'outremer et de jaune indien, appliquées avec furie.",
    anecdote_secrete: "Van Gogh considérait cette toile comme un 'échec' dans ses lettres car elle s'éloignait trop de la réalité par rapport à ses standards.",
    extended_analysis: "La spirale centrale hypnotique évoque les nébuleuses astronomiques. Le cyprès au premier plan relie la terre des vivants (le village endormi) à l'immensité spirituelle des cieux (les étoiles).",
    historical_context: "Réalisée lors de son internement volontaire à l'asile de Saint-Paul de Mausole, un an avant son suicide.",
    qcm: { sourceQuote: "MoMA, New York", conceptTag: "astronomy", difficulty: "medium", question: "L'étoile la plus brillante juste à côté du cyprès sombre représente en réalité :", options: ["La planète Vénus", "Le Soleil", "L'étoile polaire", "La lune naissante"], correctIndex: 0, explanation: "Les astronomes ont prouvé qu'au matin de l'été 1889 à Saint-Rémy, Vénus brillait exactement à cette place dans le ciel." },
    mots_cles: ["van gogh", "nuit", "étoiles", "asile", "spirale"]
  },
  {
    id: 22, slug: 'un-dimanche-apres-midi-a-l-ile-de-la-grande-jatte', id_courant: 9, titre: 'Un dimanche après-midi à l\'Île de la Grande Jatte', artiste: 'Georges Seurat', date_creation: '1884–1886',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg?width=500', aspect_ratio: 1.51, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Un monument de la science des couleurs, peint patiemment avec des millions de minuscules points juxtaposés.",
    anecdote_technique: "Seurat n'a jamais mélangé ses peintures sur une palette : il mettait un point bleu à côté d'un point jaune, laissant notre œil et notre cerveau fabriquer le vert.",
    anecdote_secrete: "Parmi les promeneurs parisiens très chics, on peut observer une femme promenant un singe domestique en laisse au premier plan à droite.",
    extended_analysis: "Contrairement à l'Impressionnisme spontané, ici tout est figé, hiératique et calculé mathématiquement comme une frise antique. La lumière et les ombres sont vibrantes grâce à la loi du contraste simultané des couleurs.",
    historical_context: "Cette toile immense (plus de 3 mètres de large) est devenue le manifeste fondateur du mouvement néo-impressionniste ou 'Pointillisme'.",
    qcm: { sourceQuote: "Art Institute of Chicago", conceptTag: "pointillism", difficulty: "easy", question: "Quel est le nom de la théorie scientifique et artistique inventée par Seurat utilisée pour ce tableau ?", options: ["Le Pointillisme (ou Divisionnisme)", "Le Cubisme", "Le Sfumato", "Le Ténébrisme"], correctIndex: 0, explanation: "Le Pointillisme consiste à utiliser de petites touches de couleur pure qui se mélangent optiquement dans l'œil de l'observateur." },
    mots_cles: ["seurat", "pointillisme", "paris", "dimanche", "points"]
  },

  // 10. Expressionnisme
  {
    id: 23, slug: 'le-cri', id_courant: 10, titre: 'Le Cri', artiste: 'Edvard Munch', date_creation: '1893',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg?width=500', aspect_ratio: 0.79, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "L'icône universelle de l'angoisse existentielle moderne, vendue pour près de 120 millions de dollars.",
    anecdote_technique: "Munch a utilisé de la tempera, de l'huile et des crayons pastels sur du simple carton. Sur l'une des versions, il a écrit au crayon : 'Ne peut avoir été peint que par un fou'.",
    anecdote_secrete: "L'éruption titanesque du volcan Krakatoa en Indonésie dix ans plus tôt a généré des couchers de soleil rouge sang spectaculaires en Norvège qui ont inspiré le ciel apocalyptique.",
    extended_analysis: "Le son perçant déforme la nature environnante en courbes sonores oppressantes. L'humanoïde asexué n'est pas celui qui crie, mais celui qui se bouche les oreilles face au 'cri infini de la nature'.",
    historical_context: "Fin de siècle marquée par la révolution industrielle, la montée de la psychanalyse et l'aliénation urbaine.",
    qcm: { sourceQuote: "Musée national, Oslo", conceptTag: "psychology", difficulty: "medium", question: "Selon les carnets intimes de Munch, que faisait le personnage face au ciel rouge sang ?", options: ["Il se bouche les oreilles pour ne pas entendre le grand cri infini qui traverse la nature", "Il crie de douleur après s'être blessé", "Il pleure la perte de son amour", "Il admire le coucher du soleil"], correctIndex: 0, explanation: "Munch a ressenti soudainement la nature hurler et a peint le personnage se bouchant les oreilles, terrorisé par cette angoisse existentielle." },
    mots_cles: ["munch", "angoisse", "cri", "norvège", "rouge"]
  },

  // 11. Art Nouveau / Symbolisme
  {
    id: 24, slug: 'le-baiser', id_courant: 11, titre: 'Le Baiser', artiste: 'Gustav Klimt', date_creation: '1907–1908',
    image_url_full: 'https://commons.wikimedia.org/wiki/Special:FilePath/Klimt_-_The_Kiss.jpg?width=1280',
    image_url_thumb: 'https://commons.wikimedia.org/wiki/Special:FilePath/Klimt_-_The_Kiss.jpg?width=500', aspect_ratio: 1.0, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Une fusion érotique, spirituelle et décorative recouverte d'authentiques feuilles d'or 24 carats.",
    anecdote_technique: "C'est l'apogée du 'Cycle d'or' de Klimt, inspiré par les mosaïques byzantines qu'il a vues à Ravenne, en Italie.",
    anecdote_secrete: "Sous ses aspects très romantiques, Klimt joue le jeu des oppositions : le manteau de l'homme est couvert de blocs rectangulaires noirs et blancs, celui de la femme de cercles colorés et fleuris.",
    extended_analysis: "Les deux amants sont isolés du monde réel sur un précipice fleuri, unis sous une aura dorée sacrée. L'abstraction géométrique du vêtement contraste violemment avec la chair hyper-réaliste et délicate des visages et des mains.",
    historical_context: "Peint à l'apogée de Vienne 'fin de siècle', ville de Sigmund Freud, où l'Art nouveau (Sécession viennoise) célébrait l'érotisme de manière assumée et opulente.",
    qcm: { sourceQuote: "Palais du Belvédère, Vienne", conceptTag: "materials", difficulty: "easy", question: "Quel matériau luxueux recouvre presque entièrement cette toile ?", options: ["De véritables feuilles d'or", "De la peinture jaune au plomb", "Du bronze fondu", "Du velours jaune collé"], correctIndex: 0, explanation: "Fils d'orfèvre, Klimt a utilisé d'épaisses feuilles d'or, d'argent et de platine, donnant à ses œuvres une aura sacrée semblable aux icônes byzantines." },
    mots_cles: ["klimt", "or", "vienne", "baiser", "sécession"]
  },

  // 12. Cubisme
  {
    id: 25, slug: 'les-demoiselles-d-avignon', id_courant: 12, titre: 'Les Demoiselles d\'Avignon', artiste: 'Pablo Picasso', date_creation: '1907',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Les_Demoiselles_d%27Avignon.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Les_Demoiselles_d%27Avignon.jpg', aspect_ratio: 0.96, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "La détonation qui a fait exploser la peinture : ce tableau choquant a posé les bases de l'art du 20e siècle.",
    anecdote_technique: "Picasso a complètement détruit 500 ans de perspective occidentale : les corps sont vus simultanément de face et de dos, comme brisés en éclats de verre.",
    anecdote_secrete: "L'œuvre était si radicale et effrayante que même les amis proches de Picasso (comme Matisse ou Apollinaire) l'ont détestée, et Picasso l'a gardée cachée dans son atelier pendant près de dix ans.",
    extended_analysis: "Le tableau représente cinq prostituées d'une rue mal famée de Barcelone (Carrer d'Avinyó). Les visages des deux femmes de droite sont remplacés par d'agressifs masques tribaux africains, introduisant le primitivisme de manière brutale.",
    historical_context: "Peint à Paris. L'émergence des musées d'ethnographie et l'exposition d'arts ibérique et africain ont profondément bouleversé la vision de Picasso.",
    qcm: { sourceQuote: "MoMA, New York", conceptTag: "primitivism", difficulty: "medium", question: "Quelle forme d'art non occidentale a radicalement influencé le visage des personnages de droite ?", options: ["Les masques rituels africains et océaniens", "Les estampes japonaises ukiyo-e", "Les poteries mayas", "La calligraphie chinoise"], correctIndex: 0, explanation: "Fasciné par leur pouvoir brut au musée du Trocadéro, Picasso a utilisé l'abstraction géométrique des masques africains pour créer le premier tableau proto-cubiste." },
    mots_cles: ["picasso", "cubisme", "masques", "rupture", "barcelone"]
  },
  {
    id: 26, slug: 'guernica', id_courant: 12, titre: 'Guernica', artiste: 'Pablo Picasso', date_creation: '1937',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/en/7/74/PicassoGuernica.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/en/7/74/PicassoGuernica.jpg', aspect_ratio: 2.23, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "L'une des peintures anti-guerre les plus puissantes et monumentales jamais réalisées, criant la douleur sans une goutte de sang.",
    anecdote_technique: "Picasso a délibérément utilisé une palette uniquement en noir, blanc et gris (en grisaille) pour imiter le ton sombre et tragique des photos de presse des journaux.",
    anecdote_secrete: "Pendant l'occupation nazie de Paris, un officier de la Gestapo pointant une reproduction de Guernica a demandé à Picasso : 'C'est vous qui avez fait ça ?'. Il a répondu : 'Non, c'est vous.'",
    extended_analysis: "La toile immense (près de 8 mètres de long) agence une série de symboles de l'agonie : la mère pleurant son enfant mort (comme une Pietà moderne), le taureau (brutalité), et le cheval éventré (le peuple innocent hurlant de douleur).",
    historical_context: "Commande pour le pavillon espagnol de l'Exposition Universelle de Paris, réalisée juste après le bombardement terroriste d'une ville basque par l'aviation nazie allemande en soutien à Franco.",
    qcm: { sourceQuote: "Museo Reina Sofía, Madrid", conceptTag: "symbolism", difficulty: "medium", question: "Pourquoi la peinture est-elle peinte exclusivement dans les tons de gris, noir et blanc ?", options: ["Pour évoquer le deuil et le rendu tragique des journaux imprimés rapportant le massacre", "Parce que Picasso n'avait plus de couleurs vives dans son atelier", "C'est une esquisse inachevée", "Pour symboliser la nuit noire"], correctIndex: 0, explanation: "L'absence de couleur crée une froideur clinique, supprimant tout romantisme à la scène, et rappelle brutalement la presse photographique de l'époque." },
    mots_cles: ["picasso", "guerre", "espagne", "taureau", "bombardement"]
  },

  // 13. Surréalisme
  {
    id: 27, slug: 'la-persistance-de-la-memoire', id_courant: 13, titre: 'La Persistance de la mémoire', artiste: 'Salvador Dalí', date_creation: '1931',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg', aspect_ratio: 1.35, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Les fameuses 'montres molles', symbolisant le temps qui s'effondre dans le monde irrationnel du rêve.",
    anecdote_technique: "Bien qu'il semble immense dans l'imaginaire collectif, le véritable tableau est minuscule : il fait à peine la taille d'une feuille de papier A4.",
    anecdote_secrete: "Dalí a avoué avoir eu l'idée des montres fondantes après un dîner en observant un morceau de fromage camembert fondre lentement au soleil.",
    extended_analysis: "Dalí utilise une technique de trompe-l'œil hyperréaliste pour peindre l'impossible : le temps perd sa rigidité et pourrit (les fourmis dévorant la montre rouge). Le paysage est celui des rochers de sa Catalogne natale.",
    historical_context: "Réalisé alors que Dalí adopte sa fameuse méthode 'paranoïaque-critique' pour extraire les images de son inconscient.",
    qcm: { sourceQuote: "MoMA, New York", conceptTag: "surrealism", difficulty: "easy", question: "Quelle drôle d'anomalie subissent toutes les montres de la composition ?", options: ["Elles fondent, devenant molles et liquides", "Elles tournent à l'envers", "Elles sont en flammes", "Elles sont géantes et écrasent le paysage"], correctIndex: 0, explanation: "La montre molle est la métaphore ultime du surréalisme : dans nos rêves et notre inconscient, le temps strict et chronométrique de la réalité n'a plus aucune valeur." },
    mots_cles: ["dalí", "surréalisme", "montres", "rêve", "temps"]
  },
  {
    id: 28, slug: 'le-fils-de-l-homme', id_courant: 13, titre: 'Le Fils de l\'homme', artiste: 'René Magritte', date_creation: '1964',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Magritte_TheSonOfMan.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Magritte_TheSonOfMan.jpg', aspect_ratio: 0.76, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Un autoportrait qui cache ce que tout le monde veut voir, jouant brillamment sur notre frustration visuelle.",
    anecdote_technique: "Le bras gauche du personnage a une curieuse anomalie : le coude se plie de manière inversée ou anormale, une subtilité que peu remarquent au premier coup d'œil.",
    anecdote_secrete: "C'est censé être un autoportrait commandé par un ami. Ne sachant pas comment peindre son propre visage sans se sentir ridicule, Magritte l'a caché derrière une pomme.",
    extended_analysis: "L'image soulève la notion psychologique du 'caché'. Comme l'expliquait Magritte, 'Tout ce que nous voyons cache autre chose'. La pomme (nature, péché originel) occulte le visage (identité moderne, bourgeois anonyme en chapeau melon).",
    historical_context: "Peint en pleine époque du Pop Art, le tableau est devenu immédiatement une icône de la culture populaire moderne.",
    qcm: { sourceQuote: "Collection privée", conceptTag: "concept_art", difficulty: "medium", question: "Quelle idée philosophique René Magritte illustre-t-il spécifiquement avec la pomme flottante devant le visage ?", options: ["Le fait que tout ce que nous voyons cache systématiquement quelque chose d'autre", "L'importance de manger des fruits", "Le symbole de la marque de son ordinateur", "La gravité découverte par Newton"], correctIndex: 0, explanation: "Magritte explore notre curiosité frustrée : le visible apparent cache perpétuellement un autre visible, générant un mystère insondable." },
    mots_cles: ["magritte", "surréalisme", "pomme", "chapeau melon", "mystère"]
  },

  // 14. Réalisme américain / Régionalisme
  {
    id: 29, slug: 'american-gothic', id_courant: 14, titre: 'American Gothic', artiste: 'Grant Wood', date_creation: '1930',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg/500px-Grant_Wood_-_American_Gothic_-_Google_Art_Project.jpg', aspect_ratio: 0.83, ordre_dans_courant: 1, is_active: true,
    anecdote_accroche: "Le tableau le plus parodié de l'histoire des États-Unis, incarnation stoïque de l'Amérique rurale.",
    anecdote_technique: "Wood a peint cela avec un souci du détail hyperréaliste influencé par les primitifs flamands du 15e siècle (comme Jan van Eyck).",
    anecdote_secrete: "Les deux personnages ne sont pas mari et femme : ce sont la sœur du peintre et son propre dentiste qui ont posé séparément devant une maison qu'ils n'avaient jamais vue.",
    extended_analysis: "La fourche (qui se répète visuellement dans la salopette de l'homme) et la fenêtre gothique pointue au fond créent un verticalisme austère. Est-ce un hommage sincère à l'Amérique pionnière ou une satire mordante de son puritanisme ?",
    historical_context: "Présentée en 1930 au début de la Grande Dépression, la toile rassurait le public américain en magnifiant les valeurs fondamentales du Midwest.",
    qcm: { sourceQuote: "Art Institute of Chicago", conceptTag: "american_culture", difficulty: "medium", question: "D'où vient le nom 'Gothic' (gothique) dans le titre de l'œuvre ?", options: ["De la fenêtre pointue de la maison (style 'Carpenter Gothic')", "Parce qu'ils ont l'air très effrayants", "Parce que c'est une peinture médiévale européenne", "C'est le nom de famille de ces fermiers"], correctIndex: 0, explanation: "L'architecture en bois avec cette fenêtre à arc brisé au 1er étage est typique du style rural 'Carpenter Gothic' du 19e siècle." },
    mots_cles: ["wood", "amérique", "fermiers", "gothique", "midwest"]
  },
  {
    id: 30, slug: 'nighthawks', id_courant: 14, titre: 'Nighthawks', artiste: 'Edward Hopper', date_creation: '1942',
    image_url_full: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Nighthawks_by_Edward_Hopper_1942.jpg',
    image_url_thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Nighthawks_by_Edward_Hopper_1942.jpg/500px-Nighthawks_by_Edward_Hopper_1942.jpg', aspect_ratio: 1.83, ordre_dans_courant: 2, is_active: true,
    anecdote_accroche: "Une scène de nuit mythique d'un 'diner' américain qui hurle le silence et l'isolation au cœur de la ville.",
    anecdote_technique: "Il n'y a délibérément aucune porte d'entrée visible depuis l'extérieur pour entrer dans le bar, enfermant les personnages dans un terrarium de verre.",
    anecdote_secrete: "Hopper a insisté sur le fait qu'il n'avait pas volontairement peint l'isolement urbain, mais admis inconsciemment qu'il avait peint 'la solitude d'une grande ville'.",
    extended_analysis: "La lumière fluorescente verte et jaune, violente et artificielle, inonde la rue sombre. Les personnages ('oiseaux de nuit') sont assis tout près les uns des autres mais ne communiquent pas du tout. L'ambiance fait écho aux films noirs de l'époque.",
    historical_context: "Achevé quelques semaines après l'attaque de Pearl Harbor en 1941, lorsque New York effectuait des couvre-feux obscurs dans la paranoïa d'un bombardement.",
    qcm: { sourceQuote: "Art Institute of Chicago", conceptTag: "urban_isolation", difficulty: "medium", question: "Quel détail architectural de la peinture renforce un sentiment d'enfermement et de séparation avec les personnages ?", options: ["Il n'y a aucune porte visible pour entrer ou sortir du bar", "Les fenêtres ont de gros barreaux de prison", "Le bar flotte dans l'air", "Le plafond s'effondre sur eux"], correctIndex: 0, explanation: "Hopper a construit ce lieu de toutes pièces et a sciemment omis toute porte côté rue, créant une bulle de verre hermétique où les personnages sont coincés." },
    mots_cles: ["hopper", "nuit", "solitude", "diner", "new york"]
  }
];

function generateSql() {
  let sql = `
-- ==============================================================================
-- SUPABASE SEED DATA (14 Movements & 30 Artworks)
-- ==============================================================================

-- Clean up existing data during testing (if any)
TRUNCATE public.user_artwork_progress, public.historique_reponses, public.contenus_oeuvres, public.oeuvres, public.contenus_courants, public.courants RESTART IDENTITY CASCADE;

-- 1. ARTISTIC MOVEMENTS (\`courants\`)
INSERT INTO public.courants (id, slug, nom, siecle, oklch_token, ordre_chronologique)
VALUES
`;
  const courantsVals = courants.map(c => `(${c.id}, $STR$${c.slug}$STR$, $STR$${c.nom}$STR$, $STR$${c.siecle}$STR$, $STR$${c.oklch_token}$STR$, ${c.ordre_chronologique})`).join(',\n');
  sql += courantsVals + ';\n\n';

  sql += `-- 2. MOVEMENT CONTENTS (\`contenus_courants\`)\nINSERT INTO public.contenus_courants (id_courant, description_courte, caracteristiques_cles, contexte_historique, qcm_synthese)\nVALUES\n`;
  const contCourantsVals = courants.map(c => {
    return `(${c.id}, $STR$${c.description_courte}$STR$, $JSON$${JSON.stringify(c.caracteristiques_cles)}$JSON$::jsonb, $STR$${c.contexte_historique}$STR$, $JSON$${JSON.stringify(c.qcm_synthese)}$JSON$::jsonb)`;
  }).join(',\n');
  sql += contCourantsVals + ';\n\n';

  sql += `-- 3. ARTWORKS (\`oeuvres\`)\nINSERT INTO public.oeuvres (id, slug, id_courant, titre, artiste, date_creation, image_url_full, image_url_thumb, aspect_ratio, ordre_dans_courant, is_active, wikipedia_title)\nVALUES\n`;
  const oeuvresVals = oeuvres.map(o => `(${o.id}, $STR$${o.slug}$STR$, ${o.id_courant}, $STR$${o.titre}$STR$, $STR$${o.artiste}$STR$, $STR$${o.date_creation}$STR$, $STR$${o.image_url_full}$STR$, $STR$${o.image_url_thumb}$STR$, ${o.aspect_ratio}, ${o.ordre_dans_courant}, ${o.is_active}, NULL)`).join(',\n');
  sql += oeuvresVals + ';\n\n';

  sql += `-- 4. ARTWORK CONTENTS (\`contenus_oeuvres\`)\nINSERT INTO public.contenus_oeuvres (id_oeuvre, anecdote_accroche, anecdote_technique, anecdote_secrete, extended_analysis, historical_context, qcm, mots_cles, generated_by_model)\nVALUES\n`;
  const contOeuvresVals = oeuvres.map(o => {
    return `(${o.id}, $STR$${o.anecdote_accroche}$STR$, $STR$${o.anecdote_technique}$STR$, $STR$${o.anecdote_secrete}$STR$, $STR$${o.extended_analysis}$STR$, $STR$${o.historical_context}$STR$, $JSON$${JSON.stringify(o.qcm)}$JSON$::jsonb, $JSON$${JSON.stringify(o.mots_cles)}$JSON$::jsonb, 'gemini-3.1-pro')`;
  }).join(',\n');
  sql += contOeuvresVals + ';\n';

  return sql;
}

const outputPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
fs.writeFileSync(outputPath, generateSql());
console.log('Fichier seed.sql généré avec succès !');
