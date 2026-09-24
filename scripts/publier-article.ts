import { readFile, readdir, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { slugifier, estSlugReserve } from "../src/lib/reserved";
import type { Article, Bloc, Image, Tag, Personne } from "../src/lib/types";
import type { UniverseSlug, CollectionSlug } from "../src/lib/univers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("❌ Erreur : SUPABASE_URL ou SUPABASE_SECRET_KEY manquant dans l'environnement.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

const DOSSIER_DRAFTS = path.join(process.cwd(), "content", "drafts");
const DOSSIER_PUBLIES = path.join(process.cwd(), "content", "publies");

interface ArticleBrut {
  univers?: string;
  collection?: string;
  titre?: string;
  heroTitle?: string;
  chapo?: string;
  auteur?: string;
  tags?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  refNumberManuel?: number;
  corpsTexte?: string;
}

/**
 * Analyse le texte brut rédigé selon le template TALAREF et extrait les champs.
 */
function parserTexteArticle(raw: string): ArticleBrut {
  const lignes = raw.split(/\r?\n/);
  const donnees: ArticleBrut = {};
  const lignesCorps: string[] = [];
  let dansCorps = false;

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const trim = ligne.trim();

    // Début de la section Corps
    if (/^corps\s*:\s*$/i.test(trim) || /^##\s*corps/i.test(trim)) {
      dansCorps = true;
      continue;
    }

    if (dansCorps) {
      lignesCorps.push(ligne);
      continue;
    }

    // Extraction des métadonnées d'en-tête
    const matchMeta = trim.match(/^([A-Za-zÀ-ÿ0-9\s_-]+?)\s*:\s*(.*)$/);
    if (matchMeta) {
      const cle = matchMeta[1]
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "");
      const val = matchMeta[2].trim();

      if (cle.includes("univers")) {
        donnees.univers = val;
      } else if (cle.includes("collection")) {
        donnees.collection = val === "—" || val === "-" ? undefined : val;
      } else if (cle === "titre" || cle.includes("titreprincipal")) {
        donnees.titre = val;
      } else if (cle.includes("herotitle") || cle.includes("titrehero")) {
        donnees.heroTitle = val;
      } else if (cle.includes("chapo") || cle.includes("chapeau") || cle.includes("resume")) {
        donnees.chapo = val;
      } else if (cle === "auteur" || cle.includes("redacteur")) {
        donnees.auteur = val;
      } else if (cle === "tags" || cle === "tag") {
        donnees.tags = val;
      } else if (cle.includes("imagedeune") || cle.includes("image")) {
        const urlMatch = val.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          donnees.imageUrl = urlMatch[0];
        }
        const creditMatch = val.match(/crédit\s*:\s*([^,\]\)]+)/i);
        if (creditMatch) donnees.imageCredit = creditMatch[1].trim();
        const altMatch = val.match(/alt\s*:\s*([^,\]\)]+)/i);
        if (altMatch) donnees.imageAlt = altMatch[1].trim();
      } else if (cle === "ref" || cle.includes("ref:")) {
        const numMatch = val.match(/\/(0*[0-9]+)/);
        if (numMatch) {
          donnees.refNumberManuel = parseInt(numMatch[1], 10);
        }
      }
    }
  }

  donnees.corpsTexte = lignesCorps.join("\n");
  return donnees;
}

/**
 * Transforme le corps textuel en tableau de Blocs TALAREF structurés.
 */
