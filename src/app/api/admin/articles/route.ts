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
      collection,
      imageUrl,
      imageAlt,
      imageCredit,
      tagsRaw,
      corps,
      video,
      auteurNom,
      auteurSlug,
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
      collection: (collection as CollectionSlug) || undefined,
      tags,
      auteurs: [
        {
          slug: auteurSlug || "redaction",
          nom: auteurNom || "La rédaction",
        },
      ],
      video: video?.youtubeId || video?.url ? video : undefined,
      corps: blocsArticle,
      status: "published",
      publieLe: new Date().toISOString(),
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
