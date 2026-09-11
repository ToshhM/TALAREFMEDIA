"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UNIVERS, getCollectionsForUnivers } from "@/lib/univers";
import type { CollectionSlug, UniverseSlug } from "@/lib/univers";
import type { Article, Bloc, ImageCadrage, ImageDisposition, PositionALaUne, UserProfile, UserRole } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { parserSourceVideo } from "@/lib/video-utils";
import { FacadeVideo } from "@/components/facade-video";
import { slugifier } from "@/lib/reserved";
import { EditeurTexteRiche } from "@/components/editeur-texte-riche";
import { formaterImageTransform, formaterObjectPosition } from "@/lib/site";

function parseCadragePourcentage(cadrage: string): number {
  if (cadrage === "top") return 0;
  if (cadrage === "bottom") return 100;
  if (cadrage === "center") return 50;
  const match = cadrage.match(/^(\d{1,3})%?$/);
  if (match) return Math.min(100, Math.max(0, parseInt(match[1], 10)));
  return 50;
}

type FormBloc = {
  _type:
    | "paragraphe"
    | "intertitre"
    | "laRef"
    | "citation"
    | "chiffreCle"
    | "image"
    | "moduleVideo"
    | "galerie";
  texte?: string;
  titre?: string;
  valeur?: string;
  libelle?: string;
  source?: string;
  auteur?: string;
  niveau?: 2 | 3;
  url?: string;
  alt?: string;
  credit?: string;
  legende?: string;
  youtubeId?: string;
  duree?: number;
  miniature?: string;
  disposition?: "standard" | "large" | "portrait" | "carre";
  layout?: "carrousel" | "grille-2" | "grille-3" | "mosaique";
  images?: Array<{ url: string; alt?: string; credit?: string; legende?: string }>;
};

async function televerserFichier(file: File): Promise<string> {
  // Limite stricte pour les images : 2 Mo maximum pour ne pas ralentir le site
  const estImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
  if (estImage && file.size > 2 * 1024 * 1024) {
    const tailleMo = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `L'image « ${file.name} » fait ${tailleMo} Mo. La limite stricte est de 2 Mo maximum afin de garantir la fluidité du site. Veuillez compresser votre image.`,
    );
  }

  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Erreur lors du téléversement");
  }
  return data.url;
}

function BlocImageEditor({
  bloc,
  index,
  modifierBloc,
}: {
  bloc: FormBloc;
  index: number;
  modifierBloc: (index: number, champ: string, valeur: any) => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const disposition = bloc.disposition || "standard";

  const optionsDisposition: Array<{
    id: "standard" | "large" | "portrait" | "carre";
    label: string;
    icone: string;
    desc: string;
  }> = [
    { id: "standard", label: "Standard", icone: "🖼️", desc: "16:9 centré" },
    { id: "large", label: "Pleine largeur", icone: "🌌", desc: "Immersif" },
    { id: "portrait", label: "Portrait", icone: "📱", desc: "3:4 vertical" },
    { id: "carre", label: "Carré", icone: "⬛", desc: "1:1 carré" },
  ];

  return (
    <div className="space-y-4">
      {/* Sélecteur de format / disposition d'image */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-gris mb-1.5">
          Disposition / Format de la photo :
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {optionsDisposition.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => modifierBloc(index, "disposition", opt.id)}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded border px-2.5 py-1.5 text-xs transition-all ${
                disposition === opt.id
                  ? "border-accent bg-accent font-bold text-noir shadow-sm"
                  : "border-ligne bg-surface-2 text-blanc hover:border-blanc/40 hover:bg-ligne"
              }`}
            >
              <span>{opt.icone}</span>
              <span className="font-semibold">{opt.label}</span>
              <span className="hidden lg:inline text-[10px] opacity-70">({opt.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zone d'aperçu ou d'upload */}
      {bloc.url ? (
        <div className="relative overflow-hidden rounded-md border border-ligne bg-surface-2">
          <div
            className={`w-full overflow-hidden ${
              disposition === "portrait"
                ? "aspect-[3/4] max-w-[240px] mx-auto"
                : disposition === "carre"
                ? "aspect-square max-w-[280px] mx-auto"
                : disposition === "large"
                ? "aspect-[21/9]"
                : "aspect-video"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bloc.url}
              alt={bloc.alt || "Aperçu photo"}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => modifierBloc(index, "url", "")}
            className="absolute top-2 right-2 rounded-md bg-noir/85 px-2.5 py-1 text-xs font-bold text-encre backdrop-blur hover:bg-noir active:scale-95"
          >
            ✕ Retirer
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-ligne/70 bg-noir/40 p-5 sm:p-6 text-center">
          <span className="text-3xl mb-2">📷</span>
          <p className="text-xs font-bold text-blanc">
            Téléverser une photo ou coller un lien direct
          </p>
          <p className="text-[0.6875rem] text-gris mt-1 mb-3">
            Formats : JPG, PNG, WebP (max 2 Mo) · Ou collez directement une URL ci-dessous
          </p>
          <label className="cursor-pointer rounded border border-ligne bg-surface-2 px-3.5 py-2 text-xs font-bold text-blanc hover:bg-ligne active:scale-95 transition-all">
            {enCours ? "Upload en cours..." : "Choisir un fichier image (≤ 2 Mo)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enCours}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setEnCours(true);
                try {
                  const url = await televerserFichier(f);
                  modifierBloc(index, "url", url);
                  if (!bloc.alt) modifierBloc(index, "alt", f.name);
                } catch (err: any) {
                  alert(err.message || "Erreur upload");
                } finally {
                  setEnCours(false);
                }
              }}
            />
          </label>
        </div>
      )}

      {/* Champs URL & Crédit */}
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="url"
          value={bloc.url || ""}
          onChange={(e) => modifierBloc(index, "url", e.target.value)}
          placeholder="Lien web direct de l'image (https://...)"
          className="rounded border border-ligne bg-noir p-2.5 sm:p-2 text-xs text-blanc sm:col-span-2 focus:border-nexus focus:outline-none"
        />
        <input
          type="text"
          value={bloc.credit || ""}
          onChange={(e) => modifierBloc(index, "credit", e.target.value)}
          placeholder="Crédit photo (obligatoire)"
          className="rounded border border-ligne bg-noir p-2.5 sm:p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
      </div>

      {/* Légende & Alt */}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={bloc.legende || ""}
          onChange={(e) => modifierBloc(index, "legende", e.target.value)}
          placeholder="Légende sous la photo (optionnelle)"
          className="rounded border border-ligne bg-noir p-2.5 sm:p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
        <input
          type="text"
          value={bloc.alt || ""}
          onChange={(e) => modifierBloc(index, "alt", e.target.value)}
          placeholder="Description pour l'accessibilité (alt)"
          className="rounded border border-ligne bg-noir p-2.5 sm:p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
      </div>
    </div>
  );
}

