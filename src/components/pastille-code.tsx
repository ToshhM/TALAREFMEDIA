import type { Collection, Univers } from "@/lib/univers";

/**
 * La pastille de code à trois lettres.
 * C'est le repère qui rend une grille de contenus lisible d'un seul regard.
 */
export function PastilleCode({
  univers,
  territoire,
  code,
  titre,
  className = "",
}: {
  univers?: Univers;
  territoire?: Univers | Collection;
  code?: string;
  titre?: string;
  className?: string;
}) {
  const target = territoire ?? univers;
  const affichage = code ?? target?.code ?? "";
  const title = titre ?? (target ? `${target.nom} — ${target.territoire}` : affichage);

  return (
    <span className={`pastille-code ${className}`} title={title}>
      {affichage}
    </span>
  );
}
