import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getALireAussi, getArticle, getArticles } from "@/lib/content";
import { formaterRef, getCollection, getUnivers } from "@/lib/univers";
import { SITE, dureeISO, formaterDate, formaterDuree, formaterImageTransform, formaterObjectPosition, urlAbsolue } from "@/lib/site";
import { RenduBlocs } from "@/components/blocs";
import { BarreProgression } from "@/components/barre-progression";
import { PastilleCode } from "@/components/pastille-code";
import { CommentairesArticle } from "@/components/commentaires-article";
import { FacadeVideo } from "@/components/facade-video";
import { TexteRiche } from "@/components/texte-riche";

type Params = { univers: string; slug: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ univers: a.univers, slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { univers: uSlug, slug } = await params;
  const article = await getArticle(uSlug, slug);
  if (!article) return {};

  const url = `/${article.univers}/${article.slug}`;
  const metaTitle = article.metaTitre?.trim() || article.titre;
  const metaDesc = article.metaDescription?.trim() || article.chapo;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: metaTitle,
      description: metaDesc,
      url,
      publishedTime: article.publieLe,
      modifiedTime: article.misAJourLe,
      authors: article.auteurs.map((a) => a.nom),
      images: article.imageDeUne?.url
        ? [{ url: article.imageDeUne.url, alt: article.imageDeUne.alt || metaTitle }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: article.imageDeUne?.url ? [article.imageDeUne.url] : [],
    },
  };
}

/**
 * La page d'article — Spécification v3.0 §02, §07 & §14.
 *
 * Règle de couleur (§2.3) : quand une collection s'applique, c'est elle
 * qui donne sa couleur à la page, pas son univers.
 * L'architecture de rédaction (14 blocs fermés, colonne de 65ch) reste strictement préservée.
 */
