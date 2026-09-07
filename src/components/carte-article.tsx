import Link from "next/link";
import type { Article } from "@/lib/types";
import { formaterRef, getCollection, getUnivers } from "@/lib/univers";
import { formaterDate, formaterDuree } from "@/lib/site";
import { PastilleCode } from "./pastille-code";

/**
 * La carte d'article — Spécification v3.0 §2.3 & §3.3.
 *
 * Règle de couleur : quand une collection s'applique, data-u prend son slug,
 * lui donnant sa couleur propre.
 * Sur la home, la couleur reste À L'INTÉRIEUR de la carte (filet 3 px en haut).
 */
export function CarteArticle({
  article,
  taille = "normale",
}: {
  article: Article;
  taille?: "normale" | "une";
}) {
  const univers = getUnivers(article.univers);
  if (!univers) return null;

  const collection = article.collection ? getCollection(article.collection) : undefined;
  const territoireActif = collection ?? univers;
  const estUne = taille === "une";
  const refLabel = formaterRef(article.univers, article.refNumber, article.collection);

  return (
    <article
      data-u={territoireActif.slug}
      className="carte-home group relative flex h-full flex-col"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {article.imageDeUne?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageDeUne.url}
            alt={article.imageDeUne.alt || article.titre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="texture" aria-hidden="true" />
        )}
        {article.video ? (
          <span className="etiquette absolute bottom-2 right-2 bg-noir/80 px-1.5 py-1 text-blanc">
            Vidéo
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PastilleCode territoire={territoireActif} />
            {collection ? (
              <Link
                href={`/${univers.slug}/c/${collection.slug}`}
                className="etiquette relative z-10 font-semibold text-accent hover:text-blanc"
              >
                {collection.nom}
              </Link>
            ) : article.tags.length > 0 ? (
              <Link
                href={`/tag/${article.tags[0].slug}`}
                className="etiquette relative z-10 hover:text-blanc"
              >
                {article.tags[0].nom}
              </Link>
            ) : (
              <Link
                href={`/${univers.slug}`}
                className="etiquette relative z-10 hover:text-blanc"
              >
                {univers.nom}
              </Link>
            )}
          </div>

          {article.refNumber !== undefined ? (
            <span className="etiquette font-mono text-[0.625rem] text-gris/80">
              {refLabel}
            </span>
          ) : null}
        </div>

        <h2
          className={`titre-article text-balance ${
            estUne ? "text-2xl sm:text-4xl" : "text-lg sm:text-xl"
          }`}
        >
          <Link
            href={`/${univers.slug}/${article.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.heroTitle && estUne ? article.heroTitle : article.titre}
          </Link>
        </h2>

        <p
          className={`text-pretty text-gris ${
            estUne ? "text-base" : "line-clamp-3 text-sm"
          }`}
        >
          {article.chapo}
        </p>

        <p className="etiquette mt-auto pt-2">
          <time dateTime={article.publieLe}>
            {formaterDate(article.publieLe)}
          </time>
          <span aria-hidden="true"> · </span>
          {formaterDuree(article.tempsDeLecture)}
        </p>
      </div>
    </article>
  );
}
