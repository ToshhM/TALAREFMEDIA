"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Commentaire, UserRole } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function CommentairesArticle({ articleSlug }: { articleSlug: string }) {
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("membre");
  const [userPseudo, setUserPseudo] = useState<string>("");
  const [envoiEnCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
          const pseudo =
            data.user.user_metadata?.pseudonyme ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "Membre";
          setUserPseudo(pseudo);

          const role: UserRole =
            data.user.email === "mpika.toshiro@talaref.co"
              ? "admin"
              : data.user.user_metadata?.role ||
                data.user.app_metadata?.role ||
                "membre";
          setUserRole(role);
        }
      });
    }

    // Récupérer les commentaires
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.commentaires) {
          setCommentaires(data.commentaires);
        }
      })
      .catch(() => {})
      .finally(() => setChargement(false));
  }, [articleSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nouveauCommentaire.trim()) return;

    setErreur(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleSlug,
            contenu: nouveauCommentaire.trim(),
            userId: user.id,
            userPseudonyme: userPseudo,
            userRole,
          }),
        });

        const data = await res.json();
        if (data.commentaire) {
          setCommentaires((prev) => [...prev, data.commentaire]);
          setNouveauCommentaire("");
        } else if (data.error) {
          setErreur(data.error);
        }
      } catch {
        setErreur("Impossible d'envoyer le commentaire pour le moment.");
      }
    });
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;

    try {
      const res = await fetch(
        `/api/comments?id=${commentId}&userId=${user?.id || ""}&role=${userRole}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setCommentaires((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <section aria-labelledby="commentaires-titre" className="mt-16 border-t border-ligne pt-10">
      <div className="flex items-center justify-between">
        <h2 id="commentaires-titre" className="text-xl font-bold tracking-tight text-blanc">
          Commentaires{" "}
          <span className="ml-1 text-sm font-normal text-gris">
            ({commentaires.length})
          </span>
        </h2>
      </div>

      {/* Formulaire pour les membres connectés */}
      {user ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex items-center gap-2 mb-2 text-xs text-gris">
            <span>Commenter en tant que</span>
            <strong className="text-blanc">{userPseudo}</strong>
            {userRole === "admin" && (
              <span className="rounded bg-nexus/20 px-1.5 py-0.2 text-[0.625rem] font-bold uppercase tracking-wider text-nexus">
                Admin
              </span>
            )}
            {userRole === "redacteur" && (
              <span className="rounded bg-pop/20 px-1.5 py-0.2 text-[0.625rem] font-bold uppercase tracking-wider text-pop">
                Rédacteur
              </span>
            )}
          </div>

          <textarea
            required
            rows={3}
            value={nouveauCommentaire}
            onChange={(e) => setNouveauCommentaire(e.target.value)}
            placeholder="Partagez votre avis ou une référence sur cet article..."
            className="w-full rounded-md border border-ligne bg-surface p-3 text-sm text-blanc placeholder-gris/60 transition-colors focus:border-accent focus:outline-none"
          />

          {erreur && (
            <p className="mt-1 text-xs text-encre">{erreur}</p>
          )}

          <div className="mt-2.5 flex justify-end">
            <button
              type="submit"
              disabled={envoiEnCours || !nouveauCommentaire.trim()}
              className="rounded bg-accent px-4 py-2 text-xs font-bold text-noir transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {envoiEnCours ? "Publication..." : "Publier le commentaire"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-md border border-ligne bg-surface p-5 text-center sm:p-6">
          <p className="text-sm text-gris">
            Rejoignez la discussion avec votre pseudonyme de membre.
          </p>
          <div className="mt-3 flex justify-center gap-3">
            <Link
              href="/connexion"
              className="rounded bg-surface-2 px-3 py-1.5 text-xs font-semibold text-blanc hover:bg-ligne"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="rounded bg-accent px-3 py-1.5 text-xs font-bold text-noir hover:opacity-90"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      )}

      {/* Fil des commentaires */}
      <div className="mt-8 space-y-4">
        {chargement ? (
          <p className="text-xs text-gris">Chargement des réactions...</p>
        ) : commentaires.length === 0 ? (
          <p className="text-sm italic text-gris">
            Soyez le premier à commenter cet article.
          </p>
        ) : (
          commentaires.map((c) => {
            const peutSupprimer =
              user && (user.id === c.userId || userRole === "admin");

            return (
              <article
                key={c.id}
                className="rounded-md border border-ligne/70 bg-surface/50 p-4 transition-colors hover:border-ligne"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blanc">
                      {c.userPseudonyme}
                    </span>
                    {c.userRole === "admin" && (
                      <span className="rounded bg-nexus/20 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-nexus">
                        Admin
                      </span>
                    )}
                    {c.userRole === "redacteur" && (
                      <span className="rounded bg-pop/20 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-pop">
                        Rédacteur
                      </span>
                    )}
                    <span className="text-xs text-gris">·</span>
                    <time
                      dateTime={c.createdAt}
                      className="text-[0.6875rem] text-gris"
                    >
                      {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  {peutSupprimer && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-gris hover:text-encre"
                      title="Supprimer ce commentaire"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-gris-clair">
                  {c.contenu}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
