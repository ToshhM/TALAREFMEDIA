import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Commentaire, UserRole } from "@/lib/types";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mémoire de secours en cas d'absence de la table SQL dans Supabase
const MEMOIRE_COMMENTAIRES: Commentaire[] = [
  {
    id: "c_demo_1",
    articleSlug: "silent-hill-2-remake-le-brouillard-a-un-cout",
    userId: "demo_user_1",
    userPseudonyme: "ArcadeRunner",
    userRole: "membre",
    contenu: "Excellente analyse sur la distance d'affichage. C'est vrai que la caméra à l'épaule change radicalement l'ambiance originale.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "c_demo_2",
    articleSlug: "lia-peut-elle-remplacer-un-monteur",
    userId: "demo_user_2",
    userPseudonyme: "PixelMaster",
    userRole: "membre",
    contenu: "L'explication sur l'effet Koulechov résume parfaitement pourquoi le geste humain reste au cœur du montage !",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleSlug = searchParams.get("articleSlug");

  if (!articleSlug) {
    return NextResponse.json({ error: "articleSlug requis" }, { status: 400 });
  }

  const adminClient = getAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("commentaires")
        .select("*")
        .eq("article_slug", articleSlug)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const mapped: Commentaire[] = data.map((c) => ({
          id: c.id,
          articleSlug: c.article_slug,
          userId: c.user_id,
          userPseudonyme: c.user_pseudonyme,
          userRole: c.user_role as UserRole,
          contenu: c.contenu,
          createdAt: c.created_at,
        }));
        return NextResponse.json({ commentaires: mapped });
      }
    } catch {
      // Repli mémoire
    }
  }

  const filtres = MEMOIRE_COMMENTAIRES.filter((c) => c.articleSlug === articleSlug);
  return NextResponse.json({ commentaires: filtres });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleSlug, contenu, userId, userPseudonyme, userRole } = body;

    if (!articleSlug || !contenu?.trim()) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    if (!userId || !userPseudonyme) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    const nouveauCommentaire: Commentaire = {
      id: "com_" + Math.random().toString(36).substring(2, 9),
      articleSlug,
      userId,
      userPseudonyme: userPseudonyme.trim(),
      userRole: userRole || "membre",
      contenu: contenu.trim(),
      createdAt: new Date().toISOString(),
    };

    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        const { data, error } = await adminClient
          .from("commentaires")
          .insert({
            article_slug: articleSlug,
            user_id: userId,
            user_pseudonyme: userPseudonyme.trim(),
            user_role: userRole || "membre",
            contenu: contenu.trim(),
          })
          .select()
          .single();

        if (!error && data) {
          nouveauCommentaire.id = data.id;
          nouveauCommentaire.createdAt = data.created_at;
        }
      } catch {
        // Repli mémoire
      }
    }

    MEMOIRE_COMMENTAIRES.push(nouveauCommentaire);
    return NextResponse.json({ commentaire: nouveauCommentaire }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!id || !userId) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        await adminClient.from("commentaires").delete().eq("id", id);
      } catch {
        // Continue
      }
    }

    const index = MEMOIRE_COMMENTAIRES.findIndex((c) => c.id === id);
    if (index !== -1) {
      const comment = MEMOIRE_COMMENTAIRES[index];
      if (comment.userId === userId || role === "admin") {
        MEMOIRE_COMMENTAIRES.splice(index, 1);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
