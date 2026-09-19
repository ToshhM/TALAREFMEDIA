"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { VideoItem } from "@/lib/video-types";
import { ModalLecteurVideo } from "./modal-lecteur-video";

interface SectionVideosKonbiniProps {
  videos: VideoItem[];
}

export function SectionVideosKonbini({ videos }: SectionVideosKonbiniProps) {
  const [videoEnLecture, setVideoEnLecture] = useState<VideoItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!videos || videos.length === 0) return null;

  const defiler = (direction: "gauche" | "droite") => {
    if (!scrollContainerRef.current) return;
    const decalage = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === "droite" ? decalage : -decalage,
      behavior: "smooth",
    });
  };

  return (
    <section aria-labelledby="titre-videos-konbini" className="mb-16">
      {/* En-tête style Konbini avec pastille et navigation */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blanc px-4 py-1.5 text-noir shadow-md">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rouge animate-pulse" />
            <h2 id="titre-videos-konbini" className="font-heading text-lg font-black tracking-tight sm:text-xl">
              Nos meilleures vidéos !
            </h2>
          </div>
          <span className="hidden text-xs font-mono text-gris sm:inline">
            Formats courts & immersifs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/videos"
            className="group flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-gris transition-colors hover:text-accent"
          >
            <span>Toutes les vidéos</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>

          {/* Boutons de défilement horizontal */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => defiler("gauche")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ligne bg-surface-2 text-sm text-blanc transition-all hover:border-accent hover:bg-accent hover:text-noir active:scale-95"
              aria-label="Faire défiler vers la gauche"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => defiler("droite")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ligne bg-surface-2 text-sm text-blanc transition-all hover:border-accent hover:bg-accent hover:text-noir active:scale-95"
              aria-label="Faire défiler vers la droite"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Rail de cartes verticales façon Konbini */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none snap-x snap-mandatory sm:gap-6"
      >
        {videos.map((v) => {
          const miniatureUrl =
            v.miniature ||
            (v.sourceType === "youtube"
              ? `https://i.ytimg.com/vi/${v.urlOuId}/maxresdefault.jpg`
              : undefined);

          return (
            <div
              key={v.id}
              className="group relative flex-none w-[260px] sm:w-[290px] md:w-[320px] snap-start"
            >
              {/* Carte vidéo verticale */}
              <div
                onClick={() => setVideoEnLecture(v)}
                className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-2xl border border-ligne/80 bg-surface shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-accent/60 group-hover:shadow-2xl group-hover:shadow-accent/10"
              >
                {/* Image de fond / Miniature */}
                {miniatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={miniatureUrl}
                    alt={v.titre}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#151518] text-gris">
                    🎬
                  </div>
                )}

                {/* Dégradé sombre pour lisibilité des textes */}
                <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-transparent" />
                <div className="absolute inset-0 bg-noir/20 transition-opacity group-hover:opacity-0" />

                {/* Haut de la carte : Bouton 'Ouvrir en plein écran' & Badges */}
                <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    {v.format && (
                      <span className="self-start rounded-md bg-rouge px-2 py-0.5 font-heading text-[11px] font-black uppercase tracking-wider text-blanc shadow-md">
                        {v.format}
                      </span>
                    )}
                    <span
                      data-u={v.univers}
                      className="self-start rounded-xs border border-white/20 bg-noir/70 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase text-accent backdrop-blur-md"
                    >
                      {v.univers}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoEnLecture(v);
                    }}
                    className="flex items-center gap-1 rounded-full bg-noir/80 px-2.5 py-1 text-[11px] font-medium text-blanc shadow-lg backdrop-blur-md transition-colors hover:bg-accent hover:text-noir"
                    title="Ouvrir en plein écran"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-currentColor stroke-2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <span className="hidden sm:inline">Plein écran</span>
                  </button>
                </div>

                {/* Centre : Bouton Play animé au hover */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-noir shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-blanc">
                    <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>

                {/* Bas de la carte : Titre percutant style Konbini + Durée */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                    {v.duree ? (
                      <span className="rounded bg-noir/80 px-2 py-0.5 backdrop-blur-sm">
                        ⏱ {v.duree}
                      </span>
                    ) : (
                      <span className="rounded bg-noir/80 px-2 py-0.5 backdrop-blur-sm">
                        TALAREF
                      </span>
                    )}

                    {v.articleSlug && (
                      <span className="rounded bg-accent/90 px-2 py-0.5 font-bold text-noir backdrop-blur-sm">
                        + Article lié
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-black leading-tight text-blanc drop-shadow-md sm:text-xl line-clamp-3">
                    {v.titre}
                  </h3>

                  {v.legende && (
                    <p className="line-clamp-2 text-xs text-gris drop-shadow-sm">
                      {v.legende}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lecteur Lightbox interactif */}
      <ModalLecteurVideo
        video={videoEnLecture}
        onFermer={() => setVideoEnLecture(null)}
      />
    </section>
  );
}
