/**
 * Les six univers éditoriaux et leurs collections — Spécification v3.0.
 *
 * Principes directeurs :
 * 1. Six univers propriétaires : POP, ARENA, BPM, AGORA, OBJECTIF, NEXUS.
 * 2. Deux collections rattachées à POP : ENCRE (manga & anime) et ARCADE (gaming & e-sport).
 * 3. La règle de couleur (§2.3) : quand une collection s'applique, c'est elle
 *    qui donne sa couleur à la page, pas son univers.
 * 4. Aucune couleur en dur dans un composant — tout passe par les tokens CSS.
 */

export type UniverseSlug =
  | "pop"
  | "arena"
  | "bpm"
  | "agora"
  | "objectif"
  | "nexus";

export type CollectionSlug = "encre" | "arcade";

export type TerritorySlug = UniverseSlug | CollectionSlug;

/** Alias pour compatibilité ascendante avec le code existant */
export type UniversSlug = UniverseSlug;

export type UniverseTheme = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  border?: string;
  surface?: string;
};

export type Univers = {
  slug: UniverseSlug;
  code: string;
  nom: string;
  territoire: string;
  description: string;
  couleur: string;
  contraste: string;
  signature: string;
  theme: UniverseTheme;
  texture: string;
  order: number;
};

export type Collection = {
  slug: CollectionSlug;
  parent: UniverseSlug;
  code: string;
  nom: string;
  territoire: string;
  description: string;
  couleur: string;
  contraste: string;
  signature: string;
  theme: UniverseTheme;
  texture: string;
};

