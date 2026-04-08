"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Bell,
  Calculator,
  Calendar,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  Home,
  LifeBuoy,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  StickyNote,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { getSupportHref, getSupportLabel, isExternalSupportHref } from "@/lib/support";
import { GlobalSearch } from "@/components/global-search";
import { ShortcutsModal } from "@/components/shortcuts-modal";
import { UserButton } from "@clerk/nextjs";

function useUnreadNotificationsCount() {
  const { data } = useSWR<{ unreadCount: number }>(
    "/api/notifications",
    (url: string) => fetch(url).then((r) => (r.ok ? r.json() : { unreadCount: 0 })),
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );
  return data?.unreadCount ?? 0;
}

export type ClientNavKey = "dashboard" | "devis" | "clients" | "factures" | "calepin" | "tools";
type ClientTone = "violet" | "emerald" | "amber" | "rose" | "slate";
export type ClientMobileAction = {
  disabled?: boolean;
  href?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "accent";
};
type ClientMobileOverviewItem = {
  detail?: string;
  label: string;
  tone?: ClientTone;
  value: string;
};

const CLIENT_NAV_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  key: ClientNavKey;
  label: string;
}> = [
  { href: "/dashboard", icon: Home, key: "dashboard", label: "Accueil" },
  { href: "/devis", icon: FileText, key: "devis", label: "Devis" },
  { href: "/factures", icon: Receipt, key: "factures", label: "Factures" },
  { href: "/clients", icon: Users, key: "clients", label: "Clients" },
] as const;

const CLIENT_TOOL_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  isSearch?: boolean;
}> = [
  { href: "/nouvelle-facture", icon: Plus, label: "Nouvelle facture" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "", icon: Search, label: "Rechercher", isSearch: true },
  { href: "/rapports", icon: FileText, label: "Rapports" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/catalogue", icon: Package, label: "Catalogue" },
  { href: "/calepin", icon: StickyNote, label: "Calepin" },
  { href: "/depenses", icon: CreditCard, label: "Dépenses" },
  { href: "/modeles", icon: Copy, label: "Modèles" },
  { href: "/recurrentes", icon: RefreshCw, label: "Récurrence" },
  { href: "/tva", icon: Calculator, label: "TVA" },
  { href: "/parametres", icon: Settings, label: "Paramètres" },
  { href: "/abonnement", icon: LifeBuoy, label: "Abonnement" },
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

function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        document.dispatchEvent(new CustomEvent("client-shell-close-overlays"));
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);
}

function useOverlayCloseSignal(onClose: () => void) {
  useEffect(() => {
    const handleClose = () => onClose();
    document.addEventListener("client-shell-close-overlays", handleClose);
    return () => document.removeEventListener("client-shell-close-overlays", handleClose);
  }, [onClose]);
}

