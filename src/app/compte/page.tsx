"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

export default function ComptePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [pseudonyme, setPseudonyme] = useState("");
  const [nouveauPseudo, setNouveauPseudo] = useState("");
  const [editionPseudo, setEditionPseudo] = useState(false);
  const [role, setRole] = useState<UserRole>("membre");
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [message, setMessage] = useState<{ type: "succes" | "erreur"; texte: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChargement(false);
      return;
    }

    async function getUser() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();

      if (!user) {
        router.push("/connexion");
      } else {
        setUser(user);
        const pseudoInitial =
          user.user_metadata?.pseudonyme ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Membre";
        setPseudonyme(pseudoInitial);
        setNouveauPseudo(pseudoInitial);

        const roleDetecte: UserRole =
          user.email === "mpika.toshiro@talaref.co"
            ? "admin"
            : (user.user_metadata?.role as UserRole) ||
              (user.app_metadata?.role as UserRole) ||
              "membre";
        setRole(roleDetecte);
      }
      setChargement(false);
    }

    getUser();
  }, [router]);

  const handleUpdatePseudo = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nouveauPseudo.trim();
    if (clean.length < 3) {
      setMessage({ type: "erreur", texte: "Le pseudonyme doit comporter au moins 3 caractères." });
      return;
    }

    setSauvegarde(true);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "erreur", texte: "Supabase non disponible." });
      setSauvegarde(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        pseudonyme: clean,
        full_name: clean,
      },
    });

    if (error) {
      setMessage({ type: "erreur", texte: error.message });
    } else {
      setPseudonyme(clean);
      setEditionPseudo(false);
      setMessage({ type: "succes", texte: "Pseudonyme mis à jour avec succès !" });
    }
    setSauvegarde(false);
  };

  const handleDeconnexion = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  };

  if (chargement) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-12">
        <p className="font-mono text-sm text-gris">Chargement de votre compte...</p>
      </main>
    );
  }

  if (!user) return null;

  const estRedacteurOuAdmin = role === "redacteur" || role === "admin";

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8 border-b border-ligne pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-gris">
                Espace Membre
              </span>
              {role === "admin" && (
                <span className="rounded border border-nexus/40 bg-nexus/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-nexus">
                  Administrateur
                </span>
              )}
              {role === "redacteur" && (
                <span className="rounded border border-pop/40 bg-pop/10 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-pop">
                  Rédacteur
                </span>
              )}
              {role === "membre" && (
                <span className="rounded border border-ligne bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-gris">
                  Membre
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-black text-blanc">{pseudonyme}</h1>
            <p className="mt-1 font-mono text-xs text-gris">{user.email}</p>
          </div>

          {estRedacteurOuAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md bg-nexus px-4 py-2.5 text-xs font-black uppercase tracking-wider text-noir transition-opacity hover:opacity-90"
            >
              Accéder à l'espace Rédaction & Admin →
            </Link>
          )}
        </div>
      </header>

      {message && (
        <div
          className={`mb-6 rounded-md p-4 text-xs font-semibold ${
            message.type === "succes"
              ? "border border-arena/40 bg-arena/10 text-arena"
              : "border border-encre/40 bg-encre/10 text-encre"
          }`}
        >
          {message.texte}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Box Pseudonyme & Profil */}
        <section className="rounded-lg border border-ligne bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blanc">
              Votre Pseudonyme
            </h2>
            {!editionPseudo && (
              <button
                type="button"
                onClick={() => setEditionPseudo(true)}
                className="text-xs text-pop hover:underline"
              >
                Modifier
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gris">
            Ce pseudonyme est affiché publiquement sur vos commentaires et contributions.
          </p>

          {editionPseudo ? (
            <form onSubmit={handleUpdatePseudo} className="mt-4 space-y-3">
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                value={nouveauPseudo}
                onChange={(e) => setNouveauPseudo(e.target.value)}
                className="w-full rounded border border-ligne bg-noir p-2.5 text-sm text-blanc focus:border-pop focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sauvegarde}
                  className="rounded bg-pop px-3 py-1.5 text-xs font-bold text-noir hover:opacity-90 disabled:opacity-50"
                >
                  {sauvegarde ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditionPseudo(false);
                    setNouveauPseudo(pseudonyme);
                  }}
                  className="rounded border border-ligne px-3 py-1.5 text-xs text-gris hover:text-blanc"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded border border-ligne bg-noir/50 p-3">
              <span className="font-mono text-sm font-bold text-blanc">{pseudonyme}</span>
            </div>
          )}
        </section>

        {/* Box Informations de compte */}
        <section className="rounded-lg border border-ligne bg-surface p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blanc">
            Informations de compte
          </h2>
          <dl className="mt-4 divide-y divide-ligne text-xs">
            <div className="flex justify-between py-2.5">
              <dt className="text-gris">Rôle communauté</dt>
              <dd className="font-bold capitalize text-blanc">{role}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gris">E-mail</dt>
              <dd className="text-blanc">{user.email}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gris">Statut du compte</dt>
              <dd className="font-semibold text-arena">Actif</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-gris">Dernière connexion</dt>
              <dd className="text-blanc">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Première session"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Espace Rédacteur / Admin Promo Card */}
        {estRedacteurOuAdmin && (
          <section className="rounded-lg border border-nexus/30 bg-nexus/5 p-6 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-nexus">
                  {role === "admin" ? "Console Administrateur & Rédaction" : "Console Rédacteur"}
                </span>
                <p className="mt-1 text-sm text-gris-clair">
                  Vous disposez des droits pour écrire et publier de nouveaux articles avec
                  l'éditeur épuré façon Medium.
                  {role === "admin" && " En tant qu'administrateur, vous pouvez également gérer les utilisateurs et leurs rôles."}
                </p>
              </div>
              <Link
                href="/admin"
                className="shrink-0 rounded bg-nexus px-4 py-2 text-xs font-black uppercase tracking-wider text-noir transition-opacity hover:opacity-90"
              >
                Ouvrir la console →
              </Link>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleDeconnexion}
          className="rounded-md border border-ligne px-4 py-2 text-xs font-bold text-encre transition-colors hover:border-encre hover:bg-encre/10"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
