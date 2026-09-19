import type { Metadata } from "next";
import { tousLesVideos } from "@/lib/videos-store";
import { GalerieVideosInteractive } from "@/components/galerie-videos-interactive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Les vidéos | Talaref Média",
  description:
    "Pop culture, sport, musique, société, création et tech : découvrez tous nos reportages, décryptages, pop quiz et interviews vidéos.",
  alternates: { canonical: "/videos" },
};

export default async function PageVideos() {
  const videos = await tousLesVideos();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* En-tête éditorial */}
      <div className="flex flex-col gap-4 border-b border-ligne/70 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rouge animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
              Talaref Vidéos Hub
            </span>
          </div>
          <h1 className="titre-article text-4xl sm:text-5xl font-black">
            Le catalogue vidéo
          </h1>
          <p className="mt-3 max-w-2xl text-gris text-base leading-relaxed">
            Reportages immersifs, débats, pop quiz et analyses approfondies.
            Regardez nos vidéos en plein écran ou plongez dans les articles associés rédigés par la rédaction.
          </p>
        </div>

        {/* Statistiques en badges */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-ligne bg-surface p-3 text-center min-w-[90px]">
            <p className="text-2xl font-black text-blanc">{videos.length}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
              Vidéos
            </p>
          </div>
          <div className="rounded-xl border border-ligne bg-surface p-3 text-center min-w-[90px]">
            <p className="text-2xl font-black text-accent">6</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
              Univers
            </p>
          </div>
        </div>
      </div>

      {/* Galerie interactive avec filtres, recherche et lecteur */}
      <GalerieVideosInteractive videosInitiales={videos} />
    </main>
  );
}
