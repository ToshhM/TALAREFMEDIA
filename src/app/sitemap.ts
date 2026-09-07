import type { MetadataRoute } from "next";
import { getArticles, getPersonnes, getTags } from "@/lib/content";
import { COLLECTIONS, UNIVERS } from "@/lib/univers";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, personnes, tags] = await Promise.all([
    getArticles(),
    getPersonnes(),
    getTags(),
  ]);

  const u = (chemin: string) => `${SITE.url}${chemin}`;

  return [
    { url: u("/"), changeFrequency: "daily", priority: 1 },
    { url: u("/videos"), changeFrequency: "daily", priority: 0.7 },
    { url: u("/auteurs"), changeFrequency: "monthly", priority: 0.4 },
    { url: u("/a-propos"), changeFrequency: "yearly", priority: 0.3 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: u("/mentions-legales"), changeFrequency: "yearly", priority: 0.1 },
    { url: u("/confidentialite"), changeFrequency: "yearly", priority: 0.1 },

    ...UNIVERS.map((univers) => ({
      url: u(`/${univers.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),

    ...COLLECTIONS.map((collection) => ({
      url: u(`/${collection.parent}/c/${collection.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    ...articles.map((a) => ({
      url: u(`/${a.univers}/${a.slug}`),
      lastModified: new Date(a.misAJourLe ?? a.publieLe),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),

    ...tags.map((t) => ({
      url: u(`/tag/${t.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),

    ...personnes.map((p) => ({
      url: u(`/auteurs/${p.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
