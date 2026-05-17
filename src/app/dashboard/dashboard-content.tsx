"use client";


import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CloudSun,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  LineChart,
  MoonStar,
  Package,
  Pencil,
  Plus,
  Send,
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
import { useEffect, useMemo, useState, type ComponentType } from "react";

// Local minimal types — react-joyride uses `export = ReactJoyride` (CJS) which
// breaks named ESM imports under moduleResolution: bundler.
type JoyrideStep = {
  target: string;
  title?: string;
  content: string;
  disableBeacon?: boolean;
  placement?: string;
};
type JoyrideCallBackProps = { status: string };
type JoyrideProps = {
  steps: JoyrideStep[];
  run: boolean;
  continuous?: boolean;
  showSkipButton?: boolean;
  showProgress?: boolean;
  callback?: (data: JoyrideCallBackProps) => void;
  styles?: { options?: { primaryColor?: string; zIndex?: number } };
  locale?: { back?: string; close?: string; last?: string; next?: string; skip?: string };
};
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ClientBrandMark,
  ClientDesktopNav,
  ClientMobileDock,
  ClientSupportButton,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import { DesktopDrawer } from "@/components/desktop-drawer";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { PaywallModal } from "@/components/paywall-modal";
import { usePaywall } from "@/lib/use-paywall";
import { QuotaBanner } from "@/components/quota-banner";
import { TrialBanner } from "@/components/trial-banner";
import { OnboardingChecklist, type OnboardingStep } from "@/components/onboarding-checklist";

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
import { MetricTile } from "@/components/desktop";
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

