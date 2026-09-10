/** Réglages du site, lus une seule fois et partagés partout. */

export const SITE = {
  nom: "Talaref",
  nomComplet: "Talaref Média",
  baseline: "Une marque. Six univers.",
  description:
    "Jeux vidéo, manga, pop culture, politique, musique et image. Six terrains, un seul média — des articles documentés, et les vidéos qui vont avec.",
  /** Sans slash final. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  langue: "fr-FR",
  /** Obligation légale : un média en ligne nomme son directeur de publication. */
  directeurDePublication: "Toshiro Mpika",
  contact: "contact@talaref.co",
} as const;

export function urlAbsolue(chemin: string): string {
  return `${SITE.url}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}

const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formaterDate(iso: string): string {
  return FORMAT_DATE.format(new Date(iso));
}

/** « 8 min de lecture ». Jamais saisi à la main : 230 mots/minute. */
export function formaterDuree(minutes: number): string {
  return `${minutes} min de lecture`;
}

/** Durée ISO 8601 pour le VideoObject de Schema.org : PT14M2S. */
export function dureeISO(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `PT${m}M${s}S`;
}

/**
 * Calcule le style CSS `object-position` à partir du cadrage
 * ("top", "center", "bottom", ou un pourcentage "0%" à "100%").
 */
export function formaterObjectPosition(cadrage?: string): string {
  if (!cadrage) return "center center";
  if (cadrage === "top") return "center 0%";
  if (cadrage === "bottom") return "center 100%";
  if (cadrage === "center") return "center 50%";
  const match = cadrage.match(/^(\d{1,3})%?$/);
  if (match) {
    return `center ${match[1]}%`;
  }
  return cadrage;
}

/**
 * Calcule le style CSS `transform` pour le zoom / redimensionnement et décalage adaptatif.
 */
export function formaterImageTransform(zoom?: number, cadrage?: string, estAdaptatif?: boolean): string | undefined {
  const z = typeof zoom === "number" && !isNaN(zoom) ? zoom : 1;
  const parts: string[] = [];
  if (z !== 1) {
    parts.push(`scale(${z})`);
  }
  if (estAdaptatif && cadrage) {
    const match = cadrage.match(/^(\d{1,3})%?$/);
    const pct = match ? parseInt(match[1], 10) : (cadrage === "top" ? 0 : cadrage === "bottom" ? 100 : 50);
    // Décalage vertical doux : de -20% à +20%
    const shift = (pct - 50) * 0.4;
    if (Math.abs(shift) > 0.5) {
      parts.push(`translateY(${shift.toFixed(1)}%)`);
    }
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}
