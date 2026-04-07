"use client";

import type { LucideIcon } from "lucide-react";
import type { ClientDashboardMonthlyDatum, ClientDashboardSummary, TresorerieSummary, BeneficeSummary } from "@/lib/client-dashboard";

// ─── Types ───────────────────────────────────────────────────────────

export type Tone = "violet" | "emerald" | "amber" | "rose" | "slate";

export type DashboardSignal = {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
};

export type DashboardActionPlanItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  tone: Tone;
  value?: string;
  ctaLabel?: string;
};

export type QuickLinkItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  tourClass?: string;
};

export type DashboardHeroIndicator = {
  id: string;
  label: string;
  value: string;
  tone: Tone;
};

export type { ClientDashboardMonthlyDatum, ClientDashboardSummary, TresorerieSummary, BeneficeSummary };

// ─── Utility Functions ────────────────────────────────────────────────

export function readStringMetadata(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readBooleanMetadata(value: unknown) {
  return value === true;
}

export function parseDevisDate(dateStr?: string): Date {
  if (dateStr && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
  }
  if (dateStr) return new Date(dateStr);
  return new Date();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDateLabel(value: string) {
  const date = parseDevisDate(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function toneClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return {
        icon: "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20",
        chip: "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20",
      };
    case "amber":
      return {
        icon: "bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/20",
        chip: "bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/20",
      };
    case "rose":
      return {
        icon: "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:rose-400/20",
        chip: "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20",
      };
    case "slate":
      return {
        icon: "bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10",
        chip: "bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10",
      };
    case "violet":
    default:
      return {
        icon: "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20",
        chip: "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20",
      };
  }
}

export function statusBadgeClasses(status: string) {
  if (status === "Accepté") {
    return "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20";
  }
  if (status === "Refusé") {
    return "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20";
  }
  return "bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10";
}

export function sectionMotion(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
  };
}
