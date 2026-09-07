/**
 * Utilitaires de traitement et d'extraction vidéo pour Talaref Média.
 */

/**
 * Extrait l'identifiant YouTube d'une URL complète ou d'un identifiant brut.
 * Exemples supportés :
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - dQw4w9WgXcQ
 */
export function extraireIdYouTube(input: string): string | null {
  if (!input) return null;
  const nettoye = input.trim();

  // Si c'est déjà un identifiant brut YouTube (généralement 11 caractères a-zA-Z0-9_-)
  if (/^[a-zA-Z0-9_-]{11}$/.test(nettoye)) {
    return nettoye;
  }

  // Regex d'extraction d'URL YouTube
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = nettoye.match(regex);
  return match ? match[1] : null;
}

/**
 * Vérifie si une chaîne correspond à un fichier vidéo direct (mp4, webm, etc.)
 */
export function estFichierVideoDirect(url: string): boolean {
  if (!url) return false;
  const nettoye = url.trim().toLowerCase();
  return (
    nettoye.endsWith(".mp4") ||
    nettoye.endsWith(".webm") ||
    nettoye.endsWith(".mov") ||
    nettoye.endsWith(".ogg") ||
    nettoye.includes(".mp4?") ||
    nettoye.includes(".webm?")
  );
}

/**
 * Normalise une source vidéo pour déterminer son type et sa valeur exploitable.
 */
export function parserSourceVideo(source: string): {
  type: "youtube" | "direct" | "inconnu";
  valeur: string;
} {
  const youtubeId = extraireIdYouTube(source);
  if (youtubeId) {
    return { type: "youtube", valeur: youtubeId };
  }

  if (estFichierVideoDirect(source) || source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/")) {
    return { type: "direct", valeur: source.trim() };
  }

  return { type: "inconnu", valeur: source };
}
