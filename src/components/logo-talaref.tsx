import Link from "next/link";

/**
 * Le verrou de marque : « TALAREF » se pose toujours au même endroit,
 * en JetBrains Mono capitales, interlettrage 0.34em. Il ne prend jamais
 * la couleur d'accent — blanc, toujours, quel que soit l'univers.
 */
export function LogoTalaref({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 ${className}`}
      aria-label="Talaref — accueil"
    >
      {/* Emblème flamme Talaref avec dimensions fixes strictes pour éviter tout étirement */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-embleme.png"
        alt=""
        width={64}
        height={64}
        style={{ width: "64px", height: "64px", minWidth: "64px", maxWidth: "64px" }}
        className="logo-embleme-img object-contain shrink-0"
      />
      <span className="mot-talaref text-sm sm:text-base font-bold tracking-[0.3em] text-blanc">
        TALAREF
      </span>
    </Link>
  );
}
