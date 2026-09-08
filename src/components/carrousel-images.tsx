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
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = images.length;

  const allerPrecedent = useCallback(() => {
    setIndexActuel((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const allerSuivant = useCallback(() => {
    setIndexActuel((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Support clavier (Flèches gauche / droite)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        allerPrecedent();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        allerSuivant();
      }
    },
    [allerPrecedent, allerSuivant],
  );

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
    const seuil = 40; // Seuil de 40px pour déclencher le swipe

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
        className="relative aspect-[4/3] sm:aspect-video w-full overflow-hidden rounded-lg border border-ligne bg-surface-2"
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
              className="relative h-full w-full shrink-0 overflow-hidden bg-noir/20"
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.alt || `Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              ) : (
                <div className="texture h-full w-full" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Boutons de navigation Flèches (taille tactile ≥ 44px sur mobile) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={allerPrecedent}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-noir/70 text-xl font-bold text-blanc backdrop-blur-md transition-all hover:scale-105 hover:bg-noir active:scale-95 border border-blanc/10"
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={allerSuivant}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-noir/70 text-xl font-bold text-blanc backdrop-blur-md transition-all hover:scale-105 hover:bg-noir active:scale-95 border border-blanc/10"
              aria-label="Photo suivante"
            >
              ›
            </button>
          </>
        )}

        {/* Badge Compteur (ex: 01 / 05) */}
        {total > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-noir/80 px-2.5 py-1 font-mono text-[11px] font-bold text-blanc backdrop-blur-md border border-blanc/10">
            {String(indexActuel + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Points indicateurs (dots) sous l'image */}
      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndexActuel(i)}
              className={`h-2 rounded-full transition-all ${
                i === indexActuel
                  ? "w-6 bg-accent"
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
          {imageActive.legende ? `${imageActive.legende} · ` : ""}
          <span className="font-mono text-gris/80">
            {imageActive.credit || "Talaref Media"}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
