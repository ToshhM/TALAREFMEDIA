import { permanentRedirect } from "next/navigation";
import { isCollectionSlug } from "@/lib/univers";

type Params = { univers: string; rubrique: string };

/**
 * Migration Spécification v3.0 §19 :
 * Redirection permanente (301) des anciennes URLs /r/ vers /c/ ou vers l'univers.
 */
export default async function PageRubriqueRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { univers, rubrique } = await params;

  if (isCollectionSlug(rubrique)) {
    permanentRedirect(`/${univers}/c/${rubrique}`);
  }

  // Redirection par défaut vers la page de l'univers
  permanentRedirect(`/${univers}`);
}
