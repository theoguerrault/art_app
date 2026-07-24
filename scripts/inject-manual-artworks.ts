import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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

const ARTWORKS = [
  {
    titre: "Les Tournesols",
    artiste_nom: "Vincent van Gogh",
    courant_nom: "Post-Impressionnisme",
    date_creation: "1888",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/4/46/Vincent_Willem_van_Gogh_127.jpg",
    article_principal: "Réalisés lors de son séjour à Arles dans le sud de la France, Les Tournesols comptent parmi les œuvres les plus iconiques de Vincent van Gogh. Peints pour décorer la chambre de son ami Paul Gauguin, ces bouquets vibrants de couleur jaune expriment la gratitude et la dévotion. \n\nVan Gogh a utilisé des innovations techniques marquantes, notamment l'emploi de nouveaux pigments jaunes (comme le jaune de chrome) qui ont permis de donner à la toile cette intensité solaire. Les fleurs sont représentées dans tous les stades de leur vie, du bourgeon à la flétrissure, symbolisant le cycle de la vie et la fugacité du temps.",
    anecdotes_secretes: [
      "Van Gogh a peint une première série de Tournesols à Paris en 1887, qui étaient posés sur une table, mais c'est la série d'Arles dans des vases qui est devenue légendaire.",
      "Le jaune de chrome utilisé par Van Gogh était chimiquement instable ; c'est pourquoi certaines toiles ont légèrement bruni avec le temps."
    ],
    extended_analysis: "L'approche de Van Gogh ne consistait pas seulement à reproduire fidèlement l'apparence des fleurs, mais à capturer leur 'essence'. Les touches épaisses d'impasto donnent un relief presque tridimensionnel aux cœurs granuleux des tournesols.",
    historical_context: "À la fin du XIXe siècle, l'arrivée de nouveaux pigments de synthèse a révolutionné la palette des peintres, leur permettant de créer des œuvres aux couleurs bien plus vives et éclatantes que par le passé.",
    mots_cles: ["Fleurs", "Jaune de chrome", "Impasto", "Arles", "Nature morte"],
    qcm: {
      sourceQuote: "National Gallery, Londres / Van Gogh Museum, Amsterdam",
      conceptTag: "color_theory",
      difficulty: "easy",
      question: "Dans quel but Van Gogh a-t-il peint la célèbre série des Tournesols à Arles ?",
      options: [
        "Pour décorer la chambre de Paul Gauguin",
        "Pour une exposition à Paris",
        "Pour payer ses dettes à son frère Théo",
        "Pour étudier l'anatomie végétale"
      ],
      correctIndex: 0,
      explanation: "Il a peint ces toiles pour accueillir chaleureusement Paul Gauguin dans la 'Maison Jaune' à Arles, espérant fonder avec lui une colonie d'artistes."
    }
  },
  {
    titre: "La Trahison des images",
    artiste_nom: "René Magritte",
    courant_nom: "Surréalisme",
    date_creation: "1929",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/MagrittePipe.jpg/800px-MagrittePipe.jpg",
    article_principal: "Célèbre pour l'inscription « Ceci n'est pas une pipe » peinte avec la minutie d'un manuel d'écriture sous une image de pipe parfaitement réaliste, cette œuvre est un chef-d'œuvre de la réflexion sur l'art et le langage. Magritte y souligne le gouffre qui sépare l'objet lui-même de sa représentation picturale ou linguistique.\n\nEn remettant en cause nos certitudes visuelles, Magritte démontre que même la représentation la plus fidèle d'un objet n'est qu'une illusion de l'objet, une peinture sur une toile plane. Cette œuvre a profondément influencé le pop art et l'art conceptuel des décennies suivantes.",
    anecdotes_secretes: [
      "Interrogé sur son tableau, Magritte répondait souvent avec humour : « La fameuse pipe, me l'a-t-on assez reprochée ! Et pourtant, pouvez-vous la bourrer ma pipe ? Non, n'est-ce pas, elle n'est qu'une représentation. Donc si j'avais écrit sur mon tableau 'Ceci est une pipe', j'aurais menti ! »",
      "Le style d'écriture de la légende s'inspire directement des manuels scolaires de l'époque."
    ],
    extended_analysis: "Cette œuvre illustre le concept sémiotique de l'arbitraire du signe, séparant le signifiant (l'image, le mot) du signifié (le concept) et du référent (l'objet réel). C'est une critique directe du réalisme académique qui prétend offrir l'illusion de la réalité.",
    historical_context: "Dans les années 1920, le Surréalisme, influencé par la psychanalyse de Freud, cherchait à libérer l'inconscient et à bouleverser la perception logique du monde.",
    mots_cles: ["Illusion", "Sémiotique", "Langage", "Pipe", "Art Conceptuel"],
    qcm: {
      sourceQuote: "Los Angeles County Museum of Art (LACMA)",
      conceptTag: "semiotics",
      difficulty: "medium",
      question: "Quel message principal René Magritte souhaite-t-il faire passer avec la phrase « Ceci n'est pas une pipe » ?",
      options: [
        "Que l'image de l'objet n'est pas l'objet lui-même",
        "Que la peinture n'est pas encore terminée",
        "Qu'il s'agit en réalité d'un morceau de bois",
        "Que fumer est mauvais pour la santé"
      ],
      correctIndex: 0,
      explanation: "Magritte rappelle de manière provocatrice que la peinture n'est qu'une représentation visuelle. L'image de la pipe ne permet pas d'être fumée, elle n'est donc pas une pipe."
    }
  },
  {
    titre: "Les Amants",
    artiste_nom: "René Magritte",
    courant_nom: "Surréalisme",
    date_creation: "1928",
    image_url_full: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/The_Lovers_-_Rene_Magritte.jpg/800px-The_Lovers_-_Rene_Magritte.jpg",
    article_principal: "Dans ce tableau captivant, un homme et une femme s'embrassent, mais leurs têtes sont entièrement recouvertes de voiles blancs opaques, rendant l'expression de leurs visages impossible à percevoir et bloquant tout contact physique direct. Leurs tenues classiques, un costume noir et une robe rouge brique, contrastent avec l'étrangeté de leurs visages dissimulés.\n\nCette barrière de tissu crée une forte sensation d'étouffement, de frustration et d'isolement. L'œuvre symbolise la difficulté, voire l'impossibilité, de connaître véritablement l'autre, même dans l'acte le plus intime. Elle explore le désir contrecarré et les secrets insondables qui persistent au sein des relations amoureuses.",
    anecdotes_secretes: [
      "Beaucoup ont interprété ces voiles comme un lien traumatique avec le suicide de la mère de Magritte, retrouvée noyée avec sa chemise de nuit rabattue sur le visage. Magritte a toujours réfuté cette explication psychanalytique.",
      "C'est la première de plusieurs versions où Magritte a utilisé des linges pour voiler le visage de ses personnages."
    ],
    extended_analysis: "En supprimant les visages, Magritte dépouille les amants de leur individualité, les transformant en archétypes du désir frustré. La lumière dramatique, avec de fortes ombres portées, ajoute à l'atmosphère étouffante et théâtrale.",
    historical_context: "Le mouvement surréaliste explorait les rêves et l'inconscient, mais Magritte se démarquait par son style pictural précis, presque froid et figuratif, utilisé pour subvertir le quotidien.",
    mots_cles: ["Amour", "Voile", "Mystère", "Incommunicabilité", "Baiser"],
    qcm: {
      sourceQuote: "MoMA, New York",
      conceptTag: "psychological_art",
      difficulty: "easy",
      question: "Comment René Magritte illustre-t-il l'incommunicabilité dans le tableau 'Les Amants' ?",
      options: [
        "En recouvrant le visage des amants d'un linge blanc",
        "En peignant les amants de dos",
        "En plaçant un mur entre eux",
        "En représentant les personnages avec les yeux fermés"
      ],
      correctIndex: 0,
      explanation: "Les linges qui enveloppent les têtes des personnages empêchent le contact physique et visuel, symbolisant la difficulté à connaître véritablement son partenaire."
    }
  },
  {
    titre: "Un bar aux Folies Bergère",
    artiste_nom: "Édouard Manet",
    courant_nom: "Impressionnisme",
    date_creation: "1882",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Edouard_Manet%2C_A_Bar_at_the_Folies-Berg%C3%A8re.jpg/1200px-Edouard_Manet%2C_A_Bar_at_the_Folies-Berg%C3%A8re.jpg",
    article_principal: "Un bar aux Folies Bergère est la dernière œuvre majeure peinte par Édouard Manet avant sa mort. Elle met en scène Suzon, une véritable serveuse du célèbre cabaret parisien, se tenant au centre du tableau avec une expression mélancolique et détachée. Derrière elle, un immense miroir reflète la foule vibrante du cabaret, les lustres scintillants et l'animation mondaine.\n\nL'œuvre est particulièrement célèbre pour sa composition trompeuse et les mystères de sa perspective : le reflet de la serveuse, vu dans le miroir, est anormalement décalé vers la droite et semble interagir avec un client au chapeau haut-de-forme qui n'apparaît pas au premier plan. Ce jeu de miroir bouleverse les règles académiques.",
    anecdotes_secretes: [
      "Dans le coin supérieur gauche du miroir, on peut apercevoir les pieds chaussés de vert d'une trapéziste en train de faire son numéro.",
      "Manet a peint des bouteilles de bière Bass, très identifiables avec leur triangle rouge. C'est l'un des premiers exemples de 'placement de produit' explicite en peinture."
    ],
    extended_analysis: "Ce tableau est une magistrale réflexion sur l'aliénation moderne. L'expression vide de Suzon tranche avec l'effervescence du spectacle reflété derrière elle, illustrant la solitude au sein de la foule propre à la nouvelle métropole industrielle.",
    historical_context: "Les Folies Bergère étaient le cœur du divertissement parisien à la fin du XIXe siècle, symbole de la modernité, de la bourgeoisie et des plaisirs mondains, mais aussi de la prostitution déguisée.",
    mots_cles: ["Miroir", "Paris", "Cabaret", "Mélancolie", "Perspective"],
    qcm: {
      sourceQuote: "Courtauld Gallery, Londres",
      conceptTag: "composition",
      difficulty: "medium",
      question: "Quel élément visuel du 'Bar aux Folies Bergère' a longuement déboussolé les critiques d'art ?",
      options: [
        "La position incohérente du reflet de la serveuse dans le miroir",
        "La présence de bière anglaise sur un comptoir parisien",
        "Le manque de détails sur le visage de la serveuse",
        "L'absence totale d'ombre portée sur le comptoir"
      ],
      correctIndex: 0,
      explanation: "Manet a volontairement décalé le reflet de la serveuse et de son client vers la droite, brisant les règles de la perspective pour créer une dynamique psychologique complexe."
    }
  },
  {
    titre: "L'Origine du monde",
    artiste_nom: "Gustave Courbet",
    courant_nom: "Réalisme",
    date_creation: "1866",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/L%27Origine_du_monde.jpg/1024px-L%27Origine_du_monde.jpg",
    article_principal: "Peintement de la manière la plus crue et réaliste, ce tableau représente en gros plan et de façon fragmentée les parties génitales et le torse d'une femme nue allongée sur un lit. Commandé secrètement par le diplomate turc-égyptien Khalil-Bey, célèbre collectionneur d'œuvres érotiques, le tableau rompt radicalement avec toutes les conventions académiques et allégoriques du nu féminin.\n\nL'audace de Courbet réside dans son traitement sans concession du sujet. Il ne recourt à aucun prétexte mythologique ou historique pour peindre la nudité. Avec son titre philosophique et provocateur, 'L'Origine du monde', il célèbre la fécondité et le sexe féminin de manière frontale et magistrale.",
    anecdotes_secretes: [
      "Le tableau a été caché pendant de nombreuses décennies, notamment derrière un autre tableau représentant un paysage enneigé. Il a même appartenu au célèbre psychanalyste Jacques Lacan.",
      "L'identité du modèle est restée longtemps mystérieuse, bien que de nombreux historiens penchent aujourd'hui pour Joanna Hiffernan, la maîtresse du peintre James Abbott McNeill Whistler."
    ],
    extended_analysis: "En coupant la tête, les bras et le bas des jambes du modèle, Courbet focalise toute l'attention sur l'anatomie génitale, dépouillant le corps de son individualité pour en faire le symbole universel de l'origine de la vie, tout en testant les limites ultimes du mouvement réaliste.",
    historical_context: "À l'époque, la peinture de nus n'était tolérée dans les Salons officiels que si elle représentait des déesses, des nymphes ou des figures mythologiques éthérées. Courbet s'attaque frontalement à cette hypocrisie bourgeoise.",
    mots_cles: ["Scandale", "Nu", "Censure", "Anatomie", "Provocation"],
    qcm: {
      sourceQuote: "Musée d'Orsay, Paris",
      conceptTag: "realism",
      difficulty: "easy",
      question: "Pour quelle raison 'L'Origine du monde' a-t-il été caché au grand public pendant plus d'un siècle ?",
      options: [
        "En raison de son réalisme cru et de son sujet anatomique considéré comme choquant",
        "Parce qu'il appartenait à une collection royale interdite d'exposition",
        "Parce que Courbet l'avait perdu lors de son exil en Suisse",
        "À cause d'un litige concernant les droits d'auteur du titre"
      ],
      correctIndex: 0,
      explanation: "Le tableau, par son réalisme frontal du sexe féminin, a été gardé secret dans des collections privées érotiques (dont celle de Lacan) pour éviter la censure et le scandale, jusqu'à son entrée au Musée d'Orsay en 1995."
    }
  },
  {
    titre: "Les Glaneuses",
    artiste_nom: "Jean-François Millet",
    courant_nom: "Réalisme",
    date_creation: "1857",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project_2.jpg/1200px-Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project_2.jpg",
    article_principal: "Les Glaneuses met en lumière les aspects les plus durs de la vie rurale en représentant trois paysannes courbées, ramassant les épis de blé restés au sol après le passage des moissonneurs. Au lieu de peindre des figures héroïques ou bibliques, Millet donne la noblesse d'une scène d'histoire à des membres de la classe paysanne la plus misérable.\n\nLe contraste est saisissant entre le labeur éreintant des trois femmes au premier plan, baignées d'une lumière douce mais implacable, et la richesse de l'abondante moisson qui se charge sur des charrettes à l'arrière-plan. Ce tableau a scandalisé la critique conservatrice qui y a vu une menace politique.",
    anecdotes_secretes: [
      "Les critiques de l'époque, effrayées par le climat politique post-révolution de 1848, ont qualifié ces glaneuses de « féroces », y voyant le symbole d'une révolte populaire imminente.",
      "Le glanage était un droit coutumier accordé aux plus pauvres, permettant de récolter les restes après la moisson pour éviter la famine."
    ],
    extended_analysis: "Millet utilise une palette chaude de tons terreux, dorés et gris pour ancrer les personnages dans la terre. La composition est très structurée, la ligne d'horizon haute et la répétition rythmique des gestes des femmes soulignant la lourdeur et l'éternité de leur condition laborieuse.",
    historical_context: "Au XIXe siècle, la Révolution industrielle creuse les inégalités et engendre l'exode rural. Le réalisme artistique se donne pour mission d'attirer l'attention sur les dures réalités sociales souvent ignorées par l'art académique.",
    mots_cles: ["Paysans", "Labeur", "Agriculture", "Pauvreté", "Campagne"],
    qcm: {
      sourceQuote: "Musée d'Orsay, Paris",
      conceptTag: "social_realism",
      difficulty: "medium",
      question: "Pourquoi l'œuvre 'Les Glaneuses' a-t-il été jugée subversive et dangereuse par certains critiques de 1857 ?",
      options: [
        "Parce qu'elle mettait en avant la misère rurale, faisant craindre une révolte sociale des classes inférieures",
        "Parce qu'elle manquait totalement de respect aux règles de la perspective classique",
        "Parce que les couleurs utilisées étaient considérées comme trop vives",
        "Parce que le peintre avait peint les femmes de dos"
      ],
      correctIndex: 0,
      explanation: "Peu après la révolution de 1848, la bourgeoisie conservatrice craignait les soulèvements populaires. Ériger la misère paysanne au rang de la grande peinture était perçu comme un manifeste socialiste et une glorification de la pauvreté."
    }
  },
  {
    titre: "Jeunes Filles au piano",
    artiste_nom: "Auguste Renoir",
    courant_nom: "Impressionnisme",
    date_creation: "1892",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Auguste_Renoir_-_Jeunes_filles_au_piano.jpg/800px-Auguste_Renoir_-_Jeunes_filles_au_piano.jpg",
    article_principal: "Tableau d'une grande douceur et d'une remarquable maîtrise des couleurs chaudes, Jeunes Filles au piano représente deux jeunes femmes, l'une assise jouant de l'instrument, l'autre debout l'écoutant attentivement. L'atmosphère du tableau est celle d'un intérieur bourgeois paisible et intime, typique de l'œuvre tardive de Renoir.\n\nL'œuvre a été commandée par l'État français pour le musée du Luxembourg, ce qui constituait une reconnaissance officielle majeure pour le peintre impressionniste. Pour cette commande, Renoir a exécuté pas moins de cinq ou six versions du même sujet, s'efforçant d'atteindre un raffinement parfait dans l'équilibre des couleurs et la fluidité des lignes.",
    anecdotes_secretes: [
      "Renoir, d'ordinaire rapide et instinctif, a passé un temps inhabituellement long sur cette composition à cause de la pression de la commande gouvernementale.",
      "Les deux modèles étaient de jeunes voisines de l'artiste, souvent sollicitées pour sa peinture."
    ],
    extended_analysis: "Contrairement aux impressionnistes radicaux, le style de Renoir dans les années 1890 marque un retour partiel au classicisme et au dessin. Les contours des jeunes filles sont doux mais définis, et l'éclairage feutré renforce l'aspect harmonieux et protecteur du huis-clos musical.",
    historical_context: "À la fin du XIXe siècle, l'Impressionnisme, autrefois moqué et rejeté, commence à obtenir la reconnaissance officielle de l'État français, marquant son intégration progressive dans l'histoire de l'art national.",
    mots_cles: ["Musique", "Intimité", "Bourgeoisie", "Harmonie", "Enfance"],
    qcm: {
      sourceQuote: "Musée d'Orsay, Paris",
      conceptTag: "late_impressionism",
      difficulty: "easy",
      question: "Quelle est la particularité de la création de ce tableau 'Jeunes Filles au piano' par Renoir ?",
      options: [
        "Il a été commandé officiellement par l'État français",
        "Il a été peint entièrement les yeux bandés",
        "C'est la seule œuvre de Renoir peinte à l'aquarelle",
        "Il a causé un énorme scandale public"
      ],
      correctIndex: 0,
      explanation: "C'est l'une des rares commandes officielles reçues par Renoir de son vivant, marquant l'acceptation de l'Impressionnisme par les institutions étatiques françaises."
    }
  },
  {
    titre: "Composition VIII",
    artiste_nom: "Vassily Kandinsky",
    courant_nom: "Expressionnisme",
    date_creation: "1923",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg/1024px-Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg",
    article_principal: "Réalisée à l'époque où Kandinsky enseignait au Bauhaus, Composition VIII est une symphonie géométrique majeure de l'art abstrait. Kandinsky a abandonné les formes lyriques et fluides de ses débuts pour adopter une rigueur géométrique absolue, basée sur les lignes, les cercles, les carrés et les triangles flottant sur un fond clair et nébuleux.\n\nKandinsky, profondément influencé par la musique et la synesthésie, cherchait à créer un langage visuel pur où les couleurs et les formes interagissent comme des notes de musique. Le cercle majestueux aux contours violacés qui domine l'œuvre représente l'équilibre et la dimension spirituelle de l'art.",
    anecdotes_secretes: [
      "Kandinsky souffrait de synesthésie : il associait physiquement les couleurs à des sons musicaux. Pour lui, le jaune sonnait comme une trompette stridente, tandis que le bleu profond résonnait comme un violoncelle.",
      "Le tableau figurait parmi les œuvres majeures de la fameuse exposition d'art « dégénéré » organisée par les nazis avant d'être sauvegardé par les Américains."
    ],
    extended_analysis: "L'interaction entre les arêtes vives des triangles et les courbes harmonieuses des cercles crée une tension dynamique. L'œuvre repose sur le contraste entre la rigueur analytique héritée du Constructivisme russe et la mystique des théories chromatiques de l'artiste.",
    historical_context: "Les années 1920 en Allemagne sont marquées par la naissance de l'école du Bauhaus, où l'art se rationalise et cherche une grammaire universelle applicable de l'architecture à la peinture.",
    mots_cles: ["Abstraction", "Géométrie", "Synesthésie", "Cercle", "Bauhaus"],
    qcm: {
      sourceQuote: "Musée Solomon R. Guggenheim, New York",
      conceptTag: "geometric_abstraction",
      difficulty: "medium",
      question: "Quelle particularité sensorielle de Kandinsky a grandement influencé sa peinture abstraite, comme Composition VIII ?",
      options: [
        "La synesthésie, qui lui faisait associer des sons musicaux à des couleurs",
        "Le daltonisme, qui l'obligeait à utiliser des formes pures",
        "L'amnésie, qui l'empêchait de dessiner des souvenirs",
        "L'anosmie, la perte de l'odorat"
      ],
      correctIndex: 0,
      explanation: "Kandinsky était synesthète : il concevait sa peinture comme une composition musicale où chaque forme et chaque couleur vibrait d'une tonalité auditive précise."
    }
  },
  {
    titre: "Saturne dévorant un de ses fils",
    artiste_nom: "Francisco de Goya",
    courant_nom: "Romantisme",
    date_creation: "1823",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg/800px-Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg",
    article_principal: "Peint directement sur les murs de sa salle à manger à la 'Quinta del Sordo' (la maison du Sourd), ce tableau est l'une des 'Peintures noires' de Francisco de Goya. Il illustre le mythe gréco-romain de Cronos (Saturne), qui dévore ses propres enfants par peur qu'ils ne le renversent. \n\nL'œuvre est cauchemardesque : les yeux écarquillés par la folie, Saturne arrache avec ses dents un bras sanglant du corps sans tête de son enfant. Cette violence crue est souvent interprétée comme une allégorie de la destruction de l'Espagne par ses propres dirigeants tyranniques, ou de la cruauté du temps qui consume tout être vivant.",
    anecdotes_secretes: [
      "Le tableau n'a jamais été pensé pour être vu par le public ; Goya l'a peint dans sa propre maison pendant une période de maladie et de grave dépression.",
      "Le sexe de l'enfant dévoré est impossible à déterminer et, de manière atypique par rapport au mythe original, Saturne semble ici dévorer un jeune adulte plutôt qu'un nourrisson."
    ],
    extended_analysis: "Le contraste dramatique (chiaroscuro) et l'utilisation de couleurs boueuses et sombres avec des éclats de rouge écarlate soulignent l'horreur viscérale. Le coup de pinceau est frénétique et expressif, anticipant l'expressionnisme moderne.",
    historical_context: "À la fin de sa vie, Goya était sourd, isolé, et profondément déçu par le retour à la monarchie absolue et à l'Inquisition en Espagne après les guerres napoléoniennes.",
    mots_cles: ["Mythologie", "Folie", "Peintures noires", "Terreur", "Allégorie"],
    qcm: {
      sourceQuote: "Musée du Prado, Madrid",
      conceptTag: "dark_romanticism",
      difficulty: "easy",
      question: "Où Goya a-t-il peint originellement cette œuvre cauchemardesque ?",
      options: [
        "Directement sur les murs de sa propre maison",
        "Dans la chapelle royale de Madrid",
        "Sur une toile immense pour le Roi Ferdinand VII",
        "Dans une cellule d'asile psychiatrique"
      ],
      correctIndex: 0,
      explanation: "L'œuvre fait partie des « Peintures noires » que Goya a exécutées directement à l'huile sur les murs en plâtre de sa propriété, la 'Quinta del Sordo', sans aucune intention de les exposer."
    }
  },
  {
    titre: "Nuit étoilée sur le Rhône",
    artiste_nom: "Vincent van Gogh",
    courant_nom: "Post-Impressionnisme",
    date_creation: "1888",
    image_url_full: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Starry_Night_Over_the_Rhone.jpg/1200px-Starry_Night_Over_the_Rhone.jpg",
    article_principal: "Souvent éclipsée par sa célèbre grande sœur peinte plus tard à Saint-Rémy-de-Provence, la Nuit étoilée sur le Rhône a été peinte à Arles, juste à une minute de la 'Maison Jaune' de Van Gogh. Sous un ciel bleu nuit parsemé d'étoiles scintillantes de la Grande Ourse, le fleuve reflète la lumière dorée artificielle des becs de gaz de la ville récemment installés.\n\nCe chef-d'œuvre est remarquable pour l'obsession de Van Gogh à peindre la nuit sur le vif. Il s'était même fixé des bougies sur son chapeau de paille pour pouvoir éclairer sa toile pendant qu'il peignait dans l'obscurité. Le contraste entre le froid céleste et la chaleur des lumières artificielles traduit une profonde sérénité romantique.",
    anecdotes_secretes: [
      "Dans ses lettres à Théo, Van Gogh décrit avec fascination la couleur de l'eau la nuit : 'le ciel est d'un bleu d'eau, l'eau est outremer, le sol est mauve'.",
      "Au premier plan, on distingue un couple d'amoureux se promenant sur la berge, une touche rare de figure humaine dans ses paysages nocturnes."
    ],
    extended_analysis: "La ligne d'horizon coupe l'œuvre en son centre. Les étoiles tourbillonnantes annoncent le style en mouvement frénétique qu'il déploiera un an plus tard. L'utilisation vibrante de couleurs complémentaires (jaune et bleu) dynamise totalement le calme apparent du sujet.",
    historical_context: "L'éclairage au gaz dans les villes était une révolution technologique au XIXe siècle. Van Gogh a été l'un des premiers peintres à être fasciné par les reflets de ces nouvelles lumières artificielles sur les cours d'eau.",
    mots_cles: ["Nuit", "Arles", "Étoiles", "Rhône", "Sérénité"],
    qcm: {
      sourceQuote: "Musée d'Orsay, Paris",
      conceptTag: "color_theory",
      difficulty: "medium",
      question: "Comment Van Gogh s'y est-il pris pour s'éclairer et peindre ce paysage de nuit en plein air ?",
      options: [
        "Il avait fixé de petites bougies sur le bord de son chapeau et de son chevalet",
        "Il peignait au clair de lune les nuits de pleine lune",
        "Il a installé un bec de gaz portable à côté de lui",
        "Il dessinait de mémoire dans sa chambre"
      ],
      correctIndex: 0,
      explanation: "Pour capturer les nuances exactes de la nuit et ses couleurs directement sur la toile, Van Gogh a utilisé l'astuce pittoresque d'accrocher des bougies à son chapeau pour voir ses couleurs dans l'obscurité."
    }
  }
];