const Joyride = dynamic(
  () => import("react-joyride").then((m) => {
    const mod = m as unknown as { default?: ComponentType<JoyrideProps> } & ComponentType<JoyrideProps>;
    return mod.default ?? mod;
  }),
  { ssr: false },
) as ComponentType<JoyrideProps>;
const DashboardChart = dynamic(() => import("@/components/DashboardChart"), { ssr: false });
const ConversionFunnel = dynamic(() => import("@/components/conversion-funnel"), { ssr: false });
const DevisEditor = dynamic(
  () => import("@/components/devis-editor").then((module) => module.DevisEditor),
  { ssr: false },
);

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
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: 5000,
      refreshInterval: 0,
    },
  );

  // Quota fetch — used by the paywall and the inline banner.
  const { data: quotaData } = useSWR<{ isPro: boolean; used: number; limit: number; remaining: number }>(
    "/api/quota",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 },
  );
  const { paywallProps, openPaywall } = usePaywall();

  const safeData = initialData ?? {
    companyTrade: null,
    catalogImported: false,
    onboardingDone: false,
    starterCatalogCount: 0,
    canAccessAdmin: false,
    isPro: false,
  };

  const canAccessAdmin = safeData.canAccessAdmin || clerkUser?.publicMetadata?.isAdmin === true;
  const isPro = safeData.isPro || clerkUser?.publicMetadata?.isPro === true;
  const trialEndsAt = (clerkUser?.publicMetadata?.trialEndsAt as string | undefined) ?? null;
  // Read from BOTH unsafeMetadata and publicMetadata — the bootstrap handler writes
  // to unsafeMetadata, while admin-set flags live in publicMetadata.
  const unsafeMeta = (clerkUser?.unsafeMetadata ?? {}) as Record<string, unknown>;
  const publicMeta = (clerkUser?.publicMetadata ?? {}) as Record<string, unknown>;
  const companyTrade = readStringMetadata(
    safeData.companyTrade
      || (unsafeMeta.companyTrade as string | undefined)
      || (publicMeta.companyTrade as string | undefined),
  );
  const catalogImported = safeData.catalogImported
    || readBooleanMetadata(unsafeMeta.starterCatalogImported as boolean | undefined)
    || readBooleanMetadata(publicMeta.starterCatalogImported as boolean | undefined);
  const onboardingDone = safeData.onboardingDone
    || readBooleanMetadata(unsafeMeta.onboardingCompleted as boolean | undefined)
    || readBooleanMetadata(publicMeta.onboardingCompleted as boolean | undefined);
  const starterCatalogCount = dashboardData?.starterCatalogCount ?? safeData.starterCatalogCount;
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

  const handleTourCallback = (data: JoyrideCallBackProps) => {
    if (data.status === "finished" || data.status === "skipped") {
      localStorage.setItem("zolio_has_seen_tour", "true");
      setRunTour(false);
    }
  };

  const closeDevisDrawer = () => {
    setSelectedDevisNumero(null);
    void mutateDashboard();
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

  // Onboarding checklist — drives the gamified panel.
  // We rely on existing data: trade selected, catalog imported, devis count,
  // accepted devis (= envoi/signature implicite réussi), profile (entreprise) filled.
  const hasCompanyName = Boolean(
    (clerkUser?.unsafeMetadata as Record<string, unknown> | undefined)?.companyName
      || (clerkUser?.publicMetadata as Record<string, unknown> | undefined)?.companyName,
  );
  const hasLogo = Boolean(
    (clerkUser?.unsafeMetadata as Record<string, unknown> | undefined)?.logoUrl
      || (clerkUser?.publicMetadata as Record<string, unknown> | undefined)?.logoUrl,
  );
  const onboardingSteps = useMemo<OnboardingStep[]>(() => [
    {
      id: "trade",
      title: "Choisir mon métier",
      description: "Active votre catalogue starter (peintre, plombier, électricien, etc.).",
      icon: BriefcaseBusiness,
      done: Boolean(companyTrade) && catalogImported,
      href: "/dashboard#dashboard-setup-panel-desktop",
    },
    {
      id: "first-devis",
      title: "Créer mon premier devis",
      description: "Lancez votre première proposition commerciale.",
      icon: FileText,
      done: totalQuotes > 0,
      href: "/nouveau-devis",
    },
    {
      id: "first-accepted",
      title: "Faire accepter / envoyer un devis",
      description: "Envoyez-le par lien public ou email pour signature.",
      icon: Send,
      done: acceptedCount > 0,
      href: "/devis",
    },
    {
      id: "company",
      title: "Compléter mon entreprise",
      description: "Nom, adresse, SIRET et coordonnées sur vos PDF.",
      icon: Building2,
      done: hasCompanyName,
      href: "/parametres",
    },
    {
      id: "logo",
      title: "Importer mon logo",
      description: "Pour des devis et factures qui marquent.",
      icon: ImageIcon,
      done: hasLogo,
      href: "/parametres",
    },
  ], [companyTrade, catalogImported, totalQuotes, acceptedCount, hasCompanyName, hasLogo]);

  const showOnboardingChecklist = !setupRequired || onboardingSteps.some((s) => s.done);

  const quickLinks: QuickLinkItem[] = [
    { href: "/clients", label: "Clients", description: "Contacts et historique.", icon: Users, tone: "violet" },
    { href: "/factures", label: "Factures", description: "Suivi des paiements.", icon: FileCheck2, tone: "slate" },
    { href: "/catalogue", label: "Catalogue", description: "Prestations réutilisables.", icon: Package, tone: "amber" },
    { href: "/parametres", label: "Paramètres", description: "Identité et réglages.", icon: Settings, tone: "slate" },
  ];

  // --- Tour steps --------------------------------------------------

  const tourSteps: JoyrideStep[] = [
    { target: ".tour-nouveau-devis", title: "Bienvenue sur Zolio 👋", content: "Votre cockpit d'activité. Créez un devis en un clic ici.", disableBeacon: true, placement: "bottom-start" as const },
    { target: ".tour-dashboard", title: "Votre tableau de bord", content: "Suivez votre chiffre d'affaires, vos relances et votre pipeline en un coup d'œil.", placement: "bottom" as const },
  ];

  // --- Render ------------------------------------------------------

  return (
    <div className="tour-dashboard client-workspace lg-v2-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white" data-testid="dashboard-page">
      <div className="client-grid-overlay pointer-events-none absolute inset-0 lg:hidden" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),rgba(251,146,60,0.06),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),rgba(251,146,60,0.08),transparent_60%)] lg:hidden" />

      {runTour && <Joyride steps={tourSteps} run={runTour} continuous showSkipButton showProgress callback={handleTourCallback} styles={{ options: { primaryColor: "#7c3aed", zIndex: 1000 } }} locale={{ back: "Précédent", close: "Fermer", last: "Terminer", next: "Suivant", skip: "Passer" }} />}

      <PullToRefresh onRefresh={async () => { await mutateDashboard(); }}>
        <div className="flex min-h-screen w-full flex-col px-4 pb-28 pt-4 sm:px-6 lg:ml-[240px] lg:max-w-[calc(100%-240px)] lg:px-8 xl:px-10 lg:pb-10">
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
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* DESKTOP — v2 dense (KPI strip + 2-col body)                   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:flex-col lg:gap-6">

            {/* ─── TOP BAR (v2 typography) ──────────────────────────── */}
            <header className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="lg-v2-eyebrow">Tableau de bord</p>
                  <span className="lg-v2-pill capitalize">
                    <GreetingIcon size={12} aria-hidden /> {todayLabel}
                  </span>
                  {starterTrade?.shortLabel && (
                    <span className="lg-v2-pill">
                      <BriefcaseBusiness size={12} aria-hidden /> {starterTrade.shortLabel}
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight lg-v2-text-strong">
                  {greetingText}{clerkUser?.firstName || initialUser.firstName ? `, ${clerkUser?.firstName || initialUser.firstName}` : ""}
                </h1>
                <p className="mt-1 text-sm lg-v2-text-muted">
                  <span className="font-medium lg-v2-text-strong">{todayFocus.title}</span>
                  {todayFocus.description ? <span className="ml-1.5">· {todayFocus.description}</span> : null}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                {canAccessAdmin && (
                  <Link href="/admin" className="lg-v2-btn lg-v2-btn-secondary">
                    <ShieldCheck size={14} aria-hidden /> Admin
                  </Link>
                )}
                <DashboardNotificationsMenu dashboardSignals={signals} />
              </div>
            </header>

            {/* ─── TRIAL / QUOTA BANNERS ────────────────────────────── */}
            {isPro && trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} />}
            {quotaData && !quotaData.isPro && Number.isFinite(quotaData.limit) && (
              <QuotaBanner
                used={quotaData.used}
                limit={quotaData.limit}
                onUpgradeClick={() => openPaywall("quota_80", { used: quotaData.used, limit: quotaData.limit })}
              />
            )}

            {/* ─── ONBOARDING CHECKLIST ─────────────────────────────── */}
            {showOnboardingChecklist && <OnboardingChecklist steps={onboardingSteps} />}

            {/* ─── KPI STRIP (4 MetricTile) ─────────────────────────── */}
            <section className="grid gap-4 lg:grid-cols-4">
              <MetricTile
                label="CA validé"
                value={formatCurrency(acceptedRevenueHT)}
                detail={`${acceptedCount} acceptés · ${conversionRate}% conv.`}
                icon={TrendingUp}
                tone="success"
              />
              <MetricTile
                label="Pipeline"
                value={formatCurrency(pipelineHT)}
                detail={`${pendingCount} en attente · ticket moy. ${formatCurrency(averageTicket)}`}
                icon={Clock3}
                tone="warning"
              />
              <MetricTile
                label="Objectif du mois"
                value={`${objectifProgress.toFixed(0)}%`}
                detail={`${formatCurrency(CA_TTC)} / ${formatCurrency(objectifActif)}`}
                icon={Target}
                tone={objectifProgress >= 80 ? "success" : objectifProgress >= 40 ? "warning" : "neutral"}
              />
              <MetricTile
                label="Recouvrement"
                value={tresorerie ? `${tresorerie.tauxRecouvrement}%` : "—"}
                detail={tresorerie ? `${formatCurrency(tresorerie.enRetard)} en retard` : "Chargement…"}
                icon={Sparkles}
                tone={
                  tresorerie
                    ? tresorerie.tauxRecouvrement >= 80
                      ? "success"
                      : tresorerie.tauxRecouvrement >= 50
                        ? "warning"
                        : "danger"
                    : "neutral"
                }
              />
            </section>

            {/* ─── SETUP MÉTIER (conditionnel, full width) ──────────── */}
            {setupRequired && selectedTradeDef && (
              <section id="dashboard-setup-panel-desktop" className="lg-v2-panel p-6">
                <div className="mb-4">
                  <p className="lg-v2-eyebrow">Configuration</p>
                  <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">Configurez votre espace de travail</h2>
                  <p className="mt-1 text-sm lg-v2-text-muted">
                    Choisissez votre métier pour importer un catalogue de prestations prêt à l&apos;emploi.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {TRADE_OPTIONS.map((opt) => (
                    <TradeOptionCard key={opt.key} option={opt} active={selectedTrade === opt.key} onSelect={setSelectedTrade} />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBootstrap}
                    disabled={isBootstrapping}
                    className="lg-v2-btn lg-v2-btn-primary disabled:opacity-50"
                  >
                    {isBootstrapping ? "Préparation..." : `Activer le starter ${selectedTradeDef.label}`}
                  </button>
                  <Link href="/parametres" className="lg-v2-btn lg-v2-btn-ghost">
                    Configurer manuellement
                  </Link>
                </div>
              </section>
            )}

            {/* ─── BODY 2-COL (8/12 + 4/12 sticky) ──────────────────── */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                {/* Actions à traiter */}
                <section className="lg-v2-panel p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="lg-v2-eyebrow">À traiter</p>
                      <p className="mt-1 text-sm lg-v2-text-muted">Vos prochaines actions prioritaires.</p>
                    </div>
                    <span className="lg-v2-pill">{actionPlan.length} actions</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {actionPlan.map((item) => <DashboardActionCard key={item.id} item={item} />)}
                  </div>
                </section>

                {/* Graphe CA */}
                <section className="lg-v2-panel p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="lg-v2-eyebrow">Performance</p>
                      <p className="mt-1 text-sm lg-v2-text-muted">Évolution du CA · 6 derniers mois</p>
                    </div>
                    {semaine && (
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums lg-v2-text-strong">{semaine.nouveauxDevis}</p>
                          <p className="text-xs lg-v2-text-subtle">devis cette semaine</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums text-[var(--v2-success)]">{formatCurrency(semaine.caEncaisse)}</p>
                          <p className="text-xs lg-v2-text-subtle">encaissé</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums text-[var(--v2-warning)]">{semaine.facturesEmises}</p>
                          <p className="text-xs lg-v2-text-subtle">factures émises</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 h-[280px]">
                    <DashboardChart monthlyData={monthlyData} />
                  </div>
                </section>

                {/* Trésorerie + Bénéfice (2-col interne) */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="lg-v2-panel p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="lg-v2-eyebrow">Trésorerie</p>
                        <p className="mt-1 text-sm lg-v2-text-muted">État des factures</p>
                      </div>
                      {tresorerie && (
                        <span
                          className={`lg-v2-pill ${
                            tresorerie.tauxRecouvrement >= 80
                              ? "lg-v2-pill-success"
                              : tresorerie.tauxRecouvrement >= 50
                                ? "lg-v2-pill-warning"
                                : "lg-v2-pill-danger"
                          }`}
                        >
                          {tresorerie.tauxRecouvrement}% rec.
                        </span>
                      )}
                    </div>
                    <div className="mt-4" aria-busy={!tresorerie}>
                      {tresorerie ? (
                        <DashboardTresorerie data={tresorerie} />
                      ) : (
                        <div className="space-y-3" aria-label="Chargement de la trésorerie">
                          <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                          <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-white/8" />
                          <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-slate-200/70 dark:bg-white/8" />
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="lg-v2-panel p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="lg-v2-eyebrow">Bénéfice net</p>
                        <p className="mt-1 text-sm lg-v2-text-muted">Votre résultat</p>
                      </div>
                      {benefice && (
                        <span
                          className={`lg-v2-pill ${
                            benefice.margePct >= 70
                              ? "lg-v2-pill-success"
                              : benefice.margePct >= 40
                                ? "lg-v2-pill-warning"
                                : "lg-v2-pill-danger"
                          }`}
                        >
                          {benefice.margePct}% marge
                        </span>
                      )}
                    </div>
                    <div className="mt-4" aria-busy={!benefice}>
                      {benefice ? (
                        <DashboardBenefice data={benefice} />
                      ) : (
                        <div className="space-y-3" aria-label="Chargement du bénéfice">
                          <div className="h-7 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
                          <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-white/8" />
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Derniers devis */}
                <section className="lg-v2-panel p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="lg-v2-eyebrow">Derniers devis</p>
                      <p className="mt-1 text-sm lg-v2-text-muted">Affaires récentes</p>
                    </div>
                    <Link href="/devis" className="lg-v2-btn lg-v2-btn-ghost">
                      Voir tout <ChevronRight size={12} aria-hidden />
                    </Link>
                  </div>
                  <DashboardRecentQuotes items={devisRecents} onSelectDevis={setSelectedDevisNumero} />
                </section>
              </div>

              {/* Right rail (sticky) */}
              <aside className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">
                {/* Relances */}
                <section className="lg-v2-panel p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-[var(--v2-danger)]" aria-hidden />
                      <p className="lg-v2-eyebrow">Relances urgentes</p>
                    </div>
                    {devisARelancer.length > 0 && (
                      <span className="lg-v2-pill lg-v2-pill-danger">{devisARelancer.length}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <DesktopPriorityQuotes items={devisARelancer} onSelectDevis={setSelectedDevisNumero} />
                  </div>
                </section>

                {/* Échéances */}
                <section className="lg-v2-panel p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} className="text-[var(--v2-warning)]" aria-hidden />
                      <p className="lg-v2-eyebrow">Échéances proches</p>
                    </div>
                    {echeances.length > 0 && (
                      <span className="lg-v2-pill lg-v2-pill-warning">{echeances.length}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <DesktopPaymentStack items={echeances} />
                  </div>
                </section>

                {/* Top clients */}
                <section className="lg-v2-panel p-5">
                  <p className="lg-v2-eyebrow">Top clients</p>
                  <div className="mt-3">
                    <DashboardTopClients items={topClients} />
                  </div>
                </section>

                {/* Funnel (conditional) */}
                {funnel && funnel.length > 0 && (
                  <section className="lg-v2-panel p-5">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-[var(--v2-primary)]" aria-hidden />
                      <p className="lg-v2-eyebrow">Conversion</p>
                    </div>
                    <div className="mt-3">
                      <ConversionFunnel funnel={funnel} />
                    </div>
                  </section>
                )}

                {/* Objectif */}
                <section className="lg-v2-panel p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="lg-v2-eyebrow">Objectif mensuel</p>
                    <button
                      type="button"
                      onClick={() => { setObjectifDraft(objectifActif.toString()); setObjectifDialogOpen(true); }}
                      className="lg-v2-text-subtle transition hover:text-[var(--v2-text-strong)]"
                      aria-label="Modifier l'objectif"
                    >
                      <Pencil size={12} aria-hidden />
                    </button>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums lg-v2-text-strong">{objectifProgress.toFixed(0)}%</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--v2-panel-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--v2-primary)] transition-all duration-700"
                      style={{ width: `${objectifProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs lg-v2-text-subtle tabular-nums">
                    {formatCurrency(CA_TTC)} / {formatCurrency(objectifActif)}
                  </p>
                </section>
              </aside>
            </div>

          </div>

          <div className="space-y-4 lg:hidden">
          {/* --- Trial banner (mobile) ------------------------ */}
          {isPro && trialEndsAt && <TrialBanner trialEndsAt={trialEndsAt} />}
          {/* --- Quota banner (mobile) ------------------------ */}
          {quotaData && !quotaData.isPro && Number.isFinite(quotaData.limit) && (
            <QuotaBanner
              used={quotaData.used}
              limit={quotaData.limit}
              onUpgradeClick={() => openPaywall("quota_80", { used: quotaData.used, limit: quotaData.limit })}
            />
          )}
          {/* --- Onboarding checklist (mobile) ----------------- */}
          {showOnboardingChecklist && <OnboardingChecklist steps={onboardingSteps} />}
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
                  <div className="mt-3" aria-busy={!tresorerie}>
                    {tresorerie ? (
                      <DashboardTresorerie data={tresorerie} />
                    ) : (
                      <div className="space-y-2" aria-label="Chargement de la trésorerie">
                        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/8" />
                        <div className="h-2 w-full animate-pulse rounded-full bg-slate-200/60 dark:bg-white/6" />
                        <div className="h-2 w-5/6 animate-pulse rounded-full bg-slate-200/60 dark:bg-white/6" />
                      </div>
                    )}
                  </div>
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
                  <div className="mt-3" aria-busy={!benefice}>
                    {benefice ? (
                      <DashboardBenefice data={benefice} />
                    ) : (
                      <div className="space-y-2" aria-label="Chargement du bénéfice">
                        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/8" />
                        <div className="h-2 w-full animate-pulse rounded-full bg-slate-200/60 dark:bg-white/6" />
                      </div>
                    )}
                  </div>
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
      <DesktopDrawer open={!!selectedDevisNumero} onClose={closeDevisDrawer}>
        {selectedDevisNumero && (
          <DevisEditor
            numero={selectedDevisNumero}
            isDrawer
            onClose={closeDevisDrawer}
          />
        )}
      </DesktopDrawer>

      {/* --- Mobile Dock --------------------------------------- */}
      <ClientMobileDock active="dashboard" />

      {/* --- Paywall modal (intelligent quota nudges) --------- */}
      <PaywallModal {...paywallProps} />

    </div>
  );
}
