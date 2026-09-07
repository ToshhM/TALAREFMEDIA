"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (user) {
    const pseudonyme =
      user.user_metadata?.pseudonyme ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Compte";

    const role =
      user.email === "mpika.toshiro@talaref.co"
        ? "admin"
        : user.user_metadata?.role || user.app_metadata?.role || "membre";
    const estAdmin = role === "admin";
    const estRedacteur = role === "redacteur";

    return (
      <div className="flex items-center gap-2">
        {(estAdmin || estRedacteur) && (
          <Link
            href="/admin"
            className="hidden rounded-sm border border-nexus/40 bg-nexus/10 px-2 py-1 text-xs font-bold text-nexus transition-colors hover:bg-nexus hover:text-noir sm:block"
            title="Espace Rédaction & Administration"
          >
            Studio
          </Link>
        )}
        <Link
          href="/compte"
          className="rounded-sm border border-pop/40 bg-pop/10 px-2.5 py-1.5 text-xs font-bold text-pop transition-colors hover:bg-pop hover:text-noir"
          title={`Connecté en tant que ${pseudonyme}`}
        >
          {pseudonyme}
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/connexion"
      className="rounded-sm border border-ligne bg-surface px-2.5 py-1.5 text-xs font-semibold text-gris transition-colors hover:border-blanc hover:text-blanc"
    >
      Connexion
    </Link>
  );
}
