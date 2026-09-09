import Link from "next/link";
import { getArticles } from "@/lib/content";
import { UNIVERS, getCollectionsForUnivers } from "@/lib/univers";
import { CarteArticle } from "@/components/carte-article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * La page d'accueil — Spécification v3.0 §11.
 *
 * Une mise en avant éditorialisée, les six univers avec leurs repères
 * visuels, et les dernières publications. Le fond reste strictement noir.
 */
export default async function Home() {
  const articles = await getArticles();
  const [une, ...suite] = articles;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {une ? (
        <section aria-labelledby="la-une" className="mb-16">
          <h1 id="la-une" className="etiquette mb-4">
            À la une
          </h1>
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <CarteArticle article={une} taille="une" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {suite.slice(0, 2).map((a) => (
                <CarteArticle key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="les-univers" className="mb-16">
        <h2 id="les-univers" className="etiquette mb-4">
          Six univers
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UNIVERS.map((u) => {
            const collections = getCollectionsForUnivers(u.slug);
            return (
              <li key={u.slug} data-u={u.slug}>
                <Link
                  href={`/${u.slug}`}
                  className="carte-home relative flex h-full flex-col justify-between overflow-hidden p-5"
                >
                  <div className="texture" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="pastille-code">{u.code}</span>
                      {collections.length > 0 ? (
                        <div className="flex gap-1.5">
                          {collections.map((c) => (
                            <span
                              key={c.slug}
                              data-u={c.slug}
                              className="etiquette rounded-xs border border-ligne px-1.5 py-0.5 text-[0.625rem] text-accent"
                            >
                              {c.nom}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <p className="mot-univers mt-4 text-3xl">{u.nom}</p>
                    <p className="etiquette mt-2">{u.territoire}</p>
                  </div>
                  <p className="relative mt-6 line-clamp-3 text-sm text-gris">
                    {u.description}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {suite.length > 2 ? (
        <section aria-labelledby="derniers">
          <h2 id="derniers" className="etiquette mb-4">
            Les derniers articles
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suite.slice(2).map((a) => (
              <li key={a.slug}>
                <CarteArticle article={a} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
