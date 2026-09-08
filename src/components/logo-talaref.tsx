import Link from "next/link";

/**
 * Le verrou de marque : « TALAREF » se pose toujours au même endroit,
 * en JetBrains Mono capitales, interlettrage 0.34em. Il ne prend jamais
 * la couleur d'accent — blanc, toujours, quel que soit l'univers.
 */
export function LogoTalaref({
  className = "",
  size = "normal",
  hideText = false,
}: {
  className?: string;
  size?: "small" | "normal" | "large";
  hideText?: boolean;
}) {
  const heightClass =
    size === "small" ? "h-6 sm:h-7" : size === "large" ? "h-10 sm:h-12" : "h-7 sm:h-8";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity ${className}`}
      aria-label="Talaref — accueil"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-embleme.png"
        alt=""
        aria-hidden="true"
        className={`${heightClass} w-auto object-contain invert brightness-125 filter`}
      />
      {!hideText && (
        <span className="mot-talaref text-sm tracking-[0.3em] font-bold text-blanc">
          TALAREF
        </span>
      )}
    </Link>
  );
}

