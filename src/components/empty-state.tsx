"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  icon?: ComponentType<{ size?: number; className?: string }>;
}

export interface EmptyStateProps {
  icon?: LucideIcon | ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  /** Visual tone — drives the icon halo color */
  tone?: "violet" | "emerald" | "amber" | "rose" | "slate" | "info";
  /** Optional secondary content (e.g. tip, hint, or link) */
  footnote?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const TONE_STYLES = {
  violet: {
    bg: "from-violet-500/15 via-violet-500/5 to-transparent",
    ring: "ring-violet-300/40 dark:ring-violet-400/20",
    halo: "from-violet-500/30 to-fuchsia-500/20",
    icon: "text-violet-600 dark:text-violet-300",
  },
  emerald: {
    bg: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    ring: "ring-emerald-300/40 dark:ring-emerald-400/20",
    halo: "from-emerald-500/30 to-teal-500/20",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  amber: {
    bg: "from-amber-500/15 via-amber-500/5 to-transparent",
    ring: "ring-amber-300/40 dark:ring-amber-400/20",
    halo: "from-amber-500/30 to-orange-500/20",
    icon: "text-amber-600 dark:text-amber-300",
  },
  rose: {
    bg: "from-rose-500/15 via-rose-500/5 to-transparent",
    ring: "ring-rose-300/40 dark:ring-rose-400/20",
    halo: "from-rose-500/30 to-pink-500/20",
    icon: "text-rose-600 dark:text-rose-300",
  },
  slate: {
    bg: "from-slate-500/10 via-slate-500/4 to-transparent",
    ring: "ring-slate-300/40 dark:ring-white/10",
    halo: "from-slate-500/20 to-slate-400/10",
    icon: "text-slate-600 dark:text-slate-300",
  },
  info: {
    bg: "from-blue-500/15 via-blue-500/5 to-transparent",
    ring: "ring-blue-300/40 dark:ring-blue-400/20",
    halo: "from-blue-500/30 to-indigo-500/20",
    icon: "text-blue-600 dark:text-blue-300",
  },
};

const SIZE_STYLES = {
  sm: { wrap: "py-8 px-5", iconBox: "h-12 w-12", iconSize: 22, title: "text-base", desc: "text-xs", gap: "gap-3" },
  md: { wrap: "py-12 px-6", iconBox: "h-16 w-16", iconSize: 28, title: "text-lg", desc: "text-sm", gap: "gap-4" },
  lg: { wrap: "py-16 px-8", iconBox: "h-20 w-20", iconSize: 34, title: "text-xl", desc: "text-sm", gap: "gap-5" },
};

/**
 * Reusable empty state — used across all "no data" pages for visual consistency.
 *
 * @example
 * <EmptyState
 *   icon={FileText}
 *   tone="violet"
 *   title="Aucun devis pour le moment"
 *   description="Créez votre premier devis pour démarrer votre pipeline."
 *   actions={[{ label: "Créer un devis", href: "/nouveau-devis", variant: "primary" }]}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  tone = "violet",
  footnote,
  className,
  size = "md",
}: EmptyStateProps) {
  const t = TONE_STYLES[tone];
  const s = SIZE_STYLES[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.bg} ${s.wrap} text-center ring-1 ${t.ring} ${className ?? ""}`}
    >
      {Icon && (
        <div className={`mx-auto flex ${s.iconBox} items-center justify-center rounded-2xl bg-gradient-to-br ${t.halo} backdrop-blur`}>
          <Icon size={s.iconSize} className={t.icon} />
        </div>
      )}
      <div className={`mx-auto mt-4 max-w-md ${s.gap}`}>
        <h3 className={`${s.title} font-bold text-slate-900 dark:text-white`}>{title}</h3>
        {description && (
          <p className={`mt-2 ${s.desc} leading-relaxed text-slate-600 dark:text-slate-400`}>{description}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {actions.map((a) => {
            const ActionIcon = a.icon;
            const isPrimary = a.variant !== "secondary";
            const baseClasses = isPrimary
              ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-violet-600/40"
              : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10";
            const inner = (
              <>
                {ActionIcon ? <ActionIcon size={15} /> : null}
                {a.label}
              </>
            );
            if (a.href) {
              return (
                <Link key={a.label} href={a.href} className={baseClasses}>
                  {inner}
                </Link>
              );
            }
            return (
              <button key={a.label} type="button" onClick={a.onClick} className={baseClasses}>
                {inner}
              </button>
            );
          })}
        </div>
      )}
      {footnote && (
        <div className="mt-5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{footnote}</div>
      )}
    </motion.div>
  );
}
