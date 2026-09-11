import { NextResponse } from "next/server";
import { getArticles } from "@/lib/content";
import { SITE, urlCanonique } from "@/lib/site";

export const revalidate = 900; // 15 minutes pour Google News

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Sitemap spécifique Google Actualités (Google News Sitemap).
 * Conforme aux spécifications officielles Google Search Central :
 * - Namespace xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
 * - Priorise les articles récents (dernières 48h ou les 30 derniers articles publiés)
 */
export async function GET() {
  const articlesTous = await getArticles();

  const maintenant = Date.now();
  const quaranteHuitHeuresMs = 48 * 60 * 60 * 1000;

  // Filtrer les articles publiés
  const articlesPublies = articlesTous.filter(
    (a) => !a.status || a.status === "published"
  );

  // Privilégier les articles des dernières 48h selon la règle Google News
  let articlesNews = articlesPublies.filter((a) => {
    const dateArticle = new Date(a.publieLe).getTime();
    return maintenant - dateArticle <= quaranteHuitHeuresMs;
  });

  // Si moins de 5 articles dans les dernières 48h (ex: rythme de publication hebdomadaire),
  // inclure les 15 articles les plus récents pour garantir que le flux Google News n'est pas vide
  if (articlesNews.length < 5) {
    articlesNews = articlesPublies.slice(0, 15);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articlesNews
  .map((article) => {
    const url = urlCanonique(`/${article.univers}/${article.slug}`);
    const datePublication = new Date(article.publieLe).toISOString();
    const titre = escapeXml(article.titre);
    const nomPublication = escapeXml(SITE.nomComplet);

    return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${nomPublication}</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${datePublication}</news:publication_date>
      <news:title>${titre}</news:title>
    </news:news>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
