import type { CollectionSlug, UniverseSlug } from "./univers";

/**
 * Le jeu de blocs FERMÉ — architecture de rédaction intacte.
 *
 * Quatorze blocs, pas un de plus. Le rédacteur ne peut pas mettre en
 * forme, il ne peut que choisir un bloc : la cohérence n'est plus une
 * consigne, c'est une contrainte de l'outil. Toute demande d'un quinzième
 * bloc passe par la rédaction en chef.
 */
export type TypeBloc =
  | "chapo"
  | "paragraphe"
  | "intertitre"
  | "moduleVideo"
  | "laRef"
  | "image"
  | "galerie"
  | "chiffreCle"
  | "citation"
  | "liste"
  | "chronologie"
  | "ficheTechnique"
  | "aLireAussi"
  | "separateur";

export type Image = {
  url: string;
  alt: string;
  /** Obligatoire : crédits photo systématiques (§09, obligation légale). */
  credit: string;
  legende?: string;
  largeur?: number;
  hauteur?: number;
  disposition?: "standard" | "large" | "portrait" | "carre";
};

export type Bloc =
  | { _key: string; _type: "chapo"; texte: string }
  | { _key: string; _type: "paragraphe"; texte: string }
  | { _key: string; _type: "intertitre"; niveau: 2 | 3; texte: string }
  | { _key: string; _type: "moduleVideo"; video: Video }
  | { _key: string; _type: "laRef"; titre: string; texte: string }
  | { _key: string; _type: "image"; image: Image; disposition?: "standard" | "large" | "portrait" | "carre" }
  | { _key: string; _type: "galerie"; images: Image[]; layout?: "carrousel" | "grille-2" | "grille-3" | "mosaique" }
  | {
      _key: string;
      _type: "chiffreCle";
      valeur: string;
      libelle: string;
      source: string;
    }
  | { _key: string; _type: "citation"; texte: string; auteur: string }
  | { _key: string; _type: "liste"; entrees: string[] }
  | {
      _key: string;
      _type: "chronologie";
      entrees: { date: string; texte: string }[];
    }
  | {
      _key: string;
      _type: "ficheTechnique";
      lignes: { libelle: string; valeur: string }[];
      verdict?: string;
    }
  | { _key: string; _type: "aLireAussi" }
  | { _key: string; _type: "separateur" };

export type Video = {
  /** Identifiant YouTube. La vidéo n'a pas de page à elle (§00). */
  youtubeId: string;
  titre: string;
  /** Durée en secondes, pour le VideoObject de Schema.org. */
  duree: number;
  misEnLigneLe: string;
};

export type Personne = {
  slug: string;
  nom: string;
  bio?: string;
  photo?: Image;
  liens?: { libelle: string; url: string }[];
};

export type Tag = {
  slug: string;
  nom: string;
};

export type ArticleStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "archived";

export type Article = {
  id?: string;
  slug: string;
  /** Numéro REF unique et immuable par univers (§07). */
  refNumber?: number;
  /** 30 à 65 signes — au-delà, tronqué dans Google. */
  titre: string;
  /** Titre alternatif calibré pour le Hero en une. */
  heroTitle?: string;
  /** 200 à 320 signes — résumé, méta-description et accroche sur la home. */
  chapo: string;
  imageDeUne: Image;
  /** Univers propriétaire (obligatoire). */
  univers: UniverseSlug;
  /** Univers / Rubriques secondaires pour multi-diffusion transversale (ex: Agora + Nexus). */
  universSecondaires?: UniverseSlug[];
  /** Collection propriétaire (optionnel, ex: encre ou arcade sous pop). */
  collection?: CollectionSlug;
  /** Ancien champ de rubrique, conservé pour compatibilité ascendante. */
  rubrique?: string;
  /** Format optionnel réservé V2 (test, décryptage, portrait…). */
  format?: string;
  tags: Tag[];
  /** Titre SEO alternatif pour moteurs de recherche (si différent du titre principal). */
  metaTitre?: string;
  /** Description SEO alternative pour moteurs de recherche (si différente du chapô). */
  metaDescription?: string;
  /** Un article non signé n'est pas publiable. */
  auteurs: Personne[];
  video?: Video;
  corps: Bloc[];
  status?: ArticleStatus;
  publieLe: string;
  misAJourLe?: string;
  /** Jamais saisi à la main — 230 mots/minute, recalculé à la sauvegarde. */
  tempsDeLecture: number;
};

/**
 * Mise en avant manuelle d'un article en Hero (Spécification v3.0 §10 & §12)
 */
export type FeaturedSlot = {
  id: string;
  scope: "homepage" | UniverseSlug;
  articleId: string;
  startAt?: string;
  endAt?: string;
  active: boolean;
  customTitle?: string;
  customImage?: string;
};

/**
 * Sujets éditoriaux actifs du bandeau « En ce moment » (§10 & §13)
 */
export type TrendingTopic = {
  id: string;
  label: string;
  href: string;
  active: boolean;
  order: number;
  startAt?: string;
  endAt?: string;
};

export type UserRole = "membre" | "redacteur" | "admin";

export type Commentaire = {
  id: string;
  articleSlug: string;
  userId: string;
  userPseudonyme: string;
  userRole?: UserRole;
  contenu: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email: string;
  pseudonyme: string;
  role: UserRole;
  createdAt: string;
};

