import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getArticles } from "@/lib/content";
import { COLLECTIONS, getCollection, getUnivers } from "@/lib/univers";
import { CarteArticle } from "@/components/carte-article";

type Params = { univers: string; collection: string };

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({
    univers: c.parent,
    collection: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { univers: uSlug, collection: cSlug } = await params;
  const univers = getUnivers(uSlug);
  const collection = getCollection(cSlug);
  if (!univers || !collection || collection.parent !== univers.slug) return {};

  return {
    title: `${collection.nom} — ${univers.nom}`,
    description: `Tous les articles de la collection ${collection.nom} (${collection.territoire}), dans l'univers ${univers.nom}.`,
    alternates: { canonical: `/${univers.slug}/c/${collection.slug}` },
  };
}

/**
 * La page de collection — Spécification v3.0 §02, §06 & §09.
 *
 * Le segment /c/ identifie formellement la collection au sein de son univers.
 * Règle de couleur (§2.3) : data-u porte le slug de la collection,
 * adoptant ainsi son accent et sa police de signature.
 */
export default async function PageCollection({
  params,
}: {
  params: Promise<Params>;
}) {
  const { univers: uSlug, collection: cSlug } = await params;
  const univers = getUnivers(uSlug);
  const collection = getCollection(cSlug);

  if (!univers || !collection || collection.parent !== univers.slug) {
    notFound();
  }

  const articles = await getArticles({
    univers: univers.slug,
    collection: collection.slug,
  });

  return (
    <main data-u={collection.slug} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="etiquette mb-6">
        <Link href={`/${univers.slug}`} className="hover:text-accent">
          {univers.nom}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="font-semibold text-accent">{collection.nom}</span>
      </nav>

      <header className="relative mb-12 overflow-hidden border-b border-ligne pb-10">
        <div className="texture" aria-hidden="true" />
        <div className="relative">
          <span className="pastille-code">{collection.code}</span>
          <h1 className="mot-univers mt-4 text-5xl sm:text-6xl">
            {collection.nom}
          </h1>
          <p className="etiquette mt-2">{collection.territoire}</p>
          <p className="mt-4 max-w-2xl text-pretty text-gris">
            {collection.description}
          </p>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="mt-10 text-gris">
          Aucun article dans cette collection pour le moment.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <CarteArticle article={a} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
