import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/lib/types";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey);
}

export async function GET() {
  const adminClient = getAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  try {
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles: UserProfile[] = data.users.map((u) => {
      const email = u.email || "";
      const isSuperAdmin = email.toLowerCase() === "mpika.toshiro@talaref.co";
      const detectedRole: UserRole = isSuperAdmin
        ? "admin"
        : (u.user_metadata?.role as UserRole) ||
          (u.app_metadata?.role as UserRole) ||
          "membre";

      const pseudo =
        u.user_metadata?.pseudonyme ||
        u.user_metadata?.full_name ||
        email.split("@")[0] ||
        "Membre";

      return {
        id: u.id,
        email,
        pseudonyme: pseudo,
        role: detectedRole,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json({ users: profiles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const adminClient = getAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { userId, newRole } = body as { userId: string; newRole: UserRole };

    if (!userId || !newRole) {
      return NextResponse.json({ error: "userId et newRole requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur pour vérifier qu'on ne rétrograde pas le super-admin
    const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
    if (getUserError || !userData.user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (userData.user.email?.toLowerCase() === "mpika.toshiro@talaref.co" && newRole !== "admin") {
      return NextResponse.json(
        { error: "Impossible de modifier le rôle du premier administrateur" },
        { status: 403 },
      );
    }

    const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...userData.user.user_metadata,
          role: newRole,
        },
        app_metadata: {
          ...userData.user.app_metadata,
          role: newRole,
        },
      },
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminClient = getAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // Sécurité : interdire la suppression du premier admin
    const { data: userData } = await adminClient.auth.admin.getUserById(userId);
    if (userData?.user?.email?.toLowerCase() === "mpika.toshiro@talaref.co") {
      return NextResponse.json(
        { error: "Le compte du premier administrateur ne peut pas être supprimé" },
        { status: 403 },
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
