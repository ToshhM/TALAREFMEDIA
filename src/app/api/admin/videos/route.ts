import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  tousLesVideos,
  sauvegarderVideo,
  mettreAJourVideo,
  supprimerVideoDuStore,
} from "@/lib/videos-store";
import { parserSourceVideo } from "@/lib/video-utils";
import type { VideoItem } from "@/lib/video-types";
import { slugifier } from "@/lib/reserved";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const univers = searchParams.get("univers");
    const aLaUne = searchParams.get("aLaUne");

    let videos = await tousLesVideos();

    if (univers && univers !== "tous") {
      videos = videos.filter((v) => v.univers === univers);
    }
    if (aLaUne === "true") {
      videos = videos.filter((v) => Boolean(v.aLaUneAccueil));
    }

    return NextResponse.json({ videos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      titre,
      description,
      legende,
      sourceType,
      urlOuId,
      miniature,
      duree,
      univers,
      format,
      aspectRatio,
      aLaUneAccueil,
      articleSlug,
      articleTitre,
      articleUnivers,
    } = body;

    if (!titre?.trim() || !urlOuId?.trim() || !univers) {
      return NextResponse.json(
        { error: "Le titre, l'URL/identifiant de la vidéo et l'univers sont obligatoires." },
        { status: 400 },
      );
    }

    // Normalisation de la source
    const parsed = parserSourceVideo(urlOuId.trim());
    const sourceFinale = sourceType || parsed.type;
    const valeurSource = parsed.valeur || urlOuId.trim();

    // Miniature automatique pour YouTube si non fournie
    let miniatureFinale = miniature?.trim() || undefined;
    if (!miniatureFinale && (sourceFinale === "youtube" || parsed.type === "youtube")) {
      miniatureFinale = `https://i.ytimg.com/vi/${valeurSource}/maxresdefault.jpg`;
    }

    const id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = `${slugifier(titre)}-${Date.now().toString().slice(-4)}`;

    const nouvelleVideo: VideoItem = {
      id,
      slug,
      titre: titre.trim(),
      description: description?.trim() || undefined,
      legende: legende?.trim() || undefined,
      sourceType: sourceFinale as any,
      urlOuId: valeurSource,
      miniature: miniatureFinale,
      duree: duree?.trim() || undefined,
      univers,
      format: format?.trim() || "VIDÉO",
      aspectRatio: aspectRatio || (format?.toLowerCase().includes("quiz") || format?.toLowerCase().includes("short") ? "9:16" : "16:9"),
      misEnLigneLe: new Date().toISOString(),
      aLaUneAccueil: Boolean(aLaUneAccueil),
      articleSlug: articleSlug || undefined,
      articleTitre: articleTitre || undefined,
      articleUnivers: articleUnivers || undefined,
    };

    await sauvegarderVideo(nouvelleVideo);

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json(
      { success: true, video: nouvelleVideo },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...modifications } = body;

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de la vidéo est requis." },
        { status: 400 },
      );
    }

    if (modifications.urlOuId) {
      const parsed = parserSourceVideo(modifications.urlOuId.trim());
      modifications.urlOuId = parsed.valeur || modifications.urlOuId.trim();
      if (!modifications.miniature && parsed.type === "youtube") {
        modifications.miniature = `https://i.ytimg.com/vi/${modifications.urlOuId}/maxresdefault.jpg`;
      }
    }

    const maj = await mettreAJourVideo(id, modifications);
    if (!maj) {
      return NextResponse.json(
        { error: "Vidéo introuvable ou mise à jour impossible." },
        { status: 404 },
      );
    }

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, video: maj });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de la vidéo est requis." },
        { status: 400 },
      );
    }

    await supprimerVideoDuStore(id);

    try {
      revalidatePath("/videos");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ success: true, message: "Vidéo supprimée avec succès." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
