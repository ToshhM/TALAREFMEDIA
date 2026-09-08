import type { Metadata } from "next";
import { getArticles } from "@/lib/content";
import { CarteArticle } from "@/components/carte-article";

export const metadata: Metadata = {
  title: "Rechercher",
  description: "Chercher dans les articles Talaref.",
  alternates: { canonical: "/recherche" },
  robots: { index: false },
};

/**
 * Recherche — version provisoire.
 *
 * L'architecture V1 retient Pagefind : index statique, gratuit, sans base
 * de données. Il s'installe une fois le site en place (il indexe le HTML
 * produit par `next build`). En attendant, filtrage simple côté serveur
 * sur le titre et le chapô.
 */
export default async function PageRecherche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const requete = (q ?? "").trim();

  const tous = await getArticles();
  const resultats = requete
    ? tous.filter((a) => {
        const texteComplet = [
          a.titre,
          a.chapo,
          a.univers,
          ...(a.universSecondaires || []),
          ...(a.tags?.map((t) => t.nom) || []),
          ...(a.auteurs?.map((au) => au.nom) || []),
        ]
          .join(" ")
          .toLowerCase();
        return texteComplet.includes(requete.toLowerCase());
      })
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="titre-article text-4xl sm:text-5xl">Rechercher</h1>

      <form method="get" className="mt-8 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Votre recherche
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={requete}
          placeholder="Un jeu, un artiste, un sujet…"
          className="flex-1 border border-ligne bg-surface px-4 py-2.5 text-blanc placeholder:text-gris focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="bg-accent px-5 py-2.5 font-semibold text-noir transition-opacity hover:opacity-90"
        >
          Chercher
        </button>
      </form>

      {requete ? (
        <>
          <p className="etiquette mt-8">
            {resultats.length} résultat{resultats.length > 1 ? "s" : ""} pour
            « {requete} »
          </p>
          {resultats.length === 0 ? (
            <div className="mt-6 max-w-xl rounded-lg border border-ligne bg-surface p-8 text-center">
              <span className="text-3xl mb-2 block">🔍</span>
              <p className="text-base font-bold text-blanc">Aucun article ne correspond à votre recherche.</p>
              <p className="mt-2 text-xs text-gris">
                Vérifiez l'orthographe ou essayez un mot-clé plus général (ex : IA, Cinéma, Sport, Politique, Musique).
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultats.map((a) => (
                <li key={a.slug}>
                  <CarteArticle article={a} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="mt-12 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-gris">
            Sujets et univers populaires
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "IA",
              "Cinéma",
              "Montage",
              "Football",
              "Sport",
              "Politique",
              "Musique",
              "Tech",
              "Manga",
            ].map((sujet) => (
              <a
                key={sujet}
                href={`/recherche?q=${encodeURIComponent(sujet)}`}
                className="rounded border border-ligne bg-surface px-3 py-1.5 text-xs font-medium text-gris transition-colors hover:border-accent hover:text-accent"
              >
                {sujet}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
