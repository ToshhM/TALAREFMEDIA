import "server-only";

import type { Article, Personne } from "./types";
import { ARTICLES_DEMO, PERSONNES_DEMO } from "./sample-data";
import { supabase } from "./supabase";

/**
 * Couche d'accès au contenu — Spécification v3.0.
 *
 * Tout le site passe par ces fonctions et par elles seules. Aucune page
 * n'interroge directement la base : le jour où la source change, il n'y a
 * qu'un fichier à reprendre.
 *
 * Priorités d'accès au contenu :
 * 1. Supabase (si configuré et si la table contient des articles)
 * 2. Sanity (si NEXT_PUBLIC_SANITY_PROJECT_ID est configuré)
 * 3. Données de démonstration (sample-data.ts) en repli
 */

const SANITY_ACTIF = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);

function trierParDate(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => Date.parse(b.publieLe) - Date.parse(a.publieLe),
  );
}

async function tousLesArticles(): Promise<Article[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("publie_le", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          slug: item.slug,
          refNumber: item.ref_number ?? undefined,
          titre: item.titre,
          heroTitle: item.hero_title ?? undefined,
          chapo: item.chapo,
          imageDeUne: item.image_de_une,
          univers: item.univers,
          collection: item.collection ?? undefined,
          rubrique: item.rubrique ?? undefined,
          format: item.format ?? undefined,
          tags: item.tags || [],
          auteurs: item.auteurs || [],
          video: item.video || undefined,
          corps: item.corps || [],
          status: item.status || "published",
          publieLe: item.publie_le,
          misAJourLe: item.mis_a_jour_le || undefined,
          tempsDeLecture: item.temps_de_lecture,
        }));
      }
    } catch {
      // En cas d'erreur de connexion Supabase ou de table absente, repli gracieux
    }
  }

  if (SANITY_ACTIF) {
    throw new Error(
      "Sanity est configuré mais la requête GROQ n'est pas encore écrite. " +
        "Vider NEXT_PUBLIC_SANITY_PROJECT_ID pour revenir aux données de démonstration.",
    );
  }

  const { lireArticlesPersonnalises, lireSlugsSupprimes } = await import("./articles-store");
  const [custom, supprimes] = await Promise.all([
    lireArticlesPersonnalises(),
    lireSlugsSupprimes(),
  ]);
  const ensembleSupprimes = new Set(supprimes);
  const slugsCustom = new Set(custom.map((a) => a.slug));
  const liste = [
    ...custom,
    ...ARTICLES_DEMO.filter((a) => !slugsCustom.has(a.slug)),
  ].filter((a) => !ensembleSupprimes.has(a.slug));

  return trierParDate(liste);
}

export async function getArticles(options?: {
  univers?: string;
  collection?: string;
  rubrique?: string;
  tag?: string;
  auteur?: string;
  avecVideo?: boolean;
  limite?: number;
  exclure?: string;
}): Promise<Article[]> {
  let articles = await tousLesArticles();

  if (options?.univers) {
    articles = articles.filter(
      (a) =>
        a.univers === options.univers ||
        a.universSecondaires?.includes(options.univers as any),
    );
  }
  if (options?.collection) {
    articles = articles.filter((a) => a.collection === options.collection);
  }
  if (options?.rubrique) {
    articles = articles.filter(
      (a) => a.rubrique === options.rubrique || a.collection === options.rubrique,
    );
  }
  if (options?.tag) {
    articles = articles.filter((a) =>
      a.tags.some((t) => t.slug === options.tag),
    );
  }
  if (options?.auteur) {
    articles = articles.filter((a) =>
      a.auteurs.some((p) => p.slug === options.auteur),
    );
  }
  if (options?.avecVideo) {
    articles = articles.filter((a) => Boolean(a.video));
  }
  if (options?.exclure) {
    articles = articles.filter((a) => a.slug !== options.exclure);
  }
  if (options?.limite) {
    articles = articles.slice(0, options.limite);
  }

  return articles;
}

export async function getArticle(
  univers: string,
  slug: string,
): Promise<Article | null> {
  const articles = await tousLesArticles();
  return (
    articles.find(
      (a) =>
        (a.univers === univers ||
          a.universSecondaires?.includes(univers as any)) &&
        a.slug === slug,
    ) ?? null
  );
}

/** Deux articles de rebond, générés automatiquement, non éditables. */
export async function getALireAussi(article: Article): Promise<Article[]> {
  if (article.collection) {
    const memeCollection = await getArticles({
      univers: article.univers,
      collection: article.collection,
      exclure: article.slug,
      limite: 2,
    });
    if (memeCollection.length === 2) return memeCollection;
  }

  const memeUnivers = await getArticles({
    univers: article.univers,
    exclure: article.slug,
    limite: 2,
  });
  return memeUnivers.slice(0, 2);
}

export async function getPersonnes(): Promise<Personne[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("personnes")
        .select("*")
        .order("nom");

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          slug: item.slug,
          nom: item.nom,
          bio: item.bio || undefined,
          photo: item.photo || undefined,
          liens: item.liens || [],
        }));
      }
    } catch {
      // Repli gracieux
    }
  }

  if (SANITY_ACTIF) {
    throw new Error("Requête GROQ des personnes non encore écrite.");
  }
  return PERSONNES_DEMO;
}

export async function getPersonne(slug: string): Promise<Personne | null> {
  const personnes = await getPersonnes();
  return personnes.find((p) => p.slug === slug) ?? null;
}

export async function getTags(): Promise<{ slug: string; nom: string }[]> {
  const articles = await tousLesArticles();
  const map = new Map<string, string>();
  for (const a of articles) {
    for (const t of a.tags) map.set(t.slug, t.nom);
  }
  return [...map.entries()].map(([slug, nom]) => ({ slug, nom }));
}

/**
 * Sélection des 3 articles « À la une » (Spécification v3.0 §11) :
 * 1. Recherche manuelle :
 *    - format === "une_1" -> Grande Une (#1)
 *    - format === "une_2" -> 2ème Une (#2)
 *    - format === "une_3" -> 3ème Une (#3)
 * 2. Repli automatique par date :
 *    - Si une position n'est pas assignée manuellement, elle est comblée
 *      par les articles les plus récents (tri par publieLe décroissant).
 */
export async function getArticlesALaUne(): Promise<{
  selection: Article[];
  reste: Article[];
}> {
  const articles = await getArticles();
  if (articles.length === 0) {
    return { selection: [], reste: [] };
  }

  let une1 = articles.find((a) => a.format === "une_1");
  let une2 = articles.find((a) => a.format === "une_2" && a.slug !== une1?.slug);
  let une3 = articles.find(
    (a) => a.format === "une_3" && a.slug !== une1?.slug && a.slug !== une2?.slug,
  );

  const pris = new Set<string>(
    [une1?.slug, une2?.slug, une3?.slug].filter(Boolean) as string[],
  );
  const candidatsDate = articles.filter((a) => !pris.has(a.slug));

  if (!une1 && candidatsDate.length > 0) {
    une1 = candidatsDate.shift();
    if (une1) pris.add(une1.slug);
  }
  if (!une2 && candidatsDate.length > 0) {
    une2 = candidatsDate.shift();
    if (une2) pris.add(une2.slug);
  }
  if (!une3 && candidatsDate.length > 0) {
    une3 = candidatsDate.shift();
    if (une3) pris.add(une3.slug);
  }

  const selection = [une1, une2, une3].filter(Boolean) as Article[];
  const reste = articles.filter((a) => !pris.has(a.slug));

  return { selection, reste };
}
