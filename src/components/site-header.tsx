import Link from "next/link";
import { LogoTalaref } from "./logo-talaref";
import { UNIVERS } from "@/lib/univers";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { IconeInstagram, IconeTikTok } from "./icones-social";

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
        <div className="hidden md:flex shrink-0 items-center gap-1.5">
          {/* Réseaux sociaux Header */}
          <div className="flex items-center gap-0.5 border-r border-ligne pr-2 mr-1">
            {/* Instagram avec menu contextuel */}
            <div className="relative group">
              <a
                href="https://www.instagram.com/talaref.media/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-gris transition-colors hover:text-[#E4405F] hover:bg-surface-2"
                aria-label="Instagram Talaref"
                title="Instagram Talaref (@talaref.media)"
              >
                <IconeInstagram className="h-4 w-4" />
              </a>

              {/* Menu déroulant au survol */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 absolute right-0 top-full pt-1.5 w-52 z-50">
                <div className="rounded-md border border-ligne bg-surface p-1.5 shadow-2xl backdrop-blur">
                  <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gris border-b border-ligne/60 mb-1">
                    Nos pages Instagram
                  </p>
                  <a
                    href="https://www.instagram.com/talaref.media/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2 py-1.5 text-xs text-blanc rounded hover:bg-surface-2 hover:text-[#E4405F] transition-colors"
                  >
                    <span className="font-semibold">Média</span>
                    <span className="text-[11px] text-gris">@talaref.media</span>
                  </a>
                  <a
                    href="https://www.instagram.com/talaref.agency/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2 py-1.5 text-xs text-blanc rounded hover:bg-surface-2 hover:text-[#E4405F] transition-colors"
                  >
                    <span className="font-semibold">Agence</span>
                    <span className="text-[11px] text-gris">@talaref.agency</span>
                  </a>
                  <a
                    href="https://www.instagram.com/talarefstudio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2 py-1.5 text-xs text-blanc rounded hover:bg-surface-2 hover:text-[#E4405F] transition-colors"
                  >
                    <span className="font-semibold">Photo</span>
                    <span className="text-[11px] text-gris">@talarefstudio</span>
                  </a>
                </div>
              </div>
            </div>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@talarefff"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-gris transition-colors hover:text-blanc hover:bg-surface-2"
              aria-label="TikTok Talaref"
              title="TikTok @talarefff"
            >
              <IconeTikTok className="h-4 w-4" />
            </a>
          </div>

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

        {/* Action Mobile : Réseaux sociaux et Toggle Jour/Nuit en haut à droite */}
        <div className="flex items-center gap-1 md:hidden">
          <a
            href="https://www.instagram.com/talaref.media/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gris hover:text-[#E4405F] active:scale-95 transition-transform"
            aria-label="Instagram Talaref"
          >
            <IconeInstagram className="h-4 w-4" />
          </a>
          <a
            href="https://www.tiktok.com/@talarefff"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gris hover:text-blanc active:scale-95 transition-transform"
            aria-label="TikTok Talaref"
          >
            <IconeTikTok className="h-4 w-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
