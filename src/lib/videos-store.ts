import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { VideoItem, VideoFiltres } from "./video-types";
import { parserSourceVideo } from "./video-utils";
import { tousLesArticles } from "./content";

const STORE_PATH = path.join(process.cwd(), "src", "lib", "custom-videos.json");
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey);
}

/**
 * Lit la liste des vidéos personnalisées enregistrées dans le store local.
 */
export async function lireVideosPersonnalisees(): Promise<VideoItem[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde la liste complète des vidéos dans le store local.
 */
export async function ecrireVideosPersonnalisees(videos: VideoItem[]): Promise<void> {
  try {
    await writeFile(STORE_PATH, JSON.stringify(videos, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur lors de l'écriture du store vidéo local :", err);
  }
}

/**
 * Agrège les vidéos du store et extrait également toutes les vidéos présentes
 * dans les articles (champ `video` ou blocs `moduleVideo`) pour garantir
 * une interconnexion totale entre les articles et la section vidéo.
 */
export async function tousLesVideos(): Promise<VideoItem[]> {
  const videosLocales = await lireVideosPersonnalisees();
  const mapVideos = new Map<string, VideoItem>();

  // 1. Enregistrer les vidéos du store local
  for (const v of videosLocales) {
    mapVideos.set(v.id, v);
  }

  // 2. Tenter de récupérer depuis Supabase si configuré
  const adminClient = getAdminClient();
  if (adminClient) {
    try {
      const { data: dbVideos } = await adminClient.from("videos").select("*");
      if (dbVideos && Array.isArray(dbVideos)) {
        for (const dbV of dbVideos) {
          const item: VideoItem = {
            id: dbV.id,
            slug: dbV.slug,
            titre: dbV.titre,
            description: dbV.description,
            legende: dbV.legende,
            sourceType: dbV.source_type || "youtube",
            urlOuId: dbV.url_ou_id,
            miniature: dbV.miniature,
            duree: dbV.duree,
            univers: dbV.univers,
            format: dbV.format,
            aspectRatio: dbV.aspect_ratio || "16:9",
            misEnLigneLe: dbV.mis_en_ligne_le || dbV.created_at,
            aLaUneAccueil: Boolean(dbV.a_la_une_accueil),
            articleSlug: dbV.article_slug,
            articleTitre: dbV.article_titre,
            articleUnivers: dbV.article_univers,
          };
          mapVideos.set(item.id, item);
        }
      }
    } catch {
      // Repli silencieux si la table videos n'est pas encore créée en base Supabase
    }
  }

  // 3. Extraction automatique des vidéos intégrées dans les articles (champ article.video ET blocs moduleVideo)
  try {
    const articles = await tousLesArticles();
    for (const art of articles) {
      const videosTrouvees: Array<{
        youtubeIdOrUrl: string;
        titre?: string;
        legende?: string;
        miniature?: string;
        duree?: number | string;
        misEnLigneLe?: string;
      }> = [];

      // A. Champ vidéo principal de l'article
      if (art.video && (art.video.youtubeId || (art.video as any).url)) {
        videosTrouvees.push({
          youtubeIdOrUrl: art.video.youtubeId || (art.video as any).url,
          titre: art.video.titre,
          legende: art.video.legende,
          miniature: art.video.miniature,
          duree: art.video.duree,
          misEnLigneLe: art.video.misEnLigneLe,
        });
      }

      // B. Blocs du corps de l'article (moduleVideo)
      if (Array.isArray(art.corps)) {
        for (const bloc of art.corps) {
          if (bloc && (bloc as any)._type === "moduleVideo") {
            const b = bloc as any;
            if (Array.isArray(b.videos) && b.videos.length > 0) {
              for (const v of b.videos) {
                if (v && (v.youtubeId || v.url)) {
                  videosTrouvees.push({
                    youtubeIdOrUrl: v.youtubeId || v.url,
                    titre: v.titre,
                    legende: v.legende,
                    miniature: v.miniature,
                    duree: v.duree,
                    misEnLigneLe: v.misEnLigneLe,
                  });
                }
              }
            } else if (b.video && (b.video.youtubeId || b.video.url)) {
              videosTrouvees.push({
                youtubeIdOrUrl: b.video.youtubeId || b.video.url,
                titre: b.video.titre,
                legende: b.video.legende,
                miniature: b.video.miniature,
                duree: b.video.duree,
                misEnLigneLe: b.video.misEnLigneLe,
              });
            } else if (b.youtubeId) {
              videosTrouvees.push({
                youtubeIdOrUrl: b.youtubeId,
                titre: b.titre,
                legende: b.legende,
                miniature: b.miniature,
                duree: b.duree,
                misEnLigneLe: b.misEnLigneLe,
              });
            }
          }
        }
      }

      // Traitement et insertion de chaque vidéo trouvée
      videosTrouvees.forEach((vItem, vIdx) => {
        const parsed = parserSourceVideo(vItem.youtubeIdOrUrl);
        const valeurCle = parsed.valeur || vItem.youtubeIdOrUrl;
        const idGenerique = `art_vid_${art.slug}_${vIdx}`;

        // Vérifier si cette vidéo existe déjà dans le store (par url/id ou par clé)
        let existante: VideoItem | undefined;
        for (const exist of mapVideos.values()) {
          if (exist.urlOuId === valeurCle || exist.id === idGenerique) {
            existante = exist;
            break;
          }
        }

        if (existante) {
          if (!existante.articleSlug) {
            existante.articleSlug = art.slug;
            existante.articleTitre = art.titre;
            existante.articleUnivers = art.univers;
          }
        } else {
          let formatAuto = "REPORTAGE";
          let ratioAuto: "9:16" | "16:9" = "9:16";
          const tMin = (vItem.titre || "").toLowerCase();
          if (tMin.includes("quiz")) {
            formatAuto = "POP QUIZ";
            ratioAuto = "9:16";
          } else if (tMin.includes("interview") || tMin.includes("aux african") || tMin.includes("awards")) {
            formatAuto = "INTERVIEW";
            ratioAuto = "9:16";
          } else if (tMin.includes("face à") || tMin.includes("peur") || tMin.includes("score")) {
            formatAuto = "RÉACTION";
            ratioAuto = "9:16";
          } else if (tMin.includes("débat") || tMin.includes("décalé") || tMin.includes("clip")) {
            formatAuto = "CLIP & DÉBAT";
            ratioAuto = "16:9";
          }

          mapVideos.set(idGenerique, {
            id: idGenerique,
            slug: `video-${art.slug}-${vIdx}`,
            titre: vItem.titre || art.titre,
            description: art.chapo,
            legende: vItem.legende || art.chapo,
            sourceType: parsed.type === "youtube" ? "youtube" : parsed.type === "vimeo" ? "vimeo" : "direct",
            urlOuId: valeurCle,
            miniature:
              vItem.miniature ||
              (parsed.type === "youtube"
                ? ratioAuto === "9:16"
                  ? `https://i.ytimg.com/vi/${valeurCle}/oar2.jpg`
                  : `https://i.ytimg.com/vi/${valeurCle}/maxresdefault.jpg`
                : art.imageDeUne?.url),
            duree: vItem.duree
              ? typeof vItem.duree === "number"
                ? `${Math.floor(vItem.duree / 60)}:${(vItem.duree % 60).toString().padStart(2, "0")}`
                : vItem.duree
              : "03:30",
            univers: art.univers,
            format: formatAuto,
            aspectRatio: ratioAuto,
            misEnLigneLe: vItem.misEnLigneLe || art.publieLe,
            aLaUneAccueil: true,
            articleSlug: art.slug,
            articleTitre: art.titre,
            articleUnivers: art.univers,
          });
        }
      });
    }
  } catch (err) {
    console.error("Erreur lors de l'agrégation des vidéos des articles :", err);
  }

  const liste = Array.from(mapVideos.values());

  // Tri par date décroissante
  return liste.sort(
    (a, b) => new Date(b.misEnLigneLe).getTime() - new Date(a.misEnLigneLe).getTime(),
  );
}

/**
 * Récupère les vidéos avec filtres optionnels.
 */
export async function getVideos(filtres?: VideoFiltres): Promise<VideoItem[]> {
  let videos = await tousLesVideos();

  if (filtres?.univers && filtres.univers !== "tous") {
    videos = videos.filter((v) => v.univers === filtres.univers);
  }

  if (filtres?.format && filtres.format !== "tous") {
    videos = videos.filter(
      (v) => v.format?.toLowerCase() === filtres.format?.toLowerCase(),
    );
  }

  if (filtres?.aLaUne) {
    videos = videos.filter((v) => Boolean(v.aLaUneAccueil));
  }

  if (filtres?.recherche && filtres.recherche.trim()) {
    const q = filtres.recherche.toLowerCase().trim();
    videos = videos.filter(
      (v) =>
        v.titre.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.format && v.format.toLowerCase().includes(q)) ||
        v.univers.toLowerCase().includes(q),
    );
  }

  return videos;
}

/**
 * Sauvegarde une nouvelle vidéo.
 */
export async function sauvegarderVideo(video: VideoItem): Promise<void> {
  const locales = await lireVideosPersonnalisees();
  const filtre = locales.filter((v) => v.id !== video.id);
  const maj = [video, ...filtre];
  await ecrireVideosPersonnalisees(maj);

  // Tentative de sauvegarde Supabase
  const adminClient = getAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("videos").upsert({
        id: video.id,
        slug: video.slug,
        titre: video.titre,
        description: video.description,
        legende: video.legende,
        source_type: video.sourceType,
        url_ou_id: video.urlOuId,
        miniature: video.miniature,
        duree: video.duree,
        univers: video.univers,
        format: video.format,
        aspect_ratio: video.aspectRatio,
        mis_en_ligne_le: video.misEnLigneLe,
        a_la_une_accueil: video.aLaUneAccueil,
        article_slug: video.articleSlug,
        article_titre: video.articleTitre,
        article_univers: video.articleUnivers,
      });
    } catch {
      // Repli
    }
  }
}