function transformerEnBlocs(corpsTexte: string, titre: string): Bloc[] {
  const blocs: Bloc[] = [];
  const lignes = corpsTexte.split(/\r?\n/);
  let i = 0;

  function genKey(prefix: string) {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
  }

  while (i < lignes.length) {
    const ligne = lignes[i].trim();

    if (!ligne) {
      i++;
      continue;
    }

    // 1. Intertitre h2 : "Intertitre (h2) — Mon titre" ou "## Mon titre"
    const matchH2 =
      ligne.match(/^(?:intertitre(?:\s*\(h2\))?\s*[—–-]\s*|##\s+)(.+)$/i);
    if (matchH2) {
      blocs.push({
        _key: genKey("h2"),
        _type: "intertitre",
        niveau: 2,
        texte: matchH2[1].trim(),
      });
      i++;
      continue;
    }

    // 2. Bloc signature "La ref"
    if (/^la\s+ref(?:\s*:.*)?$/i.test(ligne) || /^###\s*la\s+ref/i.test(ligne)) {
      i++;
      const texteLignes: string[] = [];
      let titreRef = "La référence";

      while (i < lignes.length) {
        const l = lignes[i].trim();
        if (!l && texteLignes.length > 0) break;
        if (/^(intertitre|chiffre-cl[ée]|paragraphe|citation|galerie|vid[ée]o)/i.test(l)) {
          break;
        }
        if (l.startsWith(">")) {
          const sansChevron = l.replace(/^>\s*/, "");
          const matchTitre = sansChevron.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
          if (matchTitre) {
            titreRef = matchTitre[1];
            if (matchTitre[2]) texteLignes.push(matchTitre[2]);
          } else {
            texteLignes.push(sansChevron);
          }
        } else if (l) {
          texteLignes.push(l);
        }
        i++;
      }

      blocs.push({
        _key: genKey("ref"),
        _type: "laRef",
        titre: titreRef,
        texte: texteLignes.join(" ").trim(),
      });
      continue;
    }

    // 3. Bloc Chiffre-clé : "Chiffre-clé" suivi de "1er — Français à décrocher..."
    if (/^chiffre[- ]cl[ée]/i.test(ligne)) {
      i++;
      let valeur = "";
      let libelle = "";
      let source = "TALAREF";

      while (i < lignes.length) {
        const l = lignes[i].trim();
        if (!l && valeur) break;
        if (/^(intertitre|la\s+ref|paragraphe|citation|galerie|vid[ée]o)/i.test(l)) {
          break;
        }

        const matchCle = l.match(/^-\s*(valeur|libell[ée]|source)\s*:\s*(.*)$/i);
        if (matchCle) {
          const type = matchCle[1].toLowerCase();
          const v = matchCle[2].replace(/`|\*/g, "").trim();
          if (type === "valeur") valeur = v;
          else if (type.includes("libell")) libelle = v;
          else if (type === "source") source = v;
        } else {
          // Format direct : "1er — Description (source:...)"
          const tiretMatch = l.match(/^([0-9]+[a-zA-Z%€$]*|[0-9]+(?:\.[0-9]+)?)\s*[—–-]\s*(.*)$/);
          if (tiretMatch) {
            valeur = tiretMatch[1].trim();
            libelle = tiretMatch[2].trim();
          } else if (!valeur && l) {
            valeur = l;
          } else if (valeur && !libelle && l) {
            libelle = l;
          }
        }
        i++;
      }

      if (valeur) {
        blocs.push({
          _key: genKey("num"),
          _type: "chiffreCle",
          valeur: valeur,
          libelle: libelle || "Statistique clé",
          source: source,
        });
      }
      continue;
    }

    // 4. Citation
    if (/^citation/i.test(ligne)) {
      i++;
      let texteCitation = "";
      let auteurCitation = "TALAREF";

      while (i < lignes.length) {
        const l = lignes[i].trim();
        if (!l && texteCitation) break;
        if (/^(intertitre|la\s+ref|chiffre-cl[ée]|paragraphe|galerie)/i.test(l)) break;

        const matchAuteur = l.match(/^[—–-]\s*(.+)$/);
        if (matchAuteur) {
          auteurCitation = matchAuteur[1].trim();
        } else if (l) {
          texteCitation += (texteCitation ? " " : "") + l.replace(/^["«]|["»]$/g, "");
        }
        i++;
      }

      if (texteCitation) {
        blocs.push({
          _key: genKey("cit"),
          _type: "citation",
          texte: texteCitation,
          auteur: auteurCitation,
        });
      }
      continue;
    }

    // 5. Paragraphe standard
    if (/^paragraphe/i.test(ligne)) {
      i++;
      const paraLignes: string[] = [];
      while (i < lignes.length) {
        const l = lignes[i].trim();
        if (!l && paraLignes.length > 0) break;
        if (/^(intertitre|la\s+ref|chiffre-cl[ée]|paragraphe|citation|galerie|vid[ée]o)/i.test(l)) {
          break;
        }
        if (l) paraLignes.push(l);
        i++;
      }

      if (paraLignes.length > 0) {
        blocs.push({
          _key: genKey("p"),
          _type: "paragraphe",
          texte: paraLignes.join(" ").trim(),
        });
      }
      continue;
    }

    // 6. Texte brut sans mot-clé explicite
    const texteLignes = [ligne];
    i++;
    while (i < lignes.length) {
      const l = lignes[i].trim();
      if (!l) break;
      if (/^(intertitre|la\s+ref|chiffre-cl[ée]|paragraphe|citation|galerie|vid[ée]o)/i.test(l)) {
        break;
      }
      texteLignes.push(l);
      i++;
    }

    blocs.push({
      _key: genKey("p"),
      _type: "paragraphe",
      texte: texteLignes.join(" ").trim(),
    });
  }

  // Vérification de la présence d'au moins un bloc La ref
  const aBlocLaRef = blocs.some((b) => b._type === "laRef");
  if (!aBlocLaRef) {
    blocs.push({
      _key: genKey("ref"),
      _type: "laRef",
      titre: "La référence",
      texte: `Dans cet article dédié à ${titre}, la référence mise en avant témoigne de l'ADN éditorial Talaref.`,
    });
  }

  return blocs;
}

/**
 * Récupère le prochain numéro REF pour un univers donné dans Supabase.
 */
async function obtenirProchainRefNumber(univers: UniverseSlug): Promise<number> {
  const { data } = await supabase
    .from("articles")
    .select("ref_number")
    .eq("univers", univers);

  if (!data || data.length === 0) return 1;

  const max = Math.max(0, ...data.map((a: { ref_number: number | null }) => a.ref_number || 0));
  return max + 1;
}

/**
 * Publie un article brut dans Supabase.
 */
export async function publierArticle(brut: ArticleBrut, nomFichier?: string): Promise<Article> {
  if (!brut.titre || !brut.chapo || !brut.univers) {
    throw new Error("L'article doit comporter au minimum un Titre, un Chapô et un Univers.");
  }

  const universSlug = brut.univers.trim().toLowerCase() as UniverseSlug;
  const universValides: UniverseSlug[] = ["pop", "arena", "bpm", "agora", "objectif", "nexus"];
  if (!universValides.includes(universSlug)) {
    throw new Error(`Univers invalide "${brut.univers}". Choix possibles : ${universValides.join(", ")}`);
  }

  let slug = slugifier(brut.titre);
  if (estSlugReserve(slug)) {
    slug = `${slug}-article`;
  }

  // Vérifier si le slug existe déjà
  const { data: existant } = await supabase
    .from("articles")
    .select("slug, ref_number")
    .eq("slug", slug)
    .single();

  let refNumber: number;
  if (existant) {
    refNumber = existant.ref_number || (await obtenirProchainRefNumber(universSlug));
  } else {
    refNumber = brut.refNumberManuel || (await obtenirProchainRefNumber(universSlug));
  }

  // Découpage des tags
  const tags: Tag[] = (brut.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({
      slug: slugifier(t),
      nom: t,
    }));

  // Structure des blocs
  const blocs = transformerEnBlocs(brut.corpsTexte || brut.chapo, brut.titre);

  // Temps de lecture
  const motsTotal = [
    brut.titre,
    brut.chapo,
    ...blocs.map((b) => ("texte" in b && typeof b.texte === "string" ? b.texte : "")),
  ]
    .join(" ")
    .split(/\s+/).length;
  const tempsDeLecture = Math.max(1, Math.ceil(motsTotal / 230));

  // Auteur
  const auteurNom = brut.auteur?.trim() || "Toshiro Mpika";
  const auteurSlug = slugifier(auteurNom).replace("toshiro-mpika", "toshiro");
  const auteurs: Personne[] = [
    {
      slug: auteurSlug,
      nom: auteurNom,
    },
  ];

  // Image de une
  const imageDeUne: Image = {
    url: brut.imageUrl || "",
    alt: brut.imageAlt || brut.titre,
    credit: brut.imageCredit || "TALAREF",
    disposition: "standard",
    cadrage: "center",
  };

  const articlePourDb = {
    slug,
    ref_number: refNumber,
    titre: brut.titre.trim(),
    hero_title: brut.heroTitle?.trim() || null,
    chapo: brut.chapo.trim(),
    image_de_une: imageDeUne,
    univers: universSlug,
    collection: (brut.collection?.trim().toLowerCase() as CollectionSlug) || null,
    rubrique: null,
    format: null,
    tags,
    auteurs,
    video: null,
    corps: blocs,
    status: "published",
    publie_le: new Date().toISOString().split("T")[0],
    mis_a_jour_le: new Date().toISOString(),
    temps_de_lecture: tempsDeLecture,
  };

  const { error } = await supabase.from("articles").upsert(articlePourDb, {
    onConflict: "slug",
  });

  if (error) {
    throw new Error(`Erreur Supabase lors de l'insertion : ${error.message}`);
  }

  const refFormattee = `REF:${universSlug.toUpperCase()}/${refNumber.toString().padStart(3, "0")}`;
  console.log(`\n🎉 Article publié avec succès !`);
  console.log(`   📌 Référence : ${refFormattee}`);
  console.log(`   🏷️  Titre     : ${brut.titre}`);
  console.log(`   🔗 URL       : /${universSlug}/${slug}`);
  console.log(`   ⏱️  Lecture   : ${tempsDeLecture} min (${motsTotal} mots)`);
  console.log(`   🧩 Blocs     : ${blocs.length} blocs construits`);

  return {
    ...articlePourDb,
    refNumber,
    imageDeUne,
    status: "published",
    publieLe: articlePourDb.publie_le,
    tempsDeLecture,
  } as unknown as Article;
}

/**
 * Point d'entrée CLI
 */
async function main() {
  const args = process.argv.slice(2);
  await mkdir(DOSSIER_DRAFTS, { recursive: true });
  await mkdir(DOSSIER_PUBLIES, { recursive: true });

  // Mode 1 : Fichier unique passé en argument
  if (args.length > 0 && !args[0].startsWith("-")) {
    const cheminFichier = path.resolve(process.cwd(), args[0]);
    if (!existsSync(cheminFichier)) {
      console.error(`❌ Fichier introuvable : ${cheminFichier}`);
      process.exit(1);
    }
    const contenu = await readFile(cheminFichier, "utf-8");
    const brut = parserTexteArticle(contenu);
    await publierArticle(brut, path.basename(cheminFichier));
    return;
  }

  // Mode 2 : Parcours du dossier content/drafts/
  console.log(`📁 Analyse du dossier drafts : ${DOSSIER_DRAFTS}`);
  const fichiers = await readdir(DOSSIER_DRAFTS);
  const cibles = fichiers.filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  if (cibles.length === 0) {
    console.log(`ℹ️  Aucun fichier .txt ou .md trouvé dans ${DOSSIER_DRAFTS}`);
    console.log(`👉 Déposez vos brouillons dans ce dossier puis relancez 'npm run article:publier' !`);
    return;
  }

  console.log(`🚀 ${cibles.length} article(s) à traiter...\n`);

  for (const f of cibles) {
    const chemin = path.join(DOSSIER_DRAFTS, f);
    try {
      const contenu = await readFile(chemin, "utf-8");
      const brut = parserTexteArticle(contenu);
      await publierArticle(brut, f);

      // Déplacement vers content/publies/
      const cheminArchive = path.join(DOSSIER_PUBLIES, `${Date.now()}_${f}`);
      await rename(chemin, cheminArchive);
      console.log(`   📦 Fichier archivé dans : content/publies/${path.basename(cheminArchive)}`);
    } catch (err: any) {
      console.error(`❌ Échec pour ${f} :`, err.message || err);
    }
  }
}

if (require.main === module || process.argv[1]?.includes("publier-article")) {
  main().catch((err) => {
    console.error("❌ Erreur générale :", err);
    process.exit(1);
  });
}
