"use client";

import React, { useRef, useState, useEffect } from "react";
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
  const inputUrlRef = useRef<HTMLInputElement>(null);

  const [modeApercu, setModeApercu] = useState(false);
  const [modalLienOuvert, setModalLienOuvert] = useState(false);
  const [texteLienInput, setTexteLienInput] = useState("");
  const [urlLienInput, setUrlLienInput] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // Focus automatique sur le champ URL quand le modal s'ouvre
  useEffect(() => {
    if (modalLienOuvert && inputUrlRef.current) {
      inputUrlRef.current.focus();
    }
  }, [modalLienOuvert]);

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

  const ouvrirModalLien = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const texteActuel = valeur || "";
    const selection = texteActuel.substring(start, end).trim();

    setSelectionRange({ start, end });
    setTexteLienInput(selection || "");
    setUrlLienInput("");
    setModalLienOuvert(true);
  };

  const validerLien = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let urlPropre = urlLienInput.trim();
    if (!urlPropre) {
      setModalLienOuvert(false);
      return;
    }

    // Nettoyage des doublons de protocole (ex: https://https://...)
    urlPropre = urlPropre.replace(/^(https?:\/\/)+https?:\/\//i, "https://");

    // Ajout automatique de https:// si l'utilisateur entre "www.site.com" ou "site.fr"
    if (
      !urlPropre.startsWith("http://") &&
      !urlPropre.startsWith("https://") &&
      !urlPropre.startsWith("mailto:") &&
      !urlPropre.startsWith("tel:") &&
      !urlPropre.startsWith("/") &&
      !urlPropre.startsWith("#")
    ) {
      urlPropre = `https://${urlPropre}`;
    }

    const texteFinal = texteLienInput.trim() || urlPropre;
    const snippetLien = `[${texteFinal}](${urlPropre})`;

    const texteActuel = valeur || "";
    const nouveauTexte =
      texteActuel.substring(0, selectionRange.start) +
      snippetLien +
      texteActuel.substring(selectionRange.end);

    onChange(nouveauTexte);
    setModalLienOuvert(false);

    const textarea = textareaRef.current;
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        const pos = selectionRange.start + snippetLien.length;
        textarea.setSelectionRange(pos, pos);
      }, 10);
    }
  };

  const annulerLien = () => {
    setModalLienOuvert(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;
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
      ouvrirModalLien();
    }
  };

  // Extraction des liens existants dans ce bloc pour retour visuel immédiat
  const liensDetectes: { texte: string; url: string }[] = [];
  if (valeur) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    while ((m = linkRegex.exec(valeur)) !== null) {
      liensDetectes.push({ texte: m[1], url: m[2] });
    }
  }

  return (
    <div className="space-y-2">
      {/* Barre d'outils de formatage (Gras, Italique, Souligné, Lien, Aperçu) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-ligne/50 pb-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquerFormatage("**", "**", "texte en gras")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs font-black text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Gras (Ctrl+B / Cmd+B)"
            aria-label="Mettre en gras"
          >
            G
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquerFormatage("*", "*", "texte en italique")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs italic font-semibold text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Italique (Ctrl+I / Cmd+I)"
            aria-label="Mettre en italique"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquerFormatage("<u>", "</u>", "texte souligné")}
            className="flex h-7 w-7 items-center justify-center rounded border border-ligne bg-surface text-xs font-semibold underline text-blanc transition-colors hover:border-accent hover:bg-surface-2 hover:text-accent"
            title="Souligné (Ctrl+U / Cmd+U)"
            aria-label="Souligner le texte"
          >
            S
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={ouvrirModalLien}
            className={`flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium transition-colors ${
              modalLienOuvert
                ? "border-accent bg-accent/20 text-accent"
                : "border-ligne bg-surface text-blanc hover:border-accent hover:bg-surface-2 hover:text-accent"
            }`}
            title="Insérer un lien cliquable (Ctrl+K / Cmd+K)"
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
            className={`flex h-7 items-center gap-1 rounded px-2.5 text-[11px] font-mono uppercase tracking-wider transition-colors ${
              modeApercu
                ? "bg-accent text-noir font-bold shadow"
                : "border border-ligne bg-surface text-gris hover:text-blanc hover:border-blanc"
            }`}
          >
            {modeApercu ? "Éditer ✎" : "Aperçu en surbrillance 👁"}
          </button>
        )}
      </div>

      {/* Popover / Formulaire d'insertion de lien (Remplace le prompt bloqué sur mobile) */}
      {modalLienOuvert && (
        <form
          onSubmit={validerLien}
          className="animate-in fade-in slide-in-from-top-1 duration-150 rounded-lg border border-accent/60 bg-noir/95 p-3.5 shadow-xl backdrop-blur space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <span>🔗</span> Insérer un lien avec surbrillance
            </span>
            <button
              type="button"
              onClick={annulerLien}
              className="text-xs text-gris hover:text-blanc"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-gris">
                Mot ou phrase cliquable
              </label>
              <input
                type="text"
                value={texteLienInput}
                onChange={(e) => setTexteLienInput(e.target.value)}
                placeholder="Ex : le Palais Garnier"
                className="mt-1 w-full rounded border border-ligne bg-surface p-2 text-xs text-blanc placeholder-gris/40 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gris">
                Adresse URL de redirection
              </label>
              <input
                ref={inputUrlRef}
                type="text"
                value={urlLienInput}
                onChange={(e) => setUrlLienInput(e.target.value)}
                placeholder="https://... ou www.site.com"
                className="mt-1 w-full rounded border border-ligne bg-surface p-2 text-xs font-mono text-blanc placeholder-gris/40 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[10px] text-gris/70">
              💡 Le lien s'affichera en <strong>surbrillance</strong> et s'ouvrira dans un nouvel onglet.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={annulerLien}
                className="rounded border border-ligne px-2.5 py-1 text-xs text-gris hover:text-blanc"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded bg-accent px-3 py-1 text-xs font-bold text-noir hover:opacity-90 shadow"
              >
                Appliquer le lien ✓
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Zone de saisie OU Aperçu formaté */}
      {modeApercu ? (
        <div className="rounded-lg border border-dashed border-accent/40 bg-teinte/20 p-4 min-h-[5.5rem]">
          <div className="flex items-center justify-between mb-2.5 border-b border-accent/20 pb-1.5">
            <p className="etiquette text-[10px] text-accent font-bold">
              Aperçu en direct (rendu public fidèle) :
            </p>
            <span className="text-[10px] font-mono text-gris">
              Les liens sont cliquables avec surbrillance
            </span>
          </div>
          <TexteRiche texte={valeur} className="text-sm leading-relaxed text-blanc" />
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            value={valeur || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full resize-y rounded-md border border-ligne/70 bg-noir/50 p-2.5 text-sm leading-relaxed text-blanc placeholder:text-gris/40 focus:border-accent/80 focus:outline-none whitespace-pre-wrap ${className}`}
          />

          {/* Badge des liens détectés dans ce paragraphe */}
          {liensDetectes.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-gris">
              <span className="font-semibold text-accent/90">Liens actifs :</span>
              {liensDetectes.map((l, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent border border-accent/30"
                >
                  <span className="font-sans font-bold text-blanc">{l.texte}</span>
                  <span className="opacity-60 truncate max-w-[150px]">({l.url})</span>
                  <span>↗</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
