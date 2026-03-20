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
  TriangleAlert,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";
import useSWR from "swr";
import { UserButton, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ClientBrandMark,
  ClientDesktopNav,
  ClientMobileDock,
  ClientSupportButton,
} from "@/components/client-shell";
import type { ClientDashboardMonthlyDatum, ClientDashboardSummary } from "@/lib/client-dashboard";
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

type QuickLinkItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
  tourClass?: string;
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


function DashboardNotificationsMenu({
  dashboardSignals,
  onToggle,
  onClose,
  showNotifications,
}: {
  dashboardSignals: DashboardSignal[];
  onToggle: () => void;
  onClose: () => void;
  showNotifications: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {dashboardSignals.length > 0 && (
          <span className="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" />
        )}
      </button>

      {showNotifications && (
        <div className="client-panel absolute right-0 top-14 z-50 w-[min(92vw,24rem)] rounded-[1.75rem] p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Attention du jour</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Les points qui méritent un coup d&apos;œil.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {dashboardSignals.map((signal) => {
              const classes = toneClasses(signal.tone);
              const content = (
                <div className="rounded-[1.4rem] border border-slate-200/70 bg-white/70 p-3 dark:border-white/8 dark:bg-white/4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
                      {renderSignalIcon(signal.tone)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{signal.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {signal.description}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return signal.href ? (
                <Link key={signal.id} href={signal.href} onClick={onClose}>
                  {content}
                </Link>
              ) : (
                <div key={signal.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
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
      keepPreviousData: true,
      dedupingInterval: 15000,
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [runTour, setRunTour] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("zolio_has_seen_tour");
  });
  const [currentHour] = useState(() => new Date().getHours());

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
    const newVal = prompt(
      "Entrez votre nouvel objectif mensuel (en €) :",
      objectifActif.toString(),
    );
    const parsed = Number(newVal);

    if (newVal && !Number.isNaN(parsed) && parsed > 0) {
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
      } catch {
        alert("Erreur lors de la sauvegarde de l'objectif.");
      }
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
  const acceptedRevenueHT = dashboardData?.acceptedRevenueHT ?? 0;
  const pipelineRevenueHT = dashboardData?.pipelineRevenueHT ?? 0;
  const conversionRate = dashboardData?.conversionRate ?? 0;
  const averageTicket = dashboardData?.averageTicket ?? 0;
  const objectifProgress = objectifActif > 0 ? Math.min((CA_TTC / objectifActif) * 100, 100) : 0;
  const remainingToGoal = Math.max(objectifActif - CA_TTC, 0);
  const devisRecents = dashboardData?.recentQuotes ?? [];
  const devisARelancer = dashboardData?.followUpQuotes ?? [];
  const monthlyData: ClientDashboardMonthlyDatum[] = dashboardData?.monthlyData ?? [];

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

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
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
                  onToggle={() => setShowNotifications((value) => !value)}
                  onClose={() => setShowNotifications(false)}
                  showNotifications={showNotifications}
                />
                <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-violet-200/60 dark:bg-white/8 dark:ring-white/10">
                  {isLoaded ? <UserButton /> : <User size={18} />}
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
              <ClientSupportButton compact />
              {canAccessAdminDashboard && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                >
                  <ShieldCheck size={17} />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/parametres"
                className="tour-parametres inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
              >
                <Settings size={16} />
                Paramètres
              </Link>
              <ThemeToggle />
              <DashboardNotificationsMenu
                dashboardSignals={dashboardSignals}
                onToggle={() => setShowNotifications((value) => !value)}
                onClose={() => setShowNotifications(false)}
                showNotifications={showNotifications}
              />
              <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-violet-200/60 dark:bg-white/8 dark:ring-white/10">
                {isLoaded ? <UserButton /> : <User size={18} />}
              </div>
            </div>
          </div>
        </header>

        <ClientDesktopNav active="dashboard" />

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          <motion.section
            {...sectionMotion(0)}
            className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(21rem,0.72fr)]"
          >
            <div className="client-panel-strong relative overflow-hidden rounded-[2.35rem] px-5 py-6 sm:px-6 lg:px-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_70%)]" />
              <div className="pointer-events-none absolute -right-16 top-12 h-40 w-40 rounded-full bg-fuchsia-500/14 blur-[80px]" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-orange-400/10 blur-[70px]" />

              <div className="relative max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-[0.24em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                    <GreetingIcon size={15} />
                    {todayLabel}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/72 px-3 py-1.5 text-xs font-semibold tracking-[0.24em] text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-200">
                    <BriefcaseBusiness size={14} />
                    {starterTrade?.shortLabel || "Métier à définir"}
                  </div>
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[3.15rem]">
                  {greetingText}
                  {user?.firstName ? `, ${user.firstName}` : ""}.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  Un accueil plus simple: l’action utile maintenant, les chiffres ensuite, puis les modules plus bas sans vous perdre dans des cartes répétées.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
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
              </div>
            </div>

            <div className="client-panel rounded-[2.2rem] p-5 sm:p-6 xl:self-start">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Focus du jour</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {todayFocus.title}
                  </h2>
                </div>
                <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                  {dashboardSignals.length} signal{dashboardSignals.length > 1 ? "s" : ""}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
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

              {secondarySignals.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {secondarySignals.map((signal) => (
                    <FocusSignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.55rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-5 dark:border-white/10 dark:bg-white/4">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucun second signal à traiter</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Le cockpit reste simple: un seul focus principal pour avancer sans dispersion.
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            {...sectionMotion(0.08)}
            className="client-panel rounded-[2.15rem] p-5 sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Chiffres clés</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Les chiffres à lire sans détour
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Une seule ligne KPI, sans doublon avec le hero.
                </p>
              </div>
              <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                {totalQuotes} devis monitorés
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          </motion.section>

          <motion.section
            {...sectionMotion(0.16)}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Pilotage & modules</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Le reste du cockpit, rangé plus bas
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ici seulement: progression, relances détaillées, setup métier et accès aux modules.
                </p>
              </div>
              <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                {quickLinks.length} modules clés
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <div className="space-y-4">
                {setupIsRequired && selectedTradeDefinition && (
                  <div
                    id="dashboard-setup-panel"
                    className="client-panel rounded-[2.1rem] p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Starter métier</p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                          Branchez votre activité une fois
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Ce setup reste ici pour ne plus concurrencer l’action du jour en haut de page.
                        </p>
                      </div>
                      <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                        {starterCatalogCount} ligne{starterCatalogCount > 1 ? "s" : ""} déjà en base
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {TRADE_OPTIONS.map((option) => (
                        <TradeOptionCard
                          key={option.key}
                          option={option}
                          active={selectedTrade === option.key}
                          onSelect={setSelectedTrade}
                        />
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedTradeDefinition.label} prêt à démarrer</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {selectedTradeDefinition.pitch} {selectedStarterCount} prestations starter seront injectées dans le catalogue.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleBootstrapTrade}
                          disabled={isBootstrappingTrade}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
                        >
                          {isBootstrappingTrade ? "Préparation..." : "Activer mon starter"}
                        </button>
                        <Link
                          href="/parametres"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                        >
                          Finaliser mes paramètres
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Pilotage semaine</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Vision chiffre d&apos;affaires
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Le cap mensuel n’apparaît plus qu’ici, avec la progression et la tendance.
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-white/4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Progression</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{objectifProgress.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                      onClick={handleUpdateObjectif}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                    >
                      <Pencil size={14} />
                      Ajuster l&apos;objectif
                    </button>
                  </div>

                  <div className="mt-5 h-64 w-full overflow-hidden rounded-[1.9rem] border border-slate-200/70 bg-white/75 px-2 py-4 dark:border-white/8 dark:bg-white/4">
                    {loading ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                        Chargement du graphique…
                      </div>
                    ) : (
                      <DashboardChart monthlyData={monthlyData} />
                    )}
                  </div>
                </div>

                <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Derniers devis</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Les affaires les plus récentes
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Une lecture plus simple : client, statut, montant, puis ouverture directe.
                      </p>
                    </div>
                    <Link
                      href="/devis"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-800 dark:text-violet-200 dark:hover:text-white"
                    >
                      Voir tous les devis
                      <ChevronRight size={16} />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="mt-5 space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="animate-shimmer rounded-[1.6rem] border border-slate-200/70 bg-white/70 p-4 dark:border-white/8 dark:bg-white/4"
                        >
                          <div className="h-4 w-1/3 rounded bg-slate-100/90 dark:bg-white/10" />
                          <div className="mt-3 h-3 w-1/2 rounded bg-slate-100/70 dark:bg-white/10" />
                        </div>
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

              <div className="space-y-4">
                <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Relances</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        À traiter sans tarder
                      </h2>
                    </div>
                    <span className="client-chip bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-200 dark:ring-rose-400/20">
                      {devisARelancer.length}
                    </span>
                  </div>

                  {devisARelancer.length === 0 ? (
                    <div className="mt-5 rounded-[1.65rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-5 py-8 text-center dark:border-white/10 dark:bg-white/4">
                      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-300/30 dark:text-emerald-300 dark:ring-emerald-400/20">
                        <FileCheck2 size={22} />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Pipeline propre</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Aucun devis âgé de plus de 7 jours n&apos;attend une relance pour le moment.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {devisARelancer.map((item) => (
                        <Link href={`/devis/${item.numero}`} key={item.numero}>
                          <div className="rounded-[1.45rem] border border-rose-200/70 bg-rose-50/80 p-4 transition hover:-translate-y-0.5 dark:border-rose-400/12 dark:bg-rose-500/8">
                            <div className="flex items-start gap-3">
                              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-rose-600 ring-1 ring-rose-200/80 dark:bg-white/10 dark:text-rose-200 dark:ring-white/10">
                                <Bell size={17} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                      {item.nomClient}
                                    </p>
                                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
                                      {item.numero} · {formatDateLabel(item.date)}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                                    {formatCurrency(item.totalTTC || 0)}
                                  </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  En attente depuis plus de 7 jours. Un rappel rapide peut faire la différence.
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="client-panel rounded-[2.1rem] p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Modules de travail</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Les outils utiles, plus bas et mieux rangés
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Les accès `Clients`, `Factures`, `Calepin` et `Paramètres` restent visibles, mais ne prennent plus la priorité sur l’accueil.
                      </p>
                    </div>
                    <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                      {quickLinks.length} accès directs
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {quickLinks.map((item) => (
                      <QuickLinkCard key={item.href} item={item} />
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
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
            </div>
          </motion.section>
        </main>
      </div>

      <ClientMobileDock active="dashboard" />
    </div>
  );
}
