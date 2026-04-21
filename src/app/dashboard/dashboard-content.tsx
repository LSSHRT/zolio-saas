"use client";


import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Clock3,
  CloudSun,
  FileCheck2,
  FileText,
  LineChart,
  MoonStar,
  Package,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { ShortcutsModal } from "@/components/shortcuts-modal";
import {
  ClientBrandMark,
  ClientDesktopNav,
  ClientMobileDock,
  ClientSupportButton,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import { DesktopDrawer } from "@/components/desktop-drawer";
import { DevisEditor } from "@/components/devis-editor";
import ConversionFunnel from "@/components/conversion-funnel";
import { PullToRefresh } from "@/components/pull-to-refresh";

// Dashboard components
import {
  readStringMetadata,
  readBooleanMetadata,
  formatCurrency,
  formatDateLabel,
  sectionMotion,
  type Tone,
  type DashboardSignal,
  type DashboardActionPlanItem,
  type QuickLinkItem,
  type DashboardHeroIndicator,
} from "@/components/dashboard/shared";
import {
  FocusSignalCard,
  DashboardActionCard,
  CompactMetricCard,
  HeroIndicatorPill,
  QuickLinkCard,
} from "@/components/dashboard/ui";
import { DashboardTresorerie } from "@/components/dashboard/tresorerie";
import { DashboardBenefice } from "@/components/dashboard/benefice";
import {
  DashboardEcheances,
  DashboardFollowUps,
  DashboardRecentQuotes,
  DashboardTopClients,
  type QuoteListItem,
} from "@/components/dashboard/lists";
import {
  DEFAULT_TRADE,
  TRADE_OPTIONS,
  getStarterCatalogForTrade,
  getTradeDefinition,
  type TradeDefinition,
  type TradeKey,
} from "@/lib/trades";

import type { ClientDashboardSummary, ClientDashboardMonthlyDatum } from "@/lib/client-dashboard";

interface InitialUserData {
  firstName: string | null;
  imageUrl: string | null;
}

interface InitialDashboardData {
  companyTrade: string | null;
  catalogImported: boolean;
  onboardingDone: boolean;
  starterCatalogCount: number;
  canAccessAdmin: boolean;
  isPro: boolean;
}

interface DashboardContentProps {
  initialUser: InitialUserData;
  initialData: InitialDashboardData;
  initialSummary: ClientDashboardSummary;
}

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
const DashboardChart = dynamic(() => import("@/components/DashboardChart"), { ssr: false });

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(`API ${response.status}`);
    throw error;
  }
  return response.json();
};

// --- Inline helpers (page-specific) ----------------------------------

function DashboardNotificationsMenu({ dashboardSignals }: { dashboardSignals: DashboardSignal[] }) {
  const { data } = useSWR("/api/notifications", fetcher, { refreshInterval: 30000, dedupingInterval: 15000 });
  const unreadCount: number = data?.unreadCount ?? 0;
  const total = dashboardSignals.length + unreadCount;
  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-11 w-11 lg:h-9 lg:w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
      aria-label="Notifications"
    >
      <Bell size={20} />
      {total > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-1 text-[10px] font-bold text-white">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}

function TradeOptionCard({ active, onSelect, option }: { active: boolean; onSelect: (key: TradeKey) => void; option: TradeDefinition }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.key)}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? "border-violet-400/50 bg-violet-500/12 shadow-[0_18px_45px_-32px_rgba(124,58,237,0.8)]"
          : "border-slate-200/70 bg-white/75 hover:border-violet-300/50 hover:bg-violet-500/6 dark:border-white/8 dark:bg-white/4"
      }`}
    >
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{option.label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{option.summary}</p>
    </button>
  );
}

function DesktopPriorityQuotes({ items, onSelectDevis }: { items: QuoteListItem[]; onSelectDevis: (numero: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
        Aucun devis critique à relancer pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item) => (
        <button
          key={item.numero}
          type="button"
          onClick={() => onSelectDevis(item.numero)}
          className="flex w-full items-start gap-3 rounded-3xl border border-rose-200/70 bg-rose-50/78 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-rose-300 dark:border-rose-400/12 dark:bg-rose-500/8 dark:hover:border-rose-400/20"
        >
          <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-700 ring-1 ring-rose-300/40 dark:text-rose-200 dark:ring-rose-400/20">
            <Bell size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">{item.numero}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(item.totalTTC || 0)} • {formatDateLabel(item.date)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function DesktopPaymentStack({ items }: { items: Array<{ numero: string; nomClient: string; totalTTC: number; joursRestants: number }> }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
        Aucune échéance sensible sur les 14 prochains jours.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 3).map((item) => {
        const toneClass = item.joursRestants <= 3
          ? "border-rose-200/70 bg-rose-50/78 text-rose-700 dark:border-rose-400/12 dark:bg-rose-500/8 dark:text-rose-200"
          : item.joursRestants <= 7
          ? "border-amber-200/70 bg-amber-50/78 text-amber-700 dark:border-amber-400/12 dark:bg-amber-500/8 dark:text-amber-200"
          : "border-violet-200/70 bg-violet-50/78 text-violet-700 dark:border-violet-400/12 dark:bg-violet-500/8 dark:text-violet-200";

        return (
          <Link
            key={item.numero}
            href={`/factures/${item.numero}`}
            className={`flex items-start justify-between gap-3 rounded-3xl border px-4 py-4 transition hover:-translate-y-0.5 ${toneClass}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-80">{item.numero}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(item.totalTTC)}</p>
            </div>
            <span className="shrink-0 rounded-full border border-current/20 bg-white/50 px-3 py-1 text-xs font-semibold dark:bg-white/5">
              {item.joursRestants === 0 ? "Aujourd'hui" : `J+${item.joursRestants}`}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// --- Main Dashboard Content ---------------------------------------------

