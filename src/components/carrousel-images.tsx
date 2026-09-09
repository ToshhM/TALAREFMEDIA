"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Image as ImageType } from "@/lib/types";

interface CarrouselImagesProps {
  images: ImageType[];
  className?: string;
}

export function CarrouselImages({
  images,
  className = "",
}: CarrouselImagesProps) {
  const [indexActuel, setIndexActuel] = useState(0);
  const [modeAjustement, setModeAjustement] = useState<"contain" | "cover">("contain");
  const [lightboxOuvert, setLightboxOuvert] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = images.length;

  const allerPrecedent = useCallback(() => {
    setIndexActuel((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const allerSuivant = useCallback(() => {
    setIndexActuel((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Support clavier (Flèches gauche/droite et Escape pour lightbox)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        allerPrecedent();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        allerSuivant();
      } else if (e.key === "Escape" && lightboxOuvert) {
        setLightboxOuvert(false);
      }
    },
    [allerPrecedent, allerSuivant, lightboxOuvert],
  );

  useEffect(() => {
    if (lightboxOuvert) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [lightboxOuvert, handleKeyDown]);

  // Détection du swipe sur écran tactile (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const seuil = 40; // Seuil de 40px

    if (distance > seuil) {
      allerSuivant();
    } else if (distance < -seuil) {
      allerPrecedent();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!images || images.length === 0) return null;

  const imageActive = images[indexActuel];

  return (
    <figure
      className={`relative my-10 select-none ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Carrousel de photos"
    >
      {/* Conteneur principal des diapositives */}
      <div
        className="group relative aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/10] max-h-[75vh] w-full overflow-hidden rounded-xl border border-ligne bg-noir shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Diapositives coulissantes */}
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${indexActuel * 100}%)` }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden bg-noir"
            >
              {img.url ? (
                <>
                  {/* Fond d'ambiance flouté dérivé de la photo (évite les bandes noires rigides pour les portraits) */}
                  {modeAjustement === "contain" && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover blur-2xl opacity-35 scale-110"
                      />
                      <div className="absolute inset-0 bg-noir/40 backdrop-blur-[1px]" />
                    </div>
                  )}

                  {/* Photo principale : object-contain pour portrait/paysage sans rognage, ou object-cover selon le mode */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || `Photo ${i + 1}`}
                    onClick={() => setLightboxOuvert(true)}
                    className={`relative z-10 h-full w-full transition-all duration-200 cursor-zoom-in drop-shadow-md ${
                      modeAjustement === "contain"
                        ? "object-contain max-h-full max-w-full p-1 sm:p-2"
                        : "object-cover"
                    }`}
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </>
              ) : (
                <div className="texture h-full w-full" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Boutons de navigation Flèches (taille tactile 44px sur mobile) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={allerPrecedent}
              className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-noir/70 text-xl font-bold text-blanc backdrop-blur-md transition-all hover:scale-110 hover:bg-noir active:scale-95 border border-blanc/15 shadow-lg"
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={allerSuivant}
              className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-noir/70 text-xl font-bold text-blanc backdrop-blur-md transition-all hover:scale-110 hover:bg-noir active:scale-95 border border-blanc/15 shadow-lg"
              aria-label="Photo suivante"
            >
              ›
            </button>
          </>
        )}

        {/* Barre d'outils flottante supérieure : Mode d'ajustement & Plein écran */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Bouton bascule : Photo entière vs Remplir */}
          <button
            type="button"
            onClick={() =>
              setModeAjustement((prev) => (prev === "contain" ? "cover" : "contain"))
            }
            className="flex items-center gap-1.5 rounded-full bg-noir/75 px-2.5 py-1 text-[11px] font-mono font-medium text-blanc/90 backdrop-blur-md border border-blanc/15 transition-all hover:bg-noir hover:text-accent hover:border-accent active:scale-95 shadow"
            title={
              modeAjustement === "contain"
                ? "Afficher en plein cadre (zoom)"
                : "Afficher la photo entière (sans rognage)"
            }
          >
            {modeAjustement === "contain" ? (
              <>
                <span aria-hidden="true">↔</span>
                <span className="hidden sm:inline">Photo entière</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">⤢</span>
                <span className="hidden sm:inline">Plein cadre</span>
              </>
            )}
          </button>

          {/* Bouton Agrandir / Lightbox */}
          <button
            type="button"
            onClick={() => setLightboxOuvert(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-noir/75 text-xs text-blanc/90 backdrop-blur-md border border-blanc/15 transition-all hover:bg-noir hover:text-accent hover:border-accent active:scale-95 shadow"
            title="Agrandir en plein écran"
            aria-label="Agrandir la photo"
          >
            🔍
          </button>
        </div>

        {/* Badge Compteur inférieur (ex: 02 / 06) */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 z-20 rounded-full bg-noir/80 px-2.5 py-1 font-mono text-[11px] font-bold text-blanc backdrop-blur-md border border-blanc/15 shadow">
            {String(indexActuel + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Points indicateurs (dots) sous le carrousel */}
      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndexActuel(i)}
              className={`h-2 rounded-full transition-all ${
                i === indexActuel
                  ? "w-6 bg-accent shadow-sm"
                  : "w-2 bg-ligne hover:bg-gris"
              }`}
              aria-label={`Aller à la photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Légende & Crédit de la photo active */}
      {(imageActive.legende || imageActive.credit) && (
        <figcaption className="etiquette mt-2.5 text-center text-gris">
          {imageActive.legende ? (
            <span className="text-blanc font-medium">{imageActive.legende} · </span>
          ) : null}
          <span className="font-mono text-gris/80">
            {imageActive.credit || "Talaref Media"}
          </span>
        </figcaption>
      )}

      {/* MODAL LIGHTBOX PLEIN ÉCRAN */}
      {lightboxOuvert && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxOuvert(false)}
        >
          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={() => setLightboxOuvert(false)}
            className="absolute top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-noir/80 text-xl font-bold text-blanc border border-blanc/20 transition-all hover:bg-accent hover:text-noir"
            aria-label="Fermer le plein écran"
          >
            ✕
          </button>

          {/* Image en plein écran sans rognage */}
          <div
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageActive.url}
              alt={imageActive.alt || `Photo ${indexActuel + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-md shadow-2xl drop-shadow-2xl select-none"
            />

            {/* Navigation dans la lightbox */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={allerPrecedent}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-noir/80 text-2xl font-bold text-blanc border border-blanc/20 hover:bg-accent hover:text-noir transition-all"
                  aria-label="Photo précédente"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={allerSuivant}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-noir/80 text-2xl font-bold text-blanc border border-blanc/20 hover:bg-accent hover:text-noir transition-all"
                  aria-label="Photo suivante"
                >
                  ›
                </button>
              </>
            )}

            {/* Légende en bas de la lightbox */}
            <div className="absolute bottom-2 inset-x-0 text-center">
              <span className="inline-block rounded-full bg-noir/80 px-4 py-1.5 text-xs text-blanc border border-blanc/15 backdrop-blur-md">
                {String(indexActuel + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                {imageActive.legende ? ` — ${imageActive.legende}` : ""}
                {imageActive.credit ? ` (${imageActive.credit})` : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
