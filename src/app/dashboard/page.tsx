"use client";

import ConversionFunnel from "@/components/conversion-funnel";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  CloudSun,
  CreditCard,
  FileCheck2,
  FileText,
  LineChart,
  MoonStar,
  Package,
  Pencil,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";
import useSWR from "swr";
import { UserButton, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { MobileDialog } from "@/components/mobile-dialog";
import { DevisCardSkeleton, ChartSkeleton } from "@/components/Skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ClientBrandMark,
  ClientDesktopNav,
  ClientMobileDock,
  ClientSupportButton,
} from "@/components/client-shell";
import type { ClientDashboardMonthlyDatum, ClientDashboardSummary, TresorerieSummary, BeneficeSummary } from "@/lib/client-dashboard";
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

type Tone = "violet" | "emerald" | "amber" | "rose" | "slate";

type DashboardSignal = {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
};

type DashboardActionPlanItem = {
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

type QuickLinkItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  tourClass?: string;
};

type DashboardHeroIndicator = {
  id: string;
  label: string;
  value: string;
  tone: Tone;
};

function readStringMetadata(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readBooleanMetadata(value: unknown) {
  return value === true;
}

function parseDevisDate(dateStr?: string): Date {
  if (dateStr && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
  }

  if (dateStr) {
    return new Date(dateStr);
  }

  return new Date();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateLabel(value: string) {
  const date = parseDevisDate(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function toneClasses(tone: Tone) {
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
        icon: "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20",
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

function statusBadgeClasses(status: string) {
  if (status === "Accepté") {
    return "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20";
  }

  if (status === "Refusé") {
    return "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20";
  }

  return "bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/20";
}

function sectionMotion(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, delay },
  };
}

function renderSignalIcon(tone: Tone, size = 16) {
  switch (tone) {
    case "rose":
      return <TriangleAlert size={size} />;
    case "amber":
      return <Clock3 size={size} />;
    case "emerald":
      return <TrendingUp size={size} />;
    case "slate":
      return <Target size={size} />;
    case "violet":
    default:
      return <Sparkles size={size} />;
  }
}

function FocusSignalCard({ signal }: { signal: DashboardSignal }) {
  const classes = toneClasses(signal.tone);
  const content = (
    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-start gap-3">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          {renderSignalIcon(signal.tone, 17)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{signal.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.description}</p>
        </div>
        {signal.href ? (
          <div className="mt-1 text-violet-600 dark:text-violet-200">
            <ChevronRight size={16} />
          </div>
        ) : null}
      </div>
    </div>
  );

  return signal.href ? <Link href={signal.href}>{content}</Link> : content;
}

function DashboardActionCard({
  item,
  compact = false,
}: {
  item: DashboardActionPlanItem;
  compact?: boolean;
}) {
  const classes = toneClasses(item.tone);
  const Icon = item.icon;
  const content = (
    <div
      className={`rounded-[1.6rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4 ${
        compact ? "sm:p-4" : "sm:p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          <Icon size={18} />
        </div>
        {item.value ? (
          <span className={`client-chip shrink-0 ring-1 ${classes.chip}`}>{item.value}</span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.eyebrow}</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{item.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
      </div>

      {item.href || item.ctaLabel ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-200">
          {item.ctaLabel || "Ouvrir"}
          {item.href ? <ChevronRight size={16} /> : null}
        </div>
      ) : null}
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: Tone;
  value: string;
}) {
  const classes = toneClasses(tone);

  return (
    <div className="client-kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({ item }: { item: QuickLinkItem }) {
  const classes = toneClasses(item.tone);
  const Icon = item.icon;

  return (
    <Link href={item.href} className={item.tourClass}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="client-quick-link h-full rounded-[1.75rem] p-4 transition duration-200 hover:-translate-y-0.5"
      >
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          <Icon size={19} />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function CompactMetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: Tone;
  value: string;
}) {
  const classes = toneClasses(tone);

  return (
    <div className="rounded-[1.55rem] border border-slate-200/70 bg-white/75 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-white/4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p>
    </div>
  );
}

function HeroIndicatorPill({ indicator }: { indicator: DashboardHeroIndicator }) {
  const classes = toneClasses(indicator.tone);

  return (
    <div className="rounded-[1.15rem] border border-white/55 bg-white/78 px-3 py-3 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-white/6">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
          {renderSignalIcon(indicator.tone, 14)}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{indicator.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{indicator.value}</p>
        </div>
      </div>
    </div>
  );
}

function MobileDisclosureSection({
  badge,
  children,
  defaultOpen = false,
  description,
  title,
}: {
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  description?: string;
  title: string;
}) {
  return (
    <details
      open={defaultOpen}
      className="client-panel group overflow-hidden rounded-[1.8rem] md:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {badge ? (
            <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
              {badge}
            </span>
          ) : null}
          <ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" />
        </div>
      </summary>
      <div className="border-t border-slate-200/70 px-4 py-4 dark:border-white/8">{children}</div>
    </details>
  );
}


function DashboardNotificationsMenu({
  dashboardSignals,
}: {
  dashboardSignals: DashboardSignal[];
}) {
  const { data } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
    dedupingInterval: 15000,
  });
  const unreadCount: number = data?.unreadCount ?? 0;
  const total = dashboardSignals.length + unreadCount;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
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
          ? "border-violet-400/50 bg-violet-500/12 shadow-[0_18px_45px_-32px_rgba(124,58,237,0.8)]"
          : "border-slate-200/70 bg-white/75 hover:border-violet-300/50 hover:bg-violet-500/6 dark:border-white/8 dark:bg-white/4"
      }`}
    >
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{option.label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{option.summary}</p>
    </button>
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
      dedupingInterval: 30000, // 30 secondes au lieu de 15
      refreshInterval: 0, // Pas de rafraîchissement automatique
    },
  );

  const loading = isLoading && !dashboardData;
  const canAccessAdminDashboard = user?.publicMetadata?.isAdmin === true;
  const isPro = user?.publicMetadata?.isPro === true;
  const companyTrade = readStringMetadata(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const starterCatalogImported = readBooleanMetadata(
    user?.unsafeMetadata?.starterCatalogImported || user?.publicMetadata?.starterCatalogImported,
  );
  const onboardingCompleted = readBooleanMetadata(
    user?.unsafeMetadata?.onboardingCompleted || user?.publicMetadata?.onboardingCompleted,
  );
  const starterCatalogCount = dashboardData?.starterCatalogCount ?? 0;
  const starterTrade = getTradeDefinition(companyTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isBootstrappingTrade, setIsBootstrappingTrade] = useState(false);

  useEffect(() => {
    const nextTrade = getTradeDefinition(companyTrade)?.key;
    if (nextTrade) {
      setSelectedTrade(nextTrade);
    }
  }, [companyTrade]);

  const selectedTradeDefinition =
    getTradeDefinition(selectedTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const selectedStarterCount = getStarterCatalogForTrade(selectedTrade).length;
  const setupIsRequired =
    isLoaded && (!companyTrade || !starterCatalogImported || !onboardingCompleted || starterCatalogCount === 0);

  const objectifMensuel = Number(user?.unsafeMetadata?.objectifMensuel);
  const objectifInitial =
    Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : 5000;
  const [objectif, setObjectif] = useState(objectifInitial);
  const objectifActif =
    Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : objectif;
  // showNotifications removed - managed inside component
  const [objectifDialogOpen, setObjectifDialogOpen] = useState(false);
  const [objectifDraft, setObjectifDraft] = useState(() => objectifInitial.toString());
  const [runTour, setRunTour] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("zolio_has_seen_tour");
  });
  const [currentHour] = useState(() => new Date().getHours());
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    setObjectifDraft(objectifActif.toString());
  }, [objectifActif]);

  const handleBootstrapTrade = async () => {
    if (!user || !selectedTradeDefinition) return;

    setIsBootstrappingTrade(true);
    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: selectedTradeDefinition.key }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'importer le starter métier");
      }

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: selectedTradeDefinition.key,
          onboardingCompleted: true,
          starterCatalogImported: true,
        },
      });

      await mutateDashboard();
      toast.success(
        payload.imported > 0
          ? `${payload.imported} prestation(s) ${selectedTradeDefinition.shortLabel.toLowerCase()} importée(s)`
          : `Starter ${selectedTradeDefinition.shortLabel.toLowerCase()} déjà en place`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'importer le starter métier";
      toast.error(message);
    } finally {
      setIsBootstrappingTrade(false);
    }
  };

  const handleUpdateObjectif = async () => {
    const parsed = Number(objectifDraft.replace(',', '.').trim());

    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Entrez un objectif mensuel valide.");
      return;
    }

    setObjectif(parsed);

    try {
      if (user) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            objectifMensuel: parsed,
          },
        });
      }

      setObjectifDialogOpen(false);
      toast.success("Objectif mensuel mis à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde de l'objectif.");
    }
  };

  const handleJoyrideCallback = (callbackData: CallBackProps) => {
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(callbackData.status)) {
      localStorage.setItem("zolio_has_seen_tour", "true");
      setRunTour(false);
    }
  };

  const steps: Step[] = [
    {
      target: ".tour-dashboard",
      title: "Bienvenue sur Zolio",
      content:
        "Voici votre espace de pilotage. Vous voyez ici l'essentiel de votre activité, vos raccourcis et les devis à suivre.",
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: ".tour-parametres",
      title: "Paramétrez votre identité",
      content:
        "Renseignez le logo, le SIRET, les couleurs et les coordonnées de votre entreprise pour envoyer des documents propres.",
      placement: "left",
    },
    {
      target: ".tour-nouveau-devis",
      title: "Créez vite votre prochain devis",
      content: "C'est ici que vous démarrez un nouveau devis en quelques secondes.",
      placement: "bottom",
    },
    {
      target: ".tour-clients",
      title: "Gardez vos clients sous la main",
      content: "Retrouvez vos clients et leur historique pour travailler plus vite au quotidien.",
      placement: "top",
    },
    {
      target: ".tour-catalogue",
      title: "Capitalisez votre catalogue",
      content:
        "Enregistrez vos prestations et matériaux habituels pour accélérer la création des devis.",
      placement: "top",
    },
  ];

  const totalQuotes = dashboardData?.totalQuotes ?? 0;
  const CA_TTC = dashboardData?.totalTTC ?? 0;
  const acceptedQuotesCount = dashboardData?.acceptedCount ?? 0;
  const pendingQuotesCount = dashboardData?.pendingCount ?? 0;
  const refusedQuotesCount = dashboardData?.refusedCount ?? 0;
  const acceptedRevenueHT = dashboardData?.acceptedRevenueHT ?? 0;
  const pipelineRevenueHT = dashboardData?.pipelineRevenueHT ?? 0;
  const lostRevenueHT = dashboardData?.lostRevenueHT ?? 0;
  const conversionRate = dashboardData?.conversionRate ?? 0;
  const averageTicket = dashboardData?.averageTicket ?? 0;
  const avgResponseDays = dashboardData?.avgResponseDays ?? 0;
  const objectifProgress = objectifActif > 0 ? Math.min((CA_TTC / objectifActif) * 100, 100) : 0;
  const remainingToGoal = Math.max(objectifActif - CA_TTC, 0);
  const devisRecents = dashboardData?.recentQuotes ?? [];
  const devisARelancer = dashboardData?.followUpQuotes ?? [];
  const monthlyData: ClientDashboardMonthlyDatum[] = dashboardData?.monthlyData ?? [];
  const topClients = dashboardData?.topClients ?? [];
  const tresorerie = dashboardData?.tresorerie;
  const benefice = dashboardData?.benefice;
  const echeances = dashboardData?.echeances ?? [];
  const semaine = dashboardData?.semaine;
  const funnel = dashboardData?.funnel;

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

  const dashboardSignals = useMemo<DashboardSignal[]>(() => {
    const signals: DashboardSignal[] = [];

    if (setupIsRequired) {
      signals.push({
        id: "setup",
        title: "Starter métier à activer",
        description: "Choisissez votre métier et importez le catalogue de départ pour aller plus vite.",
        tone: "violet",
      });
    }

    if (totalQuotes === 0) {
      signals.push({
        id: "empty",
        title: "Premier devis à lancer",
        description: "Créez votre premier devis pour activer votre suivi d'activité.",
        href: "/nouveau-devis",
        tone: "violet",
      });
    }

    if (devisARelancer.length > 0) {
      signals.push({
        id: "followups",
        title: `${devisARelancer.length} devis à relancer`,
        description: "Des clients attendent encore une réponse ou un rappel.",
        href: "/devis",
        tone: "rose",
      });
    }

    if (pendingQuotesCount > 0) {
      signals.push({
        id: "pipeline",
        title: `${pendingQuotesCount} devis dans le pipe`,
        description: `${formatCurrency(pipelineRevenueHT)} HT encore en attente de validation.`,
        href: "/devis",
        tone: "amber",
      });
    }

    if (CA_TTC >= objectifActif) {
      signals.push({
        id: "goal-hit",
        title: "Objectif atteint",
        description: "Le cap mensuel est atteint, vous pouvez viser plus haut.",
        tone: "emerald",
      });
    } else {
      signals.push({
        id: "goal-gap",
        title: "Objectif à suivre",
        description: `${formatCurrency(Math.max(objectifActif - CA_TTC, 0))} TTC restants pour atteindre votre cap.`,
        tone: "slate",
      });
    }

    if (!isPro) {
      signals.push({
        id: "upgrade",
        title: "Mode Starter actif",
        description: "Passez en PRO pour aller plus loin que le devis d'essai.",
        href: "/abonnement",
        tone: "violet",
      });
    }

    if (tresorerie && tresorerie.enRetard > 0) {
      signals.push({
        id: "overdue",
        title: `${formatCurrency(tresorerie.enRetard)} en retard de paiement`,
        description: `${tresorerie.tauxRecouvrement}% de recouvrement — relancez les impayés en priorité.`,
        href: "/factures",
        tone: "rose",
      });
    }

    return signals.slice(0, 4);
  }, [
    CA_TTC,
    totalQuotes,
    devisARelancer.length,
    isPro,
    objectifActif,
    pendingQuotesCount,
    pipelineRevenueHT,
    setupIsRequired,
  ]);

  const quickLinks: QuickLinkItem[] = [
    {
      href: "/clients",
      label: "Clients",
      description: "Vos contacts, leur historique et leurs coordonnées.",
      icon: Users,
      tone: "violet",
      tourClass: "tour-clients",
    },
    {
      href: "/factures",
      label: "Factures",
      description: "Suivez les factures émises et le statut de paiement.",
      icon: FileCheck2,
      tone: "slate",
    },
    {
      href: "/catalogue",
      label: "Catalogue",
      description: "Prestations et matériaux réutilisables dans vos devis.",
      icon: Package,
      tone: "amber",
      tourClass: "tour-catalogue",
    },
    {
      href: "/calepin",
      label: "Calepin",
      description: "Capturez vos notes chantier sans sortir du flux.",
      icon: BriefcaseBusiness,
      tone: "violet",
    },
    {
      href: "/parametres",
      label: "Paramètres",
      description: "Logo, identité entreprise et réglages du compte.",
      icon: Settings,
      tone: "slate",
      tourClass: "tour-parametres",
    },
  ];

  const todayFocus = useMemo<DashboardSignal>(() => {
    if (setupIsRequired) {
      return {
        id: "setup-focus",
        title: "Activer le starter métier",
        description: "Configurez votre activité pour retrouver vos prix, packs et libellés dès le premier devis.",
        tone: "violet",
      };
    }

    if (totalQuotes === 0) {
      return {
        id: "empty-focus",
        title: "Créer le premier devis",
        description: "Le cockpit sera beaucoup plus clair dès que vous aurez une première vraie affaire en cours.",
        href: "/nouveau-devis",
        tone: "violet",
      };
    }

    if (devisARelancer.length > 0) {
      return {
        id: "followup-focus",
        title: "Relances à faire aujourd'hui",
        description: `${devisARelancer.length} devis attendent un rappel. C’est votre levier de conversion le plus direct.`,
        href: "/devis",
        tone: "rose",
      };
    }

    if (pendingQuotesCount > 0) {
      return {
        id: "pipeline-focus",
        title: "Pipeline chaud à suivre",
        description: `${formatCurrency(pipelineRevenueHT)} HT restent en attente de décision client.`,
        href: "/devis",
        tone: "amber",
      };
    }

    if (!isPro) {
      return {
        id: "upgrade-focus",
        title: "Passer en PRO",
        description: "Déverrouillez le flux complet pour ne plus rester limité au mode d’essai.",
        href: "/abonnement",
        tone: "violet",
      };
    }

    return {
      id: "steady-focus",
      title: "Cockpit sous contrôle",
      description: "Votre dashboard est propre. Vous pouvez vous concentrer sur le prochain devis ou le suivi client.",
      tone: "emerald",
    };
  }, [totalQuotes, devisARelancer.length, isPro, pendingQuotesCount, pipelineRevenueHT, setupIsRequired]);
  const secondarySignals = dashboardSignals.filter((signal) => signal.title !== todayFocus.title).slice(0, 2);
  const heroIndicators = useMemo<DashboardHeroIndicator[]>(() => {
    const indicators: DashboardHeroIndicator[] = [];

    if (devisARelancer.length > 0) {
      indicators.push({
        id: "hero-followups",
        label: "Relances",
        value: `${devisARelancer.length} à faire`,
        tone: "rose",
      });
    }

    indicators.push({
      id: "hero-pipeline",
      label: "Pipeline",
      value: formatCurrency(pipelineRevenueHT),
      tone: pendingQuotesCount > 0 ? "amber" : "slate",
    });

    indicators.push({
      id: "hero-goal",
      label: remainingToGoal > 0 ? "Cap restant" : "Objectif",
      value: remainingToGoal > 0 ? formatCurrency(remainingToGoal) : "Atteint",
      tone: remainingToGoal > 0 ? "violet" : "emerald",
    });

    return indicators.slice(0, 3);
  }, [devisARelancer.length, pendingQuotesCount, pipelineRevenueHT, remainingToGoal]);

  const actionPlan = useMemo<DashboardActionPlanItem[]>(() => {
    const items: DashboardActionPlanItem[] = [
      {
        id: "create-quote",
        eyebrow: "Action du jour",
        title: totalQuotes === 0 ? "Créer le premier devis" : "Lancer un nouveau devis",
        description:
          totalQuotes === 0
            ? "Commencez par une vraie affaire pour débloquer un cockpit beaucoup plus parlant."
            : "Le raccourci le plus direct pour nourrir votre pipeline sans fouiller dans les modules.",
        href: "/nouveau-devis",
        icon: Plus,
        tone: "violet",
        ctaLabel: "Créer maintenant",
      },
    ];

    if (devisARelancer.length > 0) {
      items.push({
        id: "follow-up",
        eyebrow: "Urgent",
        title: `${devisARelancer.length} relance${devisARelancer.length > 1 ? "s" : ""} à faire`,
        description: "Les devis laissés sans rappel sont votre perte la plus évitable. Traitez-les en priorité.",
        href: "/devis",
        icon: Bell,
        tone: "rose",
        value: String(devisARelancer.length),
        ctaLabel: "Voir les relances",
      });
    } else if (pendingQuotesCount > 0) {
      items.push({
        id: "pipeline",
        eyebrow: "À suivre",
        title: "Surveiller le pipe chaud",
        description: `${pendingQuotesCount} devis attendent encore une décision pour ${formatCurrency(pipelineRevenueHT)} HT.`,
        href: "/devis",
        icon: Clock3,
        tone: "amber",
        value: formatCurrency(pipelineRevenueHT),
        ctaLabel: "Ouvrir le pipe",
      });
    } else {
      items.push({
        id: "recent-quotes",
        eyebrow: "Suivi",
        title: "Garder vos devis sous contrôle",
        description: "Votre pipeline est propre. Utilisez la liste devis pour vérifier signatures, statuts et suivis clients.",
        href: "/devis",
        icon: FileText,
        tone: "emerald",
        value: `${totalQuotes}`,
        ctaLabel: "Ouvrir mes devis",
      });
    }

    if (tresorerie && tresorerie.enRetard > 0) {
      items.push({
        id: "overdue-invoices",
        eyebrow: "Priorité",
        title: `${formatCurrency(tresorerie.enRetard)} en retard de paiement`,
        description: `${tresorerie.nombreFactures - (tresorerie.encaisse > 0 ? 1 : 0)} facture${tresorerie.nombreFactures > 1 ? 's' : ''} impayée${tresorerie.nombreFactures > 1 ? 's' : ''}. Relancez les clients avant que ça traîne.`,
        href: "/factures",
        icon: TriangleAlert,
        tone: "rose",
        value: formatCurrency(tresorerie.enRetard),
        ctaLabel: "Voir les impayés",
      });
    }

    if (setupIsRequired) {
      items.push({
        id: "setup",
        eyebrow: "Setup",
        title: "Finaliser le starter métier",
        description: "Un seul passage ici pour récupérer vos libellés, packs et prix de départ plus bas dans la page.",
        href: "#dashboard-setup-panel",
        icon: BriefcaseBusiness,
        tone: "violet",
        ctaLabel: "Configurer",
      });
    } else if (!isPro) {
      items.push({
        id: "upgrade",
        eyebrow: "Croissance",
        title: "Déverrouiller le mode PRO",
        description: "Passez en PRO pour lever les limites d'essai et garder tout votre flux de vente actif.",
        href: "/abonnement",
        icon: Sparkles,
        tone: "violet",
        ctaLabel: "Voir l'abonnement",
      });
    } else {
      items.push({
        id: "goal",
        eyebrow: "Cap du mois",
        title: remainingToGoal > 0 ? "Rester au contact de l'objectif" : "Objectif atteint ce mois-ci",
        description:
          remainingToGoal > 0
            ? `${formatCurrency(remainingToGoal)} TTC restent à sécuriser pour atteindre votre cap mensuel.`
            : "Le cap mensuel est déjà atteint. Vous pouvez maintenant accélérer sur les prochaines signatures.",
        href: "/factures",
        icon: Target,
        tone: remainingToGoal > 0 ? "slate" : "emerald",
        value: remainingToGoal > 0 ? formatCurrency(remainingToGoal) : `${objectifProgress.toFixed(0)}%`,
        ctaLabel: remainingToGoal > 0 ? "Suivre mes encaissements" : "Voir les factures",
      });
    }

    return items;
  }, [
    devisARelancer.length,
    isPro,
    objectifProgress,
    pendingQuotesCount,
    pipelineRevenueHT,
    remainingToGoal,
    setupIsRequired,
    totalQuotes,
    tresorerie,
  ]);

  const actionPlanSecondary = actionPlan.slice(1, 3);

  return (
    <div className="tour-dashboard client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {runTour ? (
        <Joyride
          steps={steps}
          run={runTour}
          continuous
          showSkipButton
          showProgress
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: "#7c3aed",
              zIndex: 1000,
            },
          }}
          locale={{
            back: "Précédent",
            close: "Fermer",
            last: "Terminer",
            next: "Suivant",
            skip: "Passer",
          }}
        />
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pl-[272px]">
        <header className="client-panel sticky top-3 z-40 rounded-[2rem] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <ClientBrandMark showLabel={false} />

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/parametres"
                  className="tour-parametres inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Paramètres"
                >
                  <Settings size={20} />
                </Link>
                <DashboardNotificationsMenu
                  dashboardSignals={dashboardSignals}
                />
                <div className="inline-flex h-9 w-9 items-center justify-center">
                  {isLoaded && user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-6 md:flex">
            <div className="flex min-w-0 items-center gap-4">
              <ClientBrandMark />
              <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                Cockpit client
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-3">
              {/* Admin — réservé dans le layout même pendant le chargement */}
              <Link
                href="/admin"
                className={`inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100 ${
                  !isLoaded || !canAccessAdminDashboard ? "invisible pointer-events-none" : ""
                }`}
              >
                <ShieldCheck size={17} />
                <span>Admin</span>
              </Link>
              <ThemeToggle />
              <DashboardNotificationsMenu
                dashboardSignals={dashboardSignals}
              />
              {/* Avatar — image directe via useUser() */}
              {isLoaded && user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          </div>
        </header>

        <ClientDesktopNav active="dashboard" />

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          {!isLoaded ? (
            // Skeleton : aucun flash de contenu pendant le chargement Clerk
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
                <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-4 md:hidden">
            <motion.section
              {...sectionMotion(0)}
              className="client-panel-strong relative overflow-hidden rounded-[2rem] px-4 py-5"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_70%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                    <GreetingIcon size={14} />
                    {todayLabel}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                    <BriefcaseBusiness size={13} />
                    {starterTrade?.shortLabel || "Métier"}
                  </div>
                </div>

                <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Aujourd&apos;hui
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {greetingText}
                  {user?.firstName ? `, ${user.firstName}` : ""}.
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Le cockpit mobile va droit au but: une action utile, puis vos chiffres clés.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {heroIndicators.map((indicator) => (
                    <HeroIndicatorPill key={indicator.id} indicator={indicator} />
                  ))}
                </div>

                <div className="mt-4">
                  <FocusSignalCard signal={todayFocus} />
                </div>

                {secondarySignals.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {secondarySignals.map((signal) => (
                      <span
                        key={signal.id}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 ${toneClasses(signal.tone).chip}`}
                      >
                        {renderSignalIcon(signal.tone, 13)}
                        {signal.title}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Action principale
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Une action forte en tête, le reste plus bas.
                      </p>
                    </div>
                    <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                      {actionPlan.length} priorités
                    </span>
                  </div>

                  <div className="grid gap-3">
                    <DashboardActionCard item={actionPlan[0]} compact />
                    {actionPlanSecondary.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {actionPlanSecondary.map((item) => (
                          <DashboardActionCard key={item.id} item={item} compact />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              {...sectionMotion(0.06)}
              className="client-panel rounded-[1.9rem] p-4"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Chiffres clés
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Lecture rapide
                  </h2>
                </div>
                <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                  {totalQuotes} devis
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <CompactMetricCard
                  label="CA validé"
                  value={formatCurrency(acceptedRevenueHT)}
                  detail={`${acceptedQuotesCount} acceptés`}
                  tone="emerald"
                  icon={TrendingUp}
                />
                <CompactMetricCard
                  label="Pipeline"
                  value={formatCurrency(pipelineRevenueHT)}
                  detail={`${pendingQuotesCount} en attente`}
                  tone="amber"
                  icon={Clock3}
                />
                <CompactMetricCard
                  label="Relances"
                  value={String(devisARelancer.length)}
                  detail="À surveiller"
                  tone="rose"
                  icon={Bell}
                />
                <CompactMetricCard
                  label="Ticket moyen"
                  value={formatCurrency(averageTicket)}
                  detail={`${conversionRate}% conversion`}
                  tone="violet"
                  icon={LineChart}
                />
              </div>
            </motion.section>

            {setupIsRequired && selectedTradeDefinition ? (
              <MobileDisclosureSection
                title="Starter métier"
                description="Préparez votre activité une fois, puis revenez au chantier."
                badge={`${starterCatalogCount} en base`}
                defaultOpen
              >
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {TRADE_OPTIONS.map((option) => (
                      <TradeOptionCard
                        key={option.key}
                        option={option}
                        active={selectedTrade === option.key}
                        onSelect={setSelectedTrade}
                      />
                    ))}
                  </div>

                  <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {selectedTradeDefinition.label} prêt à démarrer
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {selectedTradeDefinition.pitch} {selectedStarterCount} prestations starter seront injectées dans votre catalogue.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={handleBootstrapTrade}
                      disabled={isBootstrappingTrade}
                      className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
                    >
                      {isBootstrappingTrade ? "Préparation..." : "Activer mon starter"}
                    </button>
                    <Link
                      href="/parametres"
                      className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                    >
                      Finaliser mes paramètres
                    </Link>
                  </div>
                </div>
              </MobileDisclosureSection>
            ) : null}

            <MobileDisclosureSection
              title="Pilotage semaine"
              description="Objectif, progression et tendance dans un seul bloc."
              badge={`${objectifProgress.toFixed(0)}%`}
            >
              <div className="space-y-4">
                {/* Activité de la semaine */}
                {semaine && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-violet-50 px-3 py-2.5 text-center dark:bg-violet-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-violet-500 dark:text-violet-400">Devis</p>
                      <p className="mt-1 text-lg font-black text-violet-700 dark:text-violet-300">{semaine.nouveauxDevis}</p>
                      <p className="text-[9px] text-violet-400 dark:text-violet-500">{semaine.devisAcceptes} accepté{semaine.devisAcceptes !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center dark:bg-emerald-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Factures</p>
                      <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300">{semaine.facturesEmises}</p>
                      <p className="text-[9px] text-emerald-400 dark:text-emerald-500">{semaine.facturesPayees} payée{semaine.facturesPayees !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center dark:bg-amber-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400">Encaissé</p>
                      <p className="mt-1 text-lg font-black text-amber-700 dark:text-amber-300">{formatCurrency(semaine.caEncaisse)}</p>
                      <p className="text-[9px] text-amber-400 dark:text-amber-500">{formatCurrency(semaine.depensesSemaine)} dép.</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 dark:border-white/8 dark:bg-white/4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Cap restant</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatCurrency(remainingToGoal)}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 dark:border-white/8 dark:bg-white/4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total TTC</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-3 py-4 dark:border-white/8 dark:bg-white/4 col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Objectif</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatCurrency(objectifActif)}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700"
                    style={{ width: `${objectifProgress}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setObjectifDraft(objectifActif.toString());
                    setObjectifDialogOpen(true);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                >
                  <Pencil size={14} />
                  Ajuster l&apos;objectif
                </button>

                <div className="h-56 overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-2 py-4 dark:border-white/8 dark:bg-white/4">
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <DashboardChart monthlyData={monthlyData} />
                  )}
                </div>
              </div>
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Relances"
              description="Les dossiers qui demandent un rappel."
              badge={devisARelancer.length}
            >
              {devisARelancer.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Pipeline propre</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Aucun devis âgé de plus de 7 jours n’attend une relance pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devisARelancer.slice(0, 3).map((item) => (
                    <Link href={`/devis/${item.numero}`} key={item.numero}>
                      <div className="rounded-[1.45rem] border border-rose-200/70 bg-rose-50/80 p-4 dark:border-rose-400/12 dark:bg-rose-500/8">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.nomClient}</p>
                        <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
                          {item.numero} · {formatDateLabel(item.date)}
                        </p>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.totalTTC || 0)} • en attente depuis plus de 7 jours.
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </MobileDisclosureSection>

            {/* Prochaines échéances */}
            <MobileDisclosureSection
              title="Prochaines échéances"
              description="Factures dont le paiement arrive bientôt."
              badge={echeances.length}
            >
              {echeances.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune échéance dans les 14 jours</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Tout est sous contrôle pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {echeances.slice(0, 5).map((ech) => (
                    <Link href={`/factures/${ech.numero}`} key={ech.numero}>
                      <div className={`rounded-[1.45rem] border p-4 transition hover:-translate-y-0.5 ${
                        ech.joursRestants <= 3
                          ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10"
                          : ech.joursRestants <= 7
                          ? "border-amber-200/70 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/10"
                          : "border-violet-200/70 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">{ech.nomClient}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{ech.numero}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(ech.totalTTC)}</p>
                            <p className={`text-xs font-semibold ${
                              ech.joursRestants <= 3 ? "text-rose-600 dark:text-rose-400" :
                              ech.joursRestants <= 7 ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"
                            }`}>
                              {ech.joursRestants === 0 ? "Aujourd'hui" : `J${ech.joursRestants > 0 ? '+' : ''}${ech.joursRestants}j`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Derniers devis"
              description="Vos affaires récentes, sans surcharge."
              badge={devisRecents.length}
            >
              {devisRecents.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucun devis récent</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Créez votre premier devis pour alimenter le cockpit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devisRecents.slice(0, 3).map((item) => (
                    <Link href={`/devis/${item.numero}`} key={item.numero}>
                      <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                              {item.nomClient}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {item.numero} · {formatDateLabel(item.date)}
                            </p>
                          </div>
                          <span className={`client-chip ring-1 ${statusBadgeClasses(item.statut)}`}>
                            {item.statut}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
                          {formatCurrency(item.totalTTC || 0)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Trésorerie"
              description="Factures encaissées, à venir et en retard."
              badge={tresorerie?.nombreFactures ?? 0}
            >
              {tresorerie?.nombreFactures === 0 || !tresorerie ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune facture</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Transformez vos devis acceptés en factures pour suivre votre trésorerie.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-[1.45rem] border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Encaissé</p>
                          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(tresorerie.encaisse)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.45rem] border border-violet-200/70 bg-violet-50/50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-violet-500/15 flex items-center justify-center">
                          <Clock3 size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">À encaisser</p>
                          <p className="text-lg font-bold text-violet-800 dark:text-violet-200">
                            {formatCurrency(tresorerie.aEncaisser)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-[1.45rem] border p-4 ${tresorerie.enRetard > 0 ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10" : "border-slate-200/70 bg-slate-50/50 dark:border-white/8 dark:bg-white/4"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tresorerie.enRetard > 0 ? "bg-rose-500/15" : "bg-slate-500/15"}`}>
                          <TriangleAlert size={16} className={tresorerie.enRetard > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"} />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${tresorerie.enRetard > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>En retard</p>
                          <p className={`text-lg font-bold ${tresorerie.enRetard > 0 ? "text-rose-800 dark:text-rose-200" : "text-slate-400"}`}>
                            {formatCurrency(tresorerie.enRetard)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Recouvrement</p>
                        <p className={`text-lg font-bold ${tresorerie.tauxRecouvrement >= 80 ? "text-emerald-600 dark:text-emerald-400" : tresorerie.tauxRecouvrement >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {tresorerie.tauxRecouvrement}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Bénéfice net"
              description="Ce qu'il vous reste dans la poche après les dépenses."
            >
              {!benefice || (benefice.caFacture === 0 && benefice.depenses === 0) ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Pas encore de données</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Payez vos premières factures et enregistrez des dépenses pour calculer votre bénéfice.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Bénéfice net */}
                  <div className={`rounded-[1.45rem] border p-5 ${
                    benefice.beneficeNet >= 0
                      ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-transparent"
                      : "border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-rose-100/40 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-transparent"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${
                          benefice.beneficeNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}>Bénéfice net</p>
                        <p className={`text-3xl font-bold mt-1 ${
                          benefice.beneficeNet >= 0 ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200"
                        }`}>
                          {benefice.beneficeNet >= 0 ? "+" : ""}{formatCurrency(benefice.beneficeNet)}
                        </p>
                      </div>
                      <div className={`rounded-full px-4 py-2 text-sm font-bold ${
                        benefice.margePct >= 70
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : benefice.margePct >= 40
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                      }`}>
                        {benefice.margePct}% marge
                      </div>
                    </div>
                  </div>
                  {/* Détail */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.2rem] border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-500/10 dark:bg-emerald-500/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">CA encaissé</p>
                      <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(benefice.caFacture)}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-rose-200/50 bg-rose-50/50 p-3 dark:border-rose-500/10 dark:bg-rose-500/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Dépenses</p>
                      <p className="mt-1 text-lg font-bold text-rose-800 dark:text-rose-200">{formatCurrency(benefice.depenses)}</p>
                    </div>
                  </div>
                </div>
              )}
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Top Clients"
              description="Vos meilleurs clients par chiffre d'affaires."
              badge={topClients.length}
            >
              {topClients.length === 0 ? (
                <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Pas encore de données</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Acceptez vos premiers devis pour voir vos meilleurs clients apparaître ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topClients.map((client, i) => (
                    <div
                      key={client.nom}
                      className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{client.nom}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {client.devisCount} devis{client.devisCount > 1 ? 's' : ''} acceptés
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(client.revenueHT)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MobileDisclosureSection>

            <MobileDisclosureSection
              title="Modules de travail"
              description="Le reste de la boîte à outils, rangé plus bas."
              badge={`${quickLinks.length} accès`}
            >
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((item) => (
                  <QuickLinkCard key={item.href} item={item} />
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <ClientSupportButton />
                {!isPro ? (
                  <Link
                    href="/abonnement"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                  >
                    <Sparkles size={16} />
                    Passer en PRO
                  </Link>
                ) : null}
                {canAccessAdminDashboard ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-violet-300/50 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                  >
                    <ShieldCheck size={16} />
                    Ouvrir le cockpit admin
                  </Link>
                ) : null}
              </div>
            </MobileDisclosureSection>
          </div>

          <motion.section
            {...sectionMotion(0)}
            className="hidden items-start gap-4 md:grid xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]"
          >
            {/* Colonne Principale (Gauche) */}
            <div className="space-y-4">
              {/* Hero panel */}
              <div className="client-panel-strong relative overflow-hidden rounded-[2rem] px-5 py-6 sm:px-6 lg:px-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_70%)]" />
              <div className="pointer-events-none absolute -right-16 top-12 h-40 w-40 rounded-full bg-fuchsia-500/14 blur-[80px]" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-orange-400/10 blur-[70px]" />

              <div className="relative max-w-4xl space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-[0.24em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                    <GreetingIcon size={15} />
                    {todayLabel}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-xs font-semibold tracking-[0.24em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                    <BriefcaseBusiness size={14} />
                    {starterTrade?.shortLabel || "Métier à définir"}
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                    {dashboardSignals.length} signal{dashboardSignals.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Cockpit du jour
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[3.05rem]">
                    {greetingText}
                    {user?.firstName ? `, ${user.firstName}` : ""}.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    Le desktop revient à l’essentiel : une priorité claire, vos actions directes, puis le suivi business plus bas.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-white/55 bg-white/78 p-5 shadow-[0_30px_80px_-46px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-white/6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Priorité du jour</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        {todayFocus.title}
                      </h2>
                    </div>
                    <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                      Focus
                    </span>
                  </div>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {todayFocus.description}
                  </p>

                  {todayFocus.href ? (
                    <Link
                      href={todayFocus.href}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                    >
                      Ouvrir l&apos;action
                      <ChevronRight size={16} />
                    </Link>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/nouveau-devis" className="tour-nouveau-devis">
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_22px_60px_-30px_rgba(124,58,237,0.65)]"
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
                    Ouvrir mes devis
                  </Link>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {heroIndicators.map((indicator) => (
                    <HeroIndicatorPill key={indicator.id} indicator={indicator} />
                  ))}
                </div>
              </div>
            </div>

            {/* KPI */}
            <div className="client-panel rounded-[2.15rem] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Chiffres clés</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Lecture rapide
                  </h2>
                </div>
                <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                  {totalQuotes} devis
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="CA validé"
                  value={formatCurrency(acceptedRevenueHT)}
                  detail={`${acceptedQuotesCount} devis acceptés`}
                  tone="emerald"
                  icon={TrendingUp}
                />
                <MetricCard
                  label="Pipeline"
                  value={formatCurrency(pipelineRevenueHT)}
                  detail={`${pendingQuotesCount} devis en attente`}
                  tone="amber"
                  icon={Clock3}
                />
                <MetricCard
                  label="Relances"
                  value={String(devisARelancer.length)}
                  detail="Clients à relancer cette semaine"
                  tone="rose"
                  icon={Bell}
                />
                <MetricCard
                  label="Ticket moyen"
                  value={formatCurrency(averageTicket)}
                  detail={`${conversionRate}% de conversion sur les devis suivis`}
                  tone="violet"
                  icon={LineChart}
                />
              </div>
            </div>

            {/* Stats conversion + Funnel — fusionnés */}
            {avgResponseDays > 0 && (
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Target size={18} className="text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Stats de conversion</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard
                  label="Délai moyen de réponse"
                  value={`${avgResponseDays}j`}
                  detail="Entre création et décision client"
                  tone="slate"
                  icon={Clock3}
                />
                <MetricCard
                  label="Revenu perdu (6 mois)"
                  value={formatCurrency(lostRevenueHT)}
                  detail={`${refusedQuotesCount} devis refusés`}
                  tone="rose"
                  icon={XCircle}
                />
                <MetricCard
                  label="Taux de conversion"
                  value={`${conversionRate}%`}
                  detail={`${acceptedQuotesCount}/${totalQuotes} devis acceptés`}
                  tone="emerald"
                  icon={Target}
                />
              </div>
              </div>
            )}

            {/* Performance (Stats + Funnel) */}
            <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Target size={18} className="text-violet-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Performance</h3>
              </div>

              {avgResponseDays > 0 && (
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Objectif</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Pilotage mensuel
                  </h2>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm dark:border-white/8 dark:bg-white/4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Progression</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{objectifProgress.toFixed(0)}%</p>
                </div>
              </div>

              {/* Activité de la semaine */}
              {semaine && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-violet-200/60 bg-violet-50/50 px-4 py-4 text-center dark:border-violet-500/20 dark:bg-violet-500/10">
                    <p className="text-[10px] uppercase tracking-wider text-violet-500 dark:text-violet-400">Devis</p>
                    <p className="mt-1 text-2xl font-black text-violet-700 dark:text-violet-300">{semaine.nouveauxDevis}</p>
                    <p className="text-xs text-violet-400 dark:text-violet-500">{semaine.devisAcceptes} accepté{semaine.devisAcceptes !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-4 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Factures</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">{semaine.facturesEmises}</p>
                    <p className="text-xs text-emerald-400 dark:text-emerald-500">{semaine.facturesPayees} payée{semaine.facturesPayees !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-4 text-center dark:border-amber-500/20 dark:bg-amber-500/10">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-amber-400">Encaissé</p>
                    <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(semaine.caEncaisse)}</p>
                    <p className="text-xs text-amber-400 dark:text-amber-500">{formatCurrency(semaine.depensesSemaine)} dép.</p>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Cap restant</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(remainingToGoal)}</p>
                    </div>
                    <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total TTC</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                    </div>
                    <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Objectif</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(objectifActif)}</p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700"
                      style={{ width: `${objectifProgress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{formatCurrency(CA_TTC)} encaissable / produit</span>
                    <button
                      type="button"
                      onClick={() => {
                        setObjectifDraft(objectifActif.toString());
                        setObjectifDialogOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                    >
                      <Pencil size={14} />
                      Ajuster l&apos;objectif
                    </button>
                  </div>

                  <div className="mt-5 h-64 w-full overflow-hidden rounded-[1.9rem] border border-slate-200/70 bg-white/75 px-2 py-4 dark:border-white/8 dark:bg-white/4">
                    {loading ? (
                      <ChartSkeleton />
                    ) : (
                      <DashboardChart monthlyData={monthlyData} />
                    )}
                  </div>
              </div>

              {/* Derniers devis */}
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Derniers devis</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Affaires récentes
                    </h2>
                  </div>
                  <Link
                    href="/devis"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-800 dark:text-violet-200 dark:hover:text-white">
                    Voir tous
                    <ChevronRight size={16} />
                  </Link>
                </div>

                  {loading ? (
                    <div className="mt-5 space-y-3">
                      {[1, 2, 3].map((item) => (
                        <DevisCardSkeleton key={item} />
                      ))}
                    </div>
                  ) : devisRecents.length === 0 ? (
                    <div className="mt-5 rounded-[1.7rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-5 py-10 text-center dark:border-white/10 dark:bg-white/4">
                      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                        <Sparkles size={24} />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                        Le cockpit attend votre premier devis
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Lancez votre première création pour alimenter le suivi d&apos;activité, les relances et les statistiques.
                      </p>
                      <Link href="/nouveau-devis" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-brand">
                        <Plus size={16} />
                        Créer mon premier devis
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 xl:grid-cols-2">
                      {devisRecents.map((item) => (
                        <Link href={`/devis/${item.numero}`} key={item.numero}>
                          <div className="rounded-[1.55rem] border border-slate-200/70 bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-violet-300/50 dark:border-white/8 dark:bg-white/4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                                  <LineChart size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                    {item.nomClient}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {item.numero} · {formatDateLabel(item.date)}
                                  </p>
                                </div>
                              </div>
                              <span className={`client-chip ring-1 ${statusBadgeClasses(item.statut)}`}>
                                {item.statut}
                              </span>
                            </div>
                            <div className="mt-5 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Montant TTC</p>
                                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                                  {formatCurrency(item.totalTTC || 0)}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-200">
                                Ouvrir
                                <ChevronRight size={16} />
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Colonne Secondaire (Droite) */}
            <div className="space-y-4 xl:self-start">
              {/* Actions prioritaires */}
              <div className="client-panel rounded-[2.2rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Actions</p>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                    {actionPlan.length} priorités
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  <DashboardActionCard item={actionPlan[0]} compact />
                  {actionPlanSecondary.length > 0 ? (
                    <div className="grid gap-3">
                      {actionPlanSecondary.map((item) => (
                        <DashboardActionCard key={item.id} item={item} compact />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Relances */}
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Relances</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      À traiter sans tarder
                    </h2>
                  </div>
                  <span className="client-chip bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-200 dark:ring-rose-400/20">
                    {devisARelancer.length}
                  </span>
                </div>

                {devisARelancer.length === 0 ? (
                  <div className="mt-4 rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
                    <FileCheck2 size={20} className="mx-auto text-emerald-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Pipeline propre</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {devisARelancer.slice(0, 3).map((item) => (
                      <Link href={`/devis/${item.numero}`} key={item.numero}>
                        <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 p-3 transition hover:border-rose-400/20 dark:border-rose-400/12 dark:bg-rose-500/8">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                {item.nomClient}
                              </p>
                              <p className="text-xs text-rose-700 dark:text-rose-200">
                                {item.numero} · {formatDateLabel(item.date)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-slate-950 dark:text-white">
                              {formatCurrency(item.totalTTC || 0)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {devisARelancer.length > 3 && (
                      <Link href="/devis" className="text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                        Voir les {devisARelancer.length} relances →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Trésorerie */}
              {tresorerie && tresorerie.nombreFactures > 0 && (
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Trésorerie</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      État de vos factures
                    </h2>
                  </div>
                  <span className={`client-chip ring-1 ${
                    tresorerie.tauxRecouvrement >= 80
                      ? "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-100 dark:ring-emerald-400/20"
                      : tresorerie.tauxRecouvrement >= 50
                      ? "bg-amber-500/12 text-amber-700 ring-amber-300/40 dark:bg-amber-500/12 dark:text-amber-100 dark:ring-amber-400/20"
                      : "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-100 dark:ring-rose-400/20"
                  }`}>
                    {tresorerie.tauxRecouvrement}% rec.
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {/* Encaissé */}
                    <div className="rounded-[1.45rem] border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Encaissé</p>
                          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(tresorerie.encaisse)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* À encaisser */}
                    <div className="rounded-[1.45rem] border border-violet-200/70 bg-violet-50/50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-violet-500/15 flex items-center justify-center">
                          <Clock3 size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">À encaisser</p>
                          <p className="text-xl font-bold text-violet-800 dark:text-violet-200">
                            {formatCurrency(tresorerie.aEncaisser)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* En retard */}
                    <div className={`rounded-[1.45rem] border p-4 ${
                      tresorerie.enRetard > 0
                        ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10"
                        : "border-slate-200/70 bg-slate-50/50 dark:border-white/8 dark:bg-white/4"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                          tresorerie.enRetard > 0 ? "bg-rose-500/15" : "bg-slate-500/15"
                        }`}>
                          <TriangleAlert size={16} className={tresorerie.enRetard > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                            tresorerie.enRetard > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                          }`}>En retard</p>
                          <p className={`text-xl font-bold ${
                            tresorerie.enRetard > 0 ? "text-rose-800 dark:text-rose-200" : "text-slate-400"
                          }`}>
                            {formatCurrency(tresorerie.enRetard)}
                          </p>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
              )}

              {/* Bénéfice net */}
              {benefice && (benefice.caFacture > 0 || benefice.depenses > 0) && (
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Bénéfice net</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Votre résultat
                    </h2>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                    benefice.margePct >= 70
                      ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-100 dark:ring-emerald-400/20"
                      : benefice.margePct >= 40
                      ? "bg-amber-500/12 text-amber-700 ring-1 ring-amber-300/40 dark:bg-amber-500/12 dark:text-amber-100 dark:ring-amber-400/20"
                      : "bg-rose-500/12 text-rose-700 ring-1 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-100 dark:ring-rose-400/20"
                  }`}>
                    {benefice.margePct}% marge
                  </span>
                </div>

                <div className={`mt-4 rounded-[1.45rem] border p-4 ${benefice.beneficeNet >= 0 ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-transparent" : "border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-rose-100/40 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-transparent"}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${benefice.beneficeNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>Bénéfice net</p>
                  <p className={`mt-1 text-3xl font-bold ${benefice.beneficeNet >= 0 ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200"}`}>
                    {benefice.beneficeNet >= 0 ? "+" : ""}{formatCurrency(benefice.beneficeNet)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-200/50 bg-white/60 p-3 dark:border-emerald-500/10 dark:bg-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">CA encaissé</p>
                      <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(benefice.caFacture)}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200/50 bg-white/60 p-3 dark:border-rose-500/10 dark:bg-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Dépenses</p>
                      <p className="mt-1 text-lg font-bold text-rose-800 dark:text-rose-200">{formatCurrency(benefice.depenses)}</p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Échéances */}
              {echeances.length > 0 && (
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Échéances</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Prochains paiements
                    </h2>
                  </div>
                  <span className="client-chip bg-amber-500/12 text-amber-700 ring-amber-300/40 dark:bg-amber-500/12 dark:text-amber-100 dark:ring-amber-400/20">
                    {echeances.length}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {echeances.slice(0, 4).map((ech) => (
                    <Link key={ech.numero} href={`/factures/${ech.numero}`}>
                      <div className={`rounded-xl border p-3 transition hover:-translate-y-0.5 ${
                        ech.joursRestants <= 3
                          ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10"
                          : ech.joursRestants <= 7
                          ? "border-amber-200/70 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/10"
                          : "border-violet-200/70 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/10"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">{ech.nomClient}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{ech.numero}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(ech.totalTTC)}</p>
                            <p className={`text-xs font-semibold ${
                              ech.joursRestants <= 3 ? "text-rose-600 dark:text-rose-400" :
                              ech.joursRestants <= 7 ? "text-amber-600 dark:text-amber-400" :
                              "text-violet-600 dark:text-violet-400"
                            }`}>
                              {ech.joursRestants === 0 ? "Aujourd'hui" : `J+${ech.joursRestants}j`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              )}

              {/* Top Clients */}
              {topClients.length > 0 && (
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Top Clients</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Meilleurs clients
                    </h2>
                  </div>
                  <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                    Top {Math.min(topClients.length, 5)}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {topClients.slice(0, 5).map((client) => (
                    <div
                      key={client.nom}
                      className="rounded-xl border border-slate-200/70 bg-white/75 p-3 transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{client.nom}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {client.devisCount} devis{client.devisCount > 1 ? 's' : ''} acceptés
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(client.revenueHT)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Starter métier */}
              {setupIsRequired && selectedTradeDefinition ? (
              <div
                id="dashboard-setup-panel"
                className="client-panel rounded-[2.1rem] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Starter métier</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Branchez votre activité
                    </h2>
                  </div>
                  <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                    {starterCatalogCount} ligne{starterCatalogCount > 1 ? "s" : ""} en base
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {TRADE_OPTIONS.map((option) => (
                    <TradeOptionCard
                      key={option.key}
                      option={option}
                      active={selectedTrade === option.key}
                      onSelect={setSelectedTrade}
                    />
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedTradeDefinition.label} prêt à démarrer</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {selectedTradeDefinition.pitch} {selectedStarterCount} prestations starter injectées.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleBootstrapTrade}
                      disabled={isBootstrappingTrade}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
                    >
                      {isBootstrappingTrade ? "Préparation..." : "Activer mon starter"}
                    </button>
                    <Link
                      href="/parametres"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                    >
                      Finaliser mes paramètres
                    </Link>
                  </div>
                </div>
              </div>
              ) : null}

              {/* Modules */}
              <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Modules</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                      Accès rapides
                    </h2>
                  </div>
                  <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                    {quickLinks.length} accès
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {quickLinks.map((item) => (
                    <QuickLinkCard key={item.href} item={item} />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ClientSupportButton />
                  {!isPro && (
                    <Link
                      href="/abonnement"
                      className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                    >
                      <Sparkles size={16} />
                      Passer en PRO
                    </Link>
                  )}
                  {canAccessAdminDashboard && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                    >
                      <ShieldCheck size={16} />
                      Ouvrir le cockpit admin
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
          </>
          )}
        </main>
      </div>

      <ClientMobileDock active="dashboard" />

      <MobileDialog
        open={objectifDialogOpen}
        onClose={() => setObjectifDialogOpen(false)}
        title="Objectif mensuel"
        description="Ajustez votre cap sans quitter le cockpit. Le montant est enregistré pour vos prochains retours de progression."
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setObjectifDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpdateObjectif}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
            >
              Enregistrer
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[1.4rem] border border-violet-200/70 bg-violet-50/80 px-4 py-4 dark:border-violet-400/20 dark:bg-violet-500/10">
            <p className="text-[11px] uppercase tracking-[0.24em] text-violet-700 dark:text-violet-100">
              Cap actuel
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              {formatCurrency(objectifActif)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Mettez à jour votre objectif pour ajuster le suivi de progression affiché dans le dashboard.
            </p>
          </div>

          <label className="block text-sm font-semibold text-slate-950 dark:text-white">
            Nouvel objectif mensuel (€)
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="100"
              value={objectifDraft}
              onChange={(event) => setObjectifDraft(event.target.value)}
              className="mt-2 w-full rounded-[1.25rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
              placeholder="5000"
            />
          </label>
        </div>
      </MobileDialog>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50 sm:bottom-8 sm:right-8">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 16 }}
              className="mb-3 flex flex-col items-end gap-2"
            >
              {[
                { href: "/nouveau-devis", icon: FileText, label: "Nouveau devis", color: "bg-violet-600" },
                { href: "/nouvelle-facture", icon: Receipt, label: "Nouvelle facture", color: "bg-emerald-600" },
                { href: "/clients?new=1", icon: Users, label: "Nouveau client", color: "bg-blue-600" },
                { href: "/depenses?new=1", icon: CreditCard, label: "Nouvelle dépense", color: "bg-amber-600" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} onClick={() => setFabOpen(false)}>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg dark:bg-slate-800"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{action.label}</span>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${action.color}`}>
                        <Icon size={16} className="text-white" />
                      </div>
                    </motion.button>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setFabOpen(!fabOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-xl shadow-violet-500/30 transition ${
            fabOpen ? "rotate-45" : ""
          }`}
        >
          <Plus size={24} />
        </motion.button>
      </div>
    </div>
  );
}
