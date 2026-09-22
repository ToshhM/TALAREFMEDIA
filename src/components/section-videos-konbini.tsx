"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import type { VideoItem } from "@/lib/video-types";
import { extraireIdYouTube } from "@/lib/video-utils";
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
        {videos.map((v) => (
          <CarteVideoKonbini
            key={v.id}
            video={v}
            onLecture={() => setVideoEnLecture(v)}
          />
        ))}
      </div>

      {/* Lecteur Lightbox interactif */}
      <ModalLecteurVideo
        video={videoEnLecture}
        onFermer={() => setVideoEnLecture(null)}
      />
    </section>
  );
}

/**
 * Gestionnaire intelligent de vignette vidéo verticale pleine carte (9:16).
 * Élimine tout letterboxing / pillarboxing grâce à :
 * 1. oar2.jpg (format 9:16 natif YouTube Shorts sans bandes noires)
 * 2. Cascade de secours automatique (maxresdefault -> hq720 -> mqdefault -> hqdefault)
 * 3. Fond d'ambiance flouté (ambient glow) garantissant 100% de couverture colorée
 */
function VignetteVideoVerticale({ video }: { video: VideoItem }) {
  const idYT = useMemo(() => {
    if (video.sourceType === "youtube") {
      return extraireIdYouTube(video.urlOuId) || video.urlOuId;
    }
    if (video.miniature && video.miniature.includes("ytimg.com")) {
      return extraireIdYouTube(video.miniature);
    }
    return null;
  }, [video.sourceType, video.urlOuId, video.miniature]);

  const urlsCandidates = useMemo(() => {
    // Si une miniature personnalisée non-YouTube est spécifiée, priorité absolue
    if (video.miniature && !video.miniature.includes("ytimg.com")) {
      return [video.miniature];
    }

    if (idYT) {
      return [
        `https://i.ytimg.com/vi/${idYT}/oar2.jpg`,
        `https://i.ytimg.com/vi/${idYT}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${idYT}/hq720.jpg`,
        `https://i.ytimg.com/vi/${idYT}/mqdefault.jpg`,
        video.miniature || `https://i.ytimg.com/vi/${idYT}/hqdefault.jpg`,
      ];
    }

    return video.miniature ? [video.miniature] : [];
  }, [idYT, video.miniature]);

  const [indexUrl, setIndexUrl] = useState(0);
  const srcActuelle = urlsCandidates[indexUrl];

  const passerSuivante = () => {
    if (indexUrl < urlsCandidates.length - 1) {
      setIndexUrl((prev) => prev + 1);
    }
  };

  if (!srcActuelle) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#151518] text-gris">
        🎬
      </div>
    );
  }

  return (
    <>
      {/* 1. Couche d'ambiance floutée qui s'étend sur 100% de la carte */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcActuelle}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-60 brightness-90 transition-opacity duration-500"
      />

      {/* 2. Image principale nette couvrant la totalité de la carte (9:16) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcActuelle}
        alt={video.titre}
        loading="lazy"
        onError={passerSuivante}
        onLoad={(e) => {
          // Détection du faux placeholder gris YouTube 120x90
          if (
            e.currentTarget.naturalWidth === 120 &&
            e.currentTarget.naturalHeight === 90
          ) {
            passerSuivante();
          }
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </>
  );
}

/**
 * Carte vidéo verticale style Konbini / TikTok / Reels plein écran.
 */
function CarteVideoKonbini({
  video,
  onLecture,
}: {
  video: VideoItem;
  onLecture: () => void;
}) {
  return (
    <div className="group relative flex-none w-[260px] sm:w-[290px] md:w-[320px] snap-start">
      <div
        onClick={onLecture}
        className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-2xl border border-ligne/80 bg-surface shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-accent/60 group-hover:shadow-2xl group-hover:shadow-accent/10"
      >
        {/* Vignette intelligente pleine carte */}
        <VignetteVideoVerticale video={video} />

        {/* Dégradés modernes ciblés pour ne pas étouffer l'image */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-noir/80 via-noir/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-noir via-noir/65 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-noir/10 transition-opacity duration-300 group-hover:opacity-0" />

        {/* Haut de la carte : Badges et Plein écran */}
        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-start justify-between gap-2 z-10">
          <div className="flex flex-col gap-1.5">
            {video.format && (
              <span className="self-start rounded-md bg-rouge px-2 py-0.5 font-heading text-[11px] font-black uppercase tracking-wider text-blanc shadow-md">
                {video.format}
              </span>
            )}
            <span
              data-u={video.univers}
              className="self-start rounded-xs border border-white/20 bg-noir/70 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase text-accent backdrop-blur-md"
            >
              {video.univers}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLecture();
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

        {/* Centre : Bouton Play animé */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-noir shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-blanc">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        {/* Bas de la carte : Métadonnées + Titre */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/90">
            {video.duree ? (
              <span className="rounded bg-noir/80 px-2 py-0.5 backdrop-blur-sm">
                ⏱ {video.duree}
              </span>
            ) : (
              <span className="rounded bg-noir/80 px-2 py-0.5 backdrop-blur-sm">
                TALAREF
              </span>
            )}

            {video.articleSlug && (
              <span className="rounded bg-accent/90 px-2 py-0.5 font-bold text-noir backdrop-blur-sm">
                + Article lié
              </span>
            )}
          </div>

          <h3 className="font-heading text-lg font-black leading-snug text-blanc drop-shadow-md sm:text-xl line-clamp-3">
            {video.titre}
          </h3>

          {video.legende && (
            <p className="line-clamp-2 text-xs text-gris drop-shadow-sm">
              {video.legende}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
