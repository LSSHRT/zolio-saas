"use client";

import { TrendingUp, Clock3, Bell, TriangleAlert, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toneClasses, type Tone, type DashboardSignal, type DashboardActionPlanItem, type DashboardHeroIndicator, type QuickLinkItem } from "./shared";

// ─── Signal Icon ──────────────────────────────────────────────────────

export function renderSignalIcon(tone: Tone, size = 16) {
  const cls = toneClasses(tone).icon;
  const IconMap: Record<Tone, LucideIcon> = {
    violet: Bell,
    emerald: TrendingUp,
    amber: Clock3,
    rose: TriangleAlert,
    slate: Clock3,
  };
  const Icon = IconMap[tone];
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ${cls}`}>
      <Icon size={size} />
    </span>
  );
}

// ─── Focus Signal Card ────────────────────────────────────────────────

export function FocusSignalCard({ signal }: { signal: DashboardSignal }) {
  const content = (
    <div
      className={`rounded-3xl border border-white/70 bg-white/72 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.28)] transition dark:border-white/10 dark:bg-white/4 ${
        signal.href ? "cursor-pointer hover:-translate-y-0.5 hover:border-violet-300/70 hover:shadow-[0_28px_60px_-42px_rgba(124,58,237,0.35)] dark:hover:border-violet-400/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {renderSignalIcon(signal.tone)}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{signal.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.description}</p>
          {signal.href ? (
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
              Ouvrir →
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return signal.href ? <Link href={signal.href}>{content}</Link> : content;
}

// ─── Dashboard Action Card ────────────────────────────────────────────

export function DashboardActionCard({ item, compact = false }: { item: DashboardActionPlanItem; compact?: boolean }) {
  const Icon = item.icon;
  const content = (
    <div
      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
        item.tone === "rose"
          ? "border-rose-200/70 bg-rose-50/80 dark:border-rose-400/12 dark:bg-rose-500/8"
          : item.tone === "amber"
          ? "border-amber-200/70 bg-amber-50/80 dark:border-amber-400/12 dark:bg-amber-500/8"
          : item.tone === "emerald"
          ? "border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-400/12 dark:bg-emerald-500/8"
          : "border-violet-200/70 bg-violet-50/80 dark:border-violet-400/12 dark:bg-violet-500/8"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses(item.tone).icon}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          {compact ? null : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {item.eyebrow}
            </p>
          )}
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
          {compact ? null : (
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
          )}
          {item.ctaLabel && (
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
              {item.ctaLabel} →
            </span>
          )}
        </div>
        {item.value && (
          <span className="shrink-0 text-lg font-bold text-slate-900 dark:text-white">{item.value}</span>
        )}
      </div>
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

// ─── Metric Card ──────────────────────────────────────────────────────

export function CompactMetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/78 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_65px_-42px_rgba(124,58,237,0.28)] dark:border-white/8 dark:bg-white/4">
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${toneClasses(tone).icon}`}>
          <Icon size={15} />
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

// ─── Hero Indicator Pill ──────────────────────────────────────────────

export function HeroIndicatorPill({ indicator }: { indicator: DashboardHeroIndicator }) {
  const toneText: Record<Tone, { label: string; value: string }> = {
    violet: { label: "text-violet-500 dark:text-violet-400", value: "text-violet-700 dark:text-violet-200" },
    emerald: { label: "text-emerald-500 dark:text-emerald-400", value: "text-emerald-700 dark:text-emerald-200" },
    amber: { label: "text-amber-500 dark:text-amber-400", value: "text-amber-700 dark:text-amber-200" },
    rose: { label: "text-rose-500 dark:text-rose-400", value: "text-rose-700 dark:text-rose-200" },
    slate: { label: "text-slate-400 dark:text-slate-500", value: "text-slate-700 dark:text-slate-200" },
  };
  const t = toneText[indicator.tone];
  return (
    <div className={`rounded-full px-3 py-2 ring-1 ${toneClasses(indicator.tone).chip}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${t.label}`}>{indicator.label}</p>
      <p className={`text-sm font-bold ${t.value}`}>{indicator.value}</p>
    </div>
  );
}

// ─── Quick Link Card ──────────────────────────────────────────────────

export function QuickLinkCard({ item }: { item: QuickLinkItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`rounded-3xl border border-white/70 bg-white/78 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_28px_60px_-42px_rgba(124,58,237,0.26)] dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20 ${item.tourClass ?? ""}`}
    >
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${toneClasses(item.tone).icon}`}>
        <Icon size={17} />
      </div>
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
    </Link>
  );
}

// ─── Mobile Disclosure Section ────────────────────────────────────────

export function MobileDisclosureSection({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="client-panel rounded-2xl p-4"
    >
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          {badge !== undefined && (
            <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
              {badge}
            </span>
          )}
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    </motion.section>
  );
}
