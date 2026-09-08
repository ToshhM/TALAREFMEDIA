"use client";

import React, { useRef, useState } from "react";
import { TexteRiche } from "./texte-riche";

interface EditeurTexteRicheProps {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  afficherApercuToggle?: boolean;
}

export function EditeurTexteRiche({
  valeur,
  onChange,
  placeholder = "Rédigez votre texte...",
  rows = 3,
  className = "",
  afficherApercuToggle = true,
}: EditeurTexteRicheProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modeApercu, setModeApercu] = useState(false);

  const appliquerFormatage = (prefixe: string, suffixe: string, texteDefaut: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const texteActuel = valeur || "";
    const selection = texteActuel.substring(start, end);

    let nouveauTexte = "";
    let nouveauCurseurDebut = 0;
    let nouveauCurseurFin = 0;

    if (selection) {
      nouveauTexte =
        texteActuel.substring(0, start) +
        prefixe +
        selection +
        suffixe +
        texteActuel.substring(end);
      nouveauCurseurDebut = start + prefixe.length;
      nouveauCurseurFin = end + prefixe.length;
    } else {
      nouveauTexte =
        texteActuel.substring(0, start) +
        prefixe +
        texteDefaut +
        suffixe +
        texteActuel.substring(end);
      nouveauCurseurDebut = start + prefixe.length;
      nouveauCurseurFin = nouveauCurseurDebut + texteDefaut.length;
    }

    onChange(nouveauTexte);

    // Repositionner le curseur après mise à jour
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(nouveauCurseurDebut, nouveauCurseurFin);
    }, 10);
  };

  const insererLien = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = (valeur || "").substring(start, end);

    const url = window.prompt(
      "Entrez l'adresse du lien (URL) :",
      "https://"
    );
    if (!url || url.trim() === "https://" || url.trim() === "") return;

    const texteLien = selection || "texte du lien";
    const snippetLien = `[${texteLien}](${url.trim()})`;

    const texteActuel = valeur || "";
    const nouveauTexte =
      texteActuel.substring(0, start) + snippetLien + texteActuel.substring(end);

    onChange(nouveauTexte);

    setTimeout(() => {
      textarea.focus();
      const pos = start + snippetLien.length;
      textarea.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === "b") {
      e.preventDefault();
      appliquerFormatage("**", "**", "texte en gras");
    } else if (modifier && e.key.toLowerCase() === "i") {
      e.preventDefault();
      appliquerFormatage("*", "*", "texte en italique");
    } else if (modifier && e.key.toLowerCase() === "u") {
      e.preventDefault();
      appliquerFormatage("<u>", "</u>", "texte souligné");
    } else if (modifier && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insererLien();
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Barre d'outils de formatage (Gras, Italique, Souligné, Lien, Aperçu) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-ligne/50 pb-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => appliquerFormatage("**", "**", "texte en gras")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs font-black text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Gras (Ctrl+B / Cmd+B)"
            aria-label="Mettre en gras"
          >
            G
          </button>
          <button
            type="button"
            onClick={() => appliquerFormatage("*", "*", "texte en italique")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs italic font-semibold text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Italique (Ctrl+I / Cmd+I)"
            aria-label="Mettre en italique"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => appliquerFormatage("<u>", "</u>", "texte souligné")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs font-semibold underline text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Souligné (Ctrl+U / Cmd+U)"
            aria-label="Souligner le texte"
          >
            S
          </button>
          <button
            type="button"
            onClick={insererLien}
            className="flex h-7 items-center gap-1 rounded border border-ligne bg-surface px-2 text-xs font-medium text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Insérer un lien (Ctrl+K / Cmd+K)"
            aria-label="Insérer un lien"
          >
            <span aria-hidden="true">🔗</span>
            <span className="hidden sm:inline">Lien</span>
          </button>
        </div>

        {afficherApercuToggle && valeur?.trim() && (
          <button
            type="button"
            onClick={() => setModeApercu((prev) => !prev)}
            className={`flex h-7 items-center gap-1 rounded px-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${
              modeApercu
                ? "bg-accent text-noir font-bold"
                : "border border-ligne bg-surface text-gris hover:text-blanc hover:border-blanc"
            }`}
          >
            {modeApercu ? "Éditer ✎" : "Aperçu 👁"}
          </button>
        )}
      </div>

      {/* Zone de saisie OU Aperçu formaté */}
      {modeApercu ? (
        <div className="rounded border border-dashed border-accent/40 bg-teinte/20 p-3 min-h-[5rem]">
          <p className="etiquette text-[10px] text-accent mb-2">Aperçu direct :</p>
          <TexteRiche texte={valeur} className="text-sm leading-relaxed text-blanc" />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={valeur || ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full resize-y bg-transparent text-sm leading-relaxed text-blanc placeholder:text-gris/40 focus:outline-none whitespace-pre-wrap ${className}`}
        />
      )}
    </div>
  );
}
