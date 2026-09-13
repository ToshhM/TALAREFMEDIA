import Link from "next/link";
import { UNIVERS } from "@/lib/univers";
import { SITE, RESEAUX_SOCIAUX } from "@/lib/site";
import { IconeInstagram, IconeTikTok } from "./icones-social";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ligne bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Colonne 1 : Identité & Badges */}
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
            <p className="mot-talaref text-sm">Talaref</p>
            <p className="mt-3 max-w-xs text-sm text-gris leading-relaxed">
              {SITE.baseline}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://www.instagram.com/talaref.media/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-ligne bg-surface-2 text-gris transition-colors hover:border-[#E4405F]/50 hover:text-[#E4405F] hover:bg-[#E4405F]/10"
                title="Instagram Talaref Média"
                aria-label="Instagram Talaref Média"
              >
                <IconeInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@talarefff"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-ligne bg-surface-2 text-gris transition-colors hover:border-blanc/40 hover:text-blanc hover:bg-white/5"
                title="TikTok Talaref"
                aria-label="TikTok Talaref"
              >
                <IconeTikTok className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Colonne 2 : Les Univers */}
          <nav aria-label="Univers">
            <p className="etiquette">Univers</p>
            <ul className="mt-3 space-y-1.5">
              {UNIVERS.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={`/${u.slug}`}
                    data-u={u.slug}
                    className="text-sm text-gris transition-colors hover:text-accent"
                  >
                    {u.nom}
                    <span className="text-gris"> · {u.territoire}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Colonne 3 : Le média */}
          <nav aria-label="Le média">
            <p className="etiquette">Le média</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link href="/a-propos" className="text-gris hover:text-blanc">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/auteurs" className="text-gris hover:text-blanc">
                  Les signatures
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gris hover:text-blanc">
                  Les vidéos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gris hover:text-blanc">
                  Contact
                </Link>
              </li>
              <li>
                <a href="/rss.xml" className="text-gris hover:text-blanc">
                  Flux RSS
                </a>
              </li>
            </ul>
          </nav>

          {/* Colonne 4 : Réseaux & Écosystème (Média, Agence, Photo, TikTok) */}
          <nav aria-label="Réseaux sociaux et écosystème">
            <p className="etiquette">Réseaux & Studio</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              {RESEAUX_SOCIAUX.map((r) => {
                const estInstagram = r.icone === "instagram";
                return (
                  <li key={r.cle}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2.5 text-gris transition-colors hover:text-blanc"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                          estInstagram
                            ? "text-gris group-hover:text-[#E4405F]"
                            : "text-gris group-hover:text-blanc"
                        }`}
                      >
                        {estInstagram ? (
                          <IconeInstagram className="h-4 w-4" />
                        ) : (
                          <IconeTikTok className="h-4 w-4" />
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold leading-tight text-blanc group-hover:text-accent">
                          {r.nom}
                        </span>
                        <span className="text-xs text-gris group-hover:text-gris/80">
                          {r.handle}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Colonne 5 : Informations légales */}
          <nav aria-label="Informations légales">
            <p className="etiquette">Informations</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-gris hover:text-blanc"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-gris hover:text-blanc"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-gris">
              Directeur de la publication :<br />
              {SITE.directeurDePublication}
            </p>
          </nav>
        </div>

        <p className="etiquette mt-10 border-t border-ligne pt-6">
          © {new Date().getFullYear()} {SITE.nomComplet}
        </p>
      </div>
    </footer>
  );
}
