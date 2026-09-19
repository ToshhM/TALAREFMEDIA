"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { VideoItem } from "@/lib/video-types";
import { UNIVERS, type UniverseSlug } from "@/lib/univers";
import { ModalLecteurVideo } from "./modal-lecteur-video";

interface GalerieVideosInteractiveProps {
  videosInitiales: VideoItem[];
}

export function GalerieVideosInteractive({
  videosInitiales,
}: GalerieVideosInteractiveProps) {
  const [universFiltre, setUniversFiltre] = useState<string>("tous");
  const [formatFiltre, setFormatFiltre] = useState<string>("tous");
  const [recherche, setRecherche] = useState("");
  const [videoActive, setVideoActive] = useState<VideoItem | null>(null);

  const formatsDisponibles = useMemo(() => {
    const set = new Set<string>();
    videosInitiales.forEach((v) => {
      if (v.format) set.add(v.format.toUpperCase());
    });
    return Array.from(set);
  }, [videosInitiales]);

  const videosFiltrees = useMemo(() => {
    return videosInitiales.filter((v) => {
      if (universFiltre !== "tous" && v.univers !== universFiltre) return false;
      if (
        formatFiltre !== "tous" &&
        v.format?.toUpperCase() !== formatFiltre.toUpperCase()
      ) {
        return false;
      }
      if (recherche.trim()) {
        const q = recherche.toLowerCase().trim();
        const correspond =
          v.titre.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          (v.legende && v.legende.toLowerCase().includes(q)) ||
          (v.format && v.format.toLowerCase().includes(q)) ||
          v.univers.toLowerCase().includes(q) ||
          (v.articleTitre && v.articleTitre.toLowerCase().includes(q));
        if (!correspond) return false;
      }
      return true;
    });
  }, [videosInitiales, universFiltre, formatFiltre, recherche]);

  return (
    <div className="mt-8">
      {/* Barre de contrôles et filtres */}
      <div className="flex flex-col gap-5 rounded-2xl border border-ligne/80 bg-surface/80 p-4 backdrop-blur-md sm:p-6">
        {/* Recherche et filtres de format */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une vidéo, un sujet, un format..."
              className="w-full rounded-xl border border-ligne bg-surface-2 px-4 py-2.5 pl-10 text-sm text-blanc placeholder-gris transition-colors focus:border-accent focus:outline-none"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-gris"
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
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-3 top-2.5 text-xs text-gris hover:text-blanc"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres par format */}
          {formatsDisponibles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="mr-1 text-xs font-mono uppercase text-gris shrink-0">
                Format :
              </span>
              <button
                type="button"
                onClick={() => setFormatFiltre("tous")}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all shrink-0 ${
                  formatFiltre === "tous"
                    ? "bg-blanc text-noir font-bold shadow"
                    : "bg-surface-2 text-gris hover:text-blanc hover:bg-ligne"
                }`}
              >
                Tous
              </button>
              {formatsDisponibles.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormatFiltre(f)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wide transition-all shrink-0 ${
                    formatFiltre === f
                      ? "bg-accent text-noir font-bold shadow"
                      : "bg-surface-2 text-gris hover:text-blanc hover:bg-ligne"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtres par Univers (6 univers Talaref) */}
        <div className="border-t border-ligne/60 pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="mr-1 text-xs font-mono uppercase text-gris shrink-0">
              Univers :
            </span>

            <button
              type="button"
              onClick={() => setUniversFiltre("tous")}
              className={`rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                universFiltre === "tous"
                  ? "bg-blanc text-noir font-bold shadow"
                  : "border border-ligne bg-surface-2 text-gris hover:text-blanc hover:border-gris"
              }`}
            >
              Tous ({videosInitiales.length})
            </button>

            {UNIVERS.map((u) => {
              const estActif = universFiltre === u.slug;
              const compte = videosInitiales.filter((v) => v.univers === u.slug).length;

              return (
                <button
                  key={u.slug}
                  type="button"
                  data-u={u.slug}
                  onClick={() => setUniversFiltre(u.slug)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                    estActif
                      ? "border-2 border-accent bg-accent/20 text-accent font-bold shadow"
                      : "border border-ligne bg-surface-2 text-gris hover:text-blanc hover:border-ligne"
                  }`}
                >
                  <span>{u.nom}</span>
                  <span className="text-[10px] opacity-70">({compte})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compteur et état */}
      <div className="mt-6 flex items-center justify-between px-1">
        <p className="font-mono text-xs text-gris">
          Affichage de <strong className="text-blanc">{videosFiltrees.length}</strong> vidéo{videosFiltrees.length > 1 ? "s" : ""}
          {universFiltre !== "tous" && (
            <span> dans l&apos;univers <strong className="text-accent uppercase">{universFiltre}</strong></span>
          )}
          {recherche && (
            <span> pour « <strong className="text-blanc">{recherche}</strong> »</span>
          )}
        </p>

        {(universFiltre !== "tous" || formatFiltre !== "tous" || recherche) && (
          <button
            type="button"
            onClick={() => {
              setUniversFiltre("tous");
              setFormatFiltre("tous");
              setRecherche("");
            }}
            className="text-xs font-mono text-accent hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Grille de vidéos style YouTube / Konbini */}
      {videosFiltrees.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-ligne p-12 text-center">
          <span className="text-4xl mb-3">🎬</span>
          <p className="text-lg font-bold text-blanc">Aucune vidéo ne correspond à votre sélection</p>
          <p className="mt-1 text-sm text-gris">
            Essayez de modifier vos filtres ou effectuez une autre recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setUniversFiltre("tous");
              setFormatFiltre("tous");
              setRecherche("");
            }}
            className="mt-5 rounded-lg bg-surface-2 border border-ligne px-4 py-2 text-xs font-semibold text-blanc hover:bg-ligne"
          >
            Voir toutes les vidéos
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videosFiltrees.map((v) => {
            const miniatureUrl =
              v.miniature ||
              (v.sourceType === "youtube"
                ? `https://i.ytimg.com/vi/${v.urlOuId}/maxresdefault.jpg`
                : undefined);

            const isVertical = v.aspectRatio === "9:16" || v.aspectRatio === "4:5";

            return (
              <article
                key={v.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ligne/80 bg-surface shadow-lg transition-all duration-300 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/5"
              >
                {/* Vignette Vidéo cliquable */}
                <div
                  onClick={() => setVideoActive(v)}
                  className={`relative cursor-pointer overflow-hidden bg-noir ${
                    isVertical ? "aspect-[4/3] sm:aspect-video" : "aspect-video"
                  }`}
                >
                  {miniatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={miniatureUrl}
                      alt={v.titre}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-gris">
                      🎬
                    </div>
                  )}

                  {/* Voile sombre et bouton lecture */}
                  <div className="absolute inset-0 bg-noir/30 transition-colors group-hover:bg-noir/10" />

                  {/* Bouton de lecture centré */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-noir shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-blanc">
                      <svg viewBox="0 0 24 24" className="ml-1 h-5 w-5 fill-current">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>

                  {/* Badges sur la vignette */}
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    <span
                      data-u={v.univers}
                      className="rounded-xs border border-white/20 bg-noir/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-accent backdrop-blur-sm"
                    >
                      {v.univers}
                    </span>
                    {v.format && (
                      <span className="rounded bg-rouge px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-blanc shadow">
                        {v.format}
                      </span>
                    )}
                  </div>

                  {/* Durée en bas à droite */}
                  {v.duree && (
                    <span className="absolute bottom-2.5 right-2.5 rounded bg-noir/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-blanc backdrop-blur-sm">
                      {v.duree}
                    </span>
                  )}
                </div>

                {/* Contenu et métadonnées */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div className="flex flex-col gap-2">
                    <h3
                      onClick={() => setVideoActive(v)}
                      className="cursor-pointer font-heading text-lg font-bold leading-snug text-blanc transition-colors hover:text-accent line-clamp-2"
                    >
                      {v.titre}
                    </h3>

                    {v.legende ? (
                      <p className="text-xs text-gris italic line-clamp-2 leading-relaxed">
                        {v.legende}
                      </p>
                    ) : v.description ? (
                      <p className="text-xs text-gris line-clamp-2 leading-relaxed">
                        {v.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Zone d'action & interconnexion avec l'article */}
                  <div className="mt-4 border-t border-ligne/60 pt-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setVideoActive(v)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:text-blanc"
                      >
                        <span>▶ Regarder la vidéo</span>
                      </button>

                      <span className="font-mono text-[10px] text-gris/70">
                        {new Date(v.misEnLigneLe).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Lien vers l'article interconnecté */}
                    {v.articleSlug ? (
                      <Link
                        href={`/${v.articleUnivers || v.univers}/${v.articleSlug}`}
                        className="mt-1 flex items-center justify-between rounded-lg border border-ligne/80 bg-surface-2/70 p-2.5 text-xs text-gris transition-all hover:border-accent hover:bg-surface-2 hover:text-blanc"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-accent font-bold">📖</span>
                          <span className="truncate font-medium">
                            {v.articleTitre || "Lire l'article associé"}
                          </span>
                        </div>
                        <span className="shrink-0 text-accent font-bold">→</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lecteur Modal interactif */}
      <ModalLecteurVideo
        video={videoActive}
        onFermer={() => setVideoActive(null)}
      />
    </div>
  );
}
