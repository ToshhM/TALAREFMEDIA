import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Article } from "./types";

const STORE_PATH = path.join(process.cwd(), "src", "lib", "custom-articles.json");

export async function lireArticlesPersonnalises(): Promise<Article[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
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
  } catch (err) {
    console.error("Erreur lors de la persistance locale de l'article:", err);
  }
}
