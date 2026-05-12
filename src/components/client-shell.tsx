"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Gift,
  type LucideIcon,
} from "lucide-react";
import { getSupportHref, getSupportLabel, isExternalSupportHref } from "@/lib/support";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

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
}> = [
  { href: "/nouvelle-facture", icon: Plus, label: "Nouvelle facture" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/rapports", icon: FileText, label: "Rapports" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/catalogue", icon: Package, label: "Catalogue" },
  { href: "/calepin", icon: StickyNote, label: "Calepin" },
  { href: "/depenses", icon: CreditCard, label: "Dépenses" },
  { href: "/modeles", icon: Copy, label: "Modèles" },
  { href: "/recurrentes", icon: RefreshCw, label: "Récurrence" },
  { href: "/tva", icon: Calculator, label: "TVA" },
  { href: "/parametres/parrainage", icon: Gift, label: "Parrainer" },
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
  return "absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[min(78vh,32rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/96 p-3 shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/96";
}

export function ClientBrandMark({ showLabel = true, className = "" }: { showLabel?: boolean; className?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
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
  const unreadCount = useUnreadNotificationsCount();

  useBodyScrollLock(toolsOpen);
  useOverlayCloseSignal(() => { setToolsOpen(false); });

  return (
    <>
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="client-nav-dock fixed inset-x-3 bottom-5 z-30 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around gap-0.5 rounded-2xl px-2 py-2 lg:hidden"
        data-testid="mobile-nav-dock"
      >
        {/* 2 liens gauche */}
        {CLIENT_NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.key} whileTap={{ scale: 0.9 }}>
              <Link
                href={item.href}
                className={`client-nav-link ${active === item.key ? "client-nav-link-active" : ""}`}
              >
                <Icon size={20} strokeWidth={active === item.key ? 2.4 : 1.8} />
                <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        {/* Bouton central Nouveau */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <Link
            href="/nouveau-devis"
            className="relative -mt-4 flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
            data-testid="mobile-new-devis-btn"
          >
            <Plus size={22} strokeWidth={2.5} />
          </Link>
        </motion.div>

        {/* 2 liens droite */}
        {CLIENT_NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.key} whileTap={{ scale: 0.9 }}>
              <Link
                href={item.href}
                className={`client-nav-link ${active === item.key ? "client-nav-link-active" : ""}`}
              >
                <Icon size={20} strokeWidth={active === item.key ? 2.4 : 1.8} />
                <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Bouton Plus (flottant à droite, au-dessus du dock) */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setToolsOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-white/12 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:border-violet-500/30 dark:hover:text-violet-300 lg:hidden"
        aria-label="Plus d'outils"
        data-testid="mobile-tools-btn"
      >
        <MoreHorizontal size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setToolsOpen(false)}
                    className={`relative inline-flex min-h-[88px] flex-col items-start justify-between rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:translate-x-1 ${mobileActionToneClasses(
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
      label: "Production",
      items: [
        { href: "/planning", icon: Calendar, label: "Planning" },
        { href: "/catalogue", icon: Package, label: "Catalogue" },
        { href: "/modeles", icon: Copy, label: "Modèles" },
        { href: "/nouvelle-facture", icon: Receipt, label: "Nouvelle facture" },
      ],
    },
    {
      label: "Pilotage",
      items: [
        { href: "/notifications", icon: Bell, label: "Notifications" },
        { href: "/rapports", icon: FileText, label: "Rapports" },
        { href: "/depenses", icon: CreditCard, label: "Dépenses" },
        { href: "/recurrentes", icon: RefreshCw, label: "Récurrences" },
        { href: "/tva", icon: Calculator, label: "TVA" },
      ],
    },
  ];

  const footerItems = [
    { href: "/parametres", icon: Settings, label: "Paramètres" },
    { href: "/abonnement", icon: LifeBuoy, label: "Abonnement" },
  ];

  const isActiveNav = (item: { key?: string; href?: string }) => {
    if (item.key) return active === item.key;
    if (item.href) return pathname === item.href || pathname?.startsWith(item.href + "/");
    return false;
  };

  const navLink = (
    item: { href: string; icon: LucideIcon; key?: string; label: string },
    options?: { badge?: number },
  ) => {
    const Icon = item.icon;
    const isActive = isActiveNav(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
          isActive
            ? "bg-gradient-to-r from-violet-500/15 to-orange-400/10 font-semibold text-violet-700 dark:from-violet-600/20 dark:to-orange-500/10 dark:text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
        }`}
      >
        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} className="shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {options?.badge && options.badge > 0 ? (
          <span className="ml-auto inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
            {options.badge > 99 ? "99+" : options.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  const openCommandPalette = () => {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("zolio:open-command-palette"));
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50/80 lg:flex dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-950 dark:to-[#080611]">
      <div className="h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />

      {/* ── TOP (fixe) : brand + search + CTA ───────────────── */}
      <div className="shrink-0 space-y-3 px-3 pt-4">
        <div className="px-2.5">
          <ClientBrandMark />
        </div>

        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Rechercher · Cmd+K"
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[12.5px] text-slate-500 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-white/12 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          <Search size={14} strokeWidth={1.8} className="shrink-0" />
          <span className="flex-1 text-left">Rechercher</span>
          <kbd className="hidden items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 xl:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/nouveau-devis"
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:shadow-violet-600/30 hover:brightness-110"
        >
          <Plus size={15} /> Nouveau devis
        </Link>
      </div>

      {/* ── MIDDLE (scrollable) : nav + outils + footer ─────── */}
      <div className="client-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {mainItems.map((item) => navLink(item))}
        </nav>

        <div className="my-3 border-t border-slate-200/70 dark:border-white/[0.06]" />

        {toolGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) =>
                navLink(item, { badge: item.href === "/notifications" ? unreadCount : undefined }),
              )}
            </nav>
          </div>
        ))}

        <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-white/[0.06]">
          <nav className="flex flex-col gap-0.5">
            {footerItems.map((item) => navLink(item))}
            <a
              href={SUPPORT_HREF}
              target={SUPPORT_IS_EXTERNAL ? "_blank" : undefined}
              rel={SUPPORT_IS_EXTERNAL ? "noreferrer" : undefined}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <LifeBuoy size={16} strokeWidth={1.7} className="shrink-0" />
              <span className="flex-1">Support</span>
            </a>
          </nav>
        </div>
      </div>

      {/* ── BOTTOM (fixe) : user + theme toggle ─────────────── */}
      <div className="shrink-0 border-t border-slate-200/70 px-3 py-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-2 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <UserButton />
          <span className="flex-1 truncate text-[12.5px] font-medium text-slate-700 dark:text-slate-200">Mon compte</span>
          <div className="shrink-0 [&_button]:!h-8 [&_button]:!w-8">
            <ThemeToggle />
          </div>
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
                const commonClasses = `inline-flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${mobileActionToneClasses(item.tone)}`;

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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${toneClasses(tone)}`}>
          {detail}
        </div>
      </div>
    </div>
  );
}

export function ClientMobileOverview({
  badge,
  items,
  title,
}: {
  badge?: string;
  description?: string;
  items: ClientMobileOverviewItem[];
  title: string;
}) {
  // Show max 3 items on mobile for clarity
  const visibleItems = items.slice(0, 3);
  return (
    <section className="client-panel rounded-2xl p-4 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
        {badge ? (
          <span className="inline-flex shrink-0 rounded-full border border-violet-300/40 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-200">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {visibleItems.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-[1.1rem] border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 dark:border-white/8 dark:bg-white/4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
              {item.value}
            </p>
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
  return <section className={`client-panel rounded-2xl p-4 sm:p-5 md:p-6 ${className}`}>{children}</section>;
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
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white sm:pb-32">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),rgba(251,146,60,0.06),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),rgba(251,146,60,0.08),transparent_60%)]" />

      {/* Fixed sidebar (desktop) */}
      <ClientDesktopNav active={activeNav} />

      <div className="flex min-h-screen w-full flex-col px-4 pb-28 pt-3 sm:px-6 sm:pb-32 sm:pt-4 lg:ml-[220px] lg:max-w-[calc(100%-220px)] lg:px-6 xl:px-8">
        {/* Mobile header */}
        <header className="client-panel sticky top-2 z-40 rounded-2xl px-4 py-3 backdrop-blur-xl sm:top-3 sm:rounded-2xl sm:px-6 sm:py-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
                data-testid="mobile-back-button"
              >
                <ArrowLeft size={18} />
              </Link>
              <ClientBrandMark showLabel={false} />
            </div>

            {mobilePrimaryAction || mobileSecondaryActions.length > 0 ? (
              <div className="flex min-w-0 shrink-0 items-center gap-2">
                {mobilePrimaryAction ? <div className="max-w-[calc(100vw-11rem)] shrink overflow-hidden">{mobilePrimaryAction}</div> : null}
                <ClientMobileActionsMenu items={mobileSecondaryActions} />
              </div>
            ) : actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          {/* Page header */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 px-5 py-5 backdrop-blur-sm dark:border-white/8 dark:bg-white/[0.03] sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/[0.04] via-fuchsia-500/[0.02] to-orange-400/[0.04] dark:from-violet-500/[0.06] dark:via-fuchsia-500/[0.03] dark:to-orange-400/[0.05]" />
            <div className="relative">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
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

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-orange-500 dark:from-violet-400 dark:to-orange-400 sm:block">
                    {eyebrow}
                  </p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                  <p className="mt-1 hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                    {description}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {actions}
                </div>
              </div>

              {mobileSummary ? <div className="mt-4 md:hidden">{mobileSummary}</div> : null}
              {summary ? <div className={`mt-4 ${mobileSummary ? "hidden md:block" : ""}`}>{summary}</div> : null}
            </div>
          </section>

          {children}
        </main>
      </div>

      {showMobileDock ? <ClientMobileDock active={activeNav} /> : null}
    </div>
  );
}
