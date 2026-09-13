/**
 * Le jeu de blocs FERMÉ — 14 blocs, pas un de plus.
 *
 * Toute demande d'un quinzième bloc passe par la rédaction en chef : un
 * jeu de blocs qui grossit sans contrôle redevient un éditeur libre, et
 * la garantie d'homogénéité disparaît.
 *
 * Le bloc « Chapô » est un champ de l'article, pas un bloc du corps :
 * il est unique par article.
 */

export const blocParagraphe = {
  name: "blocParagraphe",
  title: "Paragraphe",
  type: "object",
  fields: [
    {
      name: "texte",
      type: "array",
      of: [{ type: "block", styles: [], lists: [] }],
      description:
        "Gras et italique seulement — pas de couleur, pas de taille, pas de style de titre.",
    },
  ],
};

export const blocIntertitre = {
  name: "blocIntertitre",
  title: "Intertitre",
  type: "object",
  description: "Un minimum toutes les 400 mots.",
  fields: [
    { name: "niveau", type: "number", options: { list: [2, 3] } },
    { name: "texte", type: "string", validation: "required" },
  ],
};

export const blocModuleVideo = {
  name: "blocModuleVideo",
  title: "Module vidéo",
  type: "object",
  description: "Vidéo unique ou carrousel de vidéos.",
  fields: [
    { name: "video", title: "Vidéo principale", type: "reference", to: [{ type: "video" }] },
    {
      name: "videos",
      title: "Liste des vidéos (Carrousel)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "video" }] }],
    },
    {
      name: "layout",
      title: "Disposition",
      type: "string",
      options: { list: ["unique", "carrousel"] },
      initialValue: "carrousel",
    },
  ],
};

/**
 * LE BLOC IDENTITAIRE. Obligatoire : un article sans ref n'est pas un
 * article Talaref. C'est ce qui transforme un article d'actualité en
 * article qu'on garde, et le format que personne ne peut copier sans
 * copier la marque.
 */
export const blocLaRef = {
  name: "blocLaRef",
  title: "La ref",
  type: "object",
  fields: [
    { name: "titre", type: "string", validation: "required" },
    {
      name: "texte",
      type: "text",
      description: "400 signes maximum. La référence citée, expliquée.",
      validation: "required · max 400",
    },
  ],
};

export const blocImage = {
  name: "blocImage",
  title: "Image",
  type: "object",
  fields: [
    {
      name: "image",
      type: "image",
      fields: [
        { name: "alt", type: "string", validation: "required" },
        { name: "credit", type: "string", validation: "required" },
        { name: "legende", type: "string" },
      ],
    },
  ],
};

export const blocGalerie = {
  name: "blocGalerie",
  title: "Galerie",
  type: "object",
  description: "3 à 8 images.",
  fields: [
    {
      name: "images",
      type: "array",
      of: [{ type: "image" }],
      validation: "min 3 · max 8",
    },
  ],
};

export const blocChiffreCle = {
  name: "blocChiffreCle",
  title: "Chiffre-clé",
  type: "object",
  description: "1 à 3 par article. Source OBLIGATOIRE : à l'écrit, on engage la responsabilité du média.",
  fields: [
    { name: "valeur", type: "string", validation: "required" },
    { name: "libelle", type: "string", validation: "required" },
    { name: "source", type: "string", validation: "required" },
  ],
};

export const blocCitation = {
  name: "blocCitation",
  title: "Citation",
  type: "object",
  fields: [
    { name: "texte", type: "text", validation: "required" },
    { name: "auteur", type: "string", validation: "required" },
  ],
};

export const blocListe = {
  name: "blocListe",
  title: "Liste",
  type: "object",
  description: "3 à 8 entrées.",
  fields: [
    {
      name: "entrees",
      type: "array",
      of: [{ type: "string" }],
      validation: "min 3 · max 8",
    },
  ],
};

/** Agora et Encre uniquement. */
export const blocChronologie = {
  name: "blocChronologie",
  title: "Chronologie",
  type: "object",
  fields: [
    {
      name: "entrees",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "date", type: "string" },
            { name: "texte", type: "text" },
          ],
        },
      ],
    },
  ],
};

/** Arcade et Objectif uniquement. */
export const blocFicheTechnique = {
  name: "blocFicheTechnique",
  title: "Fiche technique",
  type: "object",
  fields: [
    {
      name: "lignes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "libelle", type: "string" },
            { name: "valeur", type: "string" },
          ],
        },
      ],
    },
    { name: "verdict", type: "text" },
  ],
};

/** Généré automatiquement, NON éditable par le rédacteur. */
export const blocALireAussi = {
  name: "blocALireAussi",
  title: "À lire aussi",
  type: "object",
  readOnly: true,
  fields: [],
};

export const blocSeparateur = {
  name: "blocSeparateur",
  title: "Séparateur",
  type: "object",
  fields: [],
};
