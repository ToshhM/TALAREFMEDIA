"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { parserSourceVideo } from "@/lib/video-utils";

/**
 * Façade Vidéo (YouTube & Vidéo directe).
 *
 * Pour YouTube :
 * Une iframe YouTube coûte plusieurs centaines de kilo-octets au
 * chargement de la page. La façade affiche la vignette et ne charge le
 * lecteur qu'au clic.
 *
 * Pour les vidéos directes (MP4, WebM) :
 * Affiche un lecteur HTML5 vidéo fluide avec contrôles natifs.
 */
export function FacadeVideo({
  youtubeId,
  titre,
  miniature,
}: {
  youtubeId: string;
  titre: string;
  miniature?: string;
}) {
  const [actif, setActif] = useState(false);
  const parsed = parserSourceVideo(youtubeId);

  // Cas 1 : Vidéo directe (MP4, WebM, URL de fichier hébergé)
  if (parsed.type === "direct") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-noir border border-ligne">
        <video
          src={parsed.valeur}
          controls
          preload="metadata"
          className="h-full w-full object-contain"
          aria-label={titre}
        >
          Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
        </video>
      </div>
    );
  }

  // Cas 2 : Vidéo Vimeo
  if (parsed.type === "vimeo") {
    const idVimeo = parsed.valeur;
    const vimeoThumb = miniature || `https://vumbnail.com/${idVimeo}.jpg`;

    if (actif) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-noir border border-ligne">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://player.vimeo.com/video/${idVimeo}?autoplay=1&title=0&byline=0&portrait=0`}
            title={titre}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setActif(true)}
        className="group relative aspect-video w-full overflow-hidden rounded-md bg-noir border border-ligne text-left"
        aria-label={`Lire la vidéo Vimeo : ${titre}`}
      >
        {/* Halo d'ambiance flou arrière-plan */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vimeoThumb}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-60 brightness-75 transition-opacity duration-500"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vimeoThumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 bg-noir/40 transition-colors group-hover:bg-noir/20" />
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1ab7ea] shadow-xl transition-transform group-hover:scale-110">
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-7 w-7 fill-blanc"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {titre ? (
          <span className="absolute bottom-3 left-3 right-3 truncate rounded bg-noir/70 px-2.5 py-1 text-xs font-semibold text-blanc backdrop-blur-sm">
            {titre}
          </span>
        ) : null}
      </button>
    );
  }

  // Cas 3 : Vidéo YouTube
  const idYouTube = parsed.type === "youtube" ? parsed.valeur : youtubeId;

  return (
    <FacadeYouTube
      idYouTube={idYouTube}
      titre={titre}
      miniature={miniature}
      actif={actif}
      setActif={setActif}
    />
  );
}

function FacadeYouTube({
  idYouTube,
  titre,
  miniature,
  actif,
  setActif,
}: {
  idYouTube: string;
  titre: string;
  miniature?: string;
  actif: boolean;
  setActif: (val: boolean) => void;
}) {
  const urlsCandidates = useMemo(() => [
    ...(miniature && !miniature.includes("ytimg.com") ? [miniature] : []),
    ...(idYouTube
      ? [
          `https://i.ytimg.com/vi/${idYouTube}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${idYouTube}/mqdefault.jpg`,
          `https://i.ytimg.com/vi/${idYouTube}/oar2.jpg`,
          miniature || `https://i.ytimg.com/vi/${idYouTube}/hqdefault.jpg`,
        ].filter(Boolean)
      : []),
  ], [idYouTube, miniature]);

  const [indexUrl, setIndexUrl] = useState(0);
  const srcActuelle = urlsCandidates[indexUrl] || `https://i.ytimg.com/vi/${idYouTube}/hqdefault.jpg`;
  const imgRef = useRef<HTMLImageElement>(null);

  const passerSuivante = useCallback(() => {
    setIndexUrl((prev) => (prev < urlsCandidates.length - 1 ? prev + 1 : prev));
  }, [urlsCandidates.length]);

  // Détection immédiate post-hydratation pour les vignettes SSR 120x90 ou en échec
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (
        imgRef.current.naturalWidth <= 120 &&
        imgRef.current.naturalHeight <= 90
      ) {
        passerSuivante();
      }
    }
  }, [srcActuelle, passerSuivante]);

  if (actif) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-noir border border-ligne">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${idYouTube}?autoplay=1`}
          title={titre}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActif(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-md bg-noir border border-ligne text-left"
      aria-label={`Lire la vidéo : ${titre}`}
    >
      {/* Halo d'ambiance flou arrière-plan pour éliminer toute bordure ou lettre-boxe */}
      {srcActuelle && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`halo-${srcActuelle}`}
          src={srcActuelle}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-60 brightness-90 transition-opacity duration-500"
        />
      )}

      {/* Image nette principale */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={`main-${srcActuelle}`}
        src={srcActuelle}
        alt=""
        loading="lazy"
        onLoad={(e) => {
          if (
            e.currentTarget.naturalWidth <= 120 &&
            e.currentTarget.naturalHeight <= 90
          ) {
            passerSuivante();
          }
        }}
        onError={passerSuivante}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-noir/40 transition-colors group-hover:bg-noir/20" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-xl transition-transform group-hover:scale-110">
        <svg
          viewBox="0 0 24 24"
          className="ml-1 h-7 w-7 fill-noir"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      {titre ? (
        <span className="absolute bottom-3 left-3 right-3 truncate rounded bg-noir/70 px-2.5 py-1 text-xs font-semibold text-blanc backdrop-blur-sm">
          {titre}
        </span>
      ) : null}
    </button>
  );
}

