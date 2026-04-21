"use client";

import {
  Bell,
  BriefcaseBusiness,
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
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { STATUS, Step } from "react-joyride";
import type { CallBackProps } from "react-joyride";
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
import {
  readStringMetadata,
  readBooleanMetadata,
  formatCurrency,
  sectionMotion,
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
  DashboardRecentQuotes,
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
  return response.json();
};

function DashboardNotificationsMenu({ dashboardSignals }: { dashboardSignals: DashboardSignal[] }) {
  const { data } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 30_000,
    dedupingInterval: 15_000,
  });
  const unreadCount: number = data?.unreadCount ?? 0;
  const total = dashboardSignals.length + unreadCount;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 lg:h-9 lg:w-9 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
      aria-label="Notifications"
    >
      <Bell size={20} />
      {total > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-1 text-[10px] font-bold text-white">
          {total > 99 ? "99+" : total}
        </span>
      ) : null}
    </Link>
  );
}

function TradeOptionCard({
  active,
  onSelect,
  option,
}: {
  active: boolean;
  onSelect: (key: TradeKey) => void;
  option: TradeDefinition;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.key)}
      className={`rounded-[1.45rem] border px-4 py-4 text-left transition ${
        active
          ? "border-violet-300/70 bg-white/90 shadow-[0_20px_46px_-36px_rgba(124,58,237,0.3)] dark:border-violet-400/20 dark:bg-white/6"
          : "border-slate-200/70 bg-white/80 hover:border-violet-300 hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4"
      }`}
    >
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{option.label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{option.summary}</p>
    </button>
  );
}

