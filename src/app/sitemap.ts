import type { MetadataRoute } from "next";
import { getArticles, getPersonnes, getTags } from "@/lib/content";
import { COLLECTIONS, UNIVERS } from "@/lib/univers";
import { SITE, urlCanonique } from "@/lib/site";

export const revalidate = 3600; // Régénération automatique toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesTous, personnes, tags] = await Promise.all([
    getArticles(),
    getPersonnes(),
    getTags(),
  ]);

  // Seuls les articles publiés doivent être indexés par les moteurs de recherche
  const articles = articlesTous.filter(
    (a) => !a.status || a.status === "published"
  );

  const maintenant = new Date();

  return [
    {
      url: urlCanonique("/"),
      lastModified: maintenant,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: urlCanonique("/videos"),
      lastModified: maintenant,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: urlCanonique("/auteurs"),
      lastModified: maintenant,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: urlCanonique("/a-propos"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: urlCanonique("/contact"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: urlCanonique("/mentions-legales"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: urlCanonique("/confidentialite"),
      changeFrequency: "yearly",
      priority: 0.2,
    },

    // 6 Univers Talaref
    ...UNIVERS.map((univers) => {
      const articlesUnivers = articles.filter(
        (a) =>
          a.univers === univers.slug ||
          a.universSecondaires?.includes(univers.slug as any)
      );
      const dernier = articlesUnivers[0];
      return {
        url: urlCanonique(`/${univers.slug}`),
        lastModified: dernier ? new Date(dernier.misAJourLe ?? dernier.publieLe) : maintenant,
        changeFrequency: "daily" as const,
        priority: 0.9,
      };
    }),

    // Collections
    ...COLLECTIONS.map((collection) => {
      const articlesCollection = articles.filter(
        (a) => a.collection === collection.slug
      );
      const dernier = articlesCollection[0];
      return {
        url: urlCanonique(`/${collection.parent}/c/${collection.slug}`),
        lastModified: dernier ? new Date(dernier.misAJourLe ?? dernier.publieLe) : maintenant,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),

    // Tous les articles éditoriaux
    ...articles.map((a) => ({
      url: urlCanonique(`/${a.univers}/${a.slug}`),
      lastModified: new Date(a.misAJourLe ?? a.publieLe),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    // Tags
    ...tags.map((t) => ({
      url: urlCanonique(`/tag/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),

    // Auteurs
    ...personnes.map((p) => ({
      url: urlCanonique(`/auteurs/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
