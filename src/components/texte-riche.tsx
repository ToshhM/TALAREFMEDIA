import React from "react";

/**
 * Composant de rendu de texte riche :
 * - Préserve fidèlement les sauts de ligne (whitespace-pre-line)
 * - Supporte le Gras : **texte**
 * - Supporte l'Italique : *texte*
 * - Supporte le Souligné : <u>texte</u> ou __texte__
 * - Supporte les Liens : [texte](url)
 */
export function TexteRiche({
  texte,
  className = "",
  inline = false,
}: {
  texte?: string | null;
  className?: string;
  inline?: boolean;
}) {
  if (!texte) return null;

  if (inline) {
    const lignes = texte.split("\n");
    return (
      <span className={className}>
        {lignes.map((ligne, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {formaterLigneInline(ligne)}
          </React.Fragment>
        ))}
      </span>
    );
  }

  // Découpage en paragraphes pour chaque saut de ligne double (\n\n)
  const paragraphes = texte
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphes.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphes.map((p, pIdx) => {
        // Dans chaque paragraphe, on préserve les sauts de ligne simples (\n)
        const lignes = p.split("\n");
        return (
          <p key={pIdx} className="leading-relaxed">
            {lignes.map((ligne, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formaterLigneInline(ligne)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parseur inline sécurisé pour gras, italique, souligné et liens
 */
function formaterLigneInline(texte: string, profondeur = 0): React.ReactNode[] {
  if (!texte) return [];
  if (profondeur > 3) return [texte];

  // Regex pour capturer :
  // 1. Liens : \[([^\]]+)\]\(([^)]+)\)
  // 2. Gras : \*\*([^*]+)\*\*
  // 3. Souligné : <u>([^<]+)<\/u> ou __([^_]+)__
  // 4. Italique : \*([^*]+)\*
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|<u>([^<]+)<\/u>|__([^_]+)__|\*([^*]+)\*)/g;

  const elements: React.ReactNode[] = [];
  let dernierIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texte)) !== null) {
    const index = match.index;

    // Texte avant le match
    if (index > dernierIndex) {
      elements.push(texte.slice(dernierIndex, index));
    }

    const brut = match[0];

    if (brut.startsWith("[") && match[2] && match[3]) {
      // Lien markdown [texte](url)
      const lienTexte = match[2];
      let lienUrl = match[3].trim();

      // Nettoyage des doublons de protocole fréquents
      lienUrl = lienUrl.replace(/^(https?:\/\/)+https?:\/\//i, "https://");

      // Auto-complétion https:// pour les adresses sans protocole (ex: www.site.com, site.fr)
      if (
        !lienUrl.startsWith("http://") &&
        !lienUrl.startsWith("https://") &&
        !lienUrl.startsWith("mailto:") &&
        !lienUrl.startsWith("tel:") &&
        !lienUrl.startsWith("/") &&
        !lienUrl.startsWith("#")
      ) {
        lienUrl = `https://${lienUrl}`;
      }

      const estExterne =
        lienUrl.startsWith("http://") ||
        lienUrl.startsWith("https://") ||
        lienUrl.startsWith("//");

      elements.push(
        <a
          key={`link-${index}-${profondeur}`}
          href={lienUrl}
          target={estExterne ? "_blank" : undefined}
          rel={estExterne ? "noopener noreferrer" : undefined}
          className="group/link inline-flex items-baseline gap-1 font-semibold text-accent underline decoration-accent/80 underline-offset-4 bg-accent/15 hover:bg-accent/30 px-1.5 py-0.5 rounded transition-all duration-150 hover:text-blanc hover:decoration-blanc shadow-sm cursor-pointer"
        >
          <span>{formaterLigneInline(lienTexte, profondeur + 1)}</span>
          {estExterne && (
            <span
              className="text-[0.7em] font-mono opacity-80 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:opacity-100 select-none"
              aria-hidden="true"
            >
              ↗
            </span>
          )}
        </a>
      );
    } else if (brut.startsWith("**") && match[4]) {
      // Gras **texte**
      elements.push(
        <strong key={`bold-${index}-${profondeur}`} className="font-bold text-blanc">
          {formaterLigneInline(match[4], profondeur + 1)}
        </strong>
      );
    } else if ((brut.startsWith("<u>") && match[5]) || (brut.startsWith("__") && match[6])) {
      // Souligné <u>texte</u> ou __texte__
      const texteSouligne = match[5] || match[6];
      elements.push(
        <u
          key={`u-${index}-${profondeur}`}
          className="underline decoration-accent/80 underline-offset-4"
        >
          {formaterLigneInline(texteSouligne, profondeur + 1)}
        </u>
      );
    } else if (brut.startsWith("*") && match[7]) {
      // Italique *texte*
      elements.push(
        <em key={`em-${index}-${profondeur}`} className="italic text-blanc/90">
          {formaterLigneInline(match[7], profondeur + 1)}
        </em>
      );
    } else {
      elements.push(brut);
    }

    dernierIndex = index + brut.length;
  }

  // Reste du texte après le dernier match
  if (dernierIndex < texte.length) {
    elements.push(texte.slice(dernierIndex));
  }

  return elements.length > 0 ? elements : [texte];
}
