import Link from "next/link";
import { LogoTalaref } from "./logo-talaref";
import { UNIVERS } from "@/lib/univers";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

/**
 * En-tête du site. Les six univers sont des liens réels, pas un menu
 * déroulant : chacun porte sa couleur au survol, sans jamais colorer
 * le fond de la barre.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ligne bg-noir/95 backdrop-blur supports-[backdrop-filter]:bg-noir/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <LogoTalaref />

        {/* Navigation Desktop des 6 Univers (Cachée sur mobile, accessible via le menu burger Konbini en bas) */}
        <nav
          aria-label="Les six univers"
          className="hidden md:flex -mx-1 flex-1 items-center gap-1 overflow-x-auto"
        >
          {UNIVERS.map((u) => (
            <Link
              key={u.slug}
              href={`/${u.slug}`}
              data-u={u.slug}
              className="shrink-0 rounded-sm px-2.5 py-1.5 text-sm font-medium text-gris transition-colors hover:bg-teinte hover:text-accent"
            >
              {u.nom}
            </Link>
          ))}
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href="/videos"
            className="rounded-sm px-2.5 py-1.5 text-sm text-gris transition-colors hover:text-blanc"
          >
            Vidéos
          </Link>
          <Link
            href="/recherche"
            aria-label="Rechercher sur Talaref"
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm text-gris transition-colors hover:text-blanc"
          >
            <svg
              width={16}
              height={16}
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Rechercher</span>
          </Link>
          <UserMenu />
        </div>

        {/* Action Mobile : Toggle Jour/Nuit en haut à droite */}
        <div className="flex items-center md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
