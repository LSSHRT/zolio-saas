import Image from "next/image";
import Link from "next/link";
import { Star, type LucideIcon } from "lucide-react";

/**
 * Shared brand-side hero for /sign-in and /sign-up.
 *
 * Self-contained: no external image hosts (pravatar / transparenttextures).
 * Avatars are SVG gradient circles with initials, generated inline.
 * The textured backdrop is a tiny inline SVG to avoid network requests on
 * the login critical path (better LCP).
 */

export interface AuthHeroBullet {
  icon: LucideIcon;
  label: string;
}

export interface AuthHeroTestimonial {
  quote: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  /** Gradient tone for the avatar circle. */
  avatarTone?: "violet" | "fuchsia" | "orange" | "emerald";
}

export interface AuthHeroProps {
  badge: { icon: LucideIcon; label: string };
  /** First line of the headline (regular weight color). */
  titleLead: string;
  /** Second line of the headline (the highlighted span uses this). */
  titleAccent: string;
  /** Trailing token of the title after the accent (optional, e.g. "."). */
  titleTrail?: string;
  description: string;
  bullets: AuthHeroBullet[];
  testimonial: AuthHeroTestimonial;
  /** Number to display in the bottom social proof bar. */
  proofCount?: string;
  proofLabel?: string;
  /** Avatar initials for the bottom row (4 entries). */
  proofInitials?: { initials: string; tone: "violet" | "fuchsia" | "orange" | "emerald" }[];
}

const TONE_GRADIENT: Record<NonNullable<AuthHeroTestimonial["avatarTone"]>, string> = {
  violet: "from-violet-400 to-fuchsia-500",
  fuchsia: "from-fuchsia-400 to-orange-400",
  orange: "from-orange-300 to-rose-400",
  emerald: "from-emerald-400 to-teal-500",
};

function InitialAvatar({
  initials,
  tone = "violet",
  size = "md",
  ringClass = "ring-white/30",
}: {
  initials: string;
  tone?: NonNullable<AuthHeroTestimonial["avatarTone"]>;
  size?: "sm" | "md";
  ringClass?: string;
}) {
  const dimension = size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${TONE_GRADIENT[tone]} font-bold text-white ring-2 ${ringClass} ${dimension}`}
    >
      {initials}
    </span>
  );
}

const DEFAULT_PROOF_INITIALS: NonNullable<AuthHeroProps["proofInitials"]> = [
  { initials: "AT", tone: "violet" },
  { initials: "ML", tone: "fuchsia" },
  { initials: "JR", tone: "orange" },
  { initials: "SK", tone: "emerald" },
];

export function AuthHero({
  badge,
  titleLead,
  titleAccent,
  titleTrail = ".",
  description,
  bullets,
  testimonial,
  proofCount = "250+",
  proofLabel = "artisans nous font déjà confiance",
  proofInitials = DEFAULT_PROOF_INITIALS,
}: AuthHeroProps) {
  const BadgeIcon = badge.icon;
  return (
    <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 px-12 py-10 text-white lg:flex">
      {/* Inline SVG noise — no network request, ~0.5kb gzipped */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="auth-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-noise)" />
      </svg>
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-[420px] w-[420px] rounded-full bg-fuchsia-300/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Image src="/logo.png" alt="Zolio" width={22} height={22} className="h-[22px] w-[22px]" />
          </div>
          <span className="text-[13px] font-semibold uppercase tracking-[0.24em]">Zolio</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-white/80 transition hover:text-white">
          ← Accueil
        </Link>
      </div>

      {/* Hero copy + USP + testimonial */}
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
          <BadgeIcon size={13} className="text-orange-200" />
          {badge.label}
        </span>
        <h1 className="mt-5 text-[44px] font-extrabold leading-[1.05] tracking-tight">
          {titleLead}
          <br />
          <span className="text-orange-200">{titleAccent}</span>
          {titleTrail}
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/85">{description}</p>

        <ul className="mt-8 space-y-3">
          {bullets.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[15px] font-medium">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/15 backdrop-blur">
                <Icon size={16} />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {/* Mini testimonial */}
        <figure className="mt-10 max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <div className="flex gap-0.5 text-orange-200">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-current" />
            ))}
          </div>
          <blockquote className="mt-3 text-[15px] leading-snug text-white/95">
            « {testimonial.quote} »
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-3 text-sm">
            <InitialAvatar initials={testimonial.authorInitials} tone={testimonial.avatarTone ?? "fuchsia"} />
            <div>
              <p className="font-semibold">{testimonial.authorName}</p>
              <p className="text-xs text-white/70">{testimonial.authorRole}</p>
            </div>
          </figcaption>
        </figure>
      </div>

      {/* Footer : social proof bar */}
      <div className="relative z-10 flex items-center gap-4 text-sm">
        <div className="flex -space-x-2.5">
          {proofInitials.map((p, i) => (
            <InitialAvatar
              key={`${p.initials}-${i}`}
              initials={p.initials}
              tone={p.tone}
              size="sm"
              ringClass="ring-violet-700"
            />
          ))}
        </div>
        <p className="font-medium">
          <span className="font-bold">{proofCount}</span> {proofLabel}
        </p>
      </div>
    </aside>
  );
}

/**
 * Compact mobile-only social-proof banner shown above the Clerk widget.
 * Surfaces the same trust signals to the 60-70% of users who never see
 * the desktop hero.
 */
export function AuthMobileProof({
  proofCount = "250+",
  proofLabel = "artisans actifs",
  trustBadges = [
    "Sans carte bancaire",
    "Hébergé en France",
    "Conforme RGPD",
  ],
}: {
  proofCount?: string;
  proofLabel?: string;
  trustBadges?: string[];
}) {
  return (
    <div className="mb-5 lg:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-fuchsia-50/70 px-4 py-3 dark:border-violet-400/15 dark:from-violet-500/10 dark:to-fuchsia-500/5">
        <div className="flex -space-x-2">
          {DEFAULT_PROOF_INITIALS.slice(0, 3).map((p, i) => (
            <InitialAvatar
              key={`m-${p.initials}-${i}`}
              initials={p.initials}
              tone={p.tone}
              size="sm"
              ringClass="ring-white dark:ring-slate-950"
            />
          ))}
        </div>
        <p className="text-[13px] leading-tight text-slate-700 dark:text-slate-200">
          <span className="font-bold text-slate-900 dark:text-white">{proofCount}</span>{" "}
          {proofLabel} sur Zolio
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {trustBadges.map((label) => (
          <li
            key={label}
            className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
