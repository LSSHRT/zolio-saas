import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared dark-themed layout for the four public legal pages
 * (/cgu, /cgv, /mentions-legales, /politique-confidentialite).
 *
 * Centralises:
 * - Branded backdrop (radial blob + inline SVG noise — no network req)
 * - Back-to-home link with consistent tone-coloured chevron
 * - Title block with optional last-updated stamp
 * - Glassy content card hosting the sections
 */

const TONE_CONFIG = {
  violet: {
    blob: "bg-violet-900/20",
    link: "text-violet-400 hover:text-violet-300",
  },
  fuchsia: {
    blob: "bg-fuchsia-900/20",
    link: "text-fuchsia-400 hover:text-fuchsia-300",
  },
  orange: {
    blob: "bg-orange-900/20",
    link: "text-orange-400 hover:text-orange-300",
  },
  emerald: {
    blob: "bg-emerald-900/20",
    link: "text-emerald-300 hover:text-emerald-200",
  },
} as const;

export type LegalPageTone = keyof typeof TONE_CONFIG;

export interface LegalPageShellProps {
  title: string;
  /** ISO or formatted "last updated" label, e.g. "Mai 2026". Optional. */
  lastUpdated?: string;
  /** Color of the radial blob and the back link. */
  tone?: LegalPageTone;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  lastUpdated,
  tone = "violet",
  children,
}: LegalPageShellProps) {
  const cfg = TONE_CONFIG[tone];

  return (
    <div className="min-h-screen bg-[#05050A] text-neutral-300 py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Inline SVG noise — no network request */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="legal-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#legal-noise)" />
      </svg>
      <div
        className={`pointer-events-none absolute top-0 left-1/2 z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px] ${cfg.blob}`}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <Link
          href="/"
          className={`mb-12 inline-flex items-center transition-colors ${cfg.link}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l&apos;accueil
        </Link>

        <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        {lastUpdated && (
          <p className="mb-12 text-sm text-neutral-500">
            Dernière mise à jour : {lastUpdated}
          </p>
        )}

        <div className="space-y-12 rounded-3xl border border-white/5 bg-neutral-900/50 p-8 text-lg leading-relaxed backdrop-blur-md sm:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience section wrapper used inside <LegalPageShell>. Use it for
 * each numbered chapter so titles and spacing stay consistent.
 */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-neutral-300">{children}</div>
    </section>
  );
}