function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  badge,
  linkHref,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {badge ? (
          <span className="client-chip bg-slate-900/6 text-slate-700 ring-1 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
            {badge}
          </span>
        ) : null}
        {linkHref && linkLabel ? (
          <Link
            href={linkHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-200"
          >
            {linkLabel}
            <ChevronRight size={16} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function GoalSummaryCard({
  objectifProgress,
  goalContextLabel,
  caTTC,
  objectifActif,
  onEdit,
}: {
  objectifProgress: number;
  goalContextLabel: string;
  caTTC: number;
  objectifActif: number;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Objectif mensuel
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {objectifProgress.toFixed(0)}%
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{goalContextLabel}</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-700 ring-1 ring-violet-300/40 dark:text-violet-200 dark:ring-violet-400/20">
          <Target size={18} />
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700"
          style={{ width: `${objectifProgress}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            CA TTC
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {formatCurrency(caTTC)}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Cible
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {formatCurrency(objectifActif)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
      >
        <Pencil size={14} />
        Ajuster
      </button>
    </div>
  );
}

function WeeklyMiniStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200/70 bg-white/84 p-4 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
          <Icon size={15} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { data: dashboardData, isLoading, mutate: mutateDashboard } = useSWR<ClientDashboardSummary>(
    "/api/dashboard/summary",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: 30_000,
      refreshInterval: 0,
    },
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
  const [runTour, setRunTour] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem("zolio_has_seen_tour"),
  );
  const [currentHour] = useState(() => new Date().getHours());
  const [selectedDevisNumero, setSelectedDevisNumero] = useState<string | null>(null);

  useEffect(() => {
    const nextTrade = getTradeDefinition(companyTrade)?.key;
    if (nextTrade) {
      setSelectedTrade(nextTrade);
    }
  }, [companyTrade]);

  const selectedTradeDef = getTradeDefinition(selectedTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const selectedStarterCount = getStarterCatalogForTrade(selectedTrade).length;
  const setupRequired =
    isLoaded && (!companyTrade || !catalogImported || !onboardingDone || starterCatalogCount === 0);

  const objectifMensuel = Number(user?.unsafeMetadata?.objectifMensuel);
  const objectifInitial = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : 5000;
  const [objectif, setObjectif] = useState(objectifInitial);
  const objectifActif = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : objectif;

  useEffect(() => {
    setObjectifDraft(objectifActif.toString());
  }, [objectifActif]);

  const handleBootstrap = async () => {
    if (!user || !selectedTradeDef) {
      return;
    }

    setIsBootstrapping(true);
    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: selectedTradeDef.key }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Erreur");
      }

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: selectedTradeDef.key,
          onboardingCompleted: true,
          starterCatalogImported: true,
        },
      });
      await mutateDashboard();
      toast.success(payload.imported > 0 ? `${payload.imported} prestation(s) importée(s)` : "Starter déjà en place");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'importer");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleUpdateObjectif = async () => {
    const parsed = Number(objectifDraft.replace(",", ".").trim());
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Objectif invalide.");
      return;
    }

    setObjectif(parsed);
    try {
      if (user) {
        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, objectifMensuel: parsed } });
      }
      setObjectifDialogOpen(false);
      toast.success("Objectif mis à jour.");
    } catch {
      toast.error("Erreur de sauvegarde.");
    }
  };

  const handleTourCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      localStorage.setItem("zolio_has_seen_tour", "true");
      setRunTour(false);
    }
  };

  const d = dashboardData;
  const totalQuotes = d?.totalQuotes ?? 0;
  const caTTC = d?.totalTTC ?? 0;
  const acceptedCount = d?.acceptedCount ?? 0;
  const pendingCount = d?.pendingCount ?? 0;
  const acceptedRevenueHT = d?.acceptedRevenueHT ?? 0;
  const pipelineHT = d?.pipelineRevenueHT ?? 0;
  const conversionRate = d?.conversionRate ?? 0;
  const averageTicket = d?.averageTicket ?? 0;
  const avgResponseDays = d?.avgResponseDays ?? 0;
  const objectifProgress = objectifActif > 0 ? Math.min((caTTC / objectifActif) * 100, 100) : 0;
  const remainingToGoal = Math.max(objectifActif - caTTC, 0);
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
  if (currentHour >= 18) {
    greetingText = "Bonsoir";
    GreetingIcon = MoonStar;
  } else if (currentHour >= 12) {
    greetingText = "Bon après-midi";
    GreetingIcon = SunMedium;
  }

  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const signals = useMemo<DashboardSignal[]>(() => {
    const nextSignals: DashboardSignal[] = [];

    if (setupRequired) {
      nextSignals.push({
        id: "setup",
        title: "Starter métier à activer",
        description: "Choisissez votre métier et importez votre base de prestations.",
        tone: "violet",
      });
    }
    if (devisARelancer.length > 0) {
      nextSignals.push({
        id: "followups",
        title: `${devisARelancer.length} relance(s)`,
        description: "Des devis ont besoin d'une action commerciale rapide.",
        href: "/devis",
        tone: "rose",
      });
    }
    if (pendingCount > 0) {
      nextSignals.push({
        id: "pipeline",
        title: `${pendingCount} devis en attente`,
        description: `${formatCurrency(pipelineHT)} HT restent à convertir.`,
        href: "/devis",
        tone: "amber",
      });
    }
    if (tresorerie && tresorerie.enRetard > 0) {
      nextSignals.push({
        id: "overdue",
        title: `${formatCurrency(tresorerie.enRetard)} en retard`,
        description: "Une partie de la trésorerie doit être sécurisée.",
        href: "/factures",
        tone: "rose",
      });
    }
    if (totalQuotes === 0) {
      nextSignals.push({
        id: "first",
        title: "Premier devis à lancer",
        description: "Le cockpit prendra tout son sens dès la première affaire créée.",
        href: "/nouveau-devis",
        tone: "violet",
      });
    }

    return nextSignals.slice(0, 4);
  }, [devisARelancer.length, pendingCount, pipelineHT, setupRequired, totalQuotes, tresorerie]);

  const todayFocus = useMemo<DashboardSignal>(() => {
    if (setupRequired) {
      return {
        id: "focus-setup",
        title: "Finaliser la configuration métier",
        description: "Commencez par activer le starter pour avoir un cockpit immédiatement utile.",
        tone: "violet",
      };
    }
    if (devisARelancer.length > 0) {
      return {
        id: "focus-followups",
        title: `${devisARelancer.length} devis doivent être relancés`,
        description: "La priorité du moment est commerciale, pas décorative.",
        href: "/devis",
        tone: "rose",
      };
    }
    if (pendingCount > 0) {
      return {
        id: "focus-pipeline",
        title: "Le pipeline reste ouvert",
        description: `${formatCurrency(pipelineHT)} HT peuvent encore être convertis.`,
        href: "/devis",
        tone: "amber",
      };
    }
    if (totalQuotes === 0) {
      return {
        id: "focus-first",
        title: "Créer le premier devis",
        description: "Le dashboard est prêt, mais il lui manque encore un signal réel.",
        href: "/nouveau-devis",
        tone: "violet",
      };
    }
    return {
      id: "focus-steady",
      title: "Le cockpit est stable",
      description: "Travaillez maintenant la conversion, la réactivité et l'encaissement.",
      tone: "emerald",
    };
  }, [devisARelancer.length, pendingCount, pipelineHT, setupRequired, totalQuotes]);

  const heroIndicators = useMemo<DashboardHeroIndicator[]>(() => {
    return [
      {
        id: "indicator-pipeline",
        label: "Pipeline",
        value: formatCurrency(pipelineHT),
        tone: pendingCount > 0 ? "amber" : "slate",
      },
      {
        id: "indicator-relances",
        label: "Relances",
        value: `${devisARelancer.length} à traiter`,
        tone: devisARelancer.length > 0 ? "rose" : "slate",
      },
      {
        id: "indicator-cap",
        label: "Cap restant",
        value: remainingToGoal > 0 ? formatCurrency(remainingToGoal) : "Atteint",
        tone: remainingToGoal > 0 ? "violet" : "emerald",
      },
    ];
  }, [devisARelancer.length, pendingCount, pipelineHT, remainingToGoal]);

  const actionPlan = useMemo<DashboardActionPlanItem[]>(() => {
    const items: DashboardActionPlanItem[] = [
      {
        id: "create",
        eyebrow: "Action",
        title: totalQuotes === 0 ? "Créer le premier devis" : "Ouvrir un nouveau devis",
        description: "Le flux principal du cockpit commence ici.",
        href: "/nouveau-devis",
        icon: Plus,
        tone: "violet",
        ctaLabel: "Créer",
      },
    ];

    if (devisARelancer.length > 0) {
      items.push({
        id: "followups",
        eyebrow: "Urgent",
        title: "Traiter les relances",
        description: `${devisARelancer.length} devis attendent un rappel.`,
        href: "/devis",
        icon: Bell,
        tone: "rose",
        value: String(devisARelancer.length),
        ctaLabel: "Voir",
      });
    } else if (pendingCount > 0) {
      items.push({
        id: "pipeline",
        eyebrow: "Commercial",
        title: "Suivre le pipeline",
        description: `${pendingCount} devis restent en attente.`,
        href: "/devis",
        icon: Clock3,
        tone: "amber",
        value: formatCurrency(pipelineHT),
        ctaLabel: "Ouvrir",
      });
    }

    if (!isPro) {
      items.push({
        id: "pro",
        eyebrow: "Croissance",
        title: "Passer en PRO",
        description: "Débloquez plus de latitude pour piloter votre activité.",
        href: "/abonnement",
        icon: Sparkles,
        tone: "violet",
        ctaLabel: "Voir",
      });
    }

    return items.slice(0, 3);
  }, [devisARelancer.length, isPro, pendingCount, pipelineHT, totalQuotes]);

  const quickLinks: QuickLinkItem[] = [
    { href: "/clients", label: "Clients", description: "Carnet et historique", icon: Users, tone: "violet" },
    { href: "/factures", label: "Factures", description: "Paiements et relances", icon: FileCheck2, tone: "slate" },
    { href: "/catalogue", label: "Catalogue", description: "Prestations réutilisables", icon: Package, tone: "amber" },
    { href: "/parametres", label: "Paramètres", description: "Entreprise et réglages", icon: Settings, tone: "slate" },
  ];

  const briefingText = useMemo(() => {
    if (setupRequired) {
      return "Le dashboard a été vidé de tout bruit inutile. La première étape est maintenant d'activer le starter métier pour lui donner une base réelle.";
    }
    if (devisARelancer.length > 0) {
      return `${devisARelancer.length} devis demandent une relance. C'est l'information la plus importante du moment, devant le reste.`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} devis restent ouverts. Le cockpit se concentre donc sur le pipeline, l'encaissement et la vitesse de conversion.`;
    }
    if (totalQuotes === 0) {
      return "Le dashboard est prêt mais il n'a pas encore de matière. Créez un premier devis pour faire apparaître les vrais signaux.";
    }
    return "Le cockpit se concentre désormais sur ce qui compte vraiment: conversion, rythme, trésorerie et clients forts.";
  }, [devisARelancer.length, pendingCount, setupRequired, totalQuotes]);

  const goalContextLabel =
    remainingToGoal > 0
      ? `${formatCurrency(remainingToGoal)} restent à sécuriser pour atteindre la cible`
      : "Objectif mensuel atteint";

  const tourSteps: Step[] = [
    {
      target: ".tour-dashboard",
      title: "Cockpit",
      content: "Le dashboard a été recentré sur la hiérarchie des actions et des chiffres clés.",
      disableBeacon: true,
      placement: "bottom" as const,
    },
    {
      target: ".tour-nouveau-devis",
      title: "Nouveau devis",
      content: "Le point d'entrée principal reste ici.",
      placement: "bottom" as const,
    },
  ];

  return (
    <div
      className="tour-dashboard client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white"
      data-testid="dashboard-page"
    >
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {runTour ? (
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous
          showSkipButton
          showProgress
          callback={handleTourCallback}
          styles={{ options: { primaryColor: "#7c3aed", zIndex: 1000 } }}
          locale={{
            back: "Précédent",
            close: "Fermer",
            last: "Terminer",
            next: "Suivant",
            skip: "Passer",
          }}
        />
      ) : null}

      <PullToRefresh
        onRefresh={async () => {
          await mutateDashboard();
        }}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pl-[336px]">
          <header className="client-panel sticky top-3 z-40 rounded-[2rem] px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <ClientBrandMark showLabel={false} />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/parametres"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 lg:h-9 lg:w-9 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Paramètres"
                >
                  <Settings size={20} className="lg:h-4 lg:w-4" />
                </Link>
                {canAccessAdmin ? (
                  <Link
                    href="/admin"
                    className="hidden items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 md:inline-flex lg:px-3 lg:py-1.5 lg:text-xs dark:border-violet-400/20 dark:text-violet-100"
                  >
                    <ShieldCheck size={17} className="lg:h-3.5 lg:w-3.5" />
                    Admin
                  </Link>
                ) : null}
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
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 lg:h-7 lg:w-7 dark:bg-slate-700" />
                )}
              </div>
            </div>
          </header>

          <ClientDesktopNav active="dashboard" />

          <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
            {!isLoaded ? (
              <div className="space-y-6">
                <div className="h-40 animate-pulse rounded-[2rem] bg-slate-200/80 dark:bg-slate-800/80" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-[1.6rem] bg-slate-200/60 dark:bg-slate-800/60"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <motion.section
                  {...sectionMotion(0)}
                  className="client-panel-strong relative overflow-hidden rounded-[2.2rem] px-5 py-5 sm:px-6 sm:py-6 lg:px-7"
                >
                  <div className="pointer-events-none absolute -left-14 top-12 h-40 w-40 rounded-full bg-violet-500/12 blur-3xl" />
                  <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-orange-400/10 blur-3xl" />

                  <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                          <GreetingIcon size={14} />
                          {todayLabel}
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                          <BriefcaseBusiness size={13} />
                          {starterTrade?.shortLabel || "Métier"}
                        </div>
                      </div>

                      <div className="max-w-3xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-200">
                          Cockpit client
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                          {greetingText}
                          {user?.firstName ? `, ${user.firstName}` : ""}.
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                          {briefingText}
                        </p>
                      </div>

                      <FocusSignalCard signal={todayFocus} />

                      <div className="flex flex-wrap gap-3">
                        <Link href="/nouveau-devis" className="tour-nouveau-devis">
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-brand"
                          >
                            <Plus size={17} />
                            Nouveau devis
                          </motion.div>
                        </Link>
                        <Link
                          href="/devis"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                        >
                          <FileText size={17} />
                          Mes devis
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <GoalSummaryCard
                        objectifProgress={objectifProgress}
                        goalContextLabel={goalContextLabel}
                        caTTC={caTTC}
                        objectifActif={objectifActif}
                        onEdit={() => {
                          setObjectifDraft(objectifActif.toString());
                          setObjectifDialogOpen(true);
                        }}
                      />

                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {heroIndicators.map((indicator) => (
                          <HeroIndicatorPill key={indicator.id} indicator={indicator} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {setupRequired && selectedTradeDef ? (
                  <motion.section
                    id="dashboard-setup-panel"
                    {...sectionMotion(0.04)}
                    className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6"
                  >
                    <DashboardSectionHeader
                      eyebrow="Starter métier"
                      title="Initialiser votre base de travail"
                      description="Le dashboard est maintenant plus strict. Pour qu'il soit pertinent, il faut lui donner une base métier propre."
                      badge={`${starterCatalogCount} en base`}
                    />

                    <div className="mt-5 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {TRADE_OPTIONS.map((option) => (
                          <TradeOptionCard
                            key={option.key}
                            option={option}
                            active={selectedTrade === option.key}
                            onSelect={setSelectedTrade}
                          />
                        ))}
                      </div>

                      <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedTradeDef.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {selectedTradeDef.pitch} {selectedStarterCount} prestations seront injectées.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleBootstrap}
                          disabled={isBootstrapping}
                          className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
                        >
                          {isBootstrapping ? "Préparation..." : "Activer mon starter"}
                        </button>
                        <Link
                          href="/parametres"
                          className="inline-flex items-center justify-center gap-2 rounded-[1.3rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                        >
                          Finaliser mes paramètres
                        </Link>
                      </div>
                    </div>
                  </motion.section>
                ) : null}

                <motion.section
                  {...sectionMotion(0.08)}
                  className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <CompactMetricCard
                      label="CA validé"
                      value={formatCurrency(acceptedRevenueHT)}
                      detail={`${acceptedCount} devis gagnés`}
                      tone="emerald"
                      icon={TrendingUp}
                    />
                    <CompactMetricCard
                      label="Pipeline"
                      value={formatCurrency(pipelineHT)}
                      detail={`${pendingCount} devis ouverts`}
                      tone="amber"
                      icon={Clock3}
                    />
                    <CompactMetricCard
                      label="Ticket moyen"
                      value={formatCurrency(averageTicket)}
                      detail={`${conversionRate}% de conversion`}
                      tone="violet"
                      icon={LineChart}
                    />
                    <CompactMetricCard
                      label="Réponse"
                      value={`${avgResponseDays.toFixed(1)} j`}
                      detail="Délai moyen avant issue"
                      tone="slate"
                      icon={FileText}
                    />
                  </div>

                  <div className="client-panel rounded-[2rem] p-4 sm:p-5">
                    <DashboardSectionHeader
                      eyebrow="À faire maintenant"
                      title="Plan d'action"
                      description="Trois actions maximum, sans bruit."
                    />
                    <div className="mt-5 grid gap-3">
                      {actionPlan.map((item) => (
                        <DashboardActionCard key={item.id} item={item} compact />
                      ))}
                    </div>
                  </div>
                </motion.section>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)] xl:gap-6">
                  <div className="space-y-4 xl:space-y-6">
                    <motion.section {...sectionMotion(0.1)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                      <DashboardSectionHeader
                        eyebrow="Performance"
                        title="Rythme et tendance"
                        description="La courbe mensuelle reste au centre, avec les signaux hebdomadaires à portée directe."
                      />

                      {semaine ? (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <WeeklyMiniStat
                            icon={FileText}
                            label="Nouveaux devis"
                            value={String(semaine.nouveauxDevis)}
                            detail={`${semaine.devisAcceptes} accepté${semaine.devisAcceptes > 1 ? "s" : ""}`}
                          />
                          <WeeklyMiniStat
                            icon={FileCheck2}
                            label="Factures"
                            value={String(semaine.facturesEmises)}
                            detail={`${semaine.facturesPayees} payée${semaine.facturesPayees > 1 ? "s" : ""}`}
                          />
                          <WeeklyMiniStat
                            icon={TrendingUp}
                            label="Encaissé"
                            value={formatCurrency(semaine.caEncaisse)}
                            detail="Semaine en cours"
                          />
                          <WeeklyMiniStat
                            icon={Package}
                            label="Dépenses"
                            value={formatCurrency(semaine.depensesSemaine)}
                            detail="Semaine en cours"
                          />
                        </div>
                      ) : null}

                      <div className="mt-5 h-[18rem] overflow-hidden rounded-[1.7rem] border border-slate-200/70 bg-white/75 px-2 py-4 dark:border-white/8 dark:bg-white/4 sm:h-72">
                        {loading ? <ChartSkeleton /> : <DashboardChart monthlyData={monthlyData} />}
                      </div>
                    </motion.section>

                    <motion.section {...sectionMotion(0.12)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                      <DashboardSectionHeader
                        eyebrow="Pipeline"
                        title="Affaires en cours"
                        description="Les devis récents et les relances sont séparés pour éviter les ambiguïtés."
                        linkHref="/devis"
                        linkLabel="Voir tous"
                      />

                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Derniers devis</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{devisRecents.length} item(s)</span>
                          </div>
                          <DashboardRecentQuotes items={devisRecents} onSelectDevis={setSelectedDevisNumero} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Relances à traiter</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{devisARelancer.length} item(s)</span>
                          </div>
                          <DashboardFollowUps items={devisARelancer} onSelectDevis={setSelectedDevisNumero} />
                        </div>
                      </div>
                    </motion.section>

                    {funnel && funnel.length > 0 ? (
                      <motion.section {...sectionMotion(0.14)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                        <DashboardSectionHeader
                          eyebrow="Conversion"
                          title="Funnel commercial"
                          description="Lecture rapide du passage du devis jusqu'au paiement."
                        />
                        <div className="mt-5">
                          <ConversionFunnel funnel={funnel} />
                        </div>
                      </motion.section>
                    ) : null}
                  </div>

                  <div className="space-y-4 xl:space-y-6">
                    <motion.section {...sectionMotion(0.16)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                      <DashboardSectionHeader
                        eyebrow="Finance"
                        title="Trésorerie"
                        description="Montants encaissés, ouverts et en retard."
                      />
                      <div className="mt-5">
                        {tresorerie ? (
                          <DashboardTresorerie data={tresorerie} />
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
                        )}
                      </div>
                    </motion.section>

                    <motion.section {...sectionMotion(0.18)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                      <DashboardSectionHeader
                        eyebrow="Résultat"
                        title="Rentabilité"
                        description="Lecture sobre du net encaissé face aux dépenses."
                      />
                      <div className="mt-5">
                        {benefice ? (
                          <DashboardBenefice data={benefice} />
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
                        )}
                      </div>
                    </motion.section>

                    <motion.section {...sectionMotion(0.2)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                      <DashboardSectionHeader
                        eyebrow="Paiements"
                        title="Prochaines échéances"
                        description="Ce qui doit tomber dans les 14 prochains jours."
                        badge={`${echeances.length}`}
                      />
                      <div className="mt-5">
                        <DashboardEcheances items={echeances} />
                      </div>
                    </motion.section>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
                  <motion.section {...sectionMotion(0.22)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                    <DashboardSectionHeader
                      eyebrow="Clients"
                      title="Comptes les plus forts"
                      description="Ceux qui concentrent le plus de chiffre gagné."
                    />
                    <div className="mt-5">
                      <DashboardTopClients items={topClients} />
                    </div>
                  </motion.section>

                  <motion.section {...sectionMotion(0.24)} className="client-panel rounded-[2rem] p-4 sm:p-5 lg:p-6">
                    <DashboardSectionHeader
                      eyebrow="Modules"
                      title="Accès rapides"
                      description="Les outils secondaires restent disponibles, sans polluer le haut du cockpit."
                    />
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {quickLinks.map((item) => (
                        <QuickLinkCard key={item.href} item={item} />
                      ))}
                    </div>

                    <div className="mt-5 space-y-2">
                      <ClientSupportButton />
                      {canAccessAdmin ? (
                        <Link
                          href="/admin"
                          className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-100"
                        >
                          <ShieldCheck size={16} />
                          Admin
                        </Link>
                      ) : null}
                    </div>
                  </motion.section>
                </div>
              </>
            )}
          </main>

          <DesktopDrawer open={!!selectedDevisNumero} onClose={() => setSelectedDevisNumero(null)}>
            {selectedDevisNumero ? <DevisEditor numero={selectedDevisNumero} /> : null}
          </DesktopDrawer>

          <MobileDialog
            open={objectifDialogOpen}
            onClose={() => setObjectifDialogOpen(false)}
            title="Ajuster l'objectif"
          >
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Définissez votre objectif de chiffre d'affaires mensuel TTC pour piloter votre progression.
              </p>
              <div className="mt-4">
                <label
                  htmlFor="objectif"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Objectif mensuel
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    name="objectif"
                    id="objectif"
                    value={objectifDraft}
                    onChange={(event) => setObjectifDraft(event.target.value)}
                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-950 focus:border-violet-500 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white sm:text-sm"
                    placeholder="5000"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-slate-500 sm:text-sm">€ TTC</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setObjectifDialogOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleUpdateObjectif}
                  className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </MobileDialog>

          <ClientMobileDock active="dashboard" />
        </div>
      </PullToRefresh>
    </div>
  );
}
