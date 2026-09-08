"use client";

import { useState } from "react";
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
}: {
  youtubeId: string;
  titre: string;
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
        className="group relative aspect-video w-full overflow-hidden rounded-md bg-surface-2 border border-ligne text-left"
        aria-label={`Lire la vidéo Vimeo : ${titre}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://vumbnail.com/${idVimeo}.jpg`}
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
      className="group relative aspect-video w-full overflow-hidden rounded-md bg-surface-2 border border-ligne text-left"
      aria-label={`Lire la vidéo : ${titre}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${idYouTube}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
        onError={(e) => {
          // Si maxresdefault n'est pas disponible pour cette vidéo
          const target = e.currentTarget;
          if (!target.src.includes("hqdefault")) {
            target.src = `https://i.ytimg.com/vi/${idYouTube}/hqdefault.jpg`;
          }
        }}
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

