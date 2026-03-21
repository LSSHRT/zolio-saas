"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Home,
  LifeBuoy,
  MoreHorizontal,
  Receipt,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getSupportHref, getSupportLabel, isExternalSupportHref } from "@/lib/support";

export type ClientNavKey = "dashboard" | "devis" | "clients" | "factures" | "calepin";
type ClientTone = "violet" | "emerald" | "amber" | "rose" | "slate";
export type ClientMobileAction = {
  disabled?: boolean;
  href?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "accent";
};

const CLIENT_NAV_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  key: ClientNavKey;
  label: string;
}> = [
  { href: "/dashboard", icon: Home, key: "dashboard", label: "Accueil" },
  { href: "/devis", icon: FileText, key: "devis", label: "Devis" },
  { href: "/clients", icon: Users, key: "clients", label: "Clients" },
  { href: "/factures", icon: Receipt, key: "factures", label: "Factures" },
  { href: "/calepin", icon: StickyNote, key: "calepin", label: "Calepin" },
] as const;

const SUPPORT_HREF = getSupportHref();
const SUPPORT_IS_EXTERNAL = isExternalSupportHref(SUPPORT_HREF);

function toneClasses(tone: ClientTone) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20";
    case "amber":
      return "bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/20";
    case "rose":
      return "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20";
    case "slate":
      return "bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10";
    case "violet":
    default:
      return "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20";
  }
}

function mobileActionToneClasses(tone: ClientMobileAction["tone"] = "default") {
  switch (tone) {
    case "accent":
      return "border-violet-200/80 bg-violet-50/80 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/14";
    case "danger":
      return "border-rose-200/80 bg-rose-50/80 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/14";
    case "default":
    default:
      return "border-slate-200/80 bg-white/90 text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white";
  }
}

export function ClientBrandMark({ showLabel = true }: { showLabel?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-white/50 dark:bg-white/8 dark:ring-white/10">
        <Image
          src="/logo.png"
          alt="Zolio"
          width={28}
          height={28}
          className="h-7 w-auto object-contain"
          priority
        />
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[0.22em] text-violet-600 dark:text-violet-200">
            ZOLIO
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">Workspace bâtiment</p>
        </div>
      )}
    </div>
  );
}

export function ClientMobileDock({ active }: { active: ClientNavKey }) {
  return (
    <nav className="client-nav-dock fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-sm items-center justify-between gap-1.5 rounded-[1.75rem] px-2.5 py-2.5 lg:hidden">
      {CLIENT_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`client-nav-link ${active === item.key ? "client-nav-link-active" : ""}`}
          >
            <Icon size={20} strokeWidth={active === item.key ? 2.4 : 2} />
            <span className="text-[11px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientDesktopNav({ active }: { active: ClientNavKey }) {
  return (
    <nav className="client-panel mt-4 hidden items-center gap-2 rounded-[1.75rem] p-2 lg:flex">
      {CLIENT_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`inline-flex items-center gap-2 rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 text-white shadow-[0_22px_55px_-28px_rgba(124,58,237,0.65)]"
                : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientSupportButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={SUPPORT_HREF}
      target={SUPPORT_IS_EXTERNAL ? "_blank" : undefined}
      rel={SUPPORT_IS_EXTERNAL ? "noreferrer" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white ${
        compact ? "h-11 px-3 text-sm font-semibold sm:px-4" : "px-4 py-2.5 text-sm font-semibold"
      }`}
    >
      <LifeBuoy size={compact ? 16 : 17} />
      <span className={compact ? "hidden sm:inline" : ""}>
        {compact ? "Support" : getSupportLabel()}
      </span>
    </a>
  );
}

export function ClientMobileActionsMenu({
  buttonLabel = "Plus d'actions",
  className = "",
  items,
  panelAlign = "right",
  stretch = false,
}: {
  buttonLabel?: string;
  className?: string;
  items: ClientMobileAction[];
  panelAlign?: "left" | "right";
  stretch?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <details className={`relative md:hidden ${stretch ? "w-full" : ""} ${className}`}>
      <summary
        className={`inline-flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white [&::-webkit-details-marker]:hidden ${stretch ? "flex w-full" : ""}`}
        aria-label={buttonLabel}
      >
        <MoreHorizontal size={18} />
      </summary>

      <div
        className={`absolute top-[calc(100%+0.6rem)] z-50 min-w-[220px] rounded-[1.35rem] border border-slate-200/80 bg-white/96 p-2 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/96 ${stretch ? "left-0 right-0 min-w-0" : panelAlign === "left" ? "left-0" : "right-0"}`}
      >
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const commonClasses = `inline-flex w-full items-center gap-3 rounded-[1rem] border px-3 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${mobileActionToneClasses(item.tone)}`;

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={commonClasses}>
                  <Icon size={16} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={(event) => {
                  event.currentTarget.closest("details")?.removeAttribute("open");
                  item.onClick?.();
                }}
                className={commonClasses}
              >
                <Icon size={16} />
                <span className="min-w-0 flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

export function ClientHeroStat({
  detail,
  label,
  tone = "violet",
  value,
}: {
  detail: string;
  label: string;
  tone?: ClientTone;
  value: string;
}) {
  return (
    <div className="client-kpi-card">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      <div className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${toneClasses(tone)}`}>
        {detail}
      </div>
    </div>
  );
}

export function ClientSectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`client-panel rounded-[2rem] p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function ClientSubpageShell({
  actions,
  activeNav,
  backHref = "/dashboard",
  children,
  description,
  eyebrow = "Espace client",
  mobilePrimaryAction,
  mobileSecondaryActions = [],
  showMobileDock = true,
  summary,
  title,
}: {
  actions?: ReactNode;
  activeNav: ClientNavKey;
  backHref?: string;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  mobilePrimaryAction?: ReactNode;
  mobileSecondaryActions?: ClientMobileAction[];
  showMobileDock?: boolean;
  summary?: ReactNode;
  title: string;
}) {
  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-24 text-slate-950 dark:text-white sm:pb-28">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-4 lg:px-8 lg:pb-10">
        <header className="client-panel sticky top-2 z-40 rounded-[1.8rem] px-4 py-3 backdrop-blur-xl sm:top-3 sm:rounded-[2rem] sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
              >
                <ArrowLeft size={18} />
              </Link>
              <ClientBrandMark showLabel={false} />
            </div>

            {mobilePrimaryAction || mobileSecondaryActions.length > 0 ? (
              <div className="flex shrink-0 items-center gap-2">
                {mobilePrimaryAction}
                <ClientMobileActionsMenu items={mobileSecondaryActions} />
              </div>
            ) : actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>

          <div className="hidden flex-col gap-4 md:flex md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </Link>
              <ClientBrandMark />
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <ClientSupportButton compact />
              {actions}
            </div>
          </div>
        </header>

        <ClientDesktopNav active={activeNav} />

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          <section className="client-panel-strong overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-6 lg:px-7">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-violet-600 dark:text-violet-200">
                    {eyebrow}
                  </p>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    {description}
                  </p>
                </div>
              </div>

              {summary}
            </div>
          </section>

          {children}
        </main>
      </div>

      {showMobileDock ? <ClientMobileDock active={activeNav} /> : null}
    </div>
  );
}