export default async function PageArticle({
  params,
}: {
  params: Promise<Params>;
}) {
  const { univers: uSlug, slug } = await params;
  const article = await getArticle(uSlug, slug);
  if (!article) notFound();

  const univers = getUnivers(article.univers);
  if (!univers) notFound();

  const collection = article.collection ? getCollection(article.collection) : undefined;
  const territoireActif = collection ?? univers;
  const aLireAussi = await getALireAussi(article);
  const url = urlAbsolue(`/${article.univers}/${article.slug}`);
  const refLabel = formaterRef(article.univers, article.refNumber, article.collection);

  const donneesStructurees = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.titre,
      description: article.chapo,
      datePublished: article.publieLe,
      dateModified: article.misAJourLe ?? article.publieLe,
      author: article.auteurs.map((a) => ({
        "@type": "Person",
        name: a.nom,
        url: urlAbsolue(`/auteurs/${a.slug}`),
      })),
      publisher: { "@type": "Organization", name: SITE.nomComplet },
      mainEntityOfPage: url,
      articleSection: collection?.nom ?? univers.nom,
      inLanguage: SITE.langue,
    },
    ...(article.video
      ? [
          {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: article.video.titre,
            description: article.chapo,
            uploadDate: article.video.misEnLigneLe,
            duration: dureeISO(article.video.duree),
            thumbnailUrl: `https://i.ytimg.com/vi/${article.video.youtubeId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${article.video.youtubeId}`,
            contentUrl: `https://www.youtube.com/watch?v=${article.video.youtubeId}`,
          },
        ]
      : []),
  ];

  return (
    <main data-u={territoireActif.slug}>
      <BarreProgression />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Fil d'Ariane" className="etiquette mb-6">
          <Link href={`/${univers.slug}`} className="hover:text-accent">
            {univers.nom}
          </Link>
          {collection ? (
            <>
              <span aria-hidden="true"> / </span>
              <Link
                href={`/${univers.slug}/c/${collection.slug}`}
                className="font-semibold text-accent hover:underline"
              >
                {collection.nom}
              </Link>
            </>
          ) : null}
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <PastilleCode territoire={territoireActif} />
            <span className="badge-ref">{refLabel}</span>
            {article.universSecondaires && article.universSecondaires.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {article.universSecondaires.map((uSec) => {
                  const uObj = getUnivers(uSec);
                  if (!uObj) return null;
                  return (
                    <Link
                      key={uSec}
                      href={`/${uSec}`}
                      className="rounded border border-ligne bg-surface px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-gris transition-colors hover:border-accent hover:text-accent"
                    >
                      + {uObj.nom}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <h1 className="titre-article mt-5 text-balance text-3xl sm:text-5xl">
            {article.titre}
          </h1>

          <p className="etiquette mt-6 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Par{" "}
              {article.auteurs.map((a, i) => (
                <span key={a.slug}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/auteurs/${a.slug}`}
                    className="text-blanc hover:text-accent"
                  >
                    {a.nom}
                  </Link>
                </span>
              ))}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publieLe}>
              {formaterDate(article.publieLe)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{formaterDuree(article.tempsDeLecture)}</span>
          </p>

          {article.misAJourLe &&
          Date.parse(article.misAJourLe) - Date.parse(article.publieLe) >
            30 * 24 * 3600 * 1000 ? (
            <p className="etiquette mt-1">
              Mis à jour le {formaterDate(article.misAJourLe)}
            </p>
          ) : null}
        </header>

        <div className="mb-10 border-l-2 border-ligne pl-5 text-xl leading-relaxed text-gris">
          <TexteRiche texte={article.chapo} />
        </div>

        {article.video ? (
          <figure className="mb-10">
            <FacadeVideo
              youtubeId={article.video.youtubeId}
              titre={article.video.titre}
            />
            <figcaption className="etiquette mt-2">
              {article.video.titre || "Vidéo Talaref"}
            </figcaption>
          </figure>
        ) : (
          <figure className="mb-10">
            {(() => {
              const disp = article.imageDeUne?.disposition || "standard";
              const cadrage = article.imageDeUne?.cadrage || "center";
              const altText = article.imageDeUne?.alt || article.titre;

              if (disp === "adaptatif") {
                return (
                  <div
                    className="relative w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/10] max-h-[75vh] overflow-hidden rounded-md bg-surface-2 border border-ligne flex items-center justify-center"
                    role="img"
                    aria-label={altText}
                  >
                    {article.imageDeUne?.url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.imageDeUne.url}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-noir/40 backdrop-blur-[1px]" aria-hidden="true" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.imageDeUne.url}
                          alt={altText}
                          style={{
                            objectPosition: formaterObjectPosition(cadrage),
                            transform: formaterImageTransform(article.imageDeUne?.zoom, cadrage, true),
                          }}
                          className="relative z-10 max-h-full max-w-full object-contain p-1 sm:p-2 drop-shadow-md select-none transition-transform duration-200"
                        />
                      </>
                    ) : (
                      <div className="texture" aria-hidden="true" />
                    )}
                  </div>
                );
              }

              let containerClass = "aspect-video w-full";
              if (disp === "portrait") {
                containerClass = "aspect-[3/4] max-w-md mx-auto";
              } else if (disp === "carre") {
                containerClass = "aspect-square max-w-lg mx-auto";
              }

              return (
                <div
                  className={`relative overflow-hidden rounded-md bg-surface-2 border border-ligne ${containerClass}`}
                  role="img"
                  aria-label={altText}
                >
                  {article.imageDeUne?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.imageDeUne.url}
                      alt={altText}
                      style={{
                        objectPosition: formaterObjectPosition(cadrage),
                        transform: formaterImageTransform(article.imageDeUne?.zoom, cadrage, false),
                      }}
                      className="h-full w-full object-cover transition-transform duration-200"
                    />
                  ) : (
                    <div className="texture" aria-hidden="true" />
                  )}
                </div>
              );
            })()}
            <figcaption className="etiquette mt-2 text-center sm:text-left">
              {article.imageDeUne?.credit || "Talaref Media"}
            </figcaption>
          </figure>
        )}

        <div className="corps-article">
          <RenduBlocs blocs={article.corps} aLireAussi={aLireAussi} />
        </div>

        {article.tags.length > 0 ? (
          <footer className="mt-12 border-t border-ligne pt-6">
            <p className="etiquette">Sujets</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tag/${t.slug}`}
                    className="block border border-ligne px-3 py-1.5 text-sm text-gris transition-colors hover:border-accent hover:text-accent"
                  >
                    {t.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}

        <CommentairesArticle articleSlug={article.slug} />
      </article>
    </main>
  );
}