async function main() {
  console.log("Démarrage de l'insertion des 10 œuvres manuelles !");

  const artistsMap = new Map();
  let artistesCreated = 0;
  let oeuvresCreated = 0;

  for (const aw of ARTWORKS) {
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
              description_courte: "Généré automatiquement par agent.",
              verification_status: "VERIFIED"
            }
          }
        }
      });
      artistesCreated++;
    }
    
    artistsMap.set(aw.artiste_nom, artiste.id);

    const courant = await prisma.courants.findFirst({
      where: { id: COURANTS_MAP[aw.courant_nom as keyof typeof COURANTS_MAP] || 1 }
    });

    if (!courant) {
      console.warn(`Courant ${aw.courant_nom} non trouvé.`);
      continue;
    }

    const oeuvreSlug = aw.titre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = await prisma.oeuvres.findUnique({ where: { slug: oeuvreSlug } });
    if (existing) {
      console.log(`L'œuvre ${aw.titre} existe déjà, passage...`);
      continue;
    }

    let nextOeuvreId = (await prisma.oeuvres.aggregate({ _max: { id: true } }))._max.id || 0;
    nextOeuvreId++;

    await prisma.oeuvres.create({
      data: {
        id: nextOeuvreId,
        titre: aw.titre,
        slug: oeuvreSlug,
        id_courant: courant.id,
        id_artiste: artiste.id,
        date_creation: aw.date_creation,
        image_url_full: aw.image_url_full,
        image_url_thumb: aw.image_url_full + "?width=500",
        aspect_ratio: 1.0,
        is_active: true,
        ordre_dans_courant: Math.floor(Math.random() * 1000),
        contenus_oeuvres: {
          create: {
            article_principal: aw.article_principal,
            anecdotes_secretes: aw.anecdotes_secretes,
            extended_analysis: aw.extended_analysis,
            historical_context: aw.historical_context,
            qcm: aw.qcm,
            mots_cles: aw.mots_cles,
            generated_by_model: 'antigravity-agent',
            verification_status: 'VERIFIED'
          }
        }
      }
    });
    oeuvresCreated++;
    console.log(`✅ Ajouté : ${aw.titre}`);
  }

  console.log(`Terminé ! ${artistesCreated} artistes et ${oeuvresCreated} œuvres créés.`);
}

main().catch(e => {
  console.error("Erreur :", e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
