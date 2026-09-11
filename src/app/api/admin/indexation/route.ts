import { NextResponse } from "next/server";
import { getArticles } from "@/lib/content";
import { DOMAINE_CANONIQUE, urlCanonique } from "@/lib/site";

export async function POST() {
  const sitemapUrl = urlCanonique("/sitemap.xml");
  const newsSitemapUrl = urlCanonique("/news.xml");

  const articles = await getArticles();
  const articlesPublies = articles.filter(
    (a) => !a.status || a.status === "published"
  );

  const urlList = [
    urlCanonique("/"),
    urlCanonique("/videos"),
    ...articlesPublies.slice(0, 20).map((a) => urlCanonique(`/${a.univers}/${a.slug}`)),
  ];

  const resultats: { service: string; succes: boolean; message: string }[] = [];

  // 1. Notification Bing / IndexNow
  try {
    const resIndexNow = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "talaref.media",
        key: "talaref-media-index",
        urlList,
      }),
    });
    resultats.push({
      service: "IndexNow (Bing, Yandex, Seznam)",
      succes: resIndexNow.ok || resIndexNow.status === 200 || resIndexNow.status === 202,
      message: `Statut HTTP ${resIndexNow.status}`,
    });
  } catch (err: any) {
    resultats.push({
      service: "IndexNow (Bing, Yandex)",
      succes: false,
      message: err.message || "Erreur réseau",
    });
  }

  // 2. Ping Google Sitemaps
  try {
    const googleRes = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    );
    resultats.push({
      service: "Google Search (Ping Sitemap)",
      succes: googleRes.ok,
      message: `Statut HTTP ${googleRes.status}`,
    });
  } catch (err: any) {
    resultats.push({
      service: "Google Search (Ping)",
      succes: false,
      message: err.message || "Erreur réseau",
    });
  }

  return NextResponse.json({
    succes: true,
    domaine: DOMAINE_CANONIQUE,
    sitemapUrl,
    newsSitemapUrl,
    nbArticlesIndexables: articlesPublies.length,
    resultats,
  });
}