function BlocVideoEditor({
  bloc,
  index,
  modifierBloc,
}: {
  bloc: FormBloc;
  index: number;
  modifierBloc: (index: number, champ: string, valeur: any) => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [enCoursMiniature, setEnCoursMiniature] = useState(false);

  const parsed = parserSourceVideo(bloc.youtubeId || "");
  const idYouTube = parsed.type === "youtube" ? parsed.valeur : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2 flex gap-2">
          <input
            type="text"
            value={bloc.youtubeId || ""}
            onChange={(e) => modifierBloc(index, "youtubeId", e.target.value)}
            placeholder="Lien YouTube (youtube.com/...), Vimeo (vimeo.com/...) ou fichier vidéo direct"
            className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
          />
          <label className="shrink-0 cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-2 text-xs font-bold text-blanc hover:bg-ligne flex items-center gap-1">
            {enCours ? "Upload..." : "🎬 Upload vidéo"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={enCours}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setEnCours(true);
                try {
                  const url = await televerserFichier(f);
                  modifierBloc(index, "youtubeId", url);
                } catch (err: any) {
                  alert(err.message || "Erreur upload vidéo");
                } finally {
                  setEnCours(false);
                }
              }}
            />
          </label>
        </div>

        <input
          type="text"
          value={bloc.titre || ""}
          onChange={(e) => modifierBloc(index, "titre", e.target.value)}
          placeholder="Titre ou légende de la vidéo"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
      </div>

      {/* Gestion de la miniature de la vidéo */}
      <div className="rounded border border-ligne/70 bg-surface-2/40 p-2.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[0.6875rem] uppercase font-bold text-gris tracking-wide">
            🖼️ Miniature de la vidéo
          </span>
          <div className="flex items-center gap-2">
            {idYouTube && (
              <button
                type="button"
                onClick={() => {
                  modifierBloc(index, "miniature", `https://i.ytimg.com/vi/${idYouTube}/hqdefault.jpg`);
                }}
                className="text-[0.6875rem] font-bold text-nexus hover:underline"
              >
                ✨ Récupérer miniature YouTube
              </button>
            )}
            {bloc.miniature && (
              <button
                type="button"
                onClick={() => modifierBloc(index, "miniature", "")}
                className="text-[0.6875rem] text-encre hover:underline"
              >
                ✕ Rétablir automatique
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            value={bloc.miniature || ""}
            onChange={(e) => modifierBloc(index, "miniature", e.target.value)}
            placeholder={
              idYouTube
                ? "Automatique (miniature YouTube officielle) ou collez une URL personnalisée..."
                : "URL de la miniature personnalisée (ou uploadez un fichier image)..."
            }
            className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
          />
          <label className="shrink-0 cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-2 text-xs font-bold text-blanc hover:bg-ligne flex items-center gap-1">
            {enCoursMiniature ? "Upload..." : "📁 Uploader miniature"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enCoursMiniature}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setEnCoursMiniature(true);
                try {
                  const url = await televerserFichier(f);
                  modifierBloc(index, "miniature", url);
                } catch (err: any) {
                  alert(err.message || "Erreur upload image");
                } finally {
                  setEnCoursMiniature(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      {bloc.youtubeId ? (
        <div className="mt-3">
          <p className="mb-1.5 font-mono text-[0.625rem] uppercase text-gris">
            Aperçu de la vidéo dans l'article (YouTube, Vimeo ou lecteur direct) :
          </p>
          <div className="max-w-md">
            <FacadeVideo
              youtubeId={bloc.youtubeId}
              titre={bloc.titre || "Aperçu vidéo"}
              miniature={bloc.miniature}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlocGalerieEditor({
  bloc,
  index,
  modifierBloc,
}: {
  bloc: FormBloc;
  index: number;
  modifierBloc: (index: number, champ: string, valeur: any) => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [urlAjout, setUrlAjout] = useState("");
  const images = bloc.images || [];
  const layout = bloc.layout || "carrousel";

  const optionsLayout: Array<{
    id: "carrousel" | "grille-2" | "grille-3" | "mosaique";
    label: string;
    icone: string;
    desc: string;
  }> = [
    { id: "carrousel", label: "Carrousel", icone: "🎠", desc: "Slider tactile" },
    { id: "grille-2", label: "Duo (2 cols)", icone: "👥", desc: "Côte à côte" },
    { id: "grille-3", label: "Grille (3 cols)", icone: "🪟", desc: "Triptyque" },
    { id: "mosaique", label: "Mosaïque", icone: "🧩", desc: "Grande + petites" },
  ];

  const ajouterImage = (url: string) => {
    if (!url.trim()) return;
    modifierBloc(index, "images", [
      ...images,
      { url: url.trim(), alt: "", credit: "Talaref Media", legende: "" },
    ]);
  };

  const supprimerImage = (imgIdx: number) => {
    modifierBloc(
      index,
      "images",
      images.filter((_, i) => i !== imgIdx),
    );
  };

  const modifierProprieteImage = (imgIdx: number, champ: string, valeur: string) => {
    const nouvelles = images.map((img, i) => (i === imgIdx ? { ...img, [champ]: valeur } : img));
    modifierBloc(index, "images", nouvelles);
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur de layout pour la galerie */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-gris mb-1.5">
          Mise en page de la galerie :
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {optionsLayout.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => modifierBloc(index, "layout", opt.id)}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded border px-2.5 py-1.5 text-xs transition-all ${
                layout === opt.id
                  ? "border-accent bg-accent font-bold text-noir shadow-sm"
                  : "border-ligne bg-surface-2 text-blanc hover:border-blanc/40 hover:bg-ligne"
              }`}
            >
              <span>{opt.icone}</span>
              <span className="font-semibold">{opt.label}</span>
              <span className="hidden lg:inline text-[10px] opacity-70">({opt.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ajout de photos (Upload mobile ou URL) */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded border border-ligne bg-surface-2 px-4 py-2 text-xs font-bold text-blanc hover:bg-ligne active:scale-95 transition-all shrink-0">
          <span>{enCours ? "Téléversement..." : "📁 Uploader photos (≤ 2 Mo)"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={enCours}
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              setEnCours(true);
              try {
                for (const f of files) {
                  const url = await televerserFichier(f);
                  ajouterImage(url);
                }
              } catch (err: any) {
                alert(err.message || "Erreur upload galerie");
              } finally {
                setEnCours(false);
              }
            }}
          />
        </label>

        <div className="flex flex-1 gap-1.5">
          <input
            type="url"
            value={urlAjout}
            onChange={(e) => setUrlAjout(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (urlAjout.trim()) {
                  ajouterImage(urlAjout);
                  setUrlAjout("");
                }
              }
            }}
            placeholder="Ou coller une URL d'image (https://...)"
            className="flex-1 min-h-[42px] rounded border border-ligne bg-noir px-3 text-xs text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (urlAjout.trim()) {
                ajouterImage(urlAjout);
                setUrlAjout("");
              }
            }}
            className="min-h-[42px] rounded border border-ligne bg-surface-2 px-3 text-xs font-bold text-blanc hover:bg-ligne active:scale-95 transition-all shrink-0"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Liste et miniatures des photos dans la galerie */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gris">
            <span>{images.length} photo{images.length > 1 ? "s" : ""} dans la galerie</span>
            <span className="text-[11px] text-accent">Mode : {optionsLayout.find((o) => o.id === layout)?.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, imgIdx) => (
              <div
                key={imgIdx}
                className="group relative rounded-md border border-ligne bg-surface-2 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-noir/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || `Photo ${imgIdx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => supprimerImage(imgIdx)}
                    className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-noir/85 text-xs font-bold text-encre hover:bg-noir active:scale-95 shadow-md"
                    title="Supprimer cette photo"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1.5 rounded bg-noir/70 px-1.5 py-0.5 font-mono text-[10px] text-blanc/80">
                    #{imgIdx + 1}
                  </span>
                </div>
                <div className="p-1.5 space-y-1 bg-surface">
                  <input
                    type="text"
                    value={img.legende || ""}
                    onChange={(e) => modifierProprieteImage(imgIdx, "legende", e.target.value)}
                    placeholder="Légende (optionnel)"
                    className="w-full rounded border border-ligne/60 bg-noir p-1 text-[11px] text-blanc placeholder-gris/40 focus:border-nexus focus:outline-none"
                  />
                  <input
                    type="text"
                    value={img.credit || ""}
                    onChange={(e) => modifierProprieteImage(imgIdx, "credit", e.target.value)}
                    placeholder="Crédit photo"
                    className="w-full rounded border border-ligne/60 bg-noir p-1 text-[10px] text-gris placeholder-gris/40 focus:border-nexus focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gris/60 italic py-2">
          Aucune photo dans la galerie. Ajoutez-en via le bouton d&apos;upload ou un lien URL.
        </p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState<"redaction" | "articles" | "utilisateurs">("redaction");

  // État du mode édition
  const [modeEdition, setModeEdition] = useState<{
    actif: boolean;
    slug: string;
    refNumber?: number;
  }>({ actif: false, slug: "" });

  // État de l'éditeur d'article (façon Medium)
  const [titre, setTitre] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [chapo, setChapo] = useState("");
  const [univers, setUnivers] = useState<UniverseSlug>("pop");
  const [collection, setCollection] = useState<CollectionSlug | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCredit, setImageCredit] = useState("Talaref Media");
  const [imageAlt, setImageAlt] = useState("");
  const [imageDisposition, setImageDisposition] = useState<ImageDisposition>("standard");
  const [imageCadrage, setImageCadrage] = useState<ImageCadrage>("center");
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [positionALaUne, setPositionALaUne] = useState<PositionALaUne>("standard");
  const [uploadEnCoursUne, setUploadEnCoursUne] = useState(false);
  const [videoPrincipaleUrl, setVideoPrincipaleUrl] = useState("");
  const [videoPrincipaleTitre, setVideoPrincipaleTitre] = useState("");
  const [videoPrincipaleMiniature, setVideoPrincipaleMiniature] = useState("");
  const [uploadEnCoursMiniaturePrincipale, setUploadEnCoursMiniaturePrincipale] = useState(false);
  const [tagsRaw, setTagsRaw] = useState("");
  const [datePublication, setDatePublication] = useState("");
  const [numeroRef, setNumeroRef] = useState<number | string>("");
  const [universSecondaires, setUniversSecondaires] = useState<UniverseSlug[]>([]);
  const [metaTitre, setMetaTitre] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [afficherSeoAvance, setAfficherSeoAvance] = useState(false);
  const [blocs, setBlocs] = useState<FormBloc[]>([
    { _type: "paragraphe", texte: "" },
    { _type: "laRef", titre: "La référence", texte: "" },
  ]);

  const BROUILLON_STORAGE_KEY = "talaref_redaction_brouillon_auto";
  const [brouillonSauvegardeLe, setBrouillonSauvegardeLe] = useState<string | null>(null);
  const [brouillonDisponible, setBrouillonDisponible] = useState<boolean>(false);
  const [brouillonInfoDate, setBrouillonInfoDate] = useState<string | null>(null);
  const [initialiseDepuisBrouillon, setInitialiseDepuisBrouillon] = useState<boolean>(false);

  const effacerBrouillon = () => {
    try {
      localStorage.removeItem(BROUILLON_STORAGE_KEY);
    } catch {
      // Ignorer si mode navigation privée stricte
    }
    setBrouillonDisponible(false);
    setBrouillonInfoDate(null);
    setBrouillonSauvegardeLe(null);
  };

  const restaurerBrouillon = () => {
    try {
      const raw = localStorage.getItem(BROUILLON_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.titre === "string") setTitre(data.titre);
      if (typeof data.heroTitle === "string") setHeroTitle(data.heroTitle);
      if (typeof data.chapo === "string") setChapo(data.chapo);
      if (data.univers) setUnivers(data.univers);
      if (data.collection !== undefined) setCollection(data.collection);
      if (typeof data.imageUrl === "string") setImageUrl(data.imageUrl);
      if (typeof data.imageCredit === "string") setImageCredit(data.imageCredit);
      if (typeof data.imageAlt === "string") setImageAlt(data.imageAlt);
      if (data.imageDisposition) setImageDisposition(data.imageDisposition);
      if (data.imageCadrage) setImageCadrage(data.imageCadrage);
      if (typeof data.imageZoom === "number") setImageZoom(data.imageZoom);
      if (data.positionALaUne) setPositionALaUne(data.positionALaUne);
      if (typeof data.tagsRaw === "string") setTagsRaw(data.tagsRaw);
      if (typeof data.datePublication === "string") setDatePublication(data.datePublication);
      if (data.numeroRef !== undefined) setNumeroRef(data.numeroRef);
      if (Array.isArray(data.universSecondaires)) setUniversSecondaires(data.universSecondaires);
      if (typeof data.metaTitre === "string") setMetaTitre(data.metaTitre);
      if (typeof data.metaDescription === "string") setMetaDescription(data.metaDescription);
      if (typeof data.videoPrincipaleUrl === "string") setVideoPrincipaleUrl(data.videoPrincipaleUrl);
      if (typeof data.videoPrincipaleTitre === "string") setVideoPrincipaleTitre(data.videoPrincipaleTitre);
      if (typeof data.videoPrincipaleMiniature === "string") setVideoPrincipaleMiniature(data.videoPrincipaleMiniature);
      if (Array.isArray(data.blocs) && data.blocs.length > 0) setBlocs(data.blocs);
      if (data.modeEdition && typeof data.modeEdition === "object") setModeEdition(data.modeEdition);
      setBrouillonDisponible(false);
      setBrouillonSauvegardeLe(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (e) {
      console.error("Erreur lors de la récupération du brouillon", e);
    }
  };

  // 1. Détection au chargement d'un brouillon non publié stocké en cache local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BROUILLON_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const aDuContenu =
          (typeof data.titre === "string" && data.titre.trim().length > 0) ||
          (typeof data.chapo === "string" && data.chapo.trim().length > 0) ||
          (Array.isArray(data.blocs) &&
            data.blocs.some((b: any) => (b.texte && b.texte.trim().length > 0) || b.url));

        if (aDuContenu) {
          setBrouillonDisponible(true);
          if (data.savedAt) {
            try {
              const d = new Date(data.savedAt);
              setBrouillonInfoDate(
                `sauvegardé le ${d.toLocaleDateString("fr-FR")} à ${d.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              );
            } catch {
              setBrouillonInfoDate(null);
            }
          }
        }
      }
    } catch {
      // Ignorer si localStorage indisponible
    }
    setInitialiseDepuisBrouillon(true);
  }, []);

  // 2. Sauvegarde automatique continue en cache local (debounce 1500ms, sans aucun appel réseau)
  useEffect(() => {
    if (!initialiseDepuisBrouillon) return;

    // Ne rien sauvegarder si le formulaire est vide
    const aDuContenu =
      titre.trim().length > 0 ||
      chapo.trim().length > 0 ||
      imageUrl.trim().length > 0 ||
      blocs.some(
        (b) =>
          (b.texte && b.texte.trim().length > 0) ||
          b.url ||
          (b.images && b.images.length > 0)
      );

    if (!aDuContenu) return;

    const timer = setTimeout(() => {
      try {
        const donneesBrouillon = {
          titre,
          heroTitle,
          chapo,
          univers,
          collection,
          imageUrl,
          imageCredit,
          imageAlt,
          imageDisposition,
          imageCadrage,
          imageZoom,
          positionALaUne,
          tagsRaw,
          datePublication,
          numeroRef,
          universSecondaires,
          metaTitre,
          metaDescription,
          blocs,
          videoPrincipaleUrl,
          videoPrincipaleTitre,
          videoPrincipaleMiniature,
          modeEdition,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(BROUILLON_STORAGE_KEY, JSON.stringify(donneesBrouillon));
        const maintenant = new Date();
        setBrouillonSauvegardeLe(
          maintenant.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (e) {
        console.warn("Échec de la sauvegarde automatique locale :", e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    titre,
    heroTitle,
    chapo,
    univers,
    collection,
    imageUrl,
    imageCredit,
    imageAlt,
    imageDisposition,
    imageCadrage,
    imageZoom,
    positionALaUne,
    tagsRaw,
    datePublication,
    numeroRef,
    universSecondaires,
    metaTitre,
    metaDescription,
    blocs,
    videoPrincipaleUrl,
    videoPrincipaleTitre,
    videoPrincipaleMiniature,
    modeEdition,
    initialiseDepuisBrouillon,
  ]);

  const [publicationEnCours, startPublication] = useTransition();
  const [messagePublication, setMessagePublication] = useState<{
    type: "succes" | "erreur";
    texte: string;
    url?: string;
  } | null>(null);

  // État de la gestion des articles (Admin uniquement)
  const [listeArticles, setListeArticles] = useState<Article[]>([]);
  const [chargementArticles, setChargementArticles] = useState(false);
  const [rechercheArticle, setRechercheArticle] = useState("");
  const [universFiltre, setUniversFiltre] = useState<string>("tous");
  const [suppressionArticleSlug, setSuppressionArticleSlug] = useState<string | null>(null);

  // État de la gestion des utilisateurs (Admin)
  const [utilisateurs, setUtilisateurs] = useState<UserProfile[]>([]);
  const [chargementUsers, setChargementUsers] = useState(false);
  const [rechercheUser, setRechercheUser] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChargement(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push("/connexion");
        return;
      }
      setUser(data.user);

      const email = data.user.email?.toLowerCase() || "";
      const isSuperAdmin = email === "mpika.toshiro@talaref.co";
      const detectedRole: UserRole = isSuperAdmin
        ? "admin"
        : (data.user.user_metadata?.role as UserRole) ||
          (data.user.app_metadata?.role as UserRole) ||
          "membre";

      setRole(detectedRole);
      setChargement(false);
    });
  }, [router]);

  const chargerArticles = () => {
    setChargementArticles(true);
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.articles) {
          setListeArticles(data.articles);
        }
      })
      .catch(() => {})
      .finally(() => setChargementArticles(false));
  };

  // Charger les articles si rôle admin
  useEffect(() => {
    if (role === "admin") {
      chargerArticles();
    }
  }, [role, ongletActif]);

  // Charger la liste des utilisateurs si onglet actif
  useEffect(() => {
    if (ongletActif === "utilisateurs" && role === "admin") {
      setChargementUsers(true);
      fetch("/api/admin/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUtilisateurs(data.users);
          }
        })
        .catch(() => {})
        .finally(() => setChargementUsers(false));
    }
  }, [ongletActif, role]);

  // Charger un article existant dans le formulaire pour modification
  const chargerArticlePourModification = (art: Article) => {
    setModeEdition({
      actif: true,
      slug: art.slug,
      refNumber: art.refNumber,
    });
    setNumeroRef(art.refNumber !== undefined ? art.refNumber : "");
    setTitre(art.titre);
    setHeroTitle(art.heroTitle || "");
    setChapo(art.chapo);
    setUnivers(art.univers);
    setCollection(art.collection || "");
    setImageUrl(art.imageDeUne?.url || "");
    setImageCredit(art.imageDeUne?.credit || "Talaref Media");
    setImageAlt(art.imageDeUne?.alt || "");
    setImageDisposition(art.imageDeUne?.disposition || "standard");
    setImageCadrage(art.imageDeUne?.cadrage || "center");
    setImageZoom(art.imageDeUne?.zoom || 1);
    setPositionALaUne((art.format as PositionALaUne) || "standard");
    setVideoPrincipaleUrl(art.video?.youtubeId || (art.video as any)?.url || "");
    setVideoPrincipaleTitre(art.video?.titre || "");
    setVideoPrincipaleMiniature((art.video as any)?.miniature || "");
    setTagsRaw(art.tags?.map((t) => t.nom).join(", ") || "");
    setUniversSecondaires(art.universSecondaires || []);
    setMetaTitre(art.metaTitre || "");
    setMetaDescription(art.metaDescription || "");
    setAfficherSeoAvance(Boolean(art.metaTitre || art.metaDescription));
    setDatePublication(
      art.publieLe
        ? new Date(art.publieLe).toISOString().slice(0, 16)
        : ""
    );

    const formBlocs: FormBloc[] = (art.corps || []).map((b) => {
      if (b._type === "paragraphe") return { _type: "paragraphe", texte: b.texte };
      if (b._type === "intertitre") return { _type: "intertitre", niveau: b.niveau, texte: b.texte };
      if (b._type === "laRef") return { _type: "laRef", titre: b.titre, texte: b.texte };
      if (b._type === "citation") return { _type: "citation", texte: b.texte, auteur: b.auteur };
      if (b._type === "chiffreCle") {
        return { _type: "chiffreCle", valeur: b.valeur, libelle: b.libelle, source: b.source };
      }
      if (b._type === "image") {
        return {
          _type: "image",
          url: b.image?.url,
          alt: b.image?.alt,
          credit: b.image?.credit,
          legende: b.image?.legende,
          disposition: (b as any).disposition || b.image?.disposition || "standard",
        };
      }
      if (b._type === "moduleVideo") {
        return {
          _type: "moduleVideo",
          youtubeId: b.video?.youtubeId,
          titre: b.video?.titre,
          duree: b.video?.duree,
          miniature: (b.video as any)?.miniature,
        };
      }
      if (b._type === "galerie") {
        return {
          _type: "galerie",
          images: b.images || [],
          layout: (b as any).layout || "carrousel",
        };
      }
      return { _type: "paragraphe", texte: "" };
    });

    setBlocs(formBlocs.length > 0 ? formBlocs : [{ _type: "paragraphe", texte: "" }]);
    setMessagePublication(null);
    setOngletActif("redaction");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    effacerBrouillon();
    setModeEdition({ actif: false, slug: "" });
    setNumeroRef("");
    setTitre("");
    setHeroTitle("");
    setChapo("");
    setImageUrl("");
    setImageDisposition("standard");
    setImageCadrage("center");
    setImageZoom(1);
    setPositionALaUne("standard");
    setVideoPrincipaleUrl("");
    setVideoPrincipaleTitre("");
    setVideoPrincipaleMiniature("");
    setTagsRaw("");
    setDatePublication("");
    setUniversSecondaires([]);
    setMetaTitre("");
    setMetaDescription("");
    setAfficherSeoAvance(false);
    setBlocs([
      { _type: "paragraphe", texte: "" },
      { _type: "laRef", titre: "La référence", texte: "" },
    ]);
  };

  const handleSupprimerArticle = async (slug: string, titreArt: string) => {
    if (!confirm(`Supprimer définitivement l'article « ${titreArt} » ? Cette action est irréversible.`)) {
      return;
    }

    setSuppressionArticleSlug(slug);
    try {
      const res = await fetch(`/api/admin/articles?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setListeArticles((prev) => prev.filter((a) => a.slug !== slug));
        if (modeEdition.actif && modeEdition.slug === slug) {
          annulerModification();
        }
      } else {
        alert(data.error || "Erreur lors de la suppression de l'article");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSuppressionArticleSlug(null);
    }
  };

  // Gestion des blocs de rédaction
  const ajouterBloc = (type: FormBloc["_type"]) => {
    if (type === "paragraphe") {
      setBlocs((prev) => [...prev, { _type: "paragraphe", texte: "" }]);
    } else if (type === "intertitre") {
      setBlocs((prev) => [...prev, { _type: "intertitre", niveau: 2, texte: "" }]);
    } else if (type === "laRef") {
      setBlocs((prev) => [...prev, { _type: "laRef", titre: "La référence", texte: "" }]);
    } else if (type === "citation") {
      setBlocs((prev) => [...prev, { _type: "citation", texte: "", auteur: "" }]);
    } else if (type === "chiffreCle") {
      setBlocs((prev) => [
        ...prev,
        { _type: "chiffreCle", valeur: "100 %", libelle: "Indicateur clé", source: "Talaref Data" },
      ]);
    } else if (type === "image") {
      setBlocs((prev) => [
        ...prev,
        { _type: "image", url: "", alt: "", credit: "Talaref Media", legende: "", disposition: "standard" },
      ]);
    } else if (type === "moduleVideo") {
      setBlocs((prev) => [
        ...prev,
        { _type: "moduleVideo", youtubeId: "", titre: "Vidéo du sujet", duree: 0 },
      ]);
    } else if (type === "galerie") {
      setBlocs((prev) => [
        ...prev,
        { _type: "galerie", images: [], layout: "carrousel" },
      ]);
    }
  };

  const supprimerBloc = (index: number) => {
    setBlocs((prev) => prev.filter((_, i) => i !== index));
  };

  const deplacerBlocVersLeHaut = (index: number) => {
    if (index <= 0) return;
    setBlocs((prev) => {
      const nouveau = [...prev];
      const temp = nouveau[index - 1];
      nouveau[index - 1] = nouveau[index];
      nouveau[index] = temp;
      return nouveau;
    });
  };

  const deplacerBlocVersLeBas = (index: number) => {
    setBlocs((prev) => {
      if (index >= prev.length - 1) return prev;
      const nouveau = [...prev];
      const temp = nouveau[index + 1];
      nouveau[index + 1] = nouveau[index];
      nouveau[index] = temp;
      return nouveau;
    });
  };

  const modifierBloc = (index: number, champ: string, valeur: any) => {
    setBlocs((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [champ]: valeur } : b)),
    );
  };

  const handlePublierArticle = (e: React.FormEvent) => {
    e.preventDefault();
    setMessagePublication(null);

    if (titre.trim().length < 5) {
      setMessagePublication({ type: "erreur", texte: "Veuillez renseigner un titre valide." });
      return;
    }
    if (chapo.trim().length < 20) {
      setMessagePublication({
        type: "erreur",
        texte: "Le chapô doit comporter au moins 20 caractères (résumé accrocheur).",
      });
      return;
    }

    startPublication(async () => {
      try {
        const corpsBlocs: Bloc[] = blocs
          .map((b, i) => {
            const _key = `bloc_${i}_${Date.now()}`;
            if (b._type === "paragraphe") {
              return { _key, _type: "paragraphe", texte: b.texte || "" };
            }
            if (b._type === "intertitre") {
              return { _key, _type: "intertitre", niveau: b.niveau || 2, texte: b.texte || "" };
            }
            if (b._type === "laRef") {
              return {
                _key,
                _type: "laRef",
                titre: b.titre || "La ref",
                texte: b.texte || "",
              };
            }
            if (b._type === "citation") {
              return {
                _key,
                _type: "citation",
                texte: b.texte || "",
                auteur: b.auteur || "Anonyme",
              };
            }
            if (b._type === "chiffreCle") {
              return {
                _key,
                _type: "chiffreCle",
                valeur: b.valeur || "1",
                libelle: b.libelle || "",
                source: b.source || "Talaref",
              };
            }
            if (b._type === "image") {
              return {
                _key,
                _type: "image",
                disposition: b.disposition || "standard",
                image: {
                  url: b.url || "",
                  alt: b.alt || titre || "Photo de l'article",
                  credit: b.credit || "Talaref Media",
                  legende: b.legende || undefined,
                  disposition: b.disposition || "standard",
                },
              };
            }
            if (b._type === "moduleVideo") {
              const parsed = parserSourceVideo(b.youtubeId || "");
              return {
                _key,
                _type: "moduleVideo",
                video: {
                  youtubeId: parsed.valeur || "dQw4w9WgXcQ",
                  titre: b.titre || "Vidéo du sujet",
                  duree: b.duree || 0,
                  misEnLigneLe: new Date().toISOString().split("T")[0],
                  miniature: b.miniature?.trim() || undefined,
                },
              };
            }
            if (b._type === "galerie") {
              return {
                _key,
                _type: "galerie",
                layout: b.layout || "carrousel",
                images: (b.images || []).map((img) => ({
                  url: img.url,
                  alt: img.alt || titre || "Photo de galerie",
                  credit: img.credit || "Talaref Media",
                  legende: img.legende || undefined,
                })),
              };
            }
            return null;
          })
          .filter(Boolean) as Bloc[];

        const videoArticle = videoPrincipaleUrl.trim()
          ? {
              youtubeId: parserSourceVideo(videoPrincipaleUrl.trim()).valeur,
              titre: videoPrincipaleTitre.trim() || titre.trim(),
              duree: 0,
              misEnLigneLe: new Date().toISOString().split("T")[0],
              miniature: videoPrincipaleMiniature.trim() || undefined,
            }
          : undefined;

        const methode = modeEdition.actif ? "PUT" : "POST";
        const payload = {
          slug: modeEdition.actif ? modeEdition.slug : undefined,
          refNumber:
            numeroRef !== "" && !isNaN(Number(numeroRef))
              ? Number(numeroRef)
              : modeEdition.actif
                ? modeEdition.refNumber
                : undefined,
          titre,
          heroTitle,
          chapo,
          univers,
          universSecondaires,
          collection: collection || undefined,
          imageUrl,
          imageCredit,
          imageAlt,
          imageDisposition,
          imageCadrage,
          imageZoom,
          format: positionALaUne,
          positionALaUne,
          tagsRaw,
          publieLe: datePublication ? new Date(datePublication).toISOString() : undefined,
          metaTitre: metaTitre.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          corps: corpsBlocs,
          video: videoArticle,
          auteurNom: user?.user_metadata?.full_name || user?.user_metadata?.pseudonyme || "La rédaction",
          auteurSlug: "redaction",
        };

        const res = await fetch("/api/admin/articles", {
          method: methode,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success && data.article) {
          setMessagePublication({
            type: "succes",
            texte: modeEdition.actif
              ? `L'article « ${data.article.titre} » a été mis à jour avec succès !`
              : `L'article « ${data.article.titre} » a été publié avec succès !`,
            url: data.url,
          });
          chargerArticles();
          effacerBrouillon();
          if (modeEdition.actif) {
            setModeEdition({ actif: false, slug: "" });
          }
          // Réinitialiser les champs principaux
          setTitre("");
          setNumeroRef("");
          setHeroTitle("");
          setChapo("");
          setImageUrl("");
          setImageDisposition("standard");
          setImageCadrage("center");
          setPositionALaUne("standard");
          setVideoPrincipaleUrl("");
          setVideoPrincipaleTitre("");
          setTagsRaw("");
          setDatePublication("");
          setUniversSecondaires([]);
          setMetaTitre("");
          setMetaDescription("");
          setAfficherSeoAvance(false);
          setBlocs([
            { _type: "paragraphe", texte: "" },
            { _type: "laRef", titre: "La référence", texte: "" },
          ]);
        } else {
          setMessagePublication({ type: "erreur", texte: data.error || "Erreur de traitement." });
        }
      } catch {
        setMessagePublication({ type: "erreur", texte: "Erreur lors de la communication avec le serveur." });
      }
    });
  };

  const handleChangerRole = async (userId: string, newRole: UserRole) => {
    setActionUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUtilisateurs((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      } else {
        alert(data.error || "Erreur lors de la mise à jour du rôle");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setActionUserId(null);
    }
  };

  const handleSupprimerUser = async (userId: string, pseudo: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${pseudo} ?`)) return;

    setActionUserId(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUtilisateurs((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setActionUserId(null);
    }
  };

  if (chargement) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-12">
        <p className="font-mono text-sm text-gris">Vérification des droits d'accès...</p>
      </main>
    );
  }

  // Si membre simple : refus d'accès
  if (role !== "redacteur" && role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-lg border border-encre/40 bg-surface p-8">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-encre">
            Accès restreint
          </span>
          <h1 className="mt-3 text-2xl font-black text-blanc">Espace Rédaction</h1>
          <p className="mt-3 text-sm text-gris">
            Cette interface est réservée aux rédacteurs et aux administrateurs de Talaref Média.
          </p>
          <div className="mt-6">
            <Link
              href="/compte"
              className="inline-block rounded bg-surface-2 px-4 py-2 text-xs font-bold text-blanc hover:bg-ligne"
            >
              Retour à mon compte
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const collectionsDisponibles = getCollectionsForUnivers(univers);
  const usersFiltres = utilisateurs.filter(
    (u) =>
      u.email.toLowerCase().includes(rechercheUser.toLowerCase()) ||
      u.pseudonyme.toLowerCase().includes(rechercheUser.toLowerCase()),
  );

  const articlesFiltres = listeArticles.filter((art) => {
    const q = rechercheArticle.toLowerCase().trim();
    const matchRecherche =
      !q ||
      art.titre.toLowerCase().includes(q) ||
      art.slug.toLowerCase().includes(q) ||
      art.tags?.some((t) => t.nom.toLowerCase().includes(q));
    const matchUnivers = universFiltre === "tous" || art.univers === universFiltre;
    return matchRecherche && matchUnivers;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header Administration */}
      <header className="mb-8 border-b border-ligne pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-nexus">
                Talaref Studio
              </span>
              <span className="rounded bg-nexus/20 px-2 py-0.5 text-[0.625rem] font-bold uppercase text-nexus">
                {role === "admin" ? "Super Admin" : "Rédacteur"}
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-blanc">Console Éditoriale</h1>
          </div>

          <div className="flex flex-wrap gap-2 border border-ligne bg-surface p-1 rounded-md">
            <button
              type="button"
              onClick={() => setOngletActif("redaction")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                ongletActif === "redaction"
                  ? "bg-nexus text-noir"
                  : "text-gris hover:text-blanc"
              }`}
            >
              ✍️ Rédaction (Medium)
            </button>
            {role === "admin" && (
              <button
                type="button"
                onClick={() => {
                  setOngletActif("articles");
                  chargerArticles();
                }}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                  ongletActif === "articles"
                    ? "bg-nexus text-noir"
                    : "text-gris hover:text-blanc"
                }`}
              >
                📑 Tous les articles ({listeArticles.length})
              </button>
            )}
            {role === "admin" && (
              <button
                type="button"
                onClick={() => setOngletActif("utilisateurs")}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${
                  ongletActif === "utilisateurs"
                    ? "bg-nexus text-noir"
                    : "text-gris hover:text-blanc"
                }`}
              >
                👥 Utilisateurs & Droits
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ONGLET RÉDACTION STYLE MEDIUM */}
      {ongletActif === "redaction" && (
        <section className="space-y-8">
          {modeEdition.actif && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-nexus/70 bg-nexus/10 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                <div>
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-nexus">
                    Mode Modification (Admin)
                  </div>
                  <div className="text-sm font-bold text-blanc">
                    Modification en cours : <span className="underline">{titre || modeEdition.slug}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={annulerModification}
                className="rounded border border-ligne bg-surface px-3 py-1.5 text-xs font-bold text-blanc hover:border-nexus hover:text-nexus transition-colors"
              >
                ✕ Annuler et créer un nouvel article
              </button>
            </div>
          )}

          {messagePublication && (
            <div
              className={`rounded-md p-4 text-sm font-semibold ${
                messagePublication.type === "succes"
                  ? "border border-arena/40 bg-arena/10 text-arena"
                  : "border border-encre/40 bg-encre/10 text-encre"
              }`}
            >
              {messagePublication.texte}
              {messagePublication.url && (
                <div className="mt-2">
                  <Link
                    href={messagePublication.url}
                    className="inline-block font-bold text-blanc underline hover:text-arena"
                  >
                    Voir l'article en ligne →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Bannière de récupération du brouillon automatique */}
          {brouillonDisponible && !modeEdition.actif && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent/60 bg-accent/10 p-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💾</span>
                <div>
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-accent">
                    Brouillon non publié retrouvé
                  </div>
                  <div className="text-sm font-semibold text-blanc">
                    Un travail en cours a été sauvegardé en cache dans votre navigateur {brouillonInfoDate ? `(${brouillonInfoDate})` : ""}.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restaurerBrouillon}
                  className="rounded bg-accent px-4 py-2 text-xs font-bold text-noir hover:bg-accent/90 transition-all shadow-sm active:scale-95"
                >
                  ✓ Reprendre la rédaction
                </button>
                <button
                  type="button"
                  onClick={effacerBrouillon}
                  className="rounded border border-ligne bg-surface px-3 py-2 text-xs font-semibold text-gris hover:text-encre hover:border-encre/40 transition-colors"
                >
                  ✕ Ignorer et effacer
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handlePublierArticle} className="space-y-8">
            {/* Barre de statut de sauvegarde automatique & Actions brouillon */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-gris">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full transition-colors ${
                    brouillonSauvegardeLe
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                      : "bg-gris/40"
                  }`}
                />
                <span className="font-mono text-[11px]">
                  {brouillonSauvegardeLe
                    ? `Sauvegarde auto en cache local à ${brouillonSauvegardeLe}`
                    : "Sauvegarde auto en cache local active"}
                </span>
                <span className="hidden sm:inline text-[10px] text-gris/60">
                  (0 impact sur les lecteurs du site)
                </span>
              </div>
              {(titre.trim() || chapo.trim() || blocs.some((b) => b.texte && b.texte.trim())) && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Voulez-vous vraiment effacer le brouillon de secours sauvegardé dans votre navigateur ?")) {
                      effacerBrouillon();
                    }
                  }}
                  className="text-[11px] font-medium text-gris hover:text-encre transition-colors underline underline-offset-2"
                >
                  Vider le cache du brouillon
                </button>
              )}
            </div>
            {/* Barre de métadonnées légères */}
            <div className="grid gap-4 rounded-lg border border-ligne bg-surface p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                  Univers propriétaire
                </label>
                <select
                  value={univers}
                  onChange={(e) => {
                    const u = e.target.value as UniverseSlug;
                    setUnivers(u);
                    setCollection("");
                  }}
                  className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs font-bold text-blanc focus:border-nexus focus:outline-none"
                >
                  {UNIVERS.map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.nom} — {u.territoire}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                  À la une (Accueil)
                </label>
                <select
                  value={positionALaUne}
                  onChange={(e) => setPositionALaUne(e.target.value as PositionALaUne)}
                  className={`mt-1.5 w-full rounded border p-2 text-xs font-bold focus:border-nexus focus:outline-none transition-colors ${
                    positionALaUne !== "standard"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-ligne bg-noir text-blanc"
                  }`}
                >
                  <option value="standard">Automatique (selon date)</option>
                  <option value="une_1">⭐ Grande Une (#1)</option>
                  <option value="une_2">⭐ Deuxième Une (#2)</option>
                  <option value="une_3">⭐ Troisième Une (#3)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                    Numéro d'article (#REF)
                  </label>
                  <span className="font-mono text-[10px] text-nexus">
                    {numeroRef !== ""
                      ? `REF:${univers.toUpperCase()}/${String(numeroRef).padStart(3, "0")}`
                      : "Auto (selon dernier)"}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={numeroRef}
                  onChange={(e) => setNumeroRef(e.target.value)}
                  placeholder="Auto (ex: 1)"
                  className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs font-mono text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
                />
              </div>

              {collectionsDisponibles.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                    Collection (optionnel)
                  </label>
                  <select
                    value={collection}
                    onChange={(e) => setCollection(e.target.value as CollectionSlug)}
                    className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs font-bold text-blanc focus:border-nexus focus:outline-none"
                  >
                    <option value="">Aucune (Univers Pop standard)</option>
                    {collectionsDisponibles.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.nom} ({c.territoire})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                  Tags libres (séparés par virgules)
                </label>
                <input
                  type="text"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="Cinéma, IA, Tournage..."
                  className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                    Date de publication
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const annee = now.getFullYear();
                      const mois = String(now.getMonth() + 1).padStart(2, "0");
                      const jour = String(now.getDate()).padStart(2, "0");
                      const heures = String(now.getHours()).padStart(2, "0");
                      const minutes = String(now.getMinutes()).padStart(2, "0");
                      setDatePublication(`${annee}-${mois}-${jour}T${heures}:${minutes}`);
                    }}
                    className="text-[10px] font-mono text-accent hover:underline"
                    title="Régler sur l'heure actuelle"
                  >
                    Maintenant ⚡
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={datePublication}
                  onChange={(e) => setDatePublication(e.target.value)}
                  className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs font-mono text-blanc focus:border-nexus focus:outline-none"
                />
              </div>

              {/* Univers / Rubriques secondaires pour multi-diffusion */}
              <div className="col-span-full border-t border-ligne/70 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-blanc">
                    Univers / Rubriques secondaires (croisements thématiques)
                  </label>
                  <span className="font-mono text-[0.625rem] text-gris">
                    {universSecondaires.length > 0
                      ? `${universSecondaires.length} univers supplémentaire${universSecondaires.length > 1 ? "s" : ""} sélectionné${universSecondaires.length > 1 ? "s" : ""}`
                      : "Optionnel (ex: Agora pour politique + Nexus pour tech)"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {UNIVERS.filter((u) => u.slug !== univers).map((u) => {
                    const estCoche = universSecondaires.includes(u.slug);
                    return (
                      <button
                        key={u.slug}
                        type="button"
                        onClick={() => {
                          setUniversSecondaires((prev) =>
                            estCoche ? prev.filter((s) => s !== u.slug) : [...prev, u.slug],
                          );
                        }}
                        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-bold transition-all ${
                          estCoche
                            ? "border-nexus bg-nexus text-noir shadow-sm shadow-nexus/20"
                            : "border-ligne bg-noir text-gris hover:border-gris hover:text-blanc"
                        }`}
                      >
                        <span>{estCoche ? "✓" : "+"}</span>
                        <span>{u.nom}</span>
                        <span className="text-[0.625rem] opacity-70">({u.territoire})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Expérience d'écriture à la Medium : distraction-free */}
            <div className="rounded-xl border border-ligne/80 bg-surface/30 p-6 sm:p-10">
              {/* Grand Titre */}
              <div className="mb-6">
                <input
                  type="text"
                  required
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Titre de l'article..."
                  className="w-full bg-transparent font-black tracking-tight text-blanc placeholder:text-gris/40 text-3xl sm:text-5xl focus:outline-none"
                />
                <span className="mt-1 block font-mono text-[0.625rem] text-gris">
                  {titre.length} signes (recommandé : 30 à 65)
                </span>
              </div>

              {/* Titre Hero alternatif (optionnel) */}
              <div className="mb-6">
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Titre Hero accrocheur pour la home (optionnel)..."
                  className="w-full bg-transparent font-mono text-sm uppercase tracking-wider text-pop placeholder:text-gris/40 focus:outline-none"
                />
              </div>

              {/* Chapô */}
              <div className="mb-8">
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gris">
                  Chapô de l&apos;article (Introduction / Résumé)
                </label>
                <div className="rounded border-l-2 border-nexus bg-surface/30 p-3">
                  <EditeurTexteRiche
                    valeur={chapo}
                    onChange={setChapo}
                    rows={3}
                    placeholder="Écrivez un chapô accrocheur (résumé de l'article, méta-description)..."
                    className="text-base text-gris-clair"
                  />
                </div>
                <span className="mt-1 block font-mono text-[0.625rem] text-gris">
                  {chapo.length} signes (recommandé : 200 à 320)
                </span>
              </div>

              {/* Image de Une */}
              <div className="mb-10 rounded-lg border border-ligne/70 bg-noir/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blanc">
                      Image de couverture — max 2 Mo ou lien web direct
                    </p>
                    <p className="mt-0.5 text-[11px] text-gris">
                      S'adapte automatiquement selon l'orientation (Paysage, Portrait, Carré, ou Photo entière sans rognage).
                    </p>
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-xs text-encre hover:underline"
                    >
                      ✕ Retirer la photo
                    </button>
                  )}
                </div>

                {/* Aperçu interactif double : Page d'accueil (16:9) & Page Article */}
                {imageUrl ? (
                  <div className="mb-5 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* 1. Aperçu Carte Accueil (16:9) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-gris">
                          <span className="flex items-center gap-1.5 text-blanc font-bold">
                            <span>🏠</span> Aperçu Carte Accueil (16:9)
                          </span>
                          <span className="text-[10px] text-accent font-mono font-bold">
                            {imageDisposition === "adaptatif" ? "✨ Mode Adaptatif" : "Format 16:9"} · Zoom: {Math.round(imageZoom * 100)}% · Pos: {parseCadragePourcentage(imageCadrage)}%
                          </span>
                        </div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-ligne bg-surface-2 shadow-inner">
                          {imageDisposition === "adaptatif" ? (
                            <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover blur-xl opacity-45 scale-110"
                              />
                              <div className="absolute inset-0 bg-noir/35 backdrop-blur-[1px]" />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt="Aperçu Accueil"
                                style={{
                                  objectPosition: formaterObjectPosition(imageCadrage),
                                  transform: formaterImageTransform(imageZoom, imageCadrage, true),
                                }}
                                className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-150 ease-out"
                              />
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt="Aperçu Accueil"
                              style={{
                                objectPosition: formaterObjectPosition(imageCadrage),
                                transform: formaterImageTransform(imageZoom, imageCadrage, false),
                              }}
                              className="h-full w-full object-cover transition-all duration-150 ease-out"
                            />
                          )}
                          <div className="absolute bottom-1.5 left-2 z-20 rounded bg-noir/85 px-2 py-0.5 font-mono text-[9px] text-blanc border border-blanc/10">
                            Grille Accueil
                          </div>
                        </div>
                      </div>

                      {/* 2. Aperçu Page Article */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-gris">
                          <span className="flex items-center gap-1.5 text-blanc font-bold">
                            <span>📄</span> Aperçu Page Article
                          </span>
                          <span className="text-[10px] text-nexus font-mono font-bold">
                            {imageDisposition === "standard" && "16:9 Paysage (Plein cadre)"}
                            {imageDisposition === "portrait" && "3:4 Portrait"}
                            {imageDisposition === "carre" && "1:1 Carré"}
                            {imageDisposition === "adaptatif" && "Adaptatif (Entier)"}
                          </span>
                        </div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-ligne bg-surface-2 flex items-center justify-center">
                          {imageDisposition === "adaptatif" ? (
                            <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 h-full w-full object-cover blur-xl opacity-40 scale-110"
                              />
                              <div className="absolute inset-0 bg-noir/30 backdrop-blur-[1px]" />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt="Aperçu Article"
                                style={{
                                  objectPosition: formaterObjectPosition(imageCadrage),
                                  transform: formaterImageTransform(imageZoom, imageCadrage, true),
                                }}
                                className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-150 ease-out"
                              />
                            </div>
                          ) : (
                            <div
                              className={`relative overflow-hidden h-full ${
                                imageDisposition === "portrait"
                                  ? "aspect-[3/4] mx-auto"
                                  : imageDisposition === "carre"
                                    ? "aspect-square mx-auto"
                                    : "w-full"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={imageAlt || "Aperçu Article"}
                                style={{
                                  objectPosition: formaterObjectPosition(imageCadrage),
                                  transform: formaterImageTransform(imageZoom, imageCadrage, false),
                                }}
                                className="h-full w-full object-cover transition-all duration-150 ease-out"
                              />
                            </div>
                          )}
                          <div className="absolute bottom-1.5 left-2 z-20 rounded bg-noir/85 px-2 py-0.5 font-mono text-[9px] text-blanc border border-blanc/10">
                            Page Article
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Commandes d'orientation, de zoom et de cadrage focal */}
                <div className="mb-5 space-y-4 rounded-md border border-ligne/60 bg-surface/60 p-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-blanc">
                        1. Présentation de la photo dans le cadre
                      </label>
                      <span className="text-[10px] text-gris font-mono">
                        {imageDisposition === "standard"
                          ? "✓ Mode plein cadre (remplit tout le 16:9)"
                          : imageDisposition === "adaptatif"
                            ? "✓ Mode photo entière (avec flou sur les côtés)"
                            : "✓ Mode " + imageDisposition}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => setImageDisposition("standard")}
                        className={`flex flex-col items-center justify-center gap-1 rounded p-2.5 text-xs transition-all ${
                          imageDisposition === "standard"
                            ? "bg-accent text-noir font-bold shadow ring-2 ring-accent/40"
                            : "border border-ligne bg-noir text-gris hover:text-blanc hover:border-blanc/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>🏞️</span>
                          <span>Paysage (16:9)</span>
                        </div>
                        <span className="text-[9px] opacity-80">Remplir tout le cadre</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageDisposition("adaptatif")}
                        className={`flex flex-col items-center justify-center gap-1 rounded p-2.5 text-xs transition-all ${
                          imageDisposition === "adaptatif"
                            ? "bg-accent text-noir font-bold shadow ring-2 ring-accent/40"
                            : "border border-ligne bg-noir text-gris hover:text-blanc hover:border-blanc/30"
                        }`}
                        title="Affiche toute la hauteur de la photo au centre sans couper, avec flou d'ambiance sur les côtés"
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>✨</span>
                          <span>Photo entière</span>
                        </div>
                        <span className="text-[9px] opacity-80">Adaptatif (Flou côtés)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageDisposition("portrait")}
                        className={`flex flex-col items-center justify-center gap-1 rounded p-2.5 text-xs transition-all ${
                          imageDisposition === "portrait"
                            ? "bg-accent text-noir font-bold shadow ring-2 ring-accent/40"
                            : "border border-ligne bg-noir text-gris hover:text-blanc hover:border-blanc/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>📱</span>
                          <span>Portrait (3:4)</span>
                        </div>
                        <span className="text-[9px] opacity-80">Format vertical mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageDisposition("carre")}
                        className={`flex flex-col items-center justify-center gap-1 rounded p-2.5 text-xs transition-all ${
                          imageDisposition === "carre"
                            ? "bg-accent text-noir font-bold shadow ring-2 ring-accent/40"
                            : "border border-ligne bg-noir text-gris hover:text-blanc hover:border-blanc/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>⬛</span>
                          <span>Carré (1:1)</span>
                        </div>
                        <span className="text-[9px] opacity-80">Format carré</span>
                      </button>
                    </div>
                  </div>

                  {/* Curseur de Redimensionnement / Zoom */}
                  <div className="pt-3 border-t border-ligne/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blanc flex items-center gap-1.5">
                        <span>🔍</span> 2. Redimensionner & Zoomer l&apos;image
                      </label>
                      <span className="font-mono text-xs font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded border border-accent/30">
                        Échelle : {Math.round(imageZoom * 100)}%
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gris min-w-[50px]">70% (Dézoom)</span>
                        <input
                          type="range"
                          min="0.7"
                          max="2.0"
                          step="0.05"
                          value={imageZoom}
                          onChange={(e) => setImageZoom(parseFloat(e.target.value))}
                          className="w-full h-2 rounded-lg bg-surface-2 border border-ligne accent-accent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gris text-right min-w-[50px]">200% (Zoom max)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                        {[
                          { val: 0.8, label: "80% Réduit" },
                          { val: 1.0, label: "100% Normal" },
                          { val: 1.25, label: "125% Agrandir" },
                          { val: 1.5, label: "150% Zoom" },
                          { val: 1.8, label: "180% Rapproché" },
                        ].map((z) => {
                          const actif = Math.abs(imageZoom - z.val) < 0.03;
                          return (
                            <button
                              key={z.val}
                              type="button"
                              onClick={() => setImageZoom(z.val)}
                              className={`rounded border px-2 py-1.5 text-xs font-semibold transition-all ${
                                actif
                                  ? "border-accent bg-accent text-noir font-bold shadow"
                                  : "border-ligne bg-noir text-gris hover:border-blanc/30 hover:text-blanc"
                              }`}
                            >
                              {z.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Curseur de recadrage vertical */}
                  <div className="pt-3 border-t border-ligne/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blanc flex items-center gap-1.5">
                        <span>🎚️</span> 3. Recadrage vertical (Hauteur / Sujet)
                      </label>
                      <span className="font-mono text-xs font-bold text-nexus bg-nexus/15 px-2.5 py-0.5 rounded border border-nexus/30">
                        {parseCadragePourcentage(imageCadrage)}% —{" "}
                        {parseCadragePourcentage(imageCadrage) <= 15
                          ? "Haut (Ciel / Tête)"
                          : parseCadragePourcentage(imageCadrage) <= 35
                            ? "Visage / Regard"
                            : parseCadragePourcentage(imageCadrage) <= 65
                              ? "Centre"
                              : parseCadragePourcentage(imageCadrage) <= 85
                                ? "Buste / Tenue"
                                : "Bas / Voiture / Sol"}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gris min-w-[50px]">0% (Haut)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={parseCadragePourcentage(imageCadrage)}
                          onChange={(e) => setImageCadrage(`${e.target.value}%`)}
                          className="w-full h-2 rounded-lg bg-surface-2 border border-ligne accent-nexus cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-gris text-right min-w-[50px]">100% (Bas)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                        {[
                          { val: "0%", pct: 0, label: "⬆️ 0% Haut" },
                          { val: "25%", pct: 25, label: "👤 25% Visage" },
                          { val: "50%", pct: 50, label: "⏺️ 50% Centre" },
                          { val: "75%", pct: 75, label: "👗 75% Tenue" },
                          { val: "100%", pct: 100, label: "⬇️ 100% Bas" },
                        ].map((p) => {
                          const actif = parseCadragePourcentage(imageCadrage) === p.pct;
                          return (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() => setImageCadrage(p.val)}
                              className={`rounded border px-2 py-1.5 text-xs font-semibold transition-all ${
                                actif
                                  ? "border-nexus bg-nexus text-noir font-bold shadow"
                                  : "border-ligne bg-noir text-gris hover:border-blanc/30 hover:text-blanc"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-gris/80 pt-1">
                        💡 <strong>Astuce :</strong> Ajustez la taille avec le curseur de zoom et la hauteur avec le curseur de recadrage. L&apos;aperçu « Carte Accueil (16:9) » au-dessus réagit instantanément !
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Coller l'URL directe d'une image (ex: https://images.unsplash.com/...)"
                        className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                      />
                      <label className="shrink-0 cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-2 text-xs font-bold text-blanc transition-colors hover:bg-ligne flex items-center gap-1.5">
                        {uploadEnCoursUne ? (
                          <span>Upload...</span>
                        ) : (
                          <>
                            <span>📷</span>
                            <span>Uploader (≤ 2 Mo)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadEnCoursUne}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadEnCoursUne(true);
                            try {
                              const url = await televerserFichier(file);
                              setImageUrl(url);
                              if (!imageAlt) setImageAlt(titre || file.name);
                            } catch (err: any) {
                              alert(err.message || "Erreur lors de l'upload");
                            } finally {
                              setUploadEnCoursUne(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={imageCredit}
                      onChange={(e) => setImageCredit(e.target.value)}
                      placeholder="Crédit photo (obligatoire)"
                      className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Description alternative de l'image (alt accessibilité)..."
                    className="w-full rounded border border-ligne/60 bg-noir/50 p-2 text-xs text-gris placeholder:text-gris/40 focus:border-nexus focus:outline-none"
                  />
                </div>
              </div>

              {/* Vidéo principale de l'article (optionnel) */}
              <div className="mb-10 rounded-lg border border-ligne/70 bg-noir/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gris flex items-center gap-1.5">
                    🎬 Vidéo principale de l'article (YouTube, Vimeo ou vidéo directe)
                  </span>
                  {videoPrincipaleUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideoPrincipaleUrl("");
                        setVideoPrincipaleTitre("");
                        setVideoPrincipaleMiniature("");
                      }}
                      className="text-xs text-encre hover:underline"
                    >
                      ✕ Retirer la vidéo
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={videoPrincipaleUrl}
                    onChange={(e) => setVideoPrincipaleUrl(e.target.value)}
                    placeholder="Lien YouTube (youtube.com/...), Vimeo (vimeo.com/...) ou vidéo directe..."
                    className="rounded border border-ligne bg-noir p-2 text-xs text-blanc sm:col-span-2 focus:border-nexus focus:outline-none"
                  />
                  <input
                    type="text"
                    value={videoPrincipaleTitre}
                    onChange={(e) => setVideoPrincipaleTitre(e.target.value)}
                    placeholder="Titre de la vidéo"
                    className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                  />
                </div>

                {/* Miniature de la vidéo principale */}
                {videoPrincipaleUrl && (() => {
                  const parsedMain = parserSourceVideo(videoPrincipaleUrl);
                  const idMainYouTube = parsedMain.type === "youtube" ? parsedMain.valeur : null;

                  return (
                    <div className="space-y-3 pt-2 border-t border-ligne/40">
                      <div className="rounded border border-ligne/70 bg-surface-2/40 p-2.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[0.6875rem] uppercase font-bold text-gris tracking-wide">
                            🖼️ Miniature de la vidéo principale
                          </span>
                          <div className="flex items-center gap-2">
                            {idMainYouTube && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVideoPrincipaleMiniature(`https://i.ytimg.com/vi/${idMainYouTube}/hqdefault.jpg`);
                                }}
                                className="text-[0.6875rem] font-bold text-nexus hover:underline"
                              >
                                ✨ Récupérer miniature YouTube
                              </button>
                            )}
                            {videoPrincipaleMiniature && (
                              <button
                                type="button"
                                onClick={() => setVideoPrincipaleMiniature("")}
                                className="text-[0.6875rem] text-encre hover:underline"
                              >
                                ✕ Rétablir automatique
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="text"
                            value={videoPrincipaleMiniature}
                            onChange={(e) => setVideoPrincipaleMiniature(e.target.value)}
                            placeholder={
                              idMainYouTube
                                ? "Automatique (miniature YouTube officielle) ou collez une URL personnalisée..."
                                : "URL de la miniature personnalisée (ou uploadez un fichier image)..."
                            }
                            className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                          />
                          <label className="shrink-0 cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-2 text-xs font-bold text-blanc hover:bg-ligne flex items-center gap-1">
                            {uploadEnCoursMiniaturePrincipale ? "Upload..." : "📁 Uploader miniature"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadEnCoursMiniaturePrincipale}
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setUploadEnCoursMiniaturePrincipale(true);
                                try {
                                  const url = await televerserFichier(f);
                                  setVideoPrincipaleMiniature(url);
                                } catch (err: any) {
                                  alert(err.message || "Erreur upload image");
                                } finally {
                                  setUploadEnCoursMiniaturePrincipale(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="max-w-md">
                        <p className="mb-1.5 font-mono text-[0.625rem] uppercase text-gris">
                          Aperçu de la vidéo principale :
                        </p>
                        <FacadeVideo
                          youtubeId={videoPrincipaleUrl}
                          titre={videoPrincipaleTitre || "Aperçu vidéo"}
                          miniature={videoPrincipaleMiniature}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Blocs du corps d'article */}
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ligne pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-blanc">
                    Corps de l'article ({blocs.length} bloc{blocs.length > 1 ? "s" : ""})
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => ajouterBloc("paragraphe")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Paragraphe
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("intertitre")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Intertitre
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("image")}
                      className="min-h-[38px] rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-noir active:scale-95 transition-all"
                    >
                      📷 + Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("moduleVideo")}
                      className="min-h-[38px] rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-noir active:scale-95 transition-all"
                    >
                      🎬 + Vidéo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("galerie")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      🖼 + Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("laRef")}
                      className="min-h-[38px] rounded border border-pop/40 bg-pop/10 px-3 py-1.5 text-xs font-bold text-pop hover:bg-pop hover:text-noir active:scale-95 transition-all"
                    >
                      + La Ref ★
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("citation")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Citation
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("chiffreCle")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Chiffre clé
                    </button>
                  </div>
                </div>

                {blocs.map((bloc, index) => (
                  <div
                    key={index}
                    className="group relative rounded-md border border-ligne/60 bg-noir/50 p-4 transition-colors hover:border-ligne"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-ligne/40 pb-2 text-xs text-gris">
                      <div className="flex items-center gap-2">
                        {/* Boutons pour translater / monter / descendre les blocs */}
                        <div className="flex items-center rounded border border-ligne bg-surface p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => deplacerBlocVersLeHaut(index)}
                            disabled={index === 0}
                            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-all ${
                              index === 0
                                ? "cursor-not-allowed text-gris/25"
                                : "text-gris hover:bg-surface-2 hover:text-blanc active:scale-95"
                            }`}
                            title="Monter ce bloc vers le haut (▲)"
                            aria-label="Monter le bloc"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deplacerBlocVersLeBas(index)}
                            disabled={index === blocs.length - 1}
                            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-all ${
                              index === blocs.length - 1
                                ? "cursor-not-allowed text-gris/25"
                                : "text-gris hover:bg-surface-2 hover:text-blanc active:scale-95"
                            }`}
                            title="Descendre ce bloc vers le bas (▼)"
                            aria-label="Descendre le bloc"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <span className="font-mono font-bold uppercase text-gris-clair">
                          Bloc {index + 1} <span className="text-gris">· {bloc._type}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => supprimerBloc(index)}
                        className="rounded p-1 text-gris transition-colors hover:bg-encre/10 hover:text-encre"
                        title="Supprimer ce bloc"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Bloc Paragraphe */}
                    {bloc._type === "paragraphe" && (
                      <EditeurTexteRiche
                        rows={4}
                        valeur={bloc.texte || ""}
                        onChange={(val) => modifierBloc(index, "texte", val)}
                        placeholder="Rédigez votre paragraphe ici..."
                      />
                    )}

                    {/* Bloc Intertitre */}
                    {bloc._type === "intertitre" && (
                      <input
                        type="text"
                        value={bloc.texte || ""}
                        onChange={(e) => modifierBloc(index, "texte", e.target.value)}
                        placeholder="Intertitre de section..."
                        className="w-full bg-transparent text-xl font-black text-blanc placeholder:text-gris/40 focus:outline-none"
                      />
                    )}

                    {/* Bloc Photo / Image */}
                    {bloc._type === "image" && (
                      <BlocImageEditor
                        bloc={bloc}
                        index={index}
                        modifierBloc={modifierBloc}
                      />
                    )}

                    {/* Bloc Vidéo */}
                    {bloc._type === "moduleVideo" && (
                      <BlocVideoEditor
                        bloc={bloc}
                        index={index}
                        modifierBloc={modifierBloc}
                      />
                    )}

                    {/* Bloc Galerie */}
                    {bloc._type === "galerie" && (
                      <BlocGalerieEditor
                        bloc={bloc}
                        index={index}
                        modifierBloc={modifierBloc}
                      />
                    )}

                    {/* Bloc La Ref */}
                    {bloc._type === "laRef" && (
                      <div className="rounded border-l-4 border-pop bg-surface p-4">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-pop">
                          Bloc Signature — La Ref
                        </span>
                        <input
                          type="text"
                          value={bloc.titre || ""}
                          onChange={(e) => modifierBloc(index, "titre", e.target.value)}
                          placeholder="Titre de la référence (ex: L'effet Koulechov, Le Buster Call)..."
                          className="mt-1 w-full bg-transparent font-bold text-blanc placeholder:text-gris/40 focus:outline-none"
                        />
                        <div className="mt-3 pt-2 border-t border-ligne/30">
                          <EditeurTexteRiche
                            rows={3}
                            valeur={bloc.texte || ""}
                            onChange={(val) => modifierBloc(index, "texte", val)}
                            placeholder="Expliquez la référence, l'easter egg, le sample ou le fait historique..."
                            className="text-xs text-gris-clair"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bloc Citation */}
                    {bloc._type === "citation" && (
                      <div className="border-l-2 border-blanc pl-4 space-y-2">
                        <EditeurTexteRiche
                          rows={2}
                          valeur={bloc.texte || ""}
                          onChange={(val) => modifierBloc(index, "texte", val)}
                          placeholder="« Citation inspirante ou marquante... »"
                          className="italic text-blanc"
                        />
                        <input
                          type="text"
                          value={bloc.auteur || ""}
                          onChange={(e) => modifierBloc(index, "auteur", e.target.value)}
                          placeholder="Auteur de la citation"
                          className="mt-1 w-full bg-transparent text-xs text-gris focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Bloc Chiffre Clé */}
                    {bloc._type === "chiffreCle" && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          value={bloc.valeur || ""}
                          onChange={(e) => modifierBloc(index, "valeur", e.target.value)}
                          placeholder="Ex: 85 % ou 40 M€"
                          className="font-black text-nexus bg-transparent text-2xl focus:outline-none"
                        />
                        <input
                          type="text"
                          value={bloc.libelle || ""}
                          onChange={(e) => modifierBloc(index, "libelle", e.target.value)}
                          placeholder="Ex: hausse des écoutes"
                          className="bg-transparent text-xs text-blanc focus:outline-none"
                        />
                        <input
                          type="text"
                          value={bloc.source || ""}
                          onChange={(e) => modifierBloc(index, "source", e.target.value)}
                          placeholder="Source du chiffre"
                          className="bg-transparent text-xs text-gris focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Boutons d'ajout de bloc en bas de liste (idéal sur mobile) */}
                <div className="flex flex-col gap-2 rounded-lg border border-dashed border-ligne/70 bg-surface/20 p-4 text-center">
                  <span className="font-mono text-xs text-gris">
                    + Ajouter un nouveau bloc à la fin de l&apos;article :
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => ajouterBloc("paragraphe")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Paragraphe
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("intertitre")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Intertitre
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("image")}
                      className="min-h-[38px] rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-noir active:scale-95 transition-all"
                    >
                      📷 + Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("moduleVideo")}
                      className="min-h-[38px] rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-noir active:scale-95 transition-all"
                    >
                      🎬 + Vidéo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("galerie")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      🖼 + Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("laRef")}
                      className="min-h-[38px] rounded border border-pop/40 bg-pop/10 px-3 py-1.5 text-xs font-bold text-pop hover:bg-pop hover:text-noir active:scale-95 transition-all"
                    >
                      + La Ref ★
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("citation")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Citation
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("chiffreCle")}
                      className="min-h-[38px] rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-medium text-blanc hover:bg-ligne active:scale-95 transition-all"
                    >
                      + Chiffre clé
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION RÉFÉRENCEMENT GOOGLE & APERÇU SERP (SEO) */}
              <div className="mt-12 rounded-xl border border-ligne bg-surface/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ligne pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-nexus/10 text-lg text-nexus">
                      🔍
                    </span>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-blanc">
                        Aperçu Référencement Google (SERP Preview)
                      </h3>
                      <p className="text-xs text-gris">
                        Simulez en direct la manière dont l'article apparaîtra sur les moteurs de recherche.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAfficherSeoAvance((prev) => !prev)}
                    className="rounded border border-ligne bg-surface px-3 py-1.5 text-xs font-bold text-blanc hover:border-nexus hover:text-nexus transition-colors"
                  >
                    {afficherSeoAvance ? "Masquer les réglages SEO" : "✏️ Personnaliser Titre & Meta"}
                  </button>
                </div>

                {/* Simulation de résultat Google réaliste */}
                <div className="mt-4 rounded-lg border border-ligne/80 bg-[#161718] p-4 sm:p-5 font-sans">
                  {/* Fil d'Ariane Google */}
                  <div className="flex items-center gap-2 text-xs text-[#bdc1c6]">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-noir border border-ligne text-[0.625rem] font-black text-nexus">
                      T
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 truncate">
                      <span className="font-medium text-[#dadce0]">Talaref Média</span>
                      <span className="hidden sm:inline text-gris/60">·</span>
                      <span className="text-[0.6875rem] text-[#bdc1c6] truncate">
                        https://talarefmedia.fr › {univers} › {slugifier(titre) || "titre-article"}
                      </span>
                    </div>
                  </div>

                  {/* Titre Google (bleu cliquable) */}
                  <div className="mt-2 text-base sm:text-lg font-medium text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
                    {metaTitre.trim() || titre || "Titre de l'article dans les résultats de recherche Google"}
                  </div>

                  {/* Meta Description Google (gris) */}
                  <div className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#bdc1c6] line-clamp-2">
                    {metaDescription.trim() ||
                      chapo ||
                      "La méta-description résume l'article pour inciter au clic sur Google. Par défaut, le chapô est repris automatiquement, ou vous pouvez le réécrire ci-dessous."}
                  </div>

                  {/* Indicateurs de calibrage SEO */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ligne/40 pt-3 font-mono text-[0.6875rem]">
                    <div>
                      <span className="text-gris">Méta-Titre : </span>
                      <span
                        className={
                          (metaTitre || titre).length >= 30 && (metaTitre || titre).length <= 65
                            ? "font-bold text-arena"
                            : (metaTitre || titre).length > 65
                              ? "font-bold text-pop"
                              : "text-gris"
                        }
                      >
                        {(metaTitre || titre).length} / 65 signes
                      </span>
                      {(metaTitre || titre).length > 65 && (
                        <span className="ml-1 text-pop font-sans text-[0.625rem]">(peut être tronqué par Google)</span>
                      )}
                    </div>

                    <div>
                      <span className="text-gris">Méta-Description : </span>
                      <span
                        className={
                          (metaDescription || chapo).length >= 120 && (metaDescription || chapo).length <= 165
                            ? "font-bold text-arena"
                            : (metaDescription || chapo).length > 165
                              ? "font-bold text-pop"
                              : "text-gris"
                        }
                      >
                        {(metaDescription || chapo).length} / 160 signes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Champs de réécriture optionnelle */}
                {afficherSeoAvance && (
                  <div className="mt-4 grid gap-3.5 rounded-lg border border-nexus/30 bg-noir/40 p-4 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-blanc">
                          Méta-titre Google personnalisé (optionnel)
                        </label>
                        <span className="font-mono text-[0.625rem] text-gris">
                          {metaTitre.length} signes · Idéal : 30 à 60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={metaTitre}
                        onChange={(e) => setMetaTitre(e.target.value)}
                        placeholder="Laissez vide pour utiliser le titre principal de l'article..."
                        className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-blanc">
                          Méta-description Google personnalisée (optionnel)
                        </label>
                        <span className="font-mono text-[0.625rem] text-gris">
                          {metaDescription.length} signes · Idéal : 120 à 160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Laissez vide pour utiliser automatiquement le chapô de l'article..."
                        className="mt-1.5 w-full resize-none rounded border border-ligne bg-noir p-2 text-xs text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton de publication / modification */}
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ligne pt-6">
                {modeEdition.actif ? (
                  <button
                    type="button"
                    onClick={annulerModification}
                    className="rounded border border-ligne bg-surface px-4 py-2.5 text-xs font-bold text-gris hover:border-nexus/40 hover:text-blanc transition-colors"
                  >
                    ✕ Annuler la modification
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  disabled={publicationEnCours}
                  className="rounded-md bg-nexus px-6 py-3 text-sm font-black uppercase tracking-wider text-noir transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {publicationEnCours
                    ? (modeEdition.actif ? "Mise à jour en cours..." : "Publication en cours...")
                    : (modeEdition.actif ? "💾 Enregistrer les modifications" : "🚀 Publier l'article")}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ONGLET GESTION DES ARTICLES (ADMIN UNIQUEMENT - CRUD COMPLET) */}
      {ongletActif === "articles" && role === "admin" && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-blanc">
                Catalogue de tous les articles ({articlesFiltres.length})
              </h2>
              <p className="mt-1 text-xs text-gris">
                Consultez, modifiez ou supprimez n'importe quel article existant.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  annulerModification();
                  setOngletActif("redaction");
                }}
                className="rounded bg-nexus px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-noir hover:opacity-90 transition-opacity"
              >
                + Rédiger un nouvel article
              </button>
            </div>
          </div>

          {/* Filtres de recherche */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ligne bg-surface p-4">
            <input
              type="text"
              value={rechercheArticle}
              onChange={(e) => setRechercheArticle(e.target.value)}
              placeholder="Rechercher par titre, slug, tag..."
              className="min-w-[240px] flex-1 rounded border border-ligne bg-noir px-3 py-2 text-xs text-blanc placeholder-gris/60 focus:border-nexus focus:outline-none"
            />
            <select
              value={universFiltre}
              onChange={(e) => setUniversFiltre(e.target.value)}
              className="rounded border border-ligne bg-noir px-3 py-2 text-xs font-bold text-blanc focus:border-nexus focus:outline-none"
            >
              <option value="tous">Tous les univers</option>
              {UNIVERS.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.nom}
                </option>
              ))}
            </select>
          </div>

          {chargementArticles ? (
            <p className="text-xs text-gris">Chargement des articles...</p>
          ) : articlesFiltres.length === 0 ? (
            <div className="rounded-lg border border-ligne bg-surface p-8 text-center">
              <p className="text-sm text-gris">Aucun article trouvé pour ces critères.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ligne bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ligne bg-surface-2 text-gris">
                  <tr>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Article</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Univers</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">À la une</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Date</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Lecture</th>
                    <th className="p-3.5 text-right font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ligne">
                  {articlesFiltres.map((art) => {
                    const estEnCoursDeSuppression = suppressionArticleSlug === art.slug;
                    return (
                      <tr key={art.slug} className="transition-colors hover:bg-noir/30">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {art.imageDeUne?.url ? (
                              <img
                                src={art.imageDeUne.url}
                                alt={art.titre}
                                className="h-10 w-14 rounded object-cover border border-ligne"
                              />
                            ) : (
                              <div className="flex h-10 w-14 items-center justify-center rounded border border-ligne bg-noir text-[0.625rem] text-gris">
                                Sans img
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-blanc line-clamp-1">{art.titre}</div>
                              <div className="mt-0.5 font-mono text-[0.6875rem] text-gris/70">
                                #{String(art.refNumber || 1).padStart(3, "0")} · /{art.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-bold uppercase text-nexus border border-ligne">
                            {art.univers}
                          </span>
                          {art.collection && (
                            <div className="mt-1 text-[0.625rem] text-gris">
                              {art.collection}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={art.format || "standard"}
                            onChange={async (e) => {
                              const nouveauFormat = e.target.value;
                              try {
                                const res = await fetch("/api/admin/articles", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ slug: art.slug, format: nouveauFormat }),
                                });
                                if (res.ok) {
                                  chargerArticles();
                                }
                              } catch {}
                            }}
                            className={`rounded border px-2 py-1 text-[11px] font-bold transition-colors focus:outline-none ${
                              art.format === "une_1"
                                ? "border-accent bg-accent/20 text-accent"
                                : art.format === "une_2" || art.format === "une_3"
                                  ? "border-nexus/60 bg-nexus/20 text-nexus"
                                  : "border-ligne bg-noir text-gris hover:border-blanc/30 hover:text-blanc"
                            }`}
                            title="Assigner la position de cet article en page d'accueil"
                          >
                            <option value="standard">Standard (Auto)</option>
                            <option value="une_1">⭐ Grande Une (#1)</option>
                            <option value="une_2">⭐ Deuxième Une (#2)</option>
                            <option value="une_3">⭐ Troisième Une (#3)</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-gris whitespace-nowrap">
                          {new Date(art.publieLe).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3.5 text-gris whitespace-nowrap">
                          {art.tempsDeLecture} min
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/${art.univers}/${art.slug}`}
                              target="_blank"
                              className="rounded border border-ligne bg-surface px-2.5 py-1 text-[0.6875rem] font-bold text-blanc hover:border-nexus hover:text-nexus transition-colors"
                              title="Voir l'article en ligne"
                            >
                              👁 Voir
                            </Link>
                            <button
                              type="button"
                              onClick={() => chargerArticlePourModification(art)}
                              className="rounded border border-nexus/50 bg-nexus/10 px-2.5 py-1 text-[0.6875rem] font-bold text-nexus hover:bg-nexus hover:text-noir transition-colors"
                              title="Modifier cet article"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              type="button"
                              disabled={estEnCoursDeSuppression}
                              onClick={() => handleSupprimerArticle(art.slug, art.titre)}
                              className="rounded border border-encre/40 px-2.5 py-1 text-[0.6875rem] font-bold text-encre hover:bg-encre hover:text-noir disabled:opacity-40 transition-colors"
                              title="Supprimer définitivement cet article"
                            >
                              {estEnCoursDeSuppression ? "Suppression..." : "🗑 Supprimer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ONGLET GESTION DES UTILISATEURS (ADMIN UNIQUEMENT) */}
      {ongletActif === "utilisateurs" && role === "admin" && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-blanc">
              Gestion des membres & rédacteurs ({utilisateurs.length})
            </h2>
            <input
              type="text"
              value={rechercheUser}
              onChange={(e) => setRechercheUser(e.target.value)}
              placeholder="Rechercher par email ou pseudo..."
              className="rounded border border-ligne bg-surface px-3 py-1.5 text-xs text-blanc placeholder-gris/60 focus:border-nexus focus:outline-none"
            />
          </div>

          {chargementUsers ? (
            <p className="text-xs text-gris">Chargement des utilisateurs...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ligne bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ligne bg-surface-2 text-gris">
                  <tr>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Pseudonyme</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">E-mail</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Inscrit le</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Rôle</th>
                    <th className="p-3.5 text-right font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ligne">
                  {usersFiltres.map((u) => {
                    const isFirstAdmin = u.email.toLowerCase() === "mpika.toshiro@talaref.co";
                    const isSelf = u.id === user?.id;

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-noir/30">
                        <td className="p-3.5 font-bold text-blanc">
                          {u.pseudonyme}
                          {isFirstAdmin && (
                            <span className="ml-2 rounded bg-nexus/20 px-1.5 py-0.5 text-[0.625rem] font-bold text-nexus">
                              Premier Admin
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-gris">{u.email}</td>
                        <td className="p-3.5 text-gris">
                          {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3.5">
                          {isFirstAdmin ? (
                            <span className="font-bold text-nexus">Admin</span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={actionUserId === u.id}
                              onChange={(e) =>
                                handleChangerRole(u.id, e.target.value as UserRole)
                              }
                              className="rounded border border-ligne bg-noir px-2 py-1 text-xs font-semibold text-blanc focus:border-nexus focus:outline-none disabled:opacity-50"
                            >
                              <option value="membre">Membre</option>
                              <option value="redacteur">Rédacteur</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {!isFirstAdmin && !isSelf && (
                            <button
                              type="button"
                              disabled={actionUserId === u.id}
                              onClick={() => handleSupprimerUser(u.id, u.pseudonyme)}
                              className="rounded border border-encre/40 px-2 py-1 text-[0.6875rem] font-bold text-encre hover:bg-encre hover:text-noir disabled:opacity-40"
                              title="Supprimer définitivement cet utilisateur"
                            >
                              Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