/**
 * Met à jour une vidéo existante.
 */
export async function mettreAJourVideo(id: string, modifications: Partial<VideoItem>): Promise<VideoItem | null> {
  const locales = await lireVideosPersonnalisees();
  const index = locales.findIndex((v) => v.id === id);

  if (index >= 0) {
    const maj: VideoItem = { ...locales[index], ...modifications };
    locales[index] = maj;
    await ecrireVideosPersonnalisees(locales);

    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        await adminClient.from("videos").update({
          titre: maj.titre,
          description: maj.description,
          legende: maj.legende,
          source_type: maj.sourceType,
          url_ou_id: maj.urlOuId,
          miniature: maj.miniature,
          duree: maj.duree,
          univers: maj.univers,
          format: maj.format,
          aspect_ratio: maj.aspectRatio,
          a_la_une_accueil: maj.aLaUneAccueil,
          article_slug: maj.articleSlug,
          article_titre: maj.articleTitre,
          article_univers: maj.articleUnivers,
        }).eq("id", id);
      } catch {}
    }

    return maj;
  }

  return null;
}

/**
 * Supprime une vidéo.
 */
export async function supprimerVideoDuStore(id: string): Promise<boolean> {
  const locales = await lireVideosPersonnalisees();
  const filtres = locales.filter((v) => v.id !== id);
  await ecrireVideosPersonnalisees(filtres);

  const adminClient = getAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("videos").delete().eq("id", id);
    } catch {}
  }

  return true;
}
