"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { Video } from "@/lib/types";
import { FacadeVideo } from "./facade-video";
import { parserSourceVideo } from "@/lib/video-utils";

interface CarrouselVideosProps {
  videos: Video[];
  className?: string;
}

export function CarrouselVideos({
  videos,
  className = "",
}: CarrouselVideosProps) {
  const [indexActuel, setIndexActuel] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const vignetteRailRef = useRef<HTMLDivElement>(null);

  const total = videos.length;

  const allerPrecedent = useCallback(() => {
    setIndexActuel((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const allerSuivant = useCallback(() => {
    setIndexActuel((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Support clavier (Flèches gauche/droite)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
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

  // Auto-scroll pour garder la vignette active visible dans le bandeau
  useEffect(() => {
    if (vignetteRailRef.current) {
      const activeEl = vignetteRailRef.current.children[indexActuel] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [indexActuel]);

  // Gestes tactiles sur mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const seuil = 40;

    if (distance > seuil) {
      allerSuivant();
    } else if (distance < -seuil) {
      allerPrecedent();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!videos || videos.length === 0) return null;

  const videoActive = videos[indexActuel];

  // Extraction d'une miniature par défaut si non renseignée
  const obtenirMiniature = (v: Video) => {
    if (v.miniature && v.miniature.trim()) return v.miniature.trim();
    const parsed = parserSourceVideo(v.youtubeId || "");
    if (parsed.type === "youtube") {
      return `https://i.ytimg.com/vi/${parsed.valeur}/hqdefault.jpg`;
    }
    if (parsed.type === "vimeo") {
      return `https://vumbnail.com/${parsed.valeur}.jpg`;
    }
    return null;
  };

  return (
    <figure
      className={`my-10 select-none overflow-hidden rounded-xl border border-ligne bg-noir shadow-2xl ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Carrousel de vidéos"
      role="region"
    >
      {/* En-tête avec titre de playlist et compteur */}
      <div className="flex items-center justify-between border-b border-ligne/70 bg-surface px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-blanc">
            Playlist Vidéos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gris">
            <strong className="text-accent">{indexActuel + 1}</strong> / {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={allerPrecedent}
              className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface-2 text-xs text-blanc transition-colors hover:border-accent hover:text-accent active:scale-95"
              aria-label="Vidéo précédente"
              title="Vidéo précédente"
            >
              ←
            </button>
            <button
              type="button"
              onClick={allerSuivant}
              className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface-2 text-xs text-blanc transition-colors hover:border-accent hover:text-accent active:scale-95"
              aria-label="Vidéo suivante"
              title="Vidéo suivante"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Lecteur vidéo actif */}
      <div
        className="relative w-full bg-noir"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FacadeVideo
          key={`video-${indexActuel}-${videoActive.youtubeId}`}
          youtubeId={videoActive.youtubeId}
          titre={videoActive.titre || `Vidéo ${indexActuel + 1}`}
          miniature={videoActive.miniature}
        />
      </div>

      {/* Zone d'information : Titre & Légende de la vidéo active */}
      <div className="border-t border-ligne/70 bg-surface/80 p-4 sm:p-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-bold text-blanc sm:text-lg">
              {videoActive.titre || `Vidéo #${indexActuel + 1}`}
            </h4>
            <span className="shrink-0 rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-gris border border-ligne/80">
              Vidéo {indexActuel + 1} de {total}
            </span>
          </div>

          {/* Légende individuelle de la vidéo */}
          {videoActive.legende ? (
            <p className="text-sm leading-relaxed text-gris italic mt-0.5">
              {videoActive.legende}
            </p>
          ) : (
            <p className="text-xs text-gris/60 italic">
              Extrait vidéo Talaref
            </p>
          )}
        </div>

        {/* Bandeau de vignettes cliquables (Playlist) */}
        {total > 1 && (
          <div className="mt-4 pt-4 border-t border-ligne/60">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gris">
              Sélectionner une vidéo :
            </p>
            <div
              ref={vignetteRailRef}
              className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none sm:gap-3"
            >
              {videos.map((v, i) => {
                const estActif = i === indexActuel;
                const minUrl = obtenirMiniature(v);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndexActuel(i)}
                    className={`group relative flex-shrink-0 w-32 sm:w-40 text-left transition-all rounded-md overflow-hidden border ${
                      estActif
                        ? "border-accent ring-2 ring-accent/30 shadow-lg scale-[1.02]"
                        : "border-ligne bg-surface-2/60 opacity-70 hover:opacity-100 hover:border-gris/50"
                    }`}
                    aria-label={`Sélectionner vidéo ${i + 1} : ${v.titre || "Vidéo"}`}
                    aria-current={estActif ? "true" : undefined}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-noir/50">
                      {minUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={minUrl}
                          alt={v.titre || `Miniature ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-surface-2 text-gris text-xs font-mono">
                          🎬 Vidéo
                        </div>
                      )}

                      {/* Badge indice */}
                      <span className="absolute top-1 left-1 rounded bg-noir/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-blanc">
                        #{i + 1}
                      </span>

                      {/* Indicateur de lecture actif */}
                      {estActif && (
                        <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-noir text-[8px] font-black">
                          ▶
                        </span>
                      )}
                    </div>

                    <div className="p-1.5 bg-surface">
                      <p className={`line-clamp-1 text-[11px] font-medium leading-tight ${estActif ? "text-accent font-semibold" : "text-blanc"}`}>
                        {v.titre || `Vidéo ${i + 1}`}
                      </p>
                      {v.legende && (
                        <p className="line-clamp-1 text-[9px] text-gris italic mt-0.5">
                          {v.legende}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
