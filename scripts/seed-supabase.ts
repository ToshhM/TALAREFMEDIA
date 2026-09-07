import { createClient } from "@supabase/supabase-js";
import { ARTICLES_DEMO, PERSONNES_DEMO } from "../src/lib/sample-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erreur: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY non défini.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Insertion des personnes dans Supabase...");
  for (const p of PERSONNES_DEMO) {
    const { error } = await supabase.from("personnes").upsert(
      {
        slug: p.slug,
        nom: p.nom,
        bio: p.bio,
        photo: p.photo,
        liens: p.liens || [],
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`Erreur personne ${p.slug}:`, error.message);
    } else {
      console.log(`✓ Personne ${p.nom} (${p.slug}) insérée.`);
    }
  }

  console.log("Insertion des articles dans Supabase...");
  for (const a of ARTICLES_DEMO) {
    const { error } = await supabase.from("articles").upsert(
      {
        slug: a.slug,
        ref_number: a.refNumber || null,
        titre: a.titre,
        hero_title: a.heroTitle || null,
        chapo: a.chapo,
        image_de_une: a.imageDeUne,
        univers: a.univers,
        collection: a.collection || null,
        rubrique: a.rubrique || null,
        format: a.format || null,
        tags: a.tags,
        auteurs: a.auteurs,
        video: a.video || null,
        corps: a.corps,
        status: a.status || "published",
        publie_le: a.publieLe,
        mis_a_jour_le: a.misAJourLe || null,
        temps_de_lecture: a.tempsDeLecture,
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`Erreur article ${a.slug}:`, error.message);
    } else {
      console.log(`✓ Article ${a.titre} (${a.slug}) inséré.`);
    }
  }

  console.log("Seed terminé avec succès !");
}

seed().catch((err) => {
  console.error("Erreur générale du seed:", err);
  process.exit(1);
});