export default function DashboardContent({ initialUser, initialData, initialSummary }: DashboardContentProps) {
  const { user: clerkUser } = useUser();
  const { data: dashboardData, mutate: mutateDashboard } = useSWR<ClientDashboardSummary>(
    "/api/dashboard/summary",
    fetcher,
    {
      fallbackData: initialSummary,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: 30000,
      refreshInterval: 0,
    },
  );


  const canAccessAdmin = initialData.canAccessAdmin;
  const isPro = initialData.isPro;
  const companyTrade = readStringMetadata(initialData.companyTrade || clerkUser?.publicMetadata?.companyTrade as string | undefined);
  const catalogImported = initialData.catalogImported || readBooleanMetadata(clerkUser?.publicMetadata?.starterCatalogImported as boolean | undefined);
  const onboardingDone = initialData.onboardingDone || readBooleanMetadata(clerkUser?.publicMetadata?.onboardingCompleted as boolean | undefined);
  const starterCatalogCount = dashboardData?.starterCatalogCount ?? initialData.starterCatalogCount;
  const currentTrade = companyTrade || DEFAULT_TRADE;
  const starterTrade = getTradeDefinition(currentTrade);

  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [objectifDialogOpen, setObjectifDialogOpen] = useState(false);
  const [objectifDraft, setObjectifDraft] = useState("5000");
  const [runTour, setRunTour] = useState(() => typeof window !== "undefined" && !localStorage.getItem("zolio_has_seen_tour"));
  const [currentHour] = useState(() => new Date().getHours());
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const [selectedDevisNumero, setSelectedDevisNumero] = useState<string | null>(null);

  useEffect(() => {
    const nextTrade = getTradeDefinition(companyTrade)?.key;
    if (nextTrade) setSelectedTrade(nextTrade);
  }, [companyTrade]);

  const selectedTradeDef = getTradeDefinition(selectedTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const selectedStarterCount = getStarterCatalogForTrade(selectedTrade).length;
  const setupRequired = !companyTrade || !catalogImported || !onboardingDone || starterCatalogCount === 0;

  const objectifMensuel = Number((clerkUser?.unsafeMetadata as Record<string, unknown>)?.objectifMensuel || 0);
  const objectifInitial = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : 5000;
  const [objectif, setObjectif] = useState(objectifInitial);
  const objectifActif = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : objectif;

  useEffect(() => { setObjectifDraft(objectifActif.toString()); }, [objectifActif]);

  // --- Handlers ----------------------------------------------------

  const handleBootstrap = async () => {
    if (!clerkUser || !selectedTradeDef) return;
    setIsBootstrapping(true);
    try {
      const res = await fetch("/api/onboarding/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trade: selectedTradeDef.key }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Erreur");
      await clerkUser.update({ unsafeMetadata: { ...clerkUser.unsafeMetadata, companyTrade: selectedTradeDef.key, onboardingCompleted: true, starterCatalogImported: true } });
      await mutateDashboard();
      toast.success(payload.imported > 0 ? `${payload.imported} prestation(s) importée(s)` : `Starter déjà en place`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'importer");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleUpdateObjectif = async () => {
    const parsed = Number(objectifDraft.replace(',', '.').trim());
    if (Number.isNaN(parsed) || parsed <= 0) { toast.error("Objectif invalide."); return; }
    setObjectif(parsed);
    try {
      if (clerkUser) await clerkUser.update({ unsafeMetadata: { ...clerkUser.unsafeMetadata, objectifMensuel: parsed } });
      setObjectifDialogOpen(false);
      toast.success("Objectif mis à jour.");
    } catch { toast.error("Erreur de sauvegarde."); }
  };

  const handleTourCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      localStorage.setItem("zolio_has_seen_tour", "true");
      setRunTour(false);
    }
  };

  // --- Computed data -----------------------------------------------

  const d = dashboardData;
  const totalQuotes = d?.totalQuotes ?? 0;
  const CA_TTC = d?.totalTTC ?? 0;
  const acceptedCount = d?.acceptedCount ?? 0;
  const pendingCount = d?.pendingCount ?? 0;
  const acceptedRevenueHT = d?.acceptedRevenueHT ?? 0;
  const pipelineHT = d?.pipelineRevenueHT ?? 0;
  const conversionRate = d?.conversionRate ?? 0;
  const averageTicket = d?.averageTicket ?? 0;
  const avgResponseDays = d?.avgResponseDays ?? 0;
  const objectifProgress = objectifActif > 0 ? Math.min((CA_TTC / objectifActif) * 100, 100) : 0;
  const remainingToGoal = Math.max(objectifActif - CA_TTC, 0);
  const devisRecents = (d?.recentQuotes ?? []) as QuoteListItem[];
  const devisARelancer = (d?.followUpQuotes ?? []) as QuoteListItem[];
  const monthlyData: ClientDashboardMonthlyDatum[] = d?.monthlyData ?? [];
  const topClients = d?.topClients ?? [];
  const tresorerie = d?.tresorerie;
  const benefice = d?.benefice;
  const echeances = d?.echeances ?? [];
  const semaine = d?.semaine;
  const funnel = d?.funnel;
  const relanceCountLabel = devisARelancer.length > 1 ? `${devisARelancer.length} relances` : `${devisARelancer.length} relance`;

  let greetingText = "Bonjour";
  let GreetingIcon = CloudSun;
  if (currentHour >= 18) { greetingText = "Bonsoir"; GreetingIcon = MoonStar; }
  else if (currentHour >= 12) { greetingText = "Bon après-midi"; GreetingIcon = SunMedium; }

  const todayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  // --- Signals ------------------------------------------------------

  const signals = useMemo<DashboardSignal[]>(() => {
    const s: DashboardSignal[] = [];
    if (setupRequired) s.push({ id: "setup", title: "Starter métier à activer", description: "Choisissez votre métier et importez le catalogue.", tone: "violet" });
    if (totalQuotes === 0) s.push({ id: "empty", title: "Premier devis à lancer", description: "Créez votre premier devis.", href: "/nouveau-devis", tone: "violet" });
    if (devisARelancer.length > 0) s.push({ id: "followups", title: `${devisARelancer.length} devis à relancer`, description: "Des clients attendent un rappel.", href: "/devis", tone: "rose" });
    if (pendingCount > 0) s.push({ id: "pipeline", title: `${pendingCount} devis dans le pipe`, description: `${formatCurrency(pipelineHT)} HT en attente.`, href: "/devis", tone: "amber" });
    if (tresorerie && tresorerie.enRetard > 0) s.push({ id: "overdue", title: `${formatCurrency(tresorerie.enRetard)} en retard`, description: `${tresorerie.tauxRecouvrement}% recouvrement.`, href: "/factures", tone: "rose" });
    return s.slice(0, 4);
  }, [totalQuotes, devisARelancer.length, pendingCount, pipelineHT, setupRequired, tresorerie]);

  const todayFocus = useMemo<DashboardSignal>(() => {
    if (setupRequired) return { id: "f-setup", title: "Activer le starter métier", description: "Configurez votre activité.", tone: "violet" as Tone };
    if (totalQuotes === 0) return { id: "f-empty", title: "Créer le premier devis", description: "Lancez votre première affaire.", href: "/nouveau-devis", tone: "violet" as Tone };
    if (devisARelancer.length > 0) return { id: "f-follow", title: `${relanceCountLabel} à faire`, description: "Traitez-les en priorité.", href: "/devis", tone: "rose" as Tone };
    if (pendingCount > 0) return { id: "f-pipe", title: "Pipeline chaud", description: `${formatCurrency(pipelineHT)} HT en attente.`, href: "/devis", tone: "amber" as Tone };
    return { id: "f-steady", title: "Cockpit sous contrôle", description: "Concentrez-vous sur le prochain devis.", tone: "emerald" as Tone };
  }, [totalQuotes, devisARelancer.length, pendingCount, pipelineHT, relanceCountLabel, setupRequired]);

  const heroIndicators = useMemo<DashboardHeroIndicator[]>(() => {
    const arr: DashboardHeroIndicator[] = [];
    if (devisARelancer.length > 0) arr.push({ id: "h-follow", label: "Relances", value: `${devisARelancer.length} à faire`, tone: "rose" });
    arr.push({ id: "h-pipe", label: "Pipeline", value: formatCurrency(pipelineHT), tone: pendingCount > 0 ? "amber" : "slate" });
    arr.push({ id: "h-goal", label: remainingToGoal > 0 ? "Cap restant" : "Objectif", value: remainingToGoal > 0 ? formatCurrency(remainingToGoal) : "Atteint", tone: remainingToGoal > 0 ? "violet" : "emerald" });
    return arr.slice(0, 3);
  }, [devisARelancer.length, pendingCount, pipelineHT, remainingToGoal]);

  const actionPlan = useMemo<DashboardActionPlanItem[]>(() => {
    const items: DashboardActionPlanItem[] = [
      { id: "create", eyebrow: "Action", title: totalQuotes === 0 ? "Créer le premier devis" : "Nouveau devis", description: "Nourrissez votre pipeline.", href: "/nouveau-devis", icon: Plus, tone: "violet", ctaLabel: "Créer" },
    ];
    if (devisARelancer.length > 0) items.push({ id: "follow", eyebrow: "Urgent", title: relanceCountLabel, description: "Traitez-les en priorité.", href: "/devis", icon: Bell, tone: "rose", value: String(devisARelancer.length), ctaLabel: "Voir" });
    else if (pendingCount > 0) items.push({ id: "pipe", eyebrow: "À suivre", title: "Pipe chaud", description: `${pendingCount} devis en attente.`, href: "/devis", icon: Clock3, tone: "amber", value: formatCurrency(pipelineHT), ctaLabel: "Ouvrir" });
    if (tresorerie && tresorerie.enRetard > 0) items.push({ id: "overdue", eyebrow: "Priorité", title: `${formatCurrency(tresorerie.enRetard)} en retard`, description: "Relancez les impayés.", href: "/factures", icon: TriangleAlert, tone: "rose", value: formatCurrency(tresorerie.enRetard), ctaLabel: "Voir" });
    if (!isPro) items.push({ id: "pro", eyebrow: "Croissance", title: "Passer en PRO", description: "Levez les limites d'essai.", href: "/abonnement", icon: Sparkles, tone: "violet", ctaLabel: "Voir" });
    return items;
  }, [totalQuotes, devisARelancer.length, pendingCount, pipelineHT, isPro, relanceCountLabel, tresorerie]);

  const quickLinks: QuickLinkItem[] = [
    { href: "/clients", label: "Clients", description: "Contacts et historique.", icon: Users, tone: "violet" },
    { href: "/factures", label: "Factures", description: "Suivi des paiements.", icon: FileCheck2, tone: "slate" },
    { href: "/catalogue", label: "Catalogue", description: "Prestations réutilisables.", icon: Package, tone: "amber" },
    { href: "/parametres", label: "Paramètres", description: "Identité et réglages.", icon: Settings, tone: "slate" },
  ];

  // --- Tour steps --------------------------------------------------

  const tourSteps: Step[] = [
    { target: ".tour-nouveau-devis", title: "Bienvenue sur Zolio 👋", content: "Votre cockpit d'activité. Créez un devis en un clic ici.", disableBeacon: true, placement: "bottom-start" as const },
    { target: ".tour-dashboard", title: "Votre tableau de bord", content: "Suivez votre chiffre d'affaires, vos relances et votre pipeline en un coup d'œil.", placement: "bottom" as const },
  ];

  // --- Render ------------------------------------------------------

  return (
    <div className="tour-dashboard client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white" data-testid="dashboard-page">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {runTour && <Joyride steps={tourSteps} run={runTour} continuous showSkipButton showProgress callback={handleTourCallback} styles={{ options: { primaryColor: "#7c3aed", zIndex: 1000 } }} locale={{ back: "Précédent", close: "Fermer", last: "Terminer", next: "Suivant", skip: "Passer" }} />}

      <PullToRefresh onRefresh={async () => { await mutateDashboard(); }}>
        <div className="flex min-h-screen w-full flex-col px-4 pb-28 pt-4 sm:px-6 lg:ml-[276px] lg:max-w-[calc(100%-276px)] lg:px-4 lg:pb-10">
        {/* --- Header ---------------------------------------------- */}
        <header className="client-panel sticky top-3 z-40 rounded-2xl px-4 py-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <ClientBrandMark showLabel={false} className="lg:hidden" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/parametres" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white" aria-label="Paramètres">
                <Settings size={20} />
              </Link>
              {canAccessAdmin && (
                <Link href="/admin" className="hidden md:inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100">
                  <ShieldCheck size={17} /> Admin
                </Link>
              )}
              <DashboardNotificationsMenu dashboardSignals={signals} />
              {clerkUser?.imageUrl ? (
                <Image
                  src={clerkUser?.imageUrl}
                  alt="Avatar"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          </div>
        </header>

        <ClientDesktopNav active="dashboard" />

        <main className="mt-4 flex-1 lg:mt-6">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
            <div className="min-w-0 space-y-6">
              <motion.section {...sectionMotion(0)} className="client-panel rounded-3xl px-6 py-4 xl:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                      Cockpit bureau
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Vue d’ensemble du workspace, actions prioritaires et performance du moment.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canAccessAdmin && (
                      <Link href="/admin" className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100">
                        <ShieldCheck size={15} /> Admin
                      </Link>
                    )}
                    <ThemeToggle />
                    <Link href="/parametres" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white" aria-label="Paramètres">
                      <Settings size={16} />
                    </Link>
                    <DashboardNotificationsMenu dashboardSignals={signals} />
                    {clerkUser?.imageUrl ? (
                      <Image
                        src={clerkUser?.imageUrl}
                        alt="Avatar"
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-white/40 dark:ring-white/10"
                      />
                    ) : (
                      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>
                </div>
              </motion.section>

              {setupRequired && selectedTradeDef && (
                <motion.section id="dashboard-setup-panel-desktop" {...sectionMotion(0.02)} className="client-panel rounded-3xl p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Starter métier</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Préparez votre cockpit avant de produire</h2>
                    </div>
                    <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40">{starterCatalogCount} en base</span>
                  </div>
                  <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {TRADE_OPTIONS.map((opt) => (
                        <TradeOptionCard key={opt.key} option={opt} active={selectedTrade === opt.key} onSelect={setSelectedTrade} />
                      ))}
                    </div>
                    <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/8 dark:bg-white/4">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedTradeDef.label}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {selectedTradeDef.pitch} {selectedStarterCount} prestations seront injectées pour structurer vos devis plus vite.
                      </p>
                      <div className="mt-5 grid gap-3">
                        <button type="button" onClick={handleBootstrap} disabled={isBootstrapping} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                          {isBootstrapping ? "Préparation..." : "Activer mon starter"}
                        </button>
                        <Link href="/parametres" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                          Finaliser mes paramètres
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              <motion.section {...sectionMotion(0.04)} className="client-panel-strong relative overflow-hidden rounded-3xl px-6 py-6 xl:px-8 xl:py-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_68%)]" />
                <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                        <GreetingIcon size={14} /> {todayLabel}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                        <BriefcaseBusiness size={13} /> {starterTrade?.shortLabel || "Métier"}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                        <Clock3 size={13} /> Réponse moyenne {avgResponseDays} j
                      </div>
                    </div>

                    <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white xl:text-5xl">
                      {greetingText}{clerkUser?.firstName || initialUser.firstName ? `, ${(clerkUser?.firstName || initialUser.firstName)}` : ""}.
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                      Pilotez votre activité sans friction : visualisez les priorités, le pipeline commercial et les prochaines entrées d’argent avant même d’ouvrir un module.
                    </p>

                    <div className="mt-5 max-w-2xl">
                      <GlobalSearch className="mt-0 max-w-none" />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href="/nouveau-devis" className="tour-nouveau-devis">
                        <motion.div whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-brand">
                          <Plus size={17} /> Nouveau devis
                        </motion.div>
                      </Link>
                      <Link href="/devis" className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                        <FileText size={17} /> Ouvrir le pipe
                      </Link>
                      <ShortcutsModal />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-white/70 bg-white/82 p-5 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-slate-950/50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Objectif mensuel</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">CA TTC du mois en cours</p>
                        </div>
                        <button type="button" onClick={() => { setObjectifDraft(objectifActif.toString()); setObjectifDialogOpen(true); }} className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                          <Pencil size={14} /> Ajuster
                        </button>
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">sur {formatCurrency(objectifActif)} visés ce mois-ci</p>
                        </div>
                        <div className="rounded-2xl border border-violet-200/70 bg-violet-500/10 px-4 py-3 text-right dark:border-violet-400/20">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-violet-500 dark:text-violet-300">Progression</p>
                          <p className="mt-1 text-2xl font-semibold text-violet-700 dark:text-violet-100">{objectifProgress.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="mt-5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                        <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700" style={{ width: `${objectifProgress}%` }} />
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {heroIndicators.map((indicator) => (
                          <HeroIndicatorPill key={indicator.id} indicator={indicator} />
                        ))}
                      </div>
                    </div>

                    <FocusSignalCard signal={todayFocus} />
                  </div>
                </div>
              </motion.section>

              <motion.section {...sectionMotion(0.06)} className="grid gap-4 xl:grid-cols-4">
                <CompactMetricCard label="CA validé" value={formatCurrency(acceptedRevenueHT)} detail={`${acceptedCount} acceptés`} tone="emerald" icon={TrendingUp} />
                <CompactMetricCard label="Pipeline" value={formatCurrency(pipelineHT)} detail={`${pendingCount} en attente`} tone="amber" icon={Clock3} />
                <CompactMetricCard label="Relances" value={String(devisARelancer.length)} detail="Dossiers à réveiller" tone="rose" icon={Bell} />
                <CompactMetricCard label="Ticket moyen" value={formatCurrency(averageTicket)} detail={`${conversionRate}% de conversion`} tone="violet" icon={LineChart} />
              </motion.section>

              <motion.section {...sectionMotion(0.08)} className="client-panel rounded-3xl p-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Pilotage commercial</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Vision activité + conversion</h2>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                    {totalQuotes} devis cumulés
                  </span>
                </div>
                <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/76 p-4 dark:border-white/8 dark:bg-white/4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">Courbe de CA</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Évolution sur les 6 derniers mois</p>
                      </div>
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200">
                        {formatCurrency(acceptedRevenueHT)} validés
                      </span>
                    </div>
                    <div className="mt-4 h-[360px] overflow-hidden rounded-3xl border border-slate-200/70 bg-white/82 px-2 py-4 dark:border-white/8 dark:bg-slate-950/40">
                      <DashboardChart monthlyData={monthlyData} />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {semaine && (
                      <div className="rounded-3xl border border-slate-200/70 bg-white/76 p-4 dark:border-white/8 dark:bg-white/4">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Semaine</p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Cadence terrain</h3>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <div className="rounded-3xl bg-violet-50/80 p-4 dark:bg-violet-500/10">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-violet-500">Devis créés</p>
                            <p className="mt-2 text-2xl font-semibold text-violet-700 dark:text-violet-200">{semaine.nouveauxDevis}</p>
                            <p className="mt-1 text-sm text-violet-600/80 dark:text-violet-300">{semaine.devisAcceptes} acceptés</p>
                          </div>
                          <div className="rounded-3xl bg-emerald-50/80 p-4 dark:bg-emerald-500/10">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-500">Factures</p>
                            <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-200">{semaine.facturesEmises}</p>
                            <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-300">{semaine.facturesPayees} payées</p>
                          </div>
                          <div className="rounded-3xl bg-amber-50/80 p-4 dark:bg-amber-500/10">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-500">Encaissement</p>
                            <p className="mt-2 text-2xl font-semibold text-amber-700 dark:text-amber-200">{formatCurrency(semaine.caEncaisse)}</p>
                            <p className="mt-1 text-sm text-amber-600/80 dark:text-amber-300">{formatCurrency(semaine.depensesSemaine)} de dépenses</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {funnel && funnel.length > 0 ? (
                      <div className="rounded-3xl border border-slate-200/70 bg-white/76 p-4 dark:border-white/8 dark:bg-white/4">
                        <div className="mb-3 flex items-center gap-2">
                          <Target size={18} className="text-violet-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Funnel</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Devis → facturation → paiement</p>
                          </div>
                        </div>
                        <ConversionFunnel funnel={funnel} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <motion.section {...sectionMotion(0.1)} className="client-panel rounded-3xl p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Affaires récentes</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Derniers devis</h2>
                    </div>
                    <Link href="/devis" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-200">Voir tous <ChevronRight size={16} /></Link>
                  </div>
                  <div className="mt-4">
                    <DashboardRecentQuotes items={devisRecents} onSelectDevis={setSelectedDevisNumero} />
                  </div>
                </motion.section>

                <motion.section {...sectionMotion(0.12)} className="client-panel rounded-3xl p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top clients</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Ceux qui pèsent le plus</h2>
                    </div>
                  </div>
                  <div className="mt-4">
                    <DashboardTopClients items={topClients} />
                  </div>
                </motion.section>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <motion.section {...sectionMotion(0.14)} className="client-panel rounded-3xl p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Trésorerie</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">État des factures</h2>
                    </div>
                    {tresorerie && <span className={`client-chip ring-1 ${tresorerie.tauxRecouvrement >= 80 ? "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40" : tresorerie.tauxRecouvrement >= 50 ? "bg-amber-500/12 text-amber-700 ring-amber-300/40" : "bg-rose-500/12 text-rose-700 ring-rose-300/40"}`}>{tresorerie.tauxRecouvrement}% rec.</span>}
                  </div>
                  <div className="mt-4">{tresorerie ? <DashboardTresorerie data={tresorerie} /> : <p className="text-sm text-slate-500">Chargement…</p>}</div>
                </motion.section>

                <motion.section {...sectionMotion(0.16)} className="client-panel rounded-3xl p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Bénéfice net</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Votre résultat</h2>
                    </div>
                    {benefice && <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${benefice.margePct >= 70 ? "bg-emerald-500/12 text-emerald-700" : benefice.margePct >= 40 ? "bg-amber-500/12 text-amber-700" : "bg-rose-500/12 text-rose-700"}`}>{benefice.margePct}% marge</span>}
                  </div>
                  <div className="mt-4">{benefice ? <DashboardBenefice data={benefice} /> : <p className="text-sm text-slate-500">Chargement…</p>}</div>
                </motion.section>
              </div>
            </div>

            <aside className="space-y-6 self-start lg:sticky lg:top-6">
              <motion.section {...sectionMotion(0.08)} className="client-panel rounded-3xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Priorités</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">À faire maintenant</h2>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">{actionPlan.length}</span>
                </div>
                <div className="mt-4 grid gap-3">
                  {actionPlan.map((item) => <DashboardActionCard key={item.id} item={item} />)}
                </div>
              </motion.section>

              <motion.section {...sectionMotion(0.1)} className="client-panel rounded-3xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Relances</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Dossiers chauds</h2>
                  </div>
                  <span className="client-chip bg-rose-500/12 text-rose-700 ring-rose-300/40">{devisARelancer.length}</span>
                </div>
                <div className="mt-4">
                  <DesktopPriorityQuotes items={devisARelancer} onSelectDevis={setSelectedDevisNumero} />
                </div>
              </motion.section>

              <motion.section {...sectionMotion(0.12)} className="client-panel rounded-3xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Encaissements</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Paiements proches</h2>
                  </div>
                  <span className="client-chip bg-amber-500/12 text-amber-700 ring-amber-300/40">{echeances.length}</span>
                </div>
                <div className="mt-4">
                  <DesktopPaymentStack items={echeances} />
                </div>
              </motion.section>

              <motion.section {...sectionMotion(0.14)} className="client-panel rounded-3xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Modules</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Accès rapides</h2>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {quickLinks.map((item) => <QuickLinkCard key={item.href} item={item} />)}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <ClientSupportButton />
                  {canAccessAdmin && <Link href="/admin" className="flex items-center justify-center gap-2 rounded-2xl border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-100"><ShieldCheck size={16} /> Admin</Link>}
                </div>
              </motion.section>
            </aside>
          </div>

          <div className="space-y-4 lg:hidden">
          {/* --- Hero ------------------------------------------ */}
          <motion.section {...sectionMotion(0)} className="client-panel-strong relative overflow-hidden rounded-2xl px-4 py-5 sm:px-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_70%)]" />
                <div className="relative space-y-4">
                  <div className="hidden flex-wrap items-center gap-2 sm:flex">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                      <GreetingIcon size={14} /> {todayLabel}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                      <BriefcaseBusiness size={13} /> {starterTrade?.shortLabel || "Métier"}
                    </div>
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
                    {greetingText}{clerkUser?.firstName || initialUser.firstName ? `, ${(clerkUser?.firstName || initialUser.firstName)}` : ""}.
                  </h1>

                  <FocusSignalCard signal={todayFocus} />

                  <div className="flex flex-wrap gap-2">
                    <Link href="/nouveau-devis" className="tour-nouveau-devis">
                      <motion.div whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-brand">
                        <Plus size={17} /> Nouveau devis
                      </motion.div>
                    </Link>
                    <Link href="/devis" className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                      <FileText size={17} /> Mes devis
                    </Link>
                  </div>

                  <div className="hidden gap-2 sm:grid sm:grid-cols-3">
                    {heroIndicators.map(ind => <HeroIndicatorPill key={ind.id} indicator={ind} />)}
                  </div>
                </div>
              </motion.section>

              {/* --- KPI ------------------------------------------- */}
              <motion.section {...sectionMotion(0.04)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">Chiffres clés</h2>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">{totalQuotes} devis</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CompactMetricCard label="CA validé" value={formatCurrency(acceptedRevenueHT)} detail={`${acceptedCount} acceptés`} tone="emerald" icon={TrendingUp} />
                  <CompactMetricCard label="Pipeline" value={formatCurrency(pipelineHT)} detail={`${pendingCount} en attente`} tone="amber" icon={Clock3} />
                  <div className="hidden sm:block"><CompactMetricCard label="Relances" value={String(devisARelancer.length)} detail="À surveiller" tone="rose" icon={Bell} /></div>
                  <div className="hidden sm:block"><CompactMetricCard label="Ticket moyen" value={formatCurrency(averageTicket)} detail={`${conversionRate}% conv.`} tone="violet" icon={LineChart} /></div>
                </div>
              </motion.section>

              {/* --- Pilotage + Funnel (desktop 2-col) ------------ */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-[1fr_auto]`}>
                <div className="space-y-4">
                  {/* Objectif mensuel */}
                  <motion.section {...sectionMotion(0.06)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Objectif</p>
                        <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Pilotage mensuel</h2>
                      </div>
                      <span className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-950 dark:border-white/8 dark:bg-white/4 dark:text-white">{objectifProgress.toFixed(0)}%</span>
                    </div>

                    {semaine && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl bg-violet-50 px-3 py-2.5 text-center dark:bg-violet-500/10">
                          <p className="text-[10px] uppercase tracking-wider text-violet-500">Devis</p>
                          <p className="mt-1 text-lg font-black text-violet-700 dark:text-violet-300">{semaine.nouveauxDevis}</p>
                          <p className="text-[10px] text-violet-400">{semaine.devisAcceptes} accepté{semaine.devisAcceptes !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center dark:bg-emerald-500/10">
                          <p className="text-[10px] uppercase tracking-wider text-emerald-500">Factures</p>
                          <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">{semaine.facturesEmises}</p>
                          <p className="text-[10px] text-emerald-400">{semaine.facturesPayees} payée{semaine.facturesPayees !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center dark:bg-amber-500/10">
                          <p className="text-[10px] uppercase tracking-wider text-amber-500">Encaissé</p>
                          <p className="mt-1 text-lg font-black text-amber-700 dark:text-amber-300">{formatCurrency(semaine.caEncaisse)}</p>
                          <p className="text-[10px] text-amber-400">{formatCurrency(semaine.depensesSemaine)} dép.</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 dark:border-white/8 dark:bg-white/4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Cap restant</p>
                        <p className="mt-2 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(remainingToGoal)}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 dark:border-white/8 dark:bg-white/4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total TTC</p>
                        <p className="mt-2 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                      </div>
                      <div className="col-span-2 rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 sm:col-span-1 dark:border-white/8 dark:bg-white/4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Objectif</p>
                        <p className="mt-2 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">{formatCurrency(objectifActif)}</p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                      <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700" style={{ width: `${objectifProgress}%` }} />
                    </div>

                    <button type="button" onClick={() => { setObjectifDraft(objectifActif.toString()); setObjectifDialogOpen(true); }} className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                      <Pencil size={14} /> Ajuster l&apos;objectif
                    </button>

                    <div className="mt-4 h-56 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/75 px-2 py-4 sm:h-64 lg:h-80 dark:border-white/8 dark:bg-white/4">
                      <DashboardChart monthlyData={monthlyData} />
                    </div>
                  </motion.section>

                  {/* Derniers devis */}
                  <motion.section {...sectionMotion(0.08)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Derniers devis</p>
                        <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Affaires récentes</h2>
                      </div>
                      <Link href="/devis" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-200">Voir tous <ChevronRight size={16} /></Link>
                    </div>
                    <div className="mt-3">
                      {devisRecents.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-8 text-center dark:border-white/10 dark:bg-white/4">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Le cockpit attend votre premier devis</p>
                            <Link href="/nouveau-devis" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white">
                              <Plus size={16} /> Créer mon premier devis
                            </Link>
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {devisRecents.slice(0, 4).map(item => (
                              <Link href={`/devis/${item.numero}`} key={item.numero} onClick={(e) => {
                                // Only intercept on large screens
                                if (window.innerWidth >= 1024) {
                                  e.preventDefault();
                                  setSelectedDevisNumero(item.numero);
                                }
                              }}>
                                <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                                      <p className="mt-1 text-sm text-slate-500">{item.numero} · {formatDateLabel(item.date)}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(item.totalTTC || 0)}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                    </div>
                  </motion.section>
                </div>

                {/* Funnel (desktop sidebar) */}
                {funnel && funnel.length > 0 && (
                  <div className="hidden lg:block">
                    <div className="client-panel rounded-2xl p-5 sticky top-24">
                      <div className="mb-2 flex items-center gap-2">
                        <Target size={18} className="text-violet-500" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Funnel</h3>
                      </div>
                      <ConversionFunnel funnel={funnel} />
                    </div>
                  </div>
                )}
              </div>

              {/* --- Financials grid -------------------------------- */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-2`}>
                {/* Trésorerie */}
                <motion.section {...sectionMotion(0.10)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Trésorerie</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">État des factures</h2>
                    </div>
                    {tresorerie && <span className={`client-chip ring-1 ${tresorerie.tauxRecouvrement >= 80 ? "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40" : tresorerie.tauxRecouvrement >= 50 ? "bg-amber-500/12 text-amber-700 ring-amber-300/40" : "bg-rose-500/12 text-rose-700 ring-rose-300/40"}`}>{tresorerie.tauxRecouvrement}% rec.</span>}
                  </div>
                  <div className="mt-3">{tresorerie ? <DashboardTresorerie data={tresorerie} /> : <p className="text-sm text-slate-500">Chargement…</p>}</div>
                </motion.section>

                {/* Bénéfice */}
                <motion.section {...sectionMotion(0.12)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Bénéfice net</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Votre résultat</h2>
                    </div>
                    {benefice && <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${benefice.margePct >= 70 ? "bg-emerald-500/12 text-emerald-700" : benefice.margePct >= 40 ? "bg-amber-500/12 text-amber-700" : "bg-rose-500/12 text-rose-700"}`}>{benefice.margePct}% marge</span>}
                  </div>
                  <div className="mt-3">{benefice ? <DashboardBenefice data={benefice} /> : <p className="text-sm text-slate-500">Chargement…</p>}</div>
                </motion.section>
              </div>

              {/* --- Actions + Relances + Échéances grid ----------- */}
              <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {/* Actions — desktop only or expanded mobile */}
                <motion.section {...sectionMotion(0.14)} className={`${showMoreMobile ? "block" : "hidden sm:block"} client-panel rounded-2xl p-4 sm:p-5 xl:p-4`}>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Actions</p>
                    <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">{actionPlan.length}</span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {actionPlan.map(item => <DashboardActionCard key={item.id} item={item} compact />)}
                  </div>
                </motion.section>

                {/* Relances */}
                <motion.section {...sectionMotion(0.16)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">À traiter</h2>
                    <span className="client-chip bg-rose-500/12 text-rose-700 ring-rose-300/40">{devisARelancer.length}</span>
                  </div>
                  <div className="mt-3"><DashboardFollowUps items={devisARelancer} onSelectDevis={setSelectedDevisNumero} /></div>
                </motion.section>

                {/* Échéances */}
                <motion.section {...sectionMotion(0.18)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">Prochains paiements</h2>
                    <span className="client-chip bg-amber-500/12 text-amber-700 ring-amber-300/40">{echeances.length}</span>
                  </div>
                  <div className="mt-3"><DashboardEcheances items={echeances} /></div>
                </motion.section>
              </div>

              {/* --- Bouton Voir plus (mobile only) ----------------- */}
              <button
                type="button"
                onClick={() => setShowMoreMobile(!showMoreMobile)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 sm:hidden"
                data-testid="mobile-show-more-btn"
              >
                {showMoreMobile ? "Voir moins" : "Voir plus de détails"}
                <ChevronDown size={16} className={`transition-transform duration-300 ${showMoreMobile ? "rotate-180" : ""}`} />
              </button>

              {/* --- Top Clients + Quick Links -------------------- */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-2`}>
                <motion.section {...sectionMotion(0.20)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top Clients</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Meilleurs clients</h2>
                    </div>
                  </div>
                  <div className="mt-3"><DashboardTopClients items={topClients} /></div>
                </motion.section>

                <motion.section {...sectionMotion(0.22)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Modules</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Accès rapides</h2>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {quickLinks.map(item => <QuickLinkCard key={item.href} item={item} />)}
                  </div>
                  <div className="mt-4 space-y-2">
                    <ClientSupportButton />
                    {canAccessAdmin && <Link href="/admin" className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-100"><ShieldCheck size={16} /> Admin</Link>}
                  </div>
                </motion.section>
              </div>

              {/* --- Starter métier (setup only) ------------------- */}
              {setupRequired && selectedTradeDef && (
                <motion.section id="dashboard-setup-panel" {...sectionMotion(0.24)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Starter métier</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Préparez votre activité</h2>
                    </div>
                    <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40">{starterCatalogCount} en base</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {TRADE_OPTIONS.map(opt => <TradeOptionCard key={opt.key} option={opt} active={selectedTrade === opt.key} onSelect={setSelectedTrade} />)}
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedTradeDef.label}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedTradeDef.pitch} {selectedStarterCount} prestations seront injectées.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={handleBootstrap} disabled={isBootstrapping} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                        {isBootstrapping ? "Préparation..." : "Activer mon starter"}
                      </button>
                      <Link href="/parametres" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                        Finaliser mes paramètres
                      </Link>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* --- Funnel mobile -------------------------------- */}
              {funnel && funnel.length > 0 && (
                <motion.section {...sectionMotion(0.26)} className="client-panel rounded-2xl p-4 sm:p-5 xl:p-4 lg:hidden">
                  <div className="mb-2 flex items-center gap-2">
                    <Target size={18} className="text-violet-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Funnel</h3>
                  </div>
                  <ConversionFunnel funnel={funnel} />
                </motion.section>
              )}
          </div>
        </main>
      </div>
      </PullToRefresh>

      {/* --- Objectif Dialog --------------------------------------- */}
      <MobileDialog open={objectifDialogOpen} onClose={() => setObjectifDialogOpen(false)} title="Objectif mensuel">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Définissez votre cap de CA mensuel pour suivre votre progression.</p>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Montant (€)</span>
            <input type="number" inputMode="decimal" min="1" step="100" value={objectifDraft} onChange={e => setObjectifDraft(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white" placeholder="5000" />
          </label>
          <button type="button" onClick={handleUpdateObjectif} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white">Enregistrer</button>
        </div>
      </MobileDialog>

      {/* --- Desktop Drawer --------------------------------------- */}
      <DesktopDrawer open={!!selectedDevisNumero} onClose={() => setSelectedDevisNumero(null)}>
        {selectedDevisNumero && (
          <DevisEditor
            numero={selectedDevisNumero}
            isDrawer
            onClose={() => setSelectedDevisNumero(null)}
          />
        )}
      </DesktopDrawer>

      {/* --- Mobile Dock --------------------------------------- */}
      <ClientMobileDock active="dashboard" />

    </div>
  );
}