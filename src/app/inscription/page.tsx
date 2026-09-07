"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const [pseudonyme, setPseudonyme] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    const pseudoNettoye = pseudonyme.trim();
    if (pseudoNettoye.length < 3) {
      setErreur("Le pseudonyme doit comporter au moins 3 caractères.");
      setChargement(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErreur("Configuration Supabase manquante. Veuillez vérifier les variables d'environnement.");
      setChargement(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pseudonyme: pseudoNettoye,
          full_name: nom.trim() || pseudoNettoye,
          role: "membre",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErreur(error.message);
      setChargement(false);
    } else {
      setSucces(true);
      setChargement(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-lg border border-ligne bg-surface p-6 sm:p-8">
        <header className="mb-6 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-pop">
            Rejoindre la communauté
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-blanc">
            Inscription
          </h1>
          <p className="mt-1 text-sm text-gris">
            Créez votre compte pour commenter et participer sur Talaref Média
          </p>
        </header>

        {succes ? (
          <div className="rounded-md border border-arena/40 bg-arena/10 p-5 text-center text-sm text-blanc">
            <h2 className="font-bold text-arena">Vérifiez votre boîte e-mail</h2>
            <p className="mt-2 text-xs text-gris">
              Un e-mail de confirmation vient de vous être envoyé à{" "}
              <strong className="text-blanc">{email}</strong>. Cliquez sur le lien pour
              activer votre compte.
            </p>
            <div className="mt-5">
              <Link
                href="/connexion"
                className="inline-block rounded bg-arena px-4 py-2 text-xs font-bold text-noir hover:opacity-90"
              >
                Se connecter
              </Link>
            </div>
          </div>
        ) : (
          <>
            {erreur && (
              <div className="mb-6 rounded-md border border-encre/40 bg-encre/10 p-3.5 text-xs text-encre">
                {erreur}
              </div>
            )}

            <form onSubmit={handleInscription} className="space-y-4">
              <div>
                <label
                  htmlFor="pseudonyme"
                  className="block text-xs font-semibold uppercase tracking-wider text-gris"
                >
                  Pseudonyme (obligatoire, visible publiquement)
                </label>
                <input
                  id="pseudonyme"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  value={pseudonyme}
                  onChange={(e) => setPseudonyme(e.target.value)}
                  placeholder="ex: Otaku92, CyberRef"
                  className="mt-1.5 w-full rounded-md border border-ligne bg-noir p-3 text-sm text-blanc transition-colors focus:border-pop focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="nom"
                  className="block text-xs font-semibold uppercase tracking-wider text-gris"
                >
                  Nom complet (optionnel)
                </label>
                <input
                  id="nom"
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Prénom Nom"
                  className="mt-1.5 w-full rounded-md border border-ligne bg-noir p-3 text-sm text-blanc transition-colors focus:border-pop focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-gris"
                >
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@domaine.com"
                  className="mt-1.5 w-full rounded-md border border-ligne bg-noir p-3 text-sm text-blanc transition-colors focus:border-pop focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gris"
                >
                  Mot de passe (6 caractères minimum)
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-md border border-ligne bg-noir p-3 text-sm text-blanc transition-colors focus:border-pop focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-md bg-pop px-4 py-3 text-sm font-bold text-noir transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {chargement ? "Création du compte..." : "S'inscrire"}
              </button>
            </form>

            <footer className="mt-6 border-t border-ligne pt-4 text-center text-xs text-gris">
              Déjà un compte ?{" "}
              <Link href="/connexion" className="font-bold text-pop hover:underline">
                Se connecter
              </Link>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
