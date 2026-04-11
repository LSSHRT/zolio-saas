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
import { ChartSkeleton } from "@/components/Skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
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
  DashboardFollowUps,
  DashboardEcheances,
  DashboardTopClients,
  type QuoteListItem,
} from "@/components/dashboard/lists";
import type { ClientDashboardSummary, ClientDashboardMonthlyDatum } from "@/lib/client-dashboard";
import {
  DEFAULT_TRADE,
  TRADE_OPTIONS,
  getStarterCatalogForTrade,
  getTradeDefinition,
  type TradeDefinition,
  type TradeKey,
} from "@/lib/trades";

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

// ─── Inline helpers (page-specific) ──────────────────────────────────

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
      className={`rounded-[1.45rem] border px-4 py-4 text-left transition ${
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

// ─── Main Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { data: dashboardData, isLoading, mutate: mutateDashboard } = useSWR<ClientDashboardSummary>(
    "/api/dashboard/summary",
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, keepPreviousData: true, dedupingInterval: 30000, refreshInterval: 0 },
  );

  const loading = isLoading && !dashboardData;
  const canAccessAdmin = user?.publicMetadata?.isAdmin === true;
  const isPro = user?.publicMetadata?.isPro === true;
  const companyTrade = readStringMetadata(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const catalogImported = readBooleanMetadata(user?.unsafeMetadata?.starterCatalogImported || user?.publicMetadata?.starterCatalogImported);
  const onboardingDone = readBooleanMetadata(user?.unsafeMetadata?.onboardingCompleted || user?.publicMetadata?.onboardingCompleted);
  const starterCatalogCount = dashboardData?.starterCatalogCount ?? 0;
  const starterTrade = getTradeDefinition(companyTrade) ?? getTradeDefinition(DEFAULT_TRADE);

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
  const setupRequired = isLoaded && (!companyTrade || !catalogImported || !onboardingDone || starterCatalogCount === 0);

  const objectifMensuel = Number(user?.unsafeMetadata?.objectifMensuel);
  const objectifInitial = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : 5000;
  const [objectif, setObjectif] = useState(objectifInitial);
  const objectifActif = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : objectif;

  useEffect(() => { setObjectifDraft(objectifActif.toString()); }, [objectifActif]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleBootstrap = async () => {
    if (!user || !selectedTradeDef) return;
    setIsBootstrapping(true);
    try {
      const res = await fetch("/api/onboarding/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trade: selectedTradeDef.key }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Erreur");
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, companyTrade: selectedTradeDef.key, onboardingCompleted: true, starterCatalogImported: true } });
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
      if (user) await user.update({ unsafeMetadata: { ...user.unsafeMetadata, objectifMensuel: parsed } });
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

  // ─── Computed data ───────────────────────────────────────────────

  const d = dashboardData;
  const totalQuotes = d?.totalQuotes ?? 0;
  const CA_TTC = d?.totalTTC ?? 0;
  const acceptedCount = d?.acceptedCount ?? 0;
  const pendingCount = d?.pendingCount ?? 0;
  const acceptedRevenueHT = d?.acceptedRevenueHT ?? 0;
  const pipelineHT = d?.pipelineRevenueHT ?? 0;
  const conversionRate = d?.conversionRate ?? 0;
  const averageTicket = d?.averageTicket ?? 0;
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

  let greetingText = "Bonjour";
  let GreetingIcon = CloudSun;
  if (currentHour >= 18) { greetingText = "Bonsoir"; GreetingIcon = MoonStar; }
  else if (currentHour >= 12) { greetingText = "Bon après-midi"; GreetingIcon = SunMedium; }

  const todayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  // ─── Signals ──────────────────────────────────────────────────────

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
    if (devisARelancer.length > 0) return { id: "f-follow", title: `${devisARelancer.length} relance(s) à faire`, description: "Traitez-les en priorité.", href: "/devis", tone: "rose" as Tone };
    if (pendingCount > 0) return { id: "f-pipe", title: "Pipeline chaud", description: `${formatCurrency(pipelineHT)} HT en attente.`, href: "/devis", tone: "amber" as Tone };
    return { id: "f-steady", title: "Cockpit sous contrôle", description: "Concentrez-vous sur le prochain devis.", tone: "emerald" as Tone };
  }, [totalQuotes, devisARelancer.length, pendingCount, pipelineHT, setupRequired]);

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
    if (devisARelancer.length > 0) items.push({ id: "follow", eyebrow: "Urgent", title: `${devisARelancer.length} relance(s)`, description: "Traitez-les en priorité.", href: "/devis", icon: Bell, tone: "rose", value: String(devisARelancer.length), ctaLabel: "Voir" });
    else if (pendingCount > 0) items.push({ id: "pipe", eyebrow: "À suivre", title: "Pipe chaud", description: `${pendingCount} devis en attente.`, href: "/devis", icon: Clock3, tone: "amber", value: formatCurrency(pipelineHT), ctaLabel: "Ouvrir" });
    if (tresorerie && tresorerie.enRetard > 0) items.push({ id: "overdue", eyebrow: "Priorité", title: `${formatCurrency(tresorerie.enRetard)} en retard`, description: "Relancez les impayés.", href: "/factures", icon: TriangleAlert, tone: "rose", value: formatCurrency(tresorerie.enRetard), ctaLabel: "Voir" });
    if (!isPro) items.push({ id: "pro", eyebrow: "Croissance", title: "Passer en PRO", description: "Levez les limites d'essai.", href: "/abonnement", icon: Sparkles, tone: "violet", ctaLabel: "Voir" });
    return items;
  }, [totalQuotes, devisARelancer.length, pendingCount, pipelineHT, isPro, tresorerie]);

  const quickLinks: QuickLinkItem[] = [
    { href: "/clients", label: "Clients", description: "Contacts et historique.", icon: Users, tone: "violet" },
    { href: "/factures", label: "Factures", description: "Suivi des paiements.", icon: FileCheck2, tone: "slate" },
    { href: "/catalogue", label: "Catalogue", description: "Prestations réutilisables.", icon: Package, tone: "amber" },
    { href: "/parametres", label: "Paramètres", description: "Identité et réglages.", icon: Settings, tone: "slate" },
  ];

  // ─── Tour steps ──────────────────────────────────────────────────

  const tourSteps: Step[] = [
    { target: ".tour-nouveau-devis", title: "Bienvenue sur Zolio 👋", content: "Votre cockpit d'activité. Créez un devis en un clic ici.", disableBeacon: true, placement: "bottom-start" as const },
    { target: ".tour-dashboard", title: "Votre tableau de bord", content: "Suivez votre chiffre d'affaires, vos relances et votre pipeline en un coup d'œil.", placement: "bottom" as const },
  ];

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="tour-dashboard client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white" data-testid="dashboard-page">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {runTour && <Joyride steps={tourSteps} run={runTour} continuous showSkipButton showProgress callback={handleTourCallback} styles={{ options: { primaryColor: "#7c3aed", zIndex: 1000 } }} locale={{ back: "Précédent", close: "Fermer", last: "Terminer", next: "Suivant", skip: "Passer" }} />}

      <PullToRefresh onRefresh={async () => { await mutateDashboard(); }}>
        <div className="flex min-h-screen w-full flex-col px-4 pb-28 pt-4 sm:px-6 lg:ml-[276px] lg:max-w-[calc(100%-276px)] lg:px-4 lg:pb-10">
        {/* ─── Header ────────────────────────────────────────────── */}
        <header className="client-panel sticky top-3 z-40 rounded-[2rem] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <ClientBrandMark showLabel={false} className="lg:hidden" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/parametres" className="inline-flex h-11 w-11 lg:h-9 lg:w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white" aria-label="Paramètres">
                <Settings size={20} className="lg:w-4 lg:h-4" />
              </Link>
              {canAccessAdmin && (
                <Link href="/admin" className="hidden md:inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 lg:px-3 lg:py-1.5 text-sm lg:text-xs font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100">
                  <ShieldCheck size={17} className="lg:w-3.5 lg:h-3.5" /> Admin
                </Link>
              )}
              <DashboardNotificationsMenu dashboardSignals={signals} />
              {isLoaded && user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Avatar"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20 lg:h-7 lg:w-7"
                />
              ) : (
                <div className="h-8 w-8 lg:h-7 lg:w-7 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          </div>
        </header>

        <ClientDesktopNav active="dashboard" />

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          {!isLoaded ? (
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />)}
              </div>
            </div>
          ) : (
            <>
              {/* ─── Hero ────────────────────────────────────────── */}
              <motion.section {...sectionMotion(0)} className="client-panel-strong relative overflow-hidden rounded-[2rem] px-4 py-5 sm:px-6">
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
                    {greetingText}{user?.firstName ? `, ${user.firstName}` : ""}.
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

              {/* ─── KPI ─────────────────────────────────────────── */}
              <motion.section {...sectionMotion(0.04)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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

              {/* ─── Pilotage + Funnel (desktop 2-col) ──────────── */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-[1fr_auto]`}>
                <div className="space-y-4">
                  {/* Objectif mensuel */}
                  <motion.section {...sectionMotion(0.06)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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

                    <div className="mt-4 h-56 overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-2 py-4 sm:h-64 lg:h-80 dark:border-white/8 dark:bg-white/4">
                      {loading ? <ChartSkeleton /> : <DashboardChart monthlyData={monthlyData} />}
                    </div>
                  </motion.section>

                  {/* Derniers devis */}
                  <motion.section {...sectionMotion(0.08)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Derniers devis</p>
                        <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Affaires récentes</h2>
                      </div>
                      <Link href="/devis" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-200">Voir tous <ChevronRight size={16} /></Link>
                    </div>
                    <div className="mt-3">
                      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />)}</div> : (
                        devisRecents.length === 0 ? (
                          <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-8 text-center dark:border-white/10 dark:bg-white/4">
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
                                <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 p-4 transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
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
                        )
                      )}
                    </div>
                  </motion.section>
                </div>

                {/* Funnel (desktop sidebar) */}
                {funnel && funnel.length > 0 && (
                  <div className="hidden lg:block">
                    <div className="client-panel rounded-[2rem] p-5 sticky top-24">
                      <div className="mb-2 flex items-center gap-2">
                        <Target size={18} className="text-violet-500" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Funnel</h3>
                      </div>
                      <ConversionFunnel funnel={funnel} />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Financials grid ──────────────────────────────── */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-2`}>
                {/* Trésorerie */}
                <motion.section {...sectionMotion(0.10)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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
                <motion.section {...sectionMotion(0.12)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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

              {/* ─── Actions + Relances + Échéances grid ─────────── */}
              <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {/* Actions — desktop only or expanded mobile */}
                <motion.section {...sectionMotion(0.14)} className={`${showMoreMobile ? "block" : "hidden sm:block"} client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4`}>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Actions</p>
                    <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">{actionPlan.length}</span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {actionPlan.map(item => <DashboardActionCard key={item.id} item={item} compact />)}
                  </div>
                </motion.section>

                {/* Relances */}
                <motion.section {...sectionMotion(0.16)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">À traiter</h2>
                    <span className="client-chip bg-rose-500/12 text-rose-700 ring-rose-300/40">{devisARelancer.length}</span>
                  </div>
                  <div className="mt-3"><DashboardFollowUps items={devisARelancer} onSelectDevis={setSelectedDevisNumero} /></div>
                </motion.section>

                {/* Échéances */}
                <motion.section {...sectionMotion(0.18)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">Prochains paiements</h2>
                    <span className="client-chip bg-amber-500/12 text-amber-700 ring-amber-300/40">{echeances.length}</span>
                  </div>
                  <div className="mt-3"><DashboardEcheances items={echeances} /></div>
                </motion.section>
              </div>

              {/* ─── Bouton Voir plus (mobile only) ───────────────── */}
              <button
                type="button"
                onClick={() => setShowMoreMobile(!showMoreMobile)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 sm:hidden"
                data-testid="mobile-show-more-btn"
              >
                {showMoreMobile ? "Voir moins" : "Voir plus de détails"}
                <ChevronDown size={16} className={`transition-transform duration-300 ${showMoreMobile ? "rotate-180" : ""}`} />
              </button>

              {/* ─── Top Clients + Quick Links ──────────────────── */}
              <div className={`${showMoreMobile ? "grid" : "hidden sm:grid"} gap-4 lg:grid-cols-2`}>
                <motion.section {...sectionMotion(0.20)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Top Clients</p>
                      <h2 className="mt-1 text-lg xl:text-base font-semibold text-slate-950 dark:text-white">Meilleurs clients</h2>
                    </div>
                  </div>
                  <div className="mt-3"><DashboardTopClients items={topClients} /></div>
                </motion.section>

                <motion.section {...sectionMotion(0.22)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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
                    {canAccessAdmin && <Link href="/admin" className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-100"><ShieldCheck size={16} /> Admin</Link>}
                  </div>
                </motion.section>
              </div>

              {/* ─── Starter métier (setup only) ─────────────────── */}
              {setupRequired && selectedTradeDef && (
                <motion.section id="dashboard-setup-panel" {...sectionMotion(0.24)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4">
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
                      <button type="button" onClick={handleBootstrap} disabled={isBootstrapping} className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                        {isBootstrapping ? "Préparation..." : "Activer mon starter"}
                      </button>
                      <Link href="/parametres" className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100">
                        Finaliser mes paramètres
                      </Link>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ─── Funnel mobile ──────────────────────────────── */}
              {funnel && funnel.length > 0 && (
                <motion.section {...sectionMotion(0.26)} className="client-panel rounded-[2rem] p-4 sm:p-5 xl:p-4 lg:hidden">
                  <div className="mb-2 flex items-center gap-2">
                    <Target size={18} className="text-violet-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Funnel</h3>
                  </div>
                  <ConversionFunnel funnel={funnel} />
                </motion.section>
              )}
            </>
          )}
        </main>
      </div>
      </PullToRefresh>

      {/* ─── Objectif Dialog ─────────────────────────────────────── */}
      <MobileDialog open={objectifDialogOpen} onClose={() => setObjectifDialogOpen(false)} title="Objectif mensuel">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Définissez votre cap de CA mensuel pour suivre votre progression.</p>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Montant (€)</span>
            <input type="number" inputMode="decimal" min="1" step="100" value={objectifDraft} onChange={e => setObjectifDraft(e.target.value)} className="mt-2 w-full rounded-[1.25rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white" placeholder="5000" />
          </label>
          <button type="button" onClick={handleUpdateObjectif} className="inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white">Enregistrer</button>
        </div>
      </MobileDialog>

      {/* ─── Desktop Drawer ─────────────────────────────────────── */}
      <DesktopDrawer open={!!selectedDevisNumero} onClose={() => setSelectedDevisNumero(null)}>
        {selectedDevisNumero && (
          <DevisEditor
            numero={selectedDevisNumero}
            isDrawer
            onClose={() => setSelectedDevisNumero(null)}
          />
        )}
      </DesktopDrawer>

      {/* ─── Mobile Dock ─────────────────────────────────────── */}
      <ClientMobileDock active="dashboard" />

    </div>
  );
}
