/**
 * Mots réservés — piège à éviter, Spécification v3.0 §09.
 *
 * Les URL d'article vivent à /<univers>/<slug>. Sans cette liste,
 * /pop/c désignerait aussi bien la collection qu'un article.
 * Le back-office doit refuser un slug d'article qui emploie l'un de ces mots.
 */
export const SLUGS_RESERVES = [
  "c", // /pop/c/encre — le segment qui introduit une collection (§09)
  "r", // ancien segment de rubrique (redirections 301)
  "tag",
  "videos",
  "auteurs",
  "recherche",
  "preview",
  "studio",
  "admin",
  "rss.xml",
  "sitemap.xml",
  "robots.txt",
] as const;

export function estSlugReserve(slug: string): boolean {
  return (SLUGS_RESERVES as readonly string[]).includes(slug);
}

/**
 * Slugifie un titre : sans accent, sans ponctuation, tirets simples.
 * Le back-office génère le slug depuis le titre avec cette règle, puis
 * le verrouille — un slug ne change plus après publication.
 */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