function bottomSheetBaseClasses() {
  return "absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[min(78vh,32rem)] overflow-y-auto rounded-[1.6rem] border border-slate-200/80 bg-white/96 p-3 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/96";
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
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const unreadCount = useUnreadNotificationsCount();

  useBodyScrollLock(toolsOpen || searchOpen);
  useOverlayCloseSignal(() => { setToolsOpen(false); setSearchOpen(false); });

  return (
    <>
      <nav className="client-nav-dock fixed inset-x-3 bottom-3 z-40 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around gap-1 rounded-[1.75rem] px-3 py-2.5 lg:hidden">
        {/* 2 liens gauche */}
        {CLIENT_NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`client-nav-link ${active === item.key ? "client-nav-link-active" : ""}`}
            >
              <Icon size={19} strokeWidth={active === item.key ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Bouton central Nouveau */}
        <Link
          href="/nouveau-devis"
          className="relative -mt-6 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>

        {/* 2 liens droite */}
        {CLIENT_NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`client-nav-link ${active === item.key ? "client-nav-link-active" : ""}`}
            >
              <Icon size={19} strokeWidth={active === item.key ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Bouton Plus */}
        <button
          type="button"
          onClick={() => setToolsOpen(true)}
          className={`relative client-nav-link ${active === "tools" ? "client-nav-link-active" : ""}`}
          aria-label="Plus d'outils"
        >
          <MoreHorizontal size={19} strokeWidth={active === "tools" ? 2.4 : 1.8} />
          <span className="text-[10px] font-medium">Plus</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[7px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </nav>

      {/* Search modal mobile */}
      {searchOpen ? (
        <div className="fixed inset-0 z-[80] bg-white dark:bg-slate-950 lg:hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/8"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Rechercher</p>
          </div>
          <div className="p-4">
            <GlobalSearch />
          </div>
        </div>
      ) : null}

      {toolsOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            onClick={() => setToolsOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
            aria-label="Fermer le menu outils"
          />

          <div className={bottomSheetBaseClasses()}>
            <div className="mb-3 flex justify-center sm:hidden">
              <span className="h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/12" />
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Outils
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                  Accès rapide aux modules secondaires
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:text-white"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CLIENT_TOOL_ITEMS.map((item) => {
                const Icon = item.icon;
                const isNotif = item.href === "/notifications";
                if (item.isSearch) {
                  return (
                    <button
                      key="search-tool"
                      type="button"
                      onClick={() => { setToolsOpen(false); setSearchOpen(true); }}
                      className={`inline-flex min-h-[88px] flex-col items-start justify-between rounded-[1.15rem] border px-3 py-3 text-left text-sm font-semibold transition ${mobileActionToneClasses("default")}`}
                    >
                      <Icon size={18} />
                      <span className="leading-5">{item.label}</span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setToolsOpen(false)}
                    className={`relative inline-flex min-h-[88px] flex-col items-start justify-between rounded-[1.15rem] border px-3 py-3 text-left text-sm font-semibold transition ${mobileActionToneClasses(
                      pathname === item.href ? "accent" : "default",
                    )}`}
                  >
                    <Icon size={18} />
                    <span className="leading-5">{item.label}</span>
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ClientDesktopNav({ active }: { active: ClientNavKey }) {
  const pathname = usePathname();
  const unreadCount = useUnreadNotificationsCount();

  const mainItems = [
    { href: "/dashboard", icon: Home, key: "dashboard" as const, label: "Accueil" },
    { href: "/devis", icon: FileText, key: "devis" as const, label: "Devis" },
    { href: "/factures", icon: Receipt, key: "factures" as const, label: "Factures" },
    { href: "/clients", icon: Users, key: "clients" as const, label: "Clients" },
    { href: "/calepin", icon: StickyNote, key: "calepin" as const, label: "Calepin" },
  ];

  const toolGroups = [
    {
      label: "Commercial",
      items: [
        { href: "/nouvelle-facture", icon: FileText, label: "Nouvelle facture" },
        { href: "/notifications", icon: Bell, label: "Notifications" },
        { href: "/planning", icon: Calendar, label: "Planning" },
        { href: "/catalogue", icon: Package, label: "Catalogue" },
        { href: "/modeles", icon: Copy, label: "Modèles" },
      ],
    },
    {
      label: "Finance",
      items: [
        { href: "/rapports", icon: FileText, label: "Rapports" },
        { href: "/depenses", icon: CreditCard, label: "Dépenses" },
        { href: "/recurrentes", icon: RefreshCw, label: "Récurrences" },
        { href: "/tva", icon: Calculator, label: "TVA" },
      ],
    },
    {
      label: "Config",
      items: [
        { href: "/parametres", icon: Settings, label: "Paramètres" },
        { href: "/abonnement", icon: LifeBuoy, label: "Abonnement" },
      ],
    },
  ];

  const isActiveNav = (item: { key?: string; href?: string }) => {
    if (item.key) return active === item.key;
    if (item.href) return pathname === item.href || pathname?.startsWith(item.href + "/");
    return false;
  };

  return (
    <aside className="fixed inset-y-4 left-4 z-40 hidden w-[240px] flex-col rounded-2xl border border-slate-200 bg-white p-4 lg:flex dark:border-white/10 dark:bg-slate-950/80 dark:backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <Image src="/logo.png" alt="Zolio" width={28} height={28} className="h-7 w-auto" priority />
        <span className="text-[13px] font-bold tracking-widest text-slate-900 dark:text-white">ZOLIO</span>
      </div>

      {/* Navigation principale */}
      <nav className="flex flex-col gap-0.5">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveNav(item);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                active
                  ? "bg-slate-100 font-semibold text-slate-900 dark:bg-white/10 dark:text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Séparateur */}
      <div className="my-3 border-t border-slate-100 dark:border-white/8" />

      {/* Groupes d'outils */}
      {toolGroups.map((group) => (
        <div key={group.label} className="mb-2">
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{group.label}</p>
          <nav className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const itemActive = isActiveNav(item);
              const isNotif = item.href === "/notifications";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                    itemActive
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-white/10 dark:text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon size={15} strokeWidth={itemActive ? 2 : 1.8} />
                  {item.label}
                  {isNotif && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Footer: Support + User */}
      <div className="mt-auto pt-4">
        <a
          href={SUPPORT_HREF}
          target={SUPPORT_IS_EXTERNAL ? "_blank" : undefined}
          rel={SUPPORT_IS_EXTERNAL ? "noreferrer" : undefined}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <LifeBuoy size={15} />
          Support
        </a>
        <div className="mt-2 px-2.5">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8",
                userButtonTrigger: "p-0",
              },
            }}
          />
        </div>
      </div>
    </aside>
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
  stretch = false,
}: {
  buttonLabel?: string;
  className?: string;
  items: ClientMobileAction[];
  panelAlign?: "left" | "right";
  stretch?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useBodyScrollLock(open);
  useOverlayCloseSignal(() => setOpen(false));

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`md:hidden ${stretch ? "w-full" : ""} ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white [&::-webkit-details-marker]:hidden ${stretch ? "flex w-full" : ""}`}
        aria-label={buttonLabel}
      >
        <MoreHorizontal size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
            aria-label="Fermer les actions"
          />

          <div className={bottomSheetBaseClasses()}>
            <div className="mb-3 flex justify-center sm:hidden">
              <span className="h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/12" />
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Actions
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{buttonLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:text-white"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                const commonClasses = `inline-flex min-h-12 w-full items-center gap-3 rounded-[1rem] border px-3 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${mobileActionToneClasses(item.tone)}`;

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(false);
                      }}
                      className={commonClasses}
                    >
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
                      event.stopPropagation();
                      setOpen(false);
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
        </div>
      ) : null}
    </div>
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

export function ClientMobileOverview({
  badge,
  description,
  items,
  title,
}: {
  badge?: string;
  description: string;
  items: ClientMobileOverviewItem[];
  title: string;
}) {
  return (
    <section className="client-panel rounded-[1.85rem] p-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
            Vue rapide
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {badge ? (
          <span className="inline-flex shrink-0 rounded-full border border-violet-300/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-200">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {item.value}
            </p>
            {item.detail ? (
              <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneClasses(item.tone ?? "slate")}`}>
                {item.detail}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
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
  breadcrumbs,
  children,
  description,
  eyebrow = "Espace client",
  mobilePrimaryAction,
  mobileSecondaryActions = [],
  mobileSummary,
  showMobileDock = true,
  summary,
  title,
}: {
  actions?: ReactNode;
  activeNav: ClientNavKey;
  backHref?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  description: string;
  eyebrow?: string;
  mobilePrimaryAction?: ReactNode;
  mobileSecondaryActions?: ClientMobileAction[];
  mobileSummary?: ReactNode;
  showMobileDock?: boolean;
  summary?: ReactNode;
  title: string;
}) {
  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-24 text-slate-950 dark:text-white sm:pb-28">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {/* Fixed sidebar (desktop) */}
      <ClientDesktopNav active={activeNav} />

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-4 lg:px-8 lg:pl-[272px]">
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
              <div className="flex min-w-0 shrink-0 items-center gap-2">
                {mobilePrimaryAction ? <div className="max-w-[calc(100vw-12rem)] shrink overflow-hidden">{mobilePrimaryAction}</div> : null}
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

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          <section className="client-panel-strong overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-6 lg:px-7">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav aria-label="Fil d'Ariane" className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {i > 0 && <ChevronRight size={12} className="shrink-0" />}
                          {crumb.href ? (
                            <Link href={crumb.href} className="transition hover:text-slate-600 dark:hover:text-slate-300">
                              {crumb.label}
                            </Link>
                          ) : (
                            <span className="font-medium text-slate-500 dark:text-slate-400">{crumb.label}</span>
                          )}
                        </span>
                      ))}
                    </nav>
                  )}
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

              {mobileSummary ? <div className="md:hidden">{mobileSummary}</div> : null}
              {summary ? <div className={mobileSummary ? "hidden md:block" : ""}>{summary}</div> : null}

              {/* Recherche globale (desktop uniquement) */}
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            </div>
          </section>

          {children}
        </main>
      </div>

      <footer className="hidden border-t border-slate-200/60 py-4 text-center text-xs text-slate-400 dark:border-white/6 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-6">
          <span>© {new Date().getFullYear()} Zolio</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/cgu" className="hover:text-slate-600 dark:hover:text-slate-200 transition">CGU</Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/cgv" className="hover:text-slate-600 dark:hover:text-slate-200 transition">CGV</Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/mentions-legales" className="hover:text-slate-600 dark:hover:text-slate-200 transition">Mentions légales</Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/politique-confidentialite" className="hover:text-slate-600 dark:hover:text-slate-200 transition">Confidentialité</Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link href="/changelog" className="hover:text-slate-600 dark:hover:text-slate-200 transition">Changelog</Link>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <ShortcutsModal />
        </div>
      </footer>

      {showMobileDock ? <ClientMobileDock active={activeNav} /> : null}
    </div>
  );
}
