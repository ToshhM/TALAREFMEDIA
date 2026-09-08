"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UNIVERS, COLLECTIONS } from "@/lib/univers";
import { UserMenu } from "./user-menu";

export function MobileNavigation() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on page navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* 1. BOTTOM DOCK (Mobile only, Konbini-style fixed thumb bar) */}
      <aside
        aria-label="Navigation mobile principale"
        className="fixed bottom-0 inset-x-0 z-50 border-t border-ligne bg-noir/95 backdrop-blur supports-[backdrop-filter]:bg-noir/85 md:hidden"
      >
        <div className="flex h-16 items-center justify-around px-2">
          {/* Menu Burger / Explorer Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-univers-drawer"
            className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
              drawerOpen ? "text-blanc font-bold" : "text-gris hover:text-blanc"
            }`}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              {drawerOpen ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </span>
            <span className="text-[11px] font-medium tracking-wide">
              {drawerOpen ? "Fermer" : "Univers"}
            </span>
          </button>

          {/* Recherche */}
          <Link
            href="/recherche"
            className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
              pathname === "/recherche"
                ? "text-blanc font-bold"
                : "text-gris hover:text-blanc"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-[11px] font-medium tracking-wide">
              Recherche
            </span>
          </Link>

          {/* Vidéos */}
          <Link
            href="/videos"
            className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
              pathname === "/videos"
                ? "text-blanc font-bold"
                : "text-gris hover:text-blanc"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[11px] font-medium tracking-wide">
              Vidéos
            </span>
          </Link>

          {/* Profil / Compte */}
          <div className="flex flex-col items-center justify-center">
            <UserMenu />
          </div>
        </div>
      </aside>

      {/* 2. FULLSCREEN MOBILE DRAWER (Konbini style modal with Univers cards) */}
      {drawerOpen && (
        <div
          id="mobile-univers-drawer"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex flex-col bg-noir/98 pb-20 pt-16 md:hidden overflow-y-auto animate-in fade-in duration-200"
        >
          {/* Header info in drawer */}
          <div className="border-b border-ligne px-6 py-4 flex items-center justify-between">
            <div>
              <p className="etiquette text-xs text-gris">Explorer Talaref</p>
              <h2 className="text-lg font-bold text-blanc tracking-tight">
                Tous les univers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full border border-ligne p-2 text-gris hover:text-blanc hover:border-blanc"
              aria-label="Fermer le menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Grille des 6 Univers */}
          <div className="p-4 space-y-2.5">
            {UNIVERS.map((u) => {
              const isCurrent = pathname === `/${u.slug}`;
              return (
                <Link
                  key={u.slug}
                  href={`/${u.slug}`}
                  data-u={u.slug}
                  className={`group relative flex items-center justify-between rounded-lg border p-3.5 transition-all ${
                    isCurrent
                      ? "border-accent bg-teinte/60"
                      : "border-ligne bg-surface/60 hover:border-accent hover:bg-teinte/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full shadow-sm"
                      style={{ backgroundColor: u.couleur }}
                      aria-hidden="true"
                    />
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-gris group-hover:text-blanc">
                        {u.code}
                      </span>
                      <h3 className="text-base font-bold text-blanc">
                        {u.nom}
                      </h3>
                      <p className="text-xs text-gris line-clamp-1">
                        {u.territoire}
                      </p>
                    </div>
                  </div>

                  <span
                    className="font-mono text-xs font-semibold px-2 py-1 rounded bg-noir/50 border border-ligne group-hover:border-accent group-hover:text-accent"
                    style={{ color: u.couleur }}
                  >
                    Voir →
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Collections spéciales (Encre & Arcade) */}
          <div className="px-4 pt-2">
            <p className="etiquette text-xs px-2 mb-2">Collections</p>
            <div className="grid grid-cols-2 gap-2">
              {COLLECTIONS.map((col) => (
                <Link
                  key={col.slug}
                  href={`/pop/c/${col.slug}`}
                  data-u={col.slug}
                  className="rounded-lg border border-ligne bg-surface/40 p-3 hover:border-accent transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: col.couleur }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-blanc">
                      {col.nom}
                    </span>
                  </div>
                  <p className="text-[11px] text-gris line-clamp-1">
                    {col.territoire}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Liens pratiques supplémentaires */}
          <div className="mt-6 border-t border-ligne px-6 pt-4 space-y-2 text-sm text-gris">
            <Link
              href="/a-propos"
              className="block py-1 hover:text-blanc transition-colors"
            >
              À propos de Talaref
            </Link>
            <Link
              href="/videos"
              className="block py-1 hover:text-blanc transition-colors"
            >
              Toutes les vidéos
            </Link>
            <Link
              href="/contact"
              className="block py-1 hover:text-blanc transition-colors"
            >
              Contactez la rédaction
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
