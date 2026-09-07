import {
  Anton,
  Archivo,
  Archivo_Black,
  Bungee,
  DM_Mono,
  Instrument_Serif,
  JetBrains_Mono,
  Press_Start_2P,
  Reggae_One,
} from "next/font/google";

/**
 * Les polices du système — Spécification v3.0 §04.
 *
 * Trois polices de socle, identiques partout, plus les polices de
 * signature d'univers et de collections. Une police de signature ne sert JAMAIS au
 * texte courant ni aux sous-titres : elle porte le mot d'univers et les
 * grands titres d'accroche, rien d'autre.
 *
 * Toutes sont gratuites et libres d'usage commercial sur Google Fonts.
 */

/* ---- Socle ---- */

/** Texte courant, interface, sous-titres. Sert aussi pour ARENA en variante étendue. */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

/** Titrage, logotype, titres d'articles. Interlettrage serré (−3 %). */
export const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

/** Codes, numéros, dates, hashtags, crédits. Toujours en capitales espacées. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* ---- Signatures d'univers et collections ---- */

/** ARCADE (collection sous Pop) — bitmap 8 bits, max 9 signes. */
export const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

/** ENCRE (collection sous Pop) — display japonais à trait épais. */
export const reggaeOne = Reggae_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-reggae-one",
  display: "swap",
});

/** POP — lettrage d'enseigne américaine, une ligne par mot. */
export const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
  display: "swap",
});

/** AGORA — serif éditorial à contraste élevé, en bas de casse par défaut. */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

/** BPM — condensée lourde d'affiche de concert, supporte les titres longs. */
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

/** OBJECTIF — monospace à caractère, porte l'idée de métadonnée. */
export const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

/** À poser sur <html> : toutes les variables de police d'un coup. */
export const variablesPolices = [
  archivo.variable,
  archivoBlack.variable,
  jetbrainsMono.variable,
  pressStart.variable,
  reggaeOne.variable,
  bungee.variable,
  instrumentSerif.variable,
  anton.variable,
  dmMono.variable,
].join(" ");
