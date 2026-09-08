import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugifier } from "@/lib/reserved";
import { ARTICLES_DEMO } from "@/lib/sample-data";
import type { Article, Bloc } from "@/lib/types";
import type { CollectionSlug, UniverseSlug } from "@/lib/univers";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      titre,
      heroTitle,
      chapo,
      univers,
      universSecondaires,
      collection,
      imageUrl,
      imageAlt,
      imageCredit,
      tagsRaw,
      metaTitre,
      metaDescription,
      corps,
      video,
      auteurNom,
      auteurSlug,
      publieLe,
    } = body;

    if (!titre?.trim() || !chapo?.trim() || !univers) {
      return NextResponse.json(
        { error: "Le titre, le chapô et l'univers sont obligatoires." },
        { status: 400 },
      );
    }

    // Calcul du slug unique
    let slug = slugifier(titre);
    if (ARTICLES_DEMO.some((a) => a.slug === slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Découpage des tags
    const tags = (tagsRaw || "")
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((t: string) => ({
        slug: slugifier(t),
        nom: t,
      }));

    // Blocs d'article
    const blocsArticle: Bloc[] = Array.isArray(corps) && corps.length > 0
      ? corps
      : [
          {
            _key: "b_" + Math.random().toString(36).substring(2, 7),
            _type: "paragraphe",
            texte: chapo,
          },
        ];

    // Vérifier s'il y a un bloc La Ref
    const aBlocLaRef = blocsArticle.some((b) => b._type === "laRef");
    if (!aBlocLaRef) {
      // Ajout automatique d'un bloc La ref d'exemple si absent
      blocsArticle.push({
        _key: "ref_" + Math.random().toString(36).substring(2, 7),
        _type: "laRef",
        titre: "La référence",
        texte: `Dans cet article dédié à ${titre}, la référence mise en avant témoigne de l'ADN éditorial Talaref.`,
      });
    }

    // Calcul du temps de lecture
    const motsTotal = [
      titre,
      chapo,
      ...blocsArticle.map((b) => ("texte" in b && typeof b.texte === "string" ? b.texte : "")),
    ]
      .join(" ")
      .split(/\s+/).length;
    const tempsDeLecture = Math.max(1, Math.ceil(motsTotal / 230));

    // Numéro REF incrémental
    const maxRef = Math.max(
      0,
      ...ARTICLES_DEMO.filter((a) => a.univers === univers).map((a) => a.refNumber || 0),
    );
    const refNumber = maxRef + 1;

    const nouvelArticle: Article = {
      slug,
      refNumber,
      titre: titre.trim(),
      heroTitle: heroTitle?.trim() || undefined,
      chapo: chapo.trim(),
      imageDeUne: {
        url: imageUrl?.trim() || "",
        alt: imageAlt?.trim() || titre.trim(),
        credit: imageCredit?.trim() || "Talaref Media",
      },
      univers: univers as UniverseSlug,
      universSecondaires: Array.isArray(universSecondaires)
        ? (universSecondaires as UniverseSlug[])
        : undefined,
      collection: (collection as CollectionSlug) || undefined,
      tags,
      metaTitre: metaTitre?.trim() || undefined,
      metaDescription: metaDescription?.trim() || undefined,
      auteurs: [
        {
          slug: auteurSlug || "redaction",
          nom: auteurNom || "La rédaction",
        },
      ],
      video: video?.youtubeId || video?.url ? video : undefined,
      corps: blocsArticle,
      status: "published",
      publieLe: publieLe ? new Date(publieLe).toISOString() : new Date().toISOString(),
      tempsDeLecture,
    };

    // Insertion Supabase si disponible
    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        await adminClient.from("articles").insert({
          slug: nouvelArticle.slug,
          ref_number: nouvelArticle.refNumber,
          titre: nouvelArticle.titre,
          hero_title: nouvelArticle.heroTitle || null,
          chapo: nouvelArticle.chapo,
          image_de_une: nouvelArticle.imageDeUne,
          univers: nouvelArticle.univers,
          collection: nouvelArticle.collection || null,
          tags: nouvelArticle.tags,
          auteurs: nouvelArticle.auteurs,
          video: nouvelArticle.video || null,
          corps: nouvelArticle.corps,
          status: nouvelArticle.status,
          publie_le: nouvelArticle.publieLe,
          temps_de_lecture: nouvelArticle.tempsDeLecture,
        });
      } catch {
        // En cas de table SQL non encore instanciée, la persistance runtime suffit
      }
    }

    // Persistance locale fiable
    const { sauvegarderArticlePersonnalise } = await import("@/lib/articles-store");
    await sauvegarderArticlePersonnalise(nouvelArticle);

    // Enregistrement immédiat dans la collection en mémoire
    ARTICLES_DEMO.unshift(nouvelArticle);

    return NextResponse.json(
      {
        success: true,
        article: nouvelArticle,
        url: `/${nouvelArticle.univers}/${nouvelArticle.slug}`,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { getArticles } = await import("@/lib/content");
    const articles = await getArticles();
    return NextResponse.json({ articles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      titre,
      heroTitle,
      chapo,
      univers,
      universSecondaires,
      collection,
      imageUrl,
      imageAlt,
      imageCredit,
      tagsRaw,
      corps,
      video,
      metaTitre,
      metaDescription,
      refNumber,
      publieLe,
    } = body;

    if (!slug || !titre?.trim() || !chapo?.trim() || !univers) {
      return NextResponse.json(
        { error: "Le slug, le titre, le chapô et l'univers sont obligatoires." },
        { status: 400 },
      );
    }

    const tags = (tagsRaw || "")
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean)
      .map((t: string) => ({
        slug: slugifier(t),
        nom: t,
      }));

    const blocsArticle: Bloc[] = Array.isArray(corps) && corps.length > 0
      ? corps
      : [
          {
            _key: "b_" + Math.random().toString(36).substring(2, 7),
            _type: "paragraphe",
            texte: chapo,
          },
        ];

    const motsTotal = [
      titre,
      chapo,
      ...blocsArticle.map((b) => ("texte" in b && typeof b.texte === "string" ? b.texte : "")),
    ]
      .join(" ")
      .split(/\s+/).length;
    const tempsDeLecture = Math.max(1, Math.ceil(motsTotal / 230));

    const { getArticle } = await import("@/lib/content");
    const existant = await getArticle(univers, slug);

    const articleMaj: Article = {
      slug,
      refNumber: refNumber !== undefined ? refNumber : existant?.refNumber,
      titre: titre.trim(),
      heroTitle: heroTitle?.trim() || undefined,
      chapo: chapo.trim(),
      imageDeUne: {
        url: imageUrl?.trim() || "",
        alt: imageAlt?.trim() || titre.trim(),
        credit: imageCredit?.trim() || "Talaref Media",
      },
      univers: univers as UniverseSlug,
      universSecondaires: Array.isArray(universSecondaires)
        ? (universSecondaires as UniverseSlug[])
        : undefined,
      collection: (collection as CollectionSlug) || undefined,
      tags,
      metaTitre: metaTitre?.trim() || undefined,
      metaDescription: metaDescription?.trim() || undefined,
      auteurs: existant?.auteurs || [
        {
          slug: "redaction",
          nom: "La rédaction",
        },
      ],
      video: video?.youtubeId || video?.url ? video : undefined,
      corps: blocsArticle,
      status: existant?.status || "published",
      publieLe: publieLe
        ? new Date(publieLe).toISOString()
        : existant?.publieLe || new Date().toISOString(),
      misAJourLe: new Date().toISOString(),
      tempsDeLecture,
    };

    // Mise à jour Supabase si configuré
    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        await adminClient
          .from("articles")
          .update({
            titre: articleMaj.titre,
            hero_title: articleMaj.heroTitle || null,
            chapo: articleMaj.chapo,
            image_de_une: articleMaj.imageDeUne,
            univers: articleMaj.univers,
            collection: articleMaj.collection || null,
            tags: articleMaj.tags,
            video: articleMaj.video || null,
            corps: articleMaj.corps,
            publie_le: articleMaj.publieLe,
            mis_a_jour_le: articleMaj.misAJourLe,
            temps_de_lecture: articleMaj.tempsDeLecture,
          })
          .eq("slug", slug);
      } catch {
        // Fallback local
      }
    }

    // Mise à jour dans le store local
    const { mettreAJourArticle } = await import("@/lib/articles-store");
    await mettreAJourArticle(slug, articleMaj);

    // Mise à jour en mémoire si dans ARTICLES_DEMO
    const demoIndex = ARTICLES_DEMO.findIndex((a) => a.slug === slug);
    if (demoIndex >= 0) {
      ARTICLES_DEMO[demoIndex] = articleMaj;
    }

    return NextResponse.json({
      success: true,
      article: articleMaj,
      url: `/${articleMaj.univers}/${articleMaj.slug}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug de l'article requis." }, { status: 400 });
    }

    // Suppression Supabase si disponible
    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        await adminClient.from("articles").delete().eq("slug", slug);
      } catch {
        // Fallback
      }
    }

    // Suppression dans le store local et inscription dans les slugs supprimés
    const { supprimerArticleDuStore } = await import("@/lib/articles-store");
    await supprimerArticleDuStore(slug);

    // Suppression de ARTICLES_DEMO en mémoire si présent
    const idx = ARTICLES_DEMO.findIndex((a) => a.slug === slug);
    if (idx >= 0) {
      ARTICLES_DEMO.splice(idx, 1);
    }

    return NextResponse.json({ success: true, message: "Article supprimé avec succès." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

