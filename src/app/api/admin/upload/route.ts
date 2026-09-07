import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey);
}

// Extensions autorisées
const EXTENSIONS_IMAGES = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const EXTENSIONS_VIDEOS = [".mp4", ".webm", ".mov", ".ogg"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    const estImage = EXTENSIONS_IMAGES.includes(extension) || file.type.startsWith("image/");
    const estVideo = EXTENSIONS_VIDEOS.includes(extension) || file.type.startsWith("video/");

    if (!estImage && !estVideo) {
      return NextResponse.json(
        {
          error:
            "Format non supporté. Formats acceptés : Images (JPG, PNG, WebP, GIF, SVG) ou Vidéos (MP4, WebM).",
        },
        { status: 400 },
      );
    }

    // Limites de taille : 15 Mo pour les images, 60 Mo pour les vidéos
    const maxTaille = estImage ? 15 * 1024 * 1024 : 60 * 1024 * 1024;
    if (file.size > maxTaille) {
      return NextResponse.json(
        {
          error: `Fichier trop lourd. Limite : ${estImage ? "15 Mo" : "60 Mo"}.`,
        },
        { status: 400 },
      );
    }

    // Nom de fichier nettoyé et horodaté
    const cleanBasename = path
      .basename(file.name, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 40);
    const nomFichier = `${Date.now()}-${cleanBasename || "media"}${extension}`;
    const dossierSousType = estImage ? "images" : "videos";
    const cheminStorage = `${dossierSousType}/${nomFichier}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Tenter l'upload Supabase Storage
    const adminClient = getAdminClient();
    if (adminClient) {
      try {
        const { error } = await adminClient.storage
          .from("media")
          .upload(cheminStorage, buffer, {
            contentType: file.type || (estImage ? "image/jpeg" : "video/mp4"),
            upsert: true,
          });

        if (!error) {
          const { data } = adminClient.storage
            .from("media")
            .getPublicUrl(cheminStorage);

          if (data?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: data.publicUrl,
              filename: nomFichier,
              mimeType: file.type,
              size: file.size,
              storage: "supabase",
            });
          }
        }
      } catch {
        // En cas d'erreur de Supabase Storage, fallback gracieux local ci-dessous
      }
    }

    // 2. Fallback local dans /public/uploads/
    const uploadsDir = path.join(process.cwd(), "public", "uploads", dossierSousType);
    await mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, nomFichier);
    await writeFile(localFilePath, buffer);

    const publicUrl = `/uploads/${dossierSousType}/${nomFichier}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: nomFichier,
      mimeType: file.type,
      size: file.size,
      storage: "local",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
