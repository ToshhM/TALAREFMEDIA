"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { VideoItem } from "@/lib/video-types";
import { parserSourceVideo } from "@/lib/video-utils";

interface ModalLecteurVideoProps {
  video: VideoItem | null;
  onFermer: () => void;
}

export function ModalLecteurVideo({ video, onFermer }: ModalLecteurVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onFermer();
      }
    };
    if (video) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [video, onFermer]);

  if (!video) return null;

  const parsed = parserSourceVideo(video.urlOuId);
  const isVertical = video.aspectRatio === "9:16" || video.aspectRatio === "4:5";

  const togglePleinEcran = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.titre}
      className="fixed inset-0 z-50 flex items-center justify-center bg-noir/95 p-3 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        ref={containerRef}
        className={`relative flex flex-col overflow-hidden rounded-2xl border border-ligne/80 bg-[#0d0d0f] shadow-2xl transition-all ${
          isVertical
            ? "max-h-[95vh] w-full max-w-md sm:max-w-lg"
            : "max-h-[95vh] w-full max-w-5xl"
        }`}
      >
        {/* Barre de contrôle supérieure */}
        <div className="flex items-center justify-between border-b border-ligne/70 bg-surface/90 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              data-u={video.univers}
              className="etiquette rounded-xs border border-ligne px-2 py-0.5 text-[0.625rem] text-accent font-mono uppercase"
            >
              {video.univers}
            </span>
            {video.format && (
              <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-bold text-blanc uppercase tracking-wider">
                {video.format}
              </span>
            )}
            <h3 className="truncate text-sm font-semibold text-blanc sm:text-base">
              {video.titre}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePleinEcran}
              className="flex h-8 items-center gap-1.5 rounded-md border border-ligne bg-surface-2 px-2.5 text-xs text-gris transition-colors hover:border-accent hover:text-blanc"
              title="Plein écran"
              aria-label="Passer en plein écran"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 fill-none stroke-currentColor stroke-2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              <span className="hidden sm:inline">Plein écran</span>
            </button>

            <button
              type="button"
              onClick={onFermer}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-ligne bg-surface-2 text-gris transition-colors hover:bg-rouge hover:text-blanc"
              aria-label="Fermer le lecteur vidéo"
              title="Fermer (Échap)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Zone de lecture vidéo */}
        <div
          className={`relative w-full bg-noir flex items-center justify-center ${
            isVertical ? "aspect-[9/16] max-h-[68vh]" : "aspect-video"
          }`}
        >
          {parsed.type === "direct" || video.sourceType === "upload" ? (
            <video
              src={parsed.valeur}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            >
              Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
            </video>
          ) : parsed.type === "vimeo" ? (
            <iframe
              className="h-full w-full"
              src={`https://player.vimeo.com/video/${parsed.valeur}?autoplay=1&title=0&byline=0&portrait=0`}
              title={video.titre}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${parsed.valeur || video.urlOuId}?autoplay=1&rel=0`}
              title={video.titre}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        {/* Pied d'information & interconnexion avec l'article */}
        <div className="overflow-y-auto border-t border-ligne/70 bg-[#0d0d0f] p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold text-blanc sm:text-xl">
                {video.titre}
              </h2>
              {video.legende && (
                <p className="mt-1 text-sm text-gris/90 italic leading-relaxed">
                  {video.legende}
                </p>
              )}
              {video.description && video.description !== video.legende && (
                <p className="mt-2 text-xs sm:text-sm text-gris leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>

            {/* Interconnexion avec l'article associé */}
            {video.articleSlug && (
              <div className="mt-2 rounded-xl border border-accent/30 bg-accent/5 p-3.5 sm:p-4 transition-colors hover:border-accent/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-noir font-black text-sm">
                      📖
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                        Article approfondi disponible
                      </p>
                      <p className="text-sm font-semibold text-blanc line-clamp-1">
                        {video.articleTitre || "Découvrir l'article complet"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/${video.articleUnivers || video.univers}/${video.articleSlug}`}
                    onClick={onFermer}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-noir transition-all hover:bg-blanc hover:shadow-lg active:scale-95"
                  >
                    <span>Lire l&apos;article complet</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
