"use client";

import { ArrowRight, Bell, Clock3, TriangleAlert, TrendingUp, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  toneClasses,
  type Tone,
  type DashboardSignal,
  type DashboardActionPlanItem,
  type DashboardHeroIndicator,
  type QuickLinkItem,
} from "./shared";

function toneBorderClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200/70 dark:border-emerald-400/15";
    case "amber":
      return "border-amber-200/70 dark:border-amber-400/15";
    case "rose":
      return "border-rose-200/70 dark:border-rose-400/15";
    case "slate":
      return "border-slate-200/70 dark:border-white/10";
    case "violet":
    default:
      return "border-violet-200/70 dark:border-violet-400/15";
  }
}

function toneStripeClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "from-emerald-500 to-emerald-300";
    case "amber":
      return "from-amber-500 to-amber-300";
    case "rose":
      return "from-rose-500 to-rose-300";
    case "slate":
      return "from-slate-500 to-slate-300";
    case "violet":
    default:
      return "from-violet-600 to-fuchsia-400";
  }
}

export function renderSignalIcon(tone: Tone, size = 16) {
  const IconMap: Record<Tone, LucideIcon> = {
    violet: Bell,
    emerald: TrendingUp,
    amber: Clock3,
    rose: TriangleAlert,
    slate: Clock3,
  };
  const Icon = IconMap[tone];

  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${toneClasses(tone).icon}`}>
      <Icon size={size} />
    </span>
  );
}

export function FocusSignalCard({ signal }: { signal: DashboardSignal }) {
  const content = (
    <div
      className={`group relative overflow-hidden rounded-[1.6rem] border bg-white/84 p-5 shadow-[0_24px_54px_-42px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 dark:bg-white/4 ${toneBorderClasses(signal.tone)}`}
    >
      <div className={`absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b ${toneStripeClasses(signal.tone)}`} />
      <div className="flex items-start gap-4 pl-2">
        {renderSignalIcon(signal.tone, 18)}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            Focus du jour
          </p>
          <p className="mt-2 text-base font-semibold tracking-tight text-slate-950 dark:text-white">
            {signal.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {signal.description}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
            {signal.href ? "Ouvrir" : "Sous contrôle"}
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );

  return signal.href ? <Link href={signal.href}>{content}</Link> : content;
}

export function DashboardActionCard({ item, compact = false }: { item: DashboardActionPlanItem; compact?: boolean }) {
  const Icon = item.icon;
  const content = (
    <div
      className={`group relative overflow-hidden rounded-[1.45rem] border bg-white/84 p-4 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 dark:bg-white/4 ${toneBorderClasses(item.tone)}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneStripeClasses(item.tone)}`} />
      <div className="flex items-start gap-3 pt-1">
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses(item.tone).icon}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {item.eyebrow}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
            </div>
            {item.value ? (
              <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneClasses(item.tone).chip}`}>
                {item.value}
              </span>
            ) : null}
          </div>
          <p className={`mt-2 ${compact ? "text-xs leading-5" : "text-sm leading-6"} text-slate-600 dark:text-slate-300`}>
            {item.description}
          </p>
          {item.ctaLabel ? (
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
              {item.ctaLabel}
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

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
    <div className={`relative overflow-hidden rounded-[1.5rem] border bg-white/84 p-4 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] dark:bg-white/4 ${toneBorderClasses(tone)}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneStripeClasses(tone)}`} />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses(tone).icon}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export function HeroIndicatorPill({ indicator }: { indicator: DashboardHeroIndicator }) {
  return (
    <div className={`rounded-[1.35rem] border bg-white/84 px-4 py-3 dark:bg-white/4 ${toneBorderClasses(indicator.tone)}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r ${toneStripeClasses(indicator.tone)}`} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {indicator.label}
        </p>
      </div>
      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{indicator.value}</p>
    </div>
  );
}

export function QuickLinkCard({ item }: { item: QuickLinkItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group relative overflow-hidden rounded-[1.45rem] border bg-white/84 p-4 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:border-violet-300 dark:bg-white/4 dark:hover:border-violet-400/20 ${toneBorderClasses(item.tone)} ${item.tourClass ?? ""}`}
    >
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${toneClasses(item.tone).icon}`}>
        <Icon size={17} />
      </div>
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-100">
        Ouvrir
        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

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
      className="client-panel rounded-[1.7rem] p-4"
    >
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          {badge !== undefined ? (
            <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
              {badge}
            </span>
          ) : null}
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    </motion.section>
  );
}
