import Link from "next/link";
import type { Article, Bloc } from "@/lib/types";
import { getUnivers } from "@/lib/univers";
import { FacadeVideo } from "./facade-video";
import { PastilleCode } from "./pastille-code";
import { TexteRiche } from "./texte-riche";

/**
 * Le rendu du jeu de blocs FERMÉ — architecture V1 §03.
 *
 * Quatorze blocs, pas un de plus. Le rédacteur choisit un bloc, il ne le
 * met pas en forme : c'est ce qui garantit que deux articles écrits par
 * deux personnes différentes sortent avec exactement la même présentation.
 *
 * Ajouter un rendu ici sans ajouter le bloc au schéma Sanity — ou
 * l'inverse — casse cette garantie.
 */

export function RenduBlocs({
  blocs,
  aLireAussi,
}: {
  blocs: Bloc[];
  aLireAussi: Article[];
}) {
  return (
    <>
      {blocs.map((bloc) => (
        <RenduBloc key={bloc._key} bloc={bloc} aLireAussi={aLireAussi} />
      ))}
    </>
  );
}

function RenduBloc({
  bloc,
  aLireAussi,
}: {
  bloc: Bloc;
  aLireAussi: Article[];
}) {
  switch (bloc._type) {
    case "chapo":
      return (
        <TexteRiche
          texte={bloc.texte}
          className="mb-8 text-xl leading-relaxed text-gris"
        />
      );

    case "paragraphe":
      return <TexteRiche texte={bloc.texte} className="mb-6" />;

    case "intertitre": {
      // Niveaux 2 et 3 uniquement : la hiérarchie d'un article ne descend
      // pas plus bas, et h1 est réservé au titre de l'article.
      const Balise = bloc.niveau === 3 ? "h3" : "h2";
      return (
        <Balise
          className={
            bloc.niveau === 3
              ? "mb-3 mt-10 text-lg font-semibold text-blanc"
              : "titre-article mb-4 mt-14 text-2xl sm:text-3xl"
          }
        >
          {bloc.texte}
        </Balise>
      );
    }

    case "moduleVideo":
      return (
        <figure className="my-10">
          <FacadeVideo
            youtubeId={bloc.video.youtubeId || (bloc.video as any).url || ""}
            titre={bloc.video.titre}
          />
          <figcaption className="etiquette mt-2">
            {bloc.video.titre || "La vidéo Talaref du sujet"}
          </figcaption>
        </figure>
      );

    /* Le bloc identitaire : un article sans « ref » n'est pas un article
       Talaref. C'est ce qui transforme un article d'actualité en article
       qu'on garde. */
    case "laRef":
      return (
        <aside className="my-10 border-l-2 border-accent bg-teinte p-5">
          <p className="etiquette text-accent">La ref</p>
          <p className="mt-2 font-semibold text-blanc">{bloc.titre}</p>
          <TexteRiche
            texte={bloc.texte}
            className="mt-2 text-[0.95rem] leading-relaxed text-gris"
          />
        </aside>
      );

    case "image":
      return (
        <figure className="my-10">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-md bg-surface-2 border border-ligne"
            role="img"
            aria-label={bloc.image.alt}
          >
            {bloc.image.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bloc.image.url}
                alt={bloc.image.alt || ""}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="texture" aria-hidden="true" />
            )}
          </div>
          <figcaption className="etiquette mt-2">
            {bloc.image.legende ? `${bloc.image.legende} · ` : ""}
            {bloc.image.credit}
          </figcaption>
        </figure>
      );

    case "galerie":
      return (
        <figure className="my-10">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {bloc.images.map((image, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-md bg-surface-2 border border-ligne"
                role="img"
                aria-label={image.alt}
              >
                {image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.alt || ""}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="texture" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          <figcaption className="etiquette mt-2">
            {bloc.images.length} image{bloc.images.length > 1 ? "s" : ""} ·{" "}
            {[...new Set(bloc.images.map((i) => i.credit).filter(Boolean))].join(", ") || "Talaref Media"}
          </figcaption>
        </figure>
      );

    case "chiffreCle":
      return (
        <figure className="my-10 border-y border-ligne py-6">
          <p className="titre-article text-4xl text-accent sm:text-5xl">
            {bloc.valeur}
          </p>
          <p className="mt-2 text-blanc">{bloc.libelle}</p>
          <figcaption className="etiquette mt-2">
            Source : {bloc.source}
          </figcaption>
        </figure>
      );

    case "citation":
      return (
        <figure className="my-10">
          <blockquote className="border-l-2 border-ligne pl-5 text-xl italic leading-relaxed text-blanc">
            « <TexteRiche texte={bloc.texte} inline /> »
          </blockquote>
          <figcaption className="etiquette mt-3 pl-5">
            {bloc.auteur}
          </figcaption>
        </figure>
      );

    case "liste":
      return (
        <ul className="my-8 space-y-3">
          {bloc.entrees.map((entree, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="etiquette shrink-0 pt-1 text-accent"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{entree}</span>
            </li>
          ))}
        </ul>
      );

    case "chronologie":
      return (
        <ol className="my-10 space-y-6 border-l border-ligne pl-6">
          {bloc.entrees.map((entree, i) => (
            <li key={i} className="relative">
              <span
                className="absolute -left-[1.6875rem] top-2 h-2 w-2 rounded-full bg-accent"
                aria-hidden="true"
              />
              <p className="etiquette text-accent">{entree.date}</p>
              <p className="mt-1">{entree.texte}</p>
            </li>
          ))}
        </ol>
      );

    case "ficheTechnique":
      return (
        <div className="my-10 border border-ligne">
          <p className="etiquette border-b border-ligne px-4 py-3">
            Fiche technique
          </p>
          <dl className="divide-y divide-ligne">
            {bloc.lignes.map((ligne, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 text-sm">
                <dt className="w-2/5 shrink-0 text-gris">{ligne.libelle}</dt>
                <dd className="font-medium text-blanc">{ligne.valeur}</dd>
              </div>
            ))}
          </dl>
          {bloc.verdict ? (
            <p className="border-t border-ligne bg-teinte px-4 py-3 text-sm">
              <span className="etiquette text-accent">Verdict</span>
              <br />
              {bloc.verdict}
            </p>
          ) : null}
        </div>
      );

    /* Généré automatiquement, non éditable par le rédacteur. */
    case "aLireAussi": {
      if (aLireAussi.length === 0) return null;
      return (
        <aside className="my-12 border-t border-ligne pt-6">
          <p className="etiquette">À lire aussi</p>
          <ul className="mt-4 space-y-4">
            {aLireAussi.map((autre) => {
              const u = getUnivers(autre.univers);
              if (!u) return null;
              return (
                <li key={autre.slug} data-u={u.slug}>
                  <Link
                    href={`/${u.slug}/${autre.slug}`}
                    className="group flex gap-3"
                  >
                    <PastilleCode univers={u} className="mt-1 shrink-0" />
                    <span className="font-medium text-blanc group-hover:text-accent">
                      {autre.titre}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      );
    }

    case "separateur":
      return (
        <hr className="mx-auto my-12 w-16 border-0 border-t border-ligne" />
      );

    default:
      return null;
  }
}
