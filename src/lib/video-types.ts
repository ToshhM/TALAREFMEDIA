import type { UniverseSlug } from "./univers";

export type VideoSourceType = "youtube" | "vimeo" | "direct" | "upload";

export type VideoAspectRatio = "16:9" | "9:16" | "4:5";

export type VideoItem = {
  id: string;
  slug?: string;
  titre: string;
  description?: string;
  legende?: string;
  sourceType: VideoSourceType;
  urlOuId: string; // ID YouTube, ID Vimeo ou URL complète (MP4 hébergé sur Supabase ou externe)
  miniature?: string; // URL de la miniature personnalisée (optionnelle)
  duree?: string | number; // "03:45" ou secondes
  univers: UniverseSlug;
  format?: string; // ex: "Pop Quiz", "Interview", "Décryptage", "Shorts", "Reportage", "Série Club"
  aspectRatio?: VideoAspectRatio;
  misEnLigneLe: string;
  aLaUneAccueil?: boolean; // Pour la section Konbini "Nos meilleures vidéos !"
  ordre?: number;
  // Interconnexion avec les articles
  articleSlug?: string;
  articleTitre?: string;
  articleUnivers?: UniverseSlug;
};

export type VideoFiltres = {
  univers?: UniverseSlug | "tous";
  format?: string;
  recherche?: string;
  aLaUne?: boolean;
};
