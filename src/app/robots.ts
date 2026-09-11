import type { MetadataRoute } from "next";
import { urlCanonique } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/compte",
          "/compte/",
          "/connexion",
          "/inscription",
          "/mot-de-passe-oublie",
          "/reinitialisation-mot-de-passe",
          "/auth/",
          "/recherche",
          "/preview/",
          "/studio",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/compte",
          "/connexion",
          "/inscription",
          "/auth/",
          "/recherche",
          "/preview/",
        ],
      },
      {
        userAgent: "Googlebot-News",
        allow: "/",
        disallow: ["/admin", "/api/", "/compte", "/connexion", "/inscription"],
      },
    ],
    sitemap: [
      urlCanonique("/sitemap.xml"),
      urlCanonique("/news.xml"),
    ],
  };
}