export const UNIVERS: Univers[] = [
  {
    slug: "pop",
    code: "POP",
    nom: "Pop",
    territoire: "Pop culture",
    description:
      "Cinéma, séries, manga & anime, jeux vidéo, mode, comics, animation, célébrités, culture Internet et tendances.",
    couleur: "#FFC53D",
    contraste: "12,5:1",
    signature: "var(--font-bungee)",
    theme: {
      primary: "#FFC53D",
      secondary: "#3D2E0B",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "pop",
    order: 1,
  },
  {
    slug: "arena",
    code: "ARE",
    nom: "Arena",
    territoire: "Sport",
    description:
      "Football, basketball, sports de combat, athlétisme, sports mécaniques, coulisses, économie et culture sportive.",
    couleur: "#A8F53D",
    contraste: "14,8:1",
    signature: "var(--font-archivo)",
    theme: {
      primary: "#A8F53D",
      secondary: "#263D0B",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "arena",
    order: 2,
  },
  {
    slug: "bpm",
    code: "BPM",
    nom: "BPM",
    territoire: "Musique",
    description:
      "Rap, afro, R&B, pop, électro, artistes, albums, concerts, festivals, clips, producteurs et industrie musicale.",
    couleur: "#C05CFF",
    contraste: "5,8:1",
    signature: "var(--font-anton)",
    theme: {
      primary: "#C05CFF",
      secondary: "#2E0B3D",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "bpm",
    order: 3,
  },
  {
    slug: "agora",
    code: "AGO",
    nom: "Agora",
    territoire: "Société & monde",
    description:
      "Société, politique, géopolitique, économie, histoire, environnement, éducation et grands débats contemporains.",
    couleur: "#5B8DFF",
    contraste: "6,3:1",
    signature: "var(--font-instrument-serif)",
    theme: {
      primary: "#5B8DFF",
      secondary: "#0B1D3D",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "agora",
    order: 4,
  },
  {
    slug: "objectif",
    code: "OBJ",
    nom: "Objectif",
    territoire: "Image & création",
    description:
      "Photographie, vidéo, réalisation, direction artistique, matériel, techniques de tournage et workflows créatifs.",
    couleur: "#3DE0FF",
    contraste: "12,5:1",
    signature: "var(--font-dm-mono)",
    theme: {
      primary: "#3DE0FF",
      secondary: "#0B343D",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "objectif",
    order: 5,
  },
  {
    slug: "nexus",
    code: "NEX",
    nom: "Nexus",
    territoire: "Tech & IA",
    description:
      "Intelligence artificielle, innovation, robotique, hardware, software, cybersécurité, spatial et nouveaux usages numériques.",
    couleur: "#39FF88",
    contraste: "14,8:1",
    signature: "var(--font-chakra-petch)",
    theme: {
      primary: "#39FF88",
      secondary: "#0B3D25",
      background: "#080A09",
      foreground: "#F5F5F3",
      muted: "#8A9690",
    },
    texture: "nexus",
    order: 6,
  },
];

export const COLLECTIONS: Collection[] = [
  {
    slug: "encre",
    parent: "pop",
    code: "ENC",
    nom: "Encre",
    territoire: "Manga & anime",
    description:
      "Manga, anime, animation et culture japonaise. Le vermillon est celui du sceau d'encre et de la jaquette de tankôbon.",
    couleur: "#FF4A3D",
    contraste: "5,9:1",
    signature: "var(--font-reggae-one)",
    theme: {
      primary: "#FF4A3D",
      secondary: "#3D0E0B",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "encre",
  },
  {
    slug: "arcade",
    parent: "pop",
    code: "ARC",
    nom: "Arcade",
    territoire: "Gaming & e-sport",
    description:
      "Jeux vidéo, sorties, e-sport, speedrun et culture joueur. Le magenta néon évoque l'arcade retro et le néon CRT.",
    couleur: "#FF3DA5",
    contraste: "6,1:1",
    signature: "var(--font-press-start)",
    theme: {
      primary: "#FF3DA5",
      secondary: "#3D0B24",
      background: "#0B0B0C",
      foreground: "#F5F5F3",
      muted: "#9B9BA6",
    },
    texture: "arcade",
  },
];

export const UNIVERS_SLUGS: UniverseSlug[] = UNIVERS.map((u) => u.slug);
export const COLLECTION_SLUGS: CollectionSlug[] = COLLECTIONS.map((c) => c.slug);

export function getUnivers(slug: string): Univers | undefined {
  return UNIVERS.find((u) => u.slug === slug);
}

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function getCollectionsForUnivers(universSlug: string): Collection[] {
  return COLLECTIONS.filter((c) => c.parent === universSlug);
}

export function isUniversSlug(slug: string): slug is UniverseSlug {
  return UNIVERS_SLUGS.includes(slug as UniverseSlug);
}

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return COLLECTION_SLUGS.includes(slug as CollectionSlug);
}

/**
 * Retourne le territoire (Univers ou Collection) correspondant au slug
 */
export function getTerritoire(
  slug: string,
): { nom: string; code: string; couleur: string; signature: string } | undefined {
  const collection = getCollection(slug);
  if (collection) return collection;
  return getUnivers(slug);
}

/**
 * Formatage de la signature REF (§7).
 * Exemples :
 * - formaterRef("pop", 23) => "REF:POP/023"
 * - formaterRef("nexus", 17) => "REF:NEXUS/017"
 * - formaterRef("pop", undefined, "encre") => "REF:POP/ENCRE"
 */
export function formaterRef(
  universSlug: UniverseSlug,
  refNumber?: number,
  collectionSlug?: CollectionSlug,
): string {
  const u = getUnivers(universSlug);
  const uNom = (u?.nom ?? universSlug).toUpperCase();

  if (collectionSlug) {
    const c = getCollection(collectionSlug);
    const cNom = (c?.nom ?? collectionSlug).toUpperCase();
    if (refNumber !== undefined) {
      const num = String(refNumber).padStart(3, "0");
      return `REF:${uNom}/${cNom}/${num}`;
    }
    return `REF:${uNom}/${cNom}`;
  }

  if (refNumber !== undefined) {
    const num = String(refNumber).padStart(3, "0");
    return `REF:${uNom}/${num}`;
  }

  return `${uNom} REF`;
}
