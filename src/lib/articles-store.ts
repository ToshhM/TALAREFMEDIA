import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Article } from "./types";

const STORE_PATH = path.join(process.cwd(), "src", "lib", "custom-articles.json");
const DELETED_PATH = path.join(process.cwd(), "src", "lib", "deleted-articles.json");

export async function lireArticlesPersonnalises(): Promise<Article[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function lireSlugsSupprimes(): Promise<string[]> {
  try {
    const raw = await readFile(DELETED_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function sauvegarderArticlePersonnalise(nouvelArticle: Article): Promise<void> {
  try {
    const existants = await lireArticlesPersonnalises();
    const filtres = existants.filter((a) => a.slug !== nouvelArticle.slug);
    const liste = [nouvelArticle, ...filtres];
    await writeFile(STORE_PATH, JSON.stringify(liste, null, 2), "utf-8");

    // S'il était dans la liste des supprimés, le retirer
    const supprimes = await lireSlugsSupprimes();
    if (supprimes.includes(nouvelArticle.slug)) {
      const nouveauxSupprimes = supprimes.filter((s) => s !== nouvelArticle.slug);
      await writeFile(DELETED_PATH, JSON.stringify(nouveauxSupprimes, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Erreur lors de la persistance locale de l'article:", err);
  }
}

export async function mettreAJourArticle(slugOriginal: string, articleMaj: Article): Promise<void> {
  try {
    const existants = await lireArticlesPersonnalises();
    const index = existants.findIndex((a) => a.slug === slugOriginal);

    if (index >= 0) {
      existants[index] = articleMaj;
      await writeFile(STORE_PATH, JSON.stringify(existants, null, 2), "utf-8");
    } else {
      // Si c'était un article de démo modifié pour la première fois
      await sauvegarderArticlePersonnalise(articleMaj);
    }
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'article:", err);
  }
}

export async function supprimerArticleDuStore(slug: string): Promise<void> {
  try {
    // 1. Retirer du fichier des articles personnalisés
    const existants = await lireArticlesPersonnalises();
    const filtres = existants.filter((a) => a.slug !== slug);
    await writeFile(STORE_PATH, JSON.stringify(filtres, null, 2), "utf-8");

    // 2. Marquer comme supprimé pour masquer même les articles de démo
    const supprimes = await lireSlugsSupprimes();
    if (!supprimes.includes(slug)) {
      supprimes.push(slug);
      await writeFile(DELETED_PATH, JSON.stringify(supprimes, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Erreur lors de la suppression locale de l'article:", err);
  }
}
