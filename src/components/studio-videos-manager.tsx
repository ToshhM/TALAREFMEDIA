"use client";

import { useState, useEffect, useRef } from "react";
import type { VideoItem, VideoSourceType, VideoAspectRatio } from "@/lib/video-types";
import { UNIVERS, type UniverseSlug } from "@/lib/univers";
import { parserSourceVideo } from "@/lib/video-utils";
import { ModalLecteurVideo } from "./modal-lecteur-video";

interface StudioVideosManagerProps {
  articlesDisponibles?: Array<{ slug: string; titre: string; univers: string }>;
}

export function StudioVideosManager({
  articlesDisponibles = [],
}: StudioVideosManagerProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageSucces, setMessageSucces] = useState<string | null>(null);

  // Filtres
  const [filtreUnivers, setFiltreUnivers] = useState<string>("tous");
  const [recherche, setRecherche] = useState("");

  // Modal lecteur
  const [videoApercu, setVideoApercu] = useState<VideoItem | null>(null);

  // Modal création / modification
  const [modalOuverte, setModalOuverte] = useState(false);
  const [videoEnEdition, setVideoEnEdition] = useState<VideoItem | null>(null);

  // Formulaire
  const [titre, setTitre] = useState("");
  const [sourceType, setSourceType] = useState<VideoSourceType>("youtube");
  const [urlOuId, setUrlOuId] = useState("");
  const [format, setFormat] = useState("POP QUIZ");
  const [univers, setUnivers] = useState<UniverseSlug>("pop");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("9:16");
  const [duree, setDuree] = useState("04:00");
  const [legende, setLegende] = useState("");
  const [description, setDescription] = useState("");
  const [miniaturePerso, setMiniaturePerso] = useState("");
  const [aLaUneAccueil, setALaUneAccueil] = useState(true);
  const [articleAssocieSlug, setArticleAssocieSlug] = useState("");

  // Uploads
  const [uploadVideoEnCours, setUploadVideoEnCours] = useState(false);
  const [uploadMiniatureEnCours, setUploadMiniatureEnCours] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

  const fileInputVideoRef = useRef<HTMLInputElement>(null);
  const fileInputMiniatureRef = useRef<HTMLInputElement>(null);

  // Charger la liste des vidéos
  const chargerVideos = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/videos");
      const data = await res.json();
      if (res.ok && data.videos) {
        setVideos(data.videos);
      } else {
        setErreur(data.error || "Impossible de charger les vidéos.");
      }
    } catch {
      setErreur("Erreur réseau lors du chargement des vidéos.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerVideos();
  }, []);

  const reinitialiserFormulaire = () => {
    setVideoEnEdition(null);
    setTitre("");
    setSourceType("youtube");
    setUrlOuId("");
    setFormat("POP QUIZ");
    setUnivers("pop");
    setAspectRatio("9:16");
    setDuree("04:00");
    setLegende("");
    setDescription("");
    setMiniaturePerso("");
    setALaUneAccueil(true);
    setArticleAssocieSlug("");
  };

  const ouvrirCreation = () => {
    reinitialiserFormulaire();
    setModalOuverte(true);
  };

  const ouvrirModification = (v: VideoItem) => {
    setVideoEnEdition(v);
    setTitre(v.titre);
    setSourceType(v.sourceType);
    setUrlOuId(v.urlOuId);
    setFormat(v.format || "VIDÉO");
    setUnivers(v.univers);
    setAspectRatio(v.aspectRatio || "16:9");
    setDuree(typeof v.duree === "string" ? v.duree : "");
    setLegende(v.legende || "");
    setDescription(v.description || "");
    setMiniaturePerso(v.miniature || "");
    setALaUneAccueil(Boolean(v.aLaUneAccueil));
    setArticleAssocieSlug(v.articleSlug || "");
    setModalOuverte(true);
  };

  // Détection automatique lors de la saisie d'un lien YouTube
  const gererChangementUrlOuId = (valeur: string) => {
    setUrlOuId(valeur);
    const parsed = parserSourceVideo(valeur);
    if (parsed.type === "youtube") {
      setSourceType("youtube");
      if (!miniaturePerso) {
        setMiniaturePerso(`https://i.ytimg.com/vi/${parsed.valeur}/maxresdefault.jpg`);
      }
    } else if (parsed.type === "vimeo") {
      setSourceType("vimeo");
    } else if (parsed.type === "direct") {
      setSourceType("direct");
    }
  };

  // Upload direct d'une vidéo (MP4, WebM) vers Supabase Storage
  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadVideoEnCours(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setUrlOuId(data.url);
        setSourceType("upload");
        if (!titre) {
          setTitre(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        }
      } else {
        alert(data.error || "Échec de l'upload de la vidéo.");
      }
    } catch {
      alert("Erreur réseau pendant l'upload vidéo.");
    } finally {
      setUploadVideoEnCours(false);
      if (fileInputVideoRef.current) fileInputVideoRef.current.value = "";
    }
  };

  // Upload d'une miniature personnalisée
  const handleUploadMiniature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMiniatureEnCours(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setMiniaturePerso(data.url);
      } else {
        alert(data.error || "Échec de l'upload de l'image.");
      }
    } catch {
      alert("Erreur pendant l'upload de la miniature.");
    } finally {
      setUploadMiniatureEnCours(false);
      if (fileInputMiniatureRef.current) fileInputMiniatureRef.current.value = "";
    }
  };

  // Sauvegarder (Création ou Édition)
  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !urlOuId.trim()) {
      alert("Veuillez renseigner au moins un titre et une source vidéo.");
      return;
    }

    setSauvegardeEnCours(true);
    try {
      const articleLie = articlesDisponibles.find((a) => a.slug === articleAssocieSlug);

      const payload = {
        id: videoEnEdition ? videoEnEdition.id : undefined,
        titre: titre.trim(),
        sourceType,
        urlOuId: urlOuId.trim(),
        univers,
        format: format.trim(),
        aspectRatio,
        duree: duree.trim(),
        legende: legende.trim() || undefined,
        description: description.trim() || undefined,
        miniature: miniaturePerso.trim() || undefined,
        aLaUneAccueil,
        articleSlug: articleLie?.slug || (articleAssocieSlug ? articleAssocieSlug : undefined),
        articleTitre: articleLie?.titre || undefined,
        articleUnivers: (articleLie?.univers as UniverseSlug) || undefined,
      };

      const methode = videoEnEdition ? "PUT" : "POST";
      const res = await fetch("/api/admin/videos", {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessageSucces(
          videoEnEdition
            ? "Vidéo mise à jour avec succès !"
            : "Nouvelle vidéo ajoutée au catalogue !",
        );
        setTimeout(() => setMessageSucces(null), 4000);
        setModalOuverte(false);
        reinitialiserFormulaire();
        chargerVideos();
      } else {
        alert(data.error || "Erreur lors de la sauvegarde de la vidéo.");
      }
    } catch {
      alert("Erreur réseau pendant la sauvegarde.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  // Bascule rapide "À la une accueil"
  const toggleALaUne = async (v: VideoItem) => {
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: v.id,
          aLaUneAccueil: !v.aLaUneAccueil,
        }),
      });
      if (res.ok) {
        setVideos((prev) =>
          prev.map((item) =>
            item.id === v.id ? { ...item, aLaUneAccueil: !item.aLaUneAccueil } : item,
          ),
        );
      }
    } catch {}
  };

  // Supprimer une vidéo
  const supprimerVideo = async (id: string, titre: string) => {
    if (!confirm(`Supprimer définitivement la vidéo « ${titre} » ?`)) return;

    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
        setMessageSucces("Vidéo supprimée avec succès.");
        setTimeout(() => setMessageSucces(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Échec de la suppression.");
      }
    } catch {
      alert("Erreur réseau lors de la suppression.");
    }
  };

  // Filtrage local
  const videosFiltrees = videos.filter((v) => {
    if (filtreUnivers !== "tous" && v.univers !== filtreUnivers) return false;
    if (recherche.trim()) {
      const q = recherche.toLowerCase().trim();
      const match =
        v.titre.toLowerCase().includes(q) ||
        (v.format && v.format.toLowerCase().includes(q)) ||
        (v.legende && v.legende.toLowerCase().includes(q)) ||
        (v.articleTitre && v.articleTitre.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const totalYoutube = videos.filter((v) => v.sourceType === "youtube").length;
  const totalUpload = videos.filter((v) => v.sourceType === "upload" || v.sourceType === "direct").length;
  const totalUne = videos.filter((v) => v.aLaUneAccueil).length;

  return (
    <section className="space-y-6">
      {/* En-tête du module Studio Vidéos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-ligne bg-surface p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rouge animate-pulse" />
            <h2 className="text-xl font-black text-blanc sm:text-2xl font-heading">
              Studio Vidéos & Formats Courts
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gris">
            Gérez vos vidéos YouTube, uploads directs MP4, liaisons avec les articles et sélection pour la rubrique Konbini.
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-2 rounded-lg bg-nexus px-4 py-2.5 text-xs font-bold text-noir transition-all hover:bg-blanc active:scale-95 shadow-md"
        >
          <span className="text-base leading-none">+</span>
          <span>Ajouter une vidéo</span>
        </button>
      </div>

      {/* Message de succès toast */}
      {messageSucces && (
        <div className="rounded-lg border border-vert/40 bg-vert/10 p-3 text-xs font-semibold text-vert animate-in fade-in">
          ✓ {messageSucces}
        </div>
      )}

      {/* Statistiques en cartes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ligne bg-surface p-4 text-center">
          <p className="text-2xl font-black text-blanc">{videos.length}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
            Vidéos au total
          </p>
        </div>
        <div className="rounded-xl border border-ligne bg-surface p-4 text-center">
          <p className="text-2xl font-black text-rouge">{totalYoutube}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
            Liens YouTube
          </p>
        </div>
        <div className="rounded-xl border border-ligne bg-surface p-4 text-center">
          <p className="text-2xl font-black text-bleu">{totalUpload}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
            Fichiers MP4 / Uploads
          </p>
        </div>
        <div className="rounded-xl border border-ligne bg-surface p-4 text-center">
          <p className="text-2xl font-black text-accent">{totalUne}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-gris">
            À la une (Konbini)
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtre univers */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-ligne bg-surface/70 p-3 sm:p-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Filtrer par titre, format, article..."
            className="w-full rounded-lg border border-ligne bg-surface-2 px-3 py-2 text-xs text-blanc placeholder-gris focus:border-nexus focus:outline-none"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              className="absolute right-2.5 top-2 text-xs text-gris hover:text-blanc"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltreUnivers("tous")}
            className={`rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
              filtreUnivers === "tous"
                ? "bg-blanc text-noir font-bold"
                : "bg-surface-2 text-gris hover:text-blanc"
            }`}
          >
            Tous
          </button>
          {UNIVERS.map((u) => (
            <button
              key={u.slug}
              type="button"
              data-u={u.slug}
              onClick={() => setFiltreUnivers(u.slug)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all ${
                filtreUnivers === u.slug
                  ? "bg-accent text-noir font-bold"
                  : "bg-surface-2 text-gris hover:text-blanc"
              }`}
            >
              {u.nom}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau / Liste des vidéos */}
      {chargement ? (
        <div className="rounded-xl border border-ligne bg-surface p-12 text-center text-gris text-sm">
          Chargement des vidéos en cours...
        </div>
      ) : erreur ? (
        <div className="rounded-xl border border-rouge/40 bg-rouge/10 p-6 text-center text-rouge text-xs">
          {erreur}
        </div>
      ) : videosFiltrees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ligne bg-surface p-12 text-center">
          <p className="text-sm font-semibold text-blanc">Aucune vidéo trouvée</p>
          <p className="mt-1 text-xs text-gris">
            Ajoutez votre première vidéo ou ajustez vos critères de recherche.
          </p>
          <button
            type="button"
            onClick={ouvrirCreation}
            className="mt-4 rounded-lg bg-nexus px-4 py-2 text-xs font-bold text-noir"
          >
            + Ajouter une vidéo
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ligne bg-surface">
          <table className="w-full text-left text-xs text-gris">
            <thead className="border-b border-ligne bg-surface-2 font-mono text-[10px] uppercase tracking-wider text-blanc">
              <tr>
                <th className="p-3">Aperçu</th>
                <th className="p-3">Titre & Format</th>
                <th className="p-3">Univers</th>
                <th className="p-3">Source</th>
                <th className="p-3">Article lié</th>
                <th className="p-3 text-center">Accueil Konbini</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ligne/60">
              {videosFiltrees.map((v) => {
                const miniature =
                  v.miniature ||
                  (v.sourceType === "youtube"
                    ? `https://i.ytimg.com/vi/${v.urlOuId}/hqdefault.jpg`
                    : null);

                return (
                  <tr key={v.id} className="hover:bg-surface-2/40 transition-colors">
                    {/* Vignette */}
                    <td className="p-3">
                      <div
                        onClick={() => setVideoApercu(v)}
                        className="group relative h-14 w-24 cursor-pointer overflow-hidden rounded-md border border-ligne bg-noir"
                        title="Cliquer pour prévisualiser"
                      >
                        {miniature ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={miniature}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gris text-xs">
                            🎬
                          </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-noir/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-white text-xs">▶</span>
                        </span>
                        {v.duree && (
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-noir/80 px-1 font-mono text-[9px] text-white">
                            {v.duree}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Titre & Format */}
                    <td className="p-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          {v.format && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.2 font-mono text-[9px] font-bold text-blanc uppercase">
                              {v.format}
                            </span>
                          )}
                          <span className="rounded bg-noir/80 px-1.5 py-0.2 font-mono text-[9px] text-gris">
                            {v.aspectRatio === "9:16" ? "9:16 (Konbini)" : "16:9"}
                          </span>
                        </div>
                        <p className="font-semibold text-blanc line-clamp-2">
                          {v.titre}
                        </p>
                      </div>
                    </td>

                    {/* Univers */}
                    <td className="p-3">
                      <span
                        data-u={v.univers}
                        className="rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-accent border border-ligne"
                      >
                        {v.univers}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="p-3 font-mono">
                      {v.sourceType === "youtube" ? (
                        <span className="inline-flex items-center gap-1 text-rouge font-bold text-[11px]">
                          <span>▶ YouTube</span>
                        </span>
                      ) : v.sourceType === "upload" ? (
                        <span className="inline-flex items-center gap-1 text-bleu font-bold text-[11px]">
                          <span>📁 MP4 Uploadé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-vert font-bold text-[11px]">
                          <span>🔗 Direct</span>
                        </span>
                      )}
                    </td>

                    {/* Article interconnecté */}
                    <td className="p-3 max-w-[200px]">
                      {v.articleSlug ? (
                        <div className="flex items-center gap-1.5 text-blanc font-medium">
                          <span className="text-accent">📖</span>
                          <span className="truncate text-xs">
                            {v.articleTitre || v.articleSlug}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gris/60 italic text-[11px]">
                          Aucun article lié
                        </span>
                      )}
                    </td>

                    {/* À la une Konbini */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleALaUne(v)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          v.aLaUneAccueil
                            ? "bg-accent text-noir hover:opacity-80"
                            : "bg-surface-2 text-gris hover:text-blanc"
                        }`}
                        title="Cliquer pour basculer la présence sur l'accueil"
                      >
                        {v.aLaUneAccueil ? "✓ En vedette" : "Non"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setVideoApercu(v)}
                          className="rounded p-1 text-gris hover:bg-surface-2 hover:text-blanc"
                          title="Lire la vidéo"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => ouvrirModification(v)}
                          className="rounded p-1 text-gris hover:bg-surface-2 hover:text-nexus"
                          title="Modifier les informations"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => supprimerVideo(v.id, v.titre)}
                          className="rounded p-1 text-gris hover:bg-surface-2 hover:text-rouge"
                          title="Supprimer la vidéo"
                        >
                          🗑️
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

      {/* Modal de création / modification */}
      {modalOuverte && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-noir/90 p-4 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-ligne bg-[#0d0d0f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ligne/70 pb-4">
              <h3 className="text-lg font-bold text-blanc font-heading">
                {videoEnEdition ? "Modifier la vidéo" : "Ajouter une nouvelle vidéo"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                className="text-gris hover:text-blanc"
              >
                ✕
              </button>
            </div>

            <form onSubmit={soumettreFormulaire} className="mt-4 space-y-4 text-xs">
              {/* Type de source */}
              <div>
                <label className="block font-mono text-[10px] uppercase text-gris mb-1.5">
                  Type de source vidéo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("youtube")}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      sourceType === "youtube"
                        ? "border-rouge bg-rouge/20 text-blanc font-bold"
                        : "border-ligne bg-surface-2 text-gris"
                    }`}
                  >
                    ▶ YouTube / Shorts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("upload")}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      sourceType === "upload"
                        ? "border-bleu bg-bleu/20 text-blanc font-bold"
                        : "border-ligne bg-surface-2 text-gris"
                    }`}
                  >
                    📁 Upload direct MP4
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("direct")}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      sourceType === "direct"
                        ? "border-vert bg-vert/20 text-blanc font-bold"
                        : "border-ligne bg-surface-2 text-gris"
                    }`}
                  >
                    🔗 URL Directe / Vimeo
                  </button>
                </div>
              </div>

              {/* Source : URL / ID ou Upload */}
              {sourceType === "upload" ? (
                <div className="rounded-xl border border-dashed border-bleu/40 bg-bleu/5 p-4 text-center">
                  <input
                    type="file"
                    ref={fileInputVideoRef}
                    accept="video/mp4,video/webm,video/mov"
                    onChange={handleUploadVideo}
                    className="hidden"
                  />
                  <p className="font-semibold text-blanc mb-1">
                    {uploadVideoEnCours
                      ? "Téléversement de la vidéo en cours..."
                      : urlOuId
                      ? "Vidéo téléversée avec succès !"
                      : "Sélectionnez un fichier vidéo (MP4, WebM, MOV)"}
                  </p>
                  {urlOuId && (
                    <p className="font-mono text-[10px] text-bleu truncate mb-3">
                      {urlOuId}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={uploadVideoEnCours}
                    onClick={() => fileInputVideoRef.current?.click()}
                    className="rounded-lg bg-bleu px-4 py-2 text-xs font-bold text-noir hover:bg-blanc transition-all"
                  >
                    {uploadVideoEnCours
                      ? "Patientez..."
                      : urlOuId
                      ? "Remplacer le fichier vidéo"
                      : "Choisir un fichier vidéo"}
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    {sourceType === "youtube"
                      ? "Lien YouTube ou Shorts (ex: https://youtube.com/watch?v=... ou https://youtu.be/...)"
                      : "URL directe du fichier vidéo ou lien Vimeo"}
                  </label>
                  <input
                    type="text"
                    required
                    value={urlOuId}
                    onChange={(e) => gererChangementUrlOuId(e.target.value)}
                    placeholder={
                      sourceType === "youtube"
                        ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        : "https://example.com/video.mp4"
                    }
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  />
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                  Titre de la vidéo (accrocheur) *
                </label>
                <input
                  type="text"
                  required
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: POP QUIZ : Quelle est la taille de Victor Wembanyama ?"
                  className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                />
              </div>

              {/* Ligne : Univers & Format & Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    Univers Talaref
                  </label>
                  <select
                    value={univers}
                    onChange={(e) => setUnivers(e.target.value as UniverseSlug)}
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  >
                    {UNIVERS.map((u) => (
                      <option key={u.slug} value={u.slug}>
                        {u.nom} ({u.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    Format / Série
                  </label>
                  <input
                    type="text"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    placeholder="POP QUIZ, INTERVIEW, DÉCRYPTAGE..."
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    Ratio d&apos;affichage
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  >
                    <option value="9:16">9:16 (Vertical Konbini / Shorts)</option>
                    <option value="16:9">16:9 (Horizontal classique)</option>
                    <option value="4:5">4:5 (Portrait réseaux)</option>
                  </select>
                </div>
              </div>

              {/* Durée & Légende */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    Durée (ex: 04:15)
                  </label>
                  <input
                    type="text"
                    value={duree}
                    onChange={(e) => setDuree(e.target.value)}
                    placeholder="03:45"
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                    Légende / Accroche courte
                  </label>
                  <input
                    type="text"
                    value={legende}
                    onChange={(e) => setLegende(e.target.value)}
                    placeholder="Courte phrase d'accroche pour la vignette..."
                    className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[10px] uppercase text-gris mb-1">
                  Description détaillée
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Résumé du sujet présenté dans la vidéo..."
                  className="w-full rounded-lg border border-ligne bg-surface-2 p-2.5 text-xs text-blanc focus:border-nexus focus:outline-none"
                />
              </div>

              {/* Interconnexion avec un article existant */}
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5">
                <label className="block font-mono text-[10px] uppercase text-accent font-bold mb-1">
                  📖 Interconnexion avec un article (Optionnel)
                </label>
                <p className="text-[11px] text-gris mb-2">
                  Associer cette vidéo à un article du site pour afficher le bouton « Lire l&apos;article associé » dans le lecteur.
                </p>
                <select
                  value={articleAssocieSlug}
                  onChange={(e) => setArticleAssocieSlug(e.target.value)}
                  className="w-full rounded-lg border border-ligne bg-surface p-2 text-xs text-blanc focus:border-accent focus:outline-none"
                >
                  <option value="">-- Aucun article associé --</option>
                  {articlesDisponibles.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      [{a.univers.toUpperCase()}] {a.titre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Miniature personnalisée */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] uppercase text-gris">
                    Miniature (laisser vide pour auto-générer via YouTube)
                  </label>
                  <input
                    type="file"
                    ref={fileInputMiniatureRef}
                    accept="image/*"
                    onChange={handleUploadMiniature}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputMiniatureRef.current?.click()}
                    disabled={uploadMiniatureEnCours}
                    className="text-[10px] text-nexus hover:underline"
                  >
                    {uploadMiniatureEnCours ? "Upload..." : "Upload d'image..."}
                  </button>
                </div>
                <input
                  type="text"
                  value={miniaturePerso}
                  onChange={(e) => setMiniaturePerso(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-ligne bg-surface-2 p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                />
              </div>

              {/* À la une accueil (Konbini) */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="aLaUneAccueilCheck"
                  checked={aLaUneAccueil}
                  onChange={(e) => setALaUneAccueil(e.target.checked)}
                  className="h-4 w-4 rounded border-ligne bg-surface-2 text-nexus focus:ring-0"
                />
                <label
                  htmlFor="aLaUneAccueilCheck"
                  className="text-xs text-blanc font-medium cursor-pointer"
                >
                  Mettre en avant sur la page d&apos;accueil (Rubrique Konbini « Nos meilleures vidéos ! »)
                </label>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-3 border-t border-ligne/70 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOuverte(false)}
                  className="rounded-lg border border-ligne px-4 py-2 text-xs font-semibold text-gris hover:text-blanc"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sauvegardeEnCours}
                  className="rounded-lg bg-nexus px-5 py-2 text-xs font-bold text-noir hover:bg-blanc transition-all"
                >
                  {sauvegardeEnCours ? "Enregistrement..." : "Sauvegarder la vidéo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecteur Lightbox pour aperçu */}
      <ModalLecteurVideo
        video={videoApercu}
        onFermer={() => setVideoApercu(null)}
      />
    </section>
  );
}
