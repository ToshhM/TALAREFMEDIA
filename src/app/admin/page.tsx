"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UNIVERS, getCollectionsForUnivers } from "@/lib/univers";
import type { CollectionSlug, UniverseSlug } from "@/lib/univers";
import type { Bloc, UserProfile, UserRole } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { parserSourceVideo } from "@/lib/video-utils";
import { FacadeVideo } from "@/components/facade-video";

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
  images?: Array<{ url: string; alt?: string; credit?: string }>;
};

async function televerserFichier(file: File): Promise<string> {
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

  return (
    <div className="space-y-3">
      {bloc.url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-ligne bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bloc.url}
            alt={bloc.alt || "Aperçu photo"}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => modifierBloc(index, "url", "")}
            className="absolute top-2 right-2 rounded bg-noir/80 px-2 py-1 text-xs text-encre hover:bg-noir"
          >
            ✕ Retirer la photo
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-ligne/70 bg-noir/40 p-6 text-center">
          <span className="text-3xl mb-2">📷</span>
          <p className="text-xs font-bold text-blanc">
            Téléverser une photo ou coller un lien
          </p>
          <p className="text-[0.6875rem] text-gris mt-1 mb-3">
            Formats pris en charge : JPG, PNG, WebP (max 15 Mo)
          </p>
          <label className="cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-1.5 text-xs font-bold text-blanc hover:bg-ligne">
            {enCours ? "Upload en cours..." : "Choisir un fichier image"}
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

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={bloc.url || ""}
          onChange={(e) => modifierBloc(index, "url", e.target.value)}
          placeholder="Ou coller une URL d'image (https://...)"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc sm:col-span-2 focus:border-nexus focus:outline-none"
        />
        <input
          type="text"
          value={bloc.credit || ""}
          onChange={(e) => modifierBloc(index, "credit", e.target.value)}
          placeholder="Crédit photo (obligatoire)"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={bloc.legende || ""}
          onChange={(e) => modifierBloc(index, "legende", e.target.value)}
          placeholder="Légende sous la photo (optionnelle)"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
        <input
          type="text"
          value={bloc.alt || ""}
          onChange={(e) => modifierBloc(index, "alt", e.target.value)}
          placeholder="Texte alternatif (description accessibilité)"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
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

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2 flex gap-2">
          <input
            type="text"
            value={bloc.youtubeId || ""}
            onChange={(e) => modifierBloc(index, "youtubeId", e.target.value)}
            placeholder="Lien YouTube (ex: https://youtube.com/watch?v=...) ou fichier vidéo"
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
          placeholder="Titre de la vidéo"
          className="rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
        />
      </div>

      {bloc.youtubeId ? (
        <div className="mt-3">
          <p className="mb-1.5 font-mono text-[0.625rem] uppercase text-gris">
            Aperçu de la vidéo dans l'article :
          </p>
          <div className="max-w-md">
            <FacadeVideo
              youtubeId={bloc.youtubeId}
              titre={bloc.titre || "Aperçu vidéo"}
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
  const images = bloc.images || [];

  const ajouterImage = (url: string) => {
    modifierBloc(index, "images", [
      ...images,
      { url, alt: "", credit: "Talaref Media" },
    ]);
  };

  const supprimerImage = (imgIdx: number) => {
    modifierBloc(
      index,
      "images",
      images.filter((_, i) => i !== imgIdx),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gris">
          {images.length} photo{images.length > 1 ? "s" : ""} dans la galerie
        </span>
        <label className="cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-1 text-xs font-bold text-blanc hover:bg-ligne">
          {enCours ? "Téléversement..." : "+ Ajouter des photos"}
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
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((img, imgIdx) => (
            <div
              key={imgIdx}
              className="group relative aspect-square overflow-hidden rounded border border-ligne bg-surface-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || ""}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => supprimerImage(imgIdx)}
                className="absolute top-1 right-1 rounded bg-noir/80 px-1.5 py-0.5 text-xs text-encre opacity-80 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gris/60 italic">Aucune photo dans la galerie pour l'instant.</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState<"redaction" | "utilisateurs">("redaction");

  // État de l'éditeur d'article (façon Medium)
  const [titre, setTitre] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [chapo, setChapo] = useState("");
  const [univers, setUnivers] = useState<UniverseSlug>("pop");
  const [collection, setCollection] = useState<CollectionSlug | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCredit, setImageCredit] = useState("Talaref Media");
  const [imageAlt, setImageAlt] = useState("");
  const [uploadEnCoursUne, setUploadEnCoursUne] = useState(false);
  const [videoPrincipaleUrl, setVideoPrincipaleUrl] = useState("");
  const [videoPrincipaleTitre, setVideoPrincipaleTitre] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [blocs, setBlocs] = useState<FormBloc[]>([
    { _type: "paragraphe", texte: "" },
    { _type: "laRef", titre: "La référence", texte: "" },
  ]);

  const [publicationEnCours, startPublication] = useTransition();
  const [messagePublication, setMessagePublication] = useState<{
    type: "succes" | "erreur";
    texte: string;
    url?: string;
  } | null>(null);

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
        { _type: "image", url: "", alt: "", credit: "Talaref Media", legende: "" },
      ]);
    } else if (type === "moduleVideo") {
      setBlocs((prev) => [
        ...prev,
        { _type: "moduleVideo", youtubeId: "", titre: "Vidéo du sujet", duree: 0 },
      ]);
    } else if (type === "galerie") {
      setBlocs((prev) => [
        ...prev,
        { _type: "galerie", images: [] },
      ]);
    }
  };

  const supprimerBloc = (index: number) => {
    setBlocs((prev) => prev.filter((_, i) => i !== index));
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
                image: {
                  url: b.url || "",
                  alt: b.alt || titre || "Photo de l'article",
                  credit: b.credit || "Talaref Media",
                  legende: b.legende || undefined,
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
                },
              };
            }
            if (b._type === "galerie") {
              return {
                _key,
                _type: "galerie",
                images: (b.images || []).map((img) => ({
                  url: img.url,
                  alt: img.alt || titre || "Photo de galerie",
                  credit: img.credit || "Talaref Media",
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
            }
          : undefined;

        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre,
            heroTitle,
            chapo,
            univers,
            collection: collection || undefined,
            imageUrl,
            imageCredit,
            imageAlt,
            tagsRaw,
            corps: corpsBlocs,
            video: videoArticle,
            auteurNom: user?.user_metadata?.full_name || user?.user_metadata?.pseudonyme || "La rédaction",
            auteurSlug: "redaction",
          }),
        });

        const data = await res.json();
        if (data.success && data.article) {
          setMessagePublication({
            type: "succes",
            texte: `L'article « ${data.article.titre} » a été publié avec succès !`,
            url: data.url,
          });
          // Réinitialiser les champs principaux
          setTitre("");
          setHeroTitle("");
          setChapo("");
          setImageUrl("");
          setVideoPrincipaleUrl("");
          setVideoPrincipaleTitre("");
          setTagsRaw("");
        } else {
          setMessagePublication({ type: "erreur", texte: data.error || "Erreur de publication." });
        }
      } catch {
        setMessagePublication({ type: "erreur", texte: "Erreur lors de la publication de l'article." });
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

          <div className="flex gap-2 border border-ligne bg-surface p-1 rounded-md">
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

          <form onSubmit={handlePublierArticle} className="space-y-8">
            {/* Barre de métadonnées légères */}
            <div className="grid gap-4 rounded-lg border border-ligne bg-surface p-5 sm:grid-cols-3">
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

              {collectionsDisponibles.length > 0 && (
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
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gris">
                  Tags libres (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="Cinéma, IA, Tournage..."
                  className="mt-1.5 w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc placeholder-gris/50 focus:border-nexus focus:outline-none"
                />
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
                <textarea
                  required
                  rows={2}
                  value={chapo}
                  onChange={(e) => setChapo(e.target.value)}
                  placeholder="Écrivez un chapô accrocheur (résumé de l'article, méta-description)..."
                  className="w-full resize-none border-l-2 border-ligne bg-transparent pl-4 text-lg leading-relaxed text-gris-clair placeholder:text-gris/40 focus:border-nexus focus:outline-none"
                />
                <span className="mt-1 block font-mono text-[0.625rem] text-gris">
                  {chapo.length} signes (recommandé : 200 à 320)
                </span>
              </div>

              {/* Image de Une */}
              <div className="mb-10 rounded-lg border border-ligne/70 bg-noir/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-blanc">
                    Image de couverture (16:9)
                  </p>
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

                {/* Aperçu en direct de l'image de couverture si renseignée */}
                {imageUrl ? (
                  <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-md border border-ligne bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={imageAlt || "Aperçu de la couverture"}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-noir/80 px-2 py-1 font-mono text-[0.625rem] text-blanc">
                      {imageCredit || "Talaref Media"}
                    </span>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Coller l'URL d'une image (https://...)"
                        className="w-full rounded border border-ligne bg-noir p-2 text-xs text-blanc focus:border-nexus focus:outline-none"
                      />
                      <label className="shrink-0 cursor-pointer rounded border border-ligne bg-surface-2 px-3 py-2 text-xs font-bold text-blanc transition-colors hover:bg-ligne flex items-center gap-1.5">
                        {uploadEnCoursUne ? (
                          <span>Upload...</span>
                        ) : (
                          <>
                            <span>📷</span>
                            <span>Uploader</span>
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
              <div className="mb-10 rounded-lg border border-ligne/70 bg-noir/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gris">
                    Vidéo principale de l'article (optionnel)
                  </span>
                  {videoPrincipaleUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoPrincipaleUrl("")}
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
                    placeholder="Lien YouTube ou URL vidéo directe..."
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
              </div>

              {/* Blocs du corps d'article */}
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ligne pb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-blanc">
                    Corps de l'article ({blocs.length} bloc{blocs.length > 1 ? "s" : ""})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => ajouterBloc("paragraphe")}
                      className="rounded bg-surface-2 px-2.5 py-1 text-xs text-blanc hover:bg-ligne"
                    >
                      + Paragraphe
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("intertitre")}
                      className="rounded bg-surface-2 px-2.5 py-1 text-xs text-blanc hover:bg-ligne"
                    >
                      + Intertitre
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("image")}
                      className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-noir"
                    >
                      📷 + Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("moduleVideo")}
                      className="rounded border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-noir"
                    >
                      🎬 + Vidéo
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("galerie")}
                      className="rounded bg-surface-2 px-2.5 py-1 text-xs text-blanc hover:bg-ligne"
                    >
                      🖼 + Galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("laRef")}
                      className="rounded border border-pop/40 bg-pop/10 px-2.5 py-1 text-xs font-bold text-pop hover:bg-pop hover:text-noir"
                    >
                      + La Ref ★
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("citation")}
                      className="rounded bg-surface-2 px-2.5 py-1 text-xs text-blanc hover:bg-ligne"
                    >
                      + Citation
                    </button>
                    <button
                      type="button"
                      onClick={() => ajouterBloc("chiffreCle")}
                      className="rounded bg-surface-2 px-2.5 py-1 text-xs text-blanc hover:bg-ligne"
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
                    <div className="mb-2 flex items-center justify-between text-xs text-gris">
                      <span className="font-mono font-bold uppercase text-gris">
                        Bloc {index + 1} · {bloc._type}
                      </span>
                      <button
                        type="button"
                        onClick={() => supprimerBloc(index)}
                        className="text-gris opacity-40 transition-opacity hover:text-encre hover:opacity-100"
                        title="Supprimer ce bloc"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Bloc Paragraphe */}
                    {bloc._type === "paragraphe" && (
                      <textarea
                        rows={3}
                        value={bloc.texte || ""}
                        onChange={(e) => modifierBloc(index, "texte", e.target.value)}
                        placeholder="Rédigez votre paragraphe ici..."
                        className="w-full resize-y bg-transparent text-sm leading-relaxed text-blanc placeholder:text-gris/40 focus:outline-none"
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
                        <textarea
                          rows={2}
                          value={bloc.texte || ""}
                          onChange={(e) => modifierBloc(index, "texte", e.target.value)}
                          placeholder="Expliquez la référence, l'easter egg, le sample ou le fait historique..."
                          className="mt-2 w-full resize-none bg-transparent text-xs leading-relaxed text-gris-clair placeholder:text-gris/40 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Bloc Citation */}
                    {bloc._type === "citation" && (
                      <div className="border-l-2 border-blanc pl-4">
                        <textarea
                          rows={2}
                          value={bloc.texte || ""}
                          onChange={(e) => modifierBloc(index, "texte", e.target.value)}
                          placeholder="« Citation inspirante ou marquante... »"
                          className="w-full resize-none bg-transparent italic text-blanc focus:outline-none"
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
              </div>

              {/* Bouton de publication */}
              <div className="mt-12 flex justify-end border-t border-ligne pt-6">
                <button
                  type="submit"
                  disabled={publicationEnCours}
                  className="rounded-md bg-nexus px-6 py-3 text-sm font-black uppercase tracking-wider text-noir transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {publicationEnCours ? "Publication en cours..." : "🚀 Publier l'article"}
                </button>
              </div>
            </div>
          </form>
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
            <div className="overflow-hidden rounded-lg border border-ligne bg-surface">
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
