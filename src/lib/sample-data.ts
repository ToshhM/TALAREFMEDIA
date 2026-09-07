import type { Article, Personne } from "./types";

/**
 * Données de démonstration — Spécification v3.0.
 *
 * Elles servent tant que Supabase n'a pas été initialisé ou en repli local.
 * Respecte scrupuleusement les 6 univers, les 2 collections (Encre, Arcade sous Pop)
 * et les 14 blocs d'écriture fermés (avec au moins un bloc 'laRef' par article).
 */

const toshiro: Personne = {
  slug: "toshiro",
  nom: "Toshiro Mpika",
  bio: "Fondateur de Talaref. Photographe et réalisateur.",
};

const redaction: Personne = {
  slug: "la-redaction",
  nom: "La rédaction",
};

function img(alt: string, credit: string) {
  return {
    url: "",
    alt,
    credit,
  };
}

export const ARTICLES_DEMO: Article[] = [
  {
    slug: "lia-peut-elle-remplacer-un-monteur",
    titre: "L'IA peut-elle remplacer un monteur professionnel ?",
    heroTitle: "L'IA EST DÉJÀ EN TRAIN DE CHANGER LE MONTAGE",
    chapo:
      "Génération de plans B, dérushage sémantique, synchronisation automatique : les outils d'intelligence artificielle transforment la post-production. Pourtant, le sens du rythme et de la coupe humaine reste irremplaçable.",
    imageDeUne: img("Interface de montage vidéo avec analyse IA", "Talaref Studio"),
    univers: "nexus",
    refNumber: 17,
    tags: [
      { slug: "ia", nom: "IA" },
      { slug: "post-production", nom: "Post-production" },
    ],
    auteurs: [toshiro],
    video: {
      youtubeId: "dQw4w9WgXcQ",
      titre: "L'IA en régie de montage — Test complet",
      duree: 645,
      misEnLigneLe: "2026-08-25",
    },
    corps: [
      {
        _key: "nx1",
        _type: "paragraphe",
        texte:
          "Le montage a toujours été une affaire de soustraction. Sur cinquante heures de rushs, un monteur n'en garde qu'une. L'arrivée des modèles multimodaux accélère brutalement cette première phase de sélection.",
      },
      {
        _key: "nx2",
        _type: "laRef",
        titre: "L'effet Koulechov",
        texte:
          "En 1921, le cinéaste Lev Koulechov démontre que la juxtaposition de deux plans sans lien logique crée une signification neuve dans l'esprit du spectateur. C'est précisément cette intuition poétique que l'algorithme peine encore à reproduire.",
      },
      {
        _key: "nx3",
        _type: "intertitre",
        niveau: 2,
        texte: "Le tri sémantique contre le geste créatif",
      },
      {
        _key: "nx4",
        _type: "paragraphe",
        texte:
          "Classifier les plans selon le regard, la clarté de la voix ou la netteté est désormais l'affaire de quelques secondes. Mais décider de couper sur un silence gêné reste un choix d'auteur.",
      },
      {
        _key: "nx5",
        _type: "chiffreCle",
        valeur: "72 %",
        libelle: "du temps de dérushage économisé",
        source: "Étude interne Talaref Studio sur 12 productions",
      },
      { _key: "nx6", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-25",
    tempsDeLecture: 5,
  },
  {
    slug: "silent-hill-2-remake-le-brouillard-a-un-cout",
    titre: "Silent Hill 2 Remake : le brouillard a un coût",
    heroTitle: "SILENT HILL 2 : LA PEUR DERRIÈRE L'ÉPAULE",
    chapo:
      "Bloober Team reprend un monument du survival horror et déplace la caméra derrière l'épaule. Ce choix technique change la peur elle-même — et il fallait recalculer tout l'éclairage pour que le brouillard reste un personnage.",
    imageDeUne: img("Rue embrumée de Silent Hill", "Konami"),
    univers: "pop",
    collection: "arcade",
    refNumber: 23,
    tags: [
      { slug: "silent-hill", nom: "Silent Hill" },
      { slug: "jeux-video", nom: "Jeux vidéo" },
    ],
    auteurs: [toshiro],
    corps: [
      {
        _key: "b1",
        _type: "paragraphe",
        texte:
          "Le brouillard de Silent Hill n'a jamais été une intention artistique au départ. En 1999, la première PlayStation ne pouvait pas afficher la ville entière : le brouillard masquait ce que la console ne calculait pas. Vingt-sept ans plus tard, le matériel n'a plus cette limite.",
      },
      {
        _key: "b2",
        _type: "laRef",
        titre: "La distance d'affichage",
        texte:
          "En 3D temps réel, le clipping désignait l'apparition soudaine d'objets non encore calculés. Pour l'éviter, Team Silent a imaginé une brume épaisse. La contrainte matérielle est devenue une grammaire esthétique culte.",
      },
      {
        _key: "b3",
        _type: "intertitre",
        niveau: 2,
        texte: "La caméra change la peur",
      },
      {
        _key: "b4",
        _type: "paragraphe",
        texte:
          "Passer d'une caméra fixe à une caméra à l'épaule ne modifie pas seulement le confort de jeu : cela supprime le hors-champ imposé. L'original décidait de ce que vous ne pouviez pas voir.",
      },
      {
        _key: "b5",
        _type: "chiffreCle",
        valeur: "8 h 40",
        libelle: "durée moyenne d'une première partie",
        source: "Relevé interne sur trois sessions complètes",
      },
      { _key: "b6", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-20",
    tempsDeLecture: 6,
  },
  {
    slug: "one-piece-1105-le-chapitre-qui-cloture-egghead",
    titre: "One Piece 1105 : le chapitre qui clôture Egghead",
    chapo:
      "Eiichiro Oda referme l'arc le plus dense de la série depuis Marineford. Retour sur la mécanique de révélation qu'il installe depuis quarante chapitres, et sur ce qu'elle annonce pour la traversée finale vers Erbaf.",
    imageDeUne: img("Planche originale de manga", "Shueisha"),
    univers: "pop",
    collection: "encre",
    refNumber: 1,
    tags: [
      { slug: "one-piece", nom: "One Piece" },
      { slug: "manga", nom: "Manga" },
    ],
    auteurs: [redaction],
    corps: [
      {
        _key: "c1",
        _type: "paragraphe",
        texte:
          "La structure d'Egghead déroge à la règle d'Oda : ici, l'équipage n'arrive pas pour libérer une île d'un tyran local, mais pour fuir un piège qui se referme. Ce renversement du schéma classique crée une tension inédite.",
      },
      {
        _key: "c2",
        _type: "laRef",
        titre: "Le Buster Call",
        texte:
          "Introduit à Enies Lobby, le Buster Call est l'ordre militaire d'éradication totale d'une île par la Marine. Sa réapparition à Egghead crée un miroir dramatique direct avec la destruction d'Ohara vingt ans plus tôt.",
      },
      {
        _key: "c3",
        _type: "intertitre",
        niveau: 2,
        texte: "Le Siècle Oublié au grand jour",
      },
      {
        _key: "c4",
        _type: "paragraphe",
        texte:
          "La diffusion du message du Dr Vegapunk marque un tournant dans la narration : pour la première fois, le monde entier prend connaissance des vérités que le Gouvernement Mondial cachait depuis huit siècles.",
      },
      { _key: "c5", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-22",
    tempsDeLecture: 4,
  },
  {
    slug: "mercato-2026-la-geometrie-du-milieu-de-terrain",
    titre: "Mercato 2026 : la nouvelle géométrie du milieu moderne",
    chapo:
      "Le profil du numéro 6 sentinelle s'efface au profit de milieux polyvalents capables de presser haut tout en distribuant sous contrainte. Décryptage tactique des mouvements majeurs de l'été.",
    imageDeUne: img("Terrain de football vu du ciel", "Talaref Media"),
    univers: "arena",
    refNumber: 14,
    tags: [
      { slug: "football", nom: "Football" },
      { slug: "tactique", nom: "Tactique" },
    ],
    auteurs: [redaction],
    corps: [
      {
        _key: "ar1",
        _type: "paragraphe",
        texte:
          "Les entraîneurs contemporains ne cherchent plus un récupérateur statique devant la défense. L'exigence tactique moderne impose des joueurs capables de casser les lignes par la course comme par la passe.",
      },
      {
        _key: "ar2",
        _type: "laRef",
        titre: "Le double pivot asymétrique",
        texte:
          "Popularisé par le football total néerlandais, le double pivot asymétrique libère un des deux milieux axiaux pour créer le surnombre offensif tout en conservant une couverture défensive immédiate.",
      },
      {
        _key: "ar3",
        _type: "chiffreCle",
        valeur: "11,8 km",
        libelle: "distance moyenne parcourue par match",
        source: "Données UEFA 2025/2026",
      },
      { _key: "ar4", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-23",
    tempsDeLecture: 4,
  },
  {
    slug: "le-sample-qui-a-construit-le-son-dhoudi",
    titre: "Le sample qui a construit le son de Houdi",
    chapo:
      "Entre drill mélodique et synthés planants, Houdi s'est imposé avec une identité sonore immédiatement identifiable. Analyse du sample méconnu qui a forgé son esthétique dès ses premiers projets.",
    imageDeUne: img("Table de mixage en studio son", "Talaref Studio"),
    univers: "bpm",
    refNumber: 5,
    tags: [
      { slug: "rap-francais", nom: "Rap français" },
      { slug: "production", nom: "Production" },
    ],
    auteurs: [toshiro],
    corps: [
      {
        _key: "bp1",
        _type: "paragraphe",
        texte:
          "Le rap francophone vit une période de synthèse. Les boucles de synthétiseurs vintage des années 80 se marient désormais aux rythmiques 808 ultra-compressées venues de Chicago et Londres.",
      },
      {
        _key: "bp2",
        _type: "laRef",
        titre: "Le pitch-shifting à −4 demi-tons",
        texte:
          "Ralentir et transposer une mélodie vers les graves modifie son grain et confère une texture nostalgique instantanée, une technique popularisée à l'origine par les producteurs de Houston (Chopped and Screwed).",
      },
      { _key: "bp3", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-16",
    tempsDeLecture: 3,
  },
  {
    slug: "la-bataille-invisible-des-cables-sous-marins",
    titre: "La bataille invisible des câbles sous-marins",
    chapo:
      "Plus de 98 % des télécommunications mondiales ne transitent pas par satellite, mais au fond des océans. Ces artères de fibre optique sont au cœur des tensions géopolitiques contemporaines.",
    imageDeUne: img("Carte des fonds océaniques et réseaux", "Talaref Data"),
    univers: "agora",
    refNumber: 12,
    tags: [
      { slug: "geopolitique", nom: "Géopolitique" },
      { slug: "reseau", nom: "Réseau" },
    ],
    auteurs: [redaction],
    corps: [
      {
        _key: "ag1",
        _type: "paragraphe",
        texte:
          "On imagine volontiers Internet comme un nuage impalpable. En réalité, le réseau mondial est d'une matérialité absolue : un entrelacs de câbles enrobés d'acier posés sur la vase abyssale.",
      },
      {
        _key: "ag2",
        _type: "laRef",
        titre: "Le détroit de Malacca",
        texte:
          "Point névralgique du commerce maritime, le détroit de Malacca concentre également une densité critique de liaisons sous-marines reliant l'Asie de l'Est à l'Europe. Un goulot d'étranglement stratégique majeur.",
      },
      { _key: "ag3", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-15",
    tempsDeLecture: 5,
  },
  {
    slug: "pourquoi-le-16mm-revient-dans-les-clips",
    titre: "Pourquoi le 16mm revient dans les clips en 2026",
    chapo:
      "Face à la perfection clinique des capteurs 8K numériques, réalisateurs et chefs opérateurs se tournent à nouveau vers la pellicule 16mm pour retrouver grain, imperfections et couleurs organiques.",
    imageDeUne: img("Caméra argentique Arriflex 16mm", "Talaref Studio"),
    univers: "objectif",
    refNumber: 8,
    tags: [
      { slug: "argentique", nom: "Argentique" },
      { slug: "realisation", nom: "Réalisation" },
    ],
    auteurs: [toshiro],
    corps: [
      {
        _key: "ob1",
        _type: "paragraphe",
        texte:
          "Le grain argentique n'est pas un filtre que l'on applique en étalonnage : c'est la structure même de l'image. Chaque cristal d'halogénure d'argent réagit à la lumière de façon stochastique.",
      },
      {
        _key: "ob2",
        _type: "laRef",
        titre: "La pellicule Kodak Vision3 500T",
        texte:
          "Conçue pour les éclairages tungstène intérieurs, cette émulsion est devenue la référence des clips musicaux pour sa gestion des hautes lumières et son halo chaud caractéristique sur les sources directes.",
      },
      { _key: "ob3", _type: "aLireAussi" },
    ],
    publieLe: "2026-08-10",
    tempsDeLecture: 4,
  },
];

export const PERSONNES_DEMO: Personne[] = [toshiro, redaction];
