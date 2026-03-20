"use client";

import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
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
  Wallet,
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
  ClientMobileDock,
  ClientSupportButton,
} from "@/components/client-shell";
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

type DevisItem = {
  numero: string;
  client: string;
  nomClient: string;
  emailClient: string;
  date: string;
  statut: string;
  totalHT: string;
  totalTTC: string;
};

type AdminViewerData = {
  isAdmin?: boolean;
};

type CatalogItem = {
  id: string;
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

type MonthlyDatum = {
  name: string;
  CA: number;
};

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

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
  const { data, isLoading } = useSWR<DevisItem[]>("/api/devis", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const { data: adminViewerData } = useSWR<AdminViewerData>(isLoaded ? "/api/admin/me" : null, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const { data: prestationsData, mutate: mutatePrestations } = useSWR<CatalogItem[]>(
    isLoaded ? "/api/prestations" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const devis = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const catalogueItems = useMemo(() => (Array.isArray(prestationsData) ? prestationsData : []), [prestationsData]);
  const loading = isLoading && !data;
  const canAccessAdminDashboard =
    user?.publicMetadata?.isAdmin === true || adminViewerData?.isAdmin === true;
  const isPro = user?.publicMetadata?.isPro === true;
  const companyTrade = readStringMetadata(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const starterCatalogImported = readBooleanMetadata(
    user?.unsafeMetadata?.starterCatalogImported || user?.publicMetadata?.starterCatalogImported,
  );
  const onboardingCompleted = readBooleanMetadata(
    user?.unsafeMetadata?.onboardingCompleted || user?.publicMetadata?.onboardingCompleted,
  );
  const starterCatalogCount = catalogueItems.length;
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
  const [todayMs] = useState(() => Date.now());

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

      await mutatePrestations();
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

  const CA_HT = useMemo(
    () => devis.reduce((sum, item) => sum + (Number.parseFloat(item.totalHT) || 0), 0),
    [devis],
  );
  const CA_TTC = useMemo(
    () => devis.reduce((sum, item) => sum + (Number.parseFloat(item.totalTTC) || 0), 0),
    [devis],
  );
  const acceptedQuotes = useMemo(
    () => devis.filter((item) => item.statut === "Accepté"),
    [devis],
  );
  const pendingQuotes = useMemo(
    () =>
      devis.filter(
        (item) => item.statut === "En attente" || item.statut === "En attente (Modifié)",
      ),
    [devis],
  );
  const acceptedRevenueHT = useMemo(
    () =>
      acceptedQuotes.reduce((sum, item) => sum + (Number.parseFloat(item.totalHT) || 0), 0),
    [acceptedQuotes],
  );
  const pipelineRevenueHT = useMemo(
    () =>
      pendingQuotes.reduce((sum, item) => sum + (Number.parseFloat(item.totalHT) || 0), 0),
    [pendingQuotes],
  );
  const conversionRate = devis.length > 0 ? Math.round((acceptedQuotes.length / devis.length) * 100) : 0;
  const averageTicket = devis.length > 0 ? CA_TTC / devis.length : 0;
  const objectifProgress = objectifActif > 0 ? Math.min((CA_TTC / objectifActif) * 100, 100) : 0;
  const devisRecents = useMemo(() => devis.slice(0, 4), [devis]);

  const devisARelancer = useMemo(
    () =>
      devis
        .filter((item) => {
          if (item.statut === "Accepté" || item.statut === "Refusé") return false;
          const dateObj = parseDevisDate(item.date);
          const diffTime = Math.abs(todayMs - dateObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 7;
        })
        .slice(0, 4),
    [devis, todayMs],
  );

  const monthlyData = useMemo<MonthlyDatum[]>(() => {
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        name: MONTH_NAMES[date.getMonth()],
        month: date.getMonth(),
        year: date.getFullYear(),
        CA: 0,
      };
    });

    acceptedQuotes.forEach((item) => {
      const parsedDate = parseDevisDate(item.date);
      const targetMonth = months.find(
        (month) =>
          month.month === parsedDate.getMonth() && month.year === parsedDate.getFullYear(),
      );

      if (targetMonth) {
        targetMonth.CA += Number.parseFloat(item.totalHT) || 0;
      }
    });

    return months.map(({ name, CA }) => ({ name, CA }));
  }, [acceptedQuotes]);

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

    if (devis.length === 0) {
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

    if (pendingQuotes.length > 0) {
      signals.push({
        id: "pipeline",
        title: `${pendingQuotes.length} devis dans le pipe`,
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
    devis.length,
    devisARelancer.length,
    isPro,
    objectifActif,
    pendingQuotes.length,
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
      href: "/catalogue",
      label: "Catalogue",
      description: "Prestations et matériaux réutilisables dans vos devis.",
      icon: Package,
      tone: "amber",
      tourClass: "tour-catalogue",
    },
    {
      href: "/planning",
      label: "Planning",
      description: "Gardez une vue claire sur vos chantiers à venir.",
      icon: CalendarDays,
      tone: "emerald",
    },
    {
      href: "/factures",
      label: "Factures",
      description: "Suivez les factures émises et le statut de paiement.",
      icon: FileCheck2,
      tone: "slate",
    },
    {
      href: "/depenses",
      label: "Dépenses",
      description: "Centralisez vos achats, frais et justificatifs.",
      icon: Receipt,
      tone: "rose",
    },
    {
      href: "/calepin",
      label: "Calepin",
      description: "Capturez vos notes chantier sans sortir du flux.",
      icon: BriefcaseBusiness,
      tone: "violet",
    },
  ];

  return (
    <div className="tour-dashboard client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

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

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
        <header className="client-panel sticky top-3 z-40 rounded-[2rem] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <ClientBrandMark />

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <ClientSupportButton compact />
              {canAccessAdminDashboard && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:text-violet-100"
                >
                  <ShieldCheck size={17} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link
                href="/parametres"
                className="tour-parametres inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Paramètres"
              >
                <Settings size={20} />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((value) => !value)}
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
                                {signal.tone === "rose" ? (
                                  <TriangleAlert size={16} />
                                ) : signal.tone === "emerald" ? (
                                  <TrendingUp size={16} />
                                ) : signal.tone === "amber" ? (
                                  <Clock3 size={16} />
                                ) : (
                                  <Sparkles size={16} />
                                )}
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
                          <Link key={signal.id} href={signal.href} onClick={() => setShowNotifications(false)}>
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
              <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-violet-50 ring-1 ring-violet-200/60 dark:bg-white/8 dark:ring-white/10">
                {isLoaded ? <UserButton /> : <User size={18} />}
              </div>
            </div>
          </div>
        </header>

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          <motion.section
            {...sectionMotion(0)}
            className="grid gap-4 xl:grid-cols-[1.32fr_0.92fr]"
          >
            <div className="client-panel-strong overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-6 lg:px-7">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold tracking-[0.24em] text-violet-700 ring-1 ring-violet-200/60 dark:bg-white/7 dark:text-violet-100 dark:ring-white/10">
                      <GreetingIcon size={15} />
                      {todayLabel}
                    </div>
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                        {greetingText}
                        {user?.firstName ? `, ${user.firstName}` : ""}.
                      </h1>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                        Votre poste de pilotage garde l&apos;essentiel sous la main : activité récente,
                        chiffre d&apos;affaires, pipeline, relances et raccourcis métier.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                        {isPro ? "Mode PRO actif" : "Mode Starter"}
                      </span>
                      <span className="client-chip bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-100 dark:ring-emerald-400/20">
                        {starterTrade?.shortLabel || "Métier à définir"}
                      </span>
                      <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                        {devis.length} devis suivis
                      </span>
                      <span className="client-chip bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-amber-400/20">
                        {devisARelancer.length} relance{devisARelancer.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[22rem] xl:grid-cols-1">
                    <Link href="/nouveau-devis" className="tour-nouveau-devis">
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="rounded-[1.8rem] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-5 text-white shadow-[0_22px_60px_-30px_rgba(124,58,237,0.65)]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                            <Plus size={22} />
                          </div>
                          <ChevronRight size={18} className="text-white/80" />
                        </div>
                        <p className="mt-8 text-lg font-semibold">Nouveau devis</p>
                        <p className="mt-2 text-sm leading-6 text-white/82">
                          Préparez un devis propre, rapide et prêt à signer.
                        </p>
                      </motion.div>
                    </Link>

                    <div className="grid gap-3">
                      {isPro ? (
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/stripe/portal", { method: "POST" });
                              const payload = await response.json();
                              if (payload.url) {
                                window.location.href = payload.url;
                              }
                            } catch {
                              // Silent fail to preserve the dashboard flow.
                            }
                          }}
                          className="client-panel flex items-start justify-between rounded-[1.55rem] px-4 py-4 text-left transition hover:-translate-y-0.5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Gérer l&apos;abonnement</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              Facturation, portail Stripe et options PRO.
                            </p>
                          </div>
                          <Wallet size={18} className="mt-1 text-violet-600 dark:text-violet-200" />
                        </button>
                      ) : (
                        <Link href="/abonnement">
                          <div className="client-panel flex items-start justify-between rounded-[1.55rem] px-4 py-4 transition hover:-translate-y-0.5">
                            <div>
                              <p className="text-sm font-semibold text-slate-950 dark:text-white">Passer en PRO</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Déverrouillez plus de devis, plus d&apos;automatisation et plus de marge.
                              </p>
                            </div>
                            <Sparkles size={18} className="mt-1 text-violet-600 dark:text-violet-200" />
                          </div>
                        </Link>
                      )}

                      <div className="grid gap-3">
                        {canAccessAdminDashboard && (
                          <Link href="/admin">
                            <div className="client-panel flex items-start justify-between rounded-[1.55rem] px-4 py-4 transition hover:-translate-y-0.5">
                              <div>
                                <p className="text-sm font-semibold text-slate-950 dark:text-white">Passer en mode pilotage</p>
                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  Ouvrez le cockpit admin pour suivre l&apos;activité globale.
                                </p>
                              </div>
                              <ShieldCheck size={18} className="mt-1 text-violet-600 dark:text-violet-200" />
                            </div>
                          </Link>
                        )}

                        <div className="client-panel flex items-start justify-between rounded-[1.55rem] px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Support réactif</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              Besoin d&apos;aide sur un devis ou un réglage ? Le support reste accessible sans quitter votre flux.
                            </p>
                          </div>
                          <Sparkles size={18} className="mt-1 text-violet-600 dark:text-violet-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.6rem] border border-white/45 bg-white/72 p-4 dark:border-white/10 dark:bg-white/4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">CA TTC</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Vision globale de votre production.</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/45 bg-white/72 p-4 dark:border-white/10 dark:bg-white/4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Conversion</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{conversionRate}%</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {acceptedQuotes.length} accepté{acceptedQuotes.length > 1 ? "s" : ""} sur {devis.length}.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/45 bg-white/72 p-4 dark:border-white/10 dark:bg-white/4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Ticket moyen</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{formatCurrency(averageTicket)}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Montant moyen par devis suivi.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <motion.div
                {...sectionMotion(0.05)}
                className="client-panel rounded-[2rem] p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Objectif mensuel</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {formatCurrency(objectifActif)}
                    </p>
                  </div>
                  <button
                    onClick={handleUpdateObjectif}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white"
                    aria-label="Modifier l'objectif"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="mt-6 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all duration-700"
                    style={{ width: `${objectifProgress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>{objectifProgress.toFixed(0)}%</span>
                  <span>{formatCurrency(Math.max(objectifActif - CA_TTC, 0))} restants</span>
                </div>
                <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/30 dark:text-violet-200 dark:ring-violet-400/20">
                      <Target size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {CA_TTC >= objectifActif ? "Objectif atteint" : "Cap du mois en cours"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {CA_TTC >= objectifActif
                          ? "Vous pouvez monter votre objectif ou lisser votre pipeline sur les semaines à venir."
                          : "Le tableau de bord vous aide à voir rapidement ce qu'il reste à transformer."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                {...sectionMotion(0.08)}
                className="client-panel rounded-[2rem] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Focus du jour</p>
                    <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">3 priorités à traiter</p>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                    {dashboardSignals.length} signal{dashboardSignals.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {dashboardSignals.map((signal) => {
                    const classes = toneClasses(signal.tone);
                    const block = (
                      <div className="rounded-[1.45rem] border border-slate-200/70 bg-white/75 px-4 py-4 transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
                        <div className="flex gap-3">
                          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
                            {signal.tone === "rose" ? (
                              <TriangleAlert size={16} />
                            ) : signal.tone === "amber" ? (
                              <Clock3 size={16} />
                            ) : signal.tone === "emerald" ? (
                              <TrendingUp size={16} />
                            ) : (
                              <Sparkles size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{signal.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.description}</p>
                          </div>
                        </div>
                      </div>
                    );

                    return signal.href ? (
                      <Link key={signal.id} href={signal.href}>
                        {block}
                      </Link>
                    ) : (
                      <div key={signal.id}>{block}</div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.section>

          {setupIsRequired && selectedTradeDefinition && (
            <motion.section
              {...sectionMotion(0.09)}
              className="grid gap-4 xl:grid-cols-[1.16fr_0.84fr]"
            >
              <div className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Setup métier</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Préparez Zolio pour votre activité
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Choisissez votre métier, importez votre starter catalogue et partez avec des packs adaptés au terrain.
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
              </div>

              <div className="client-panel rounded-[2rem] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Plan d&apos;attaque</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {selectedTradeDefinition.label} prêt en quelques secondes
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {selectedTradeDefinition.pitch}
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedStarterCount} prestations starter</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Base prête pour accélérer vos devis et retrouver vos prix récurrents.
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Packs rapides métier</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Les forfaits rapides sur les devis utilisent ensuite le même vocabulaire métier.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
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
                  <Link
                    href="/nouveau-devis"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                  >
                    Passer au premier devis
                  </Link>
                </div>
              </div>
            </motion.section>
          )}

          <motion.section
            {...sectionMotion(0.1)}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="CA validé"
              value={formatCurrency(acceptedRevenueHT)}
              detail={`${acceptedQuotes.length} devis acceptés`}
              tone="emerald"
              icon={TrendingUp}
            />
            <MetricCard
              label="Pipeline"
              value={formatCurrency(pipelineRevenueHT)}
              detail={`${pendingQuotes.length} devis en attente`}
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
              label="Devis actifs"
              value={String(devis.length)}
              detail="Base de travail suivie dans Zolio"
              tone="violet"
              icon={FileText}
            />
          </motion.section>

          <motion.section
            {...sectionMotion(0.16)}
            className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]"
          >
            <div className="client-panel rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Performance</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Vision chiffre d&apos;affaires
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Lecture simple entre validé, pipeline chaud et tendance des six derniers mois.
                  </p>
                </div>
                <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                  {devis.length} devis monitorés
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.55rem] border border-emerald-200/70 bg-emerald-50/80 p-4 dark:border-emerald-400/12 dark:bg-emerald-500/8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Validé HT</p>
                    <span className="text-xs text-emerald-600 dark:text-emerald-300">
                      {acceptedQuotes.length} signé{acceptedQuotes.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
                    {formatCurrency(acceptedRevenueHT)}
                  </p>
                </div>
                <div className="rounded-[1.55rem] border border-amber-200/70 bg-amber-50/80 p-4 dark:border-amber-400/12 dark:bg-amber-500/8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">En attente HT</p>
                    <span className="text-xs text-amber-600 dark:text-amber-300">
                      {pendingQuotes.length} à convertir
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-amber-700 dark:text-amber-200">
                    {formatCurrency(pipelineRevenueHT)}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-56 w-full overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/75 px-2 py-4 dark:border-white/8 dark:bg-white/4">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    Chargement du graphique…
                  </div>
                ) : (
                  <DashboardChart monthlyData={monthlyData} />
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total HT</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_HT)}</p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total TTC</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatCurrency(CA_TTC)}</p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-white/8 dark:bg-white/4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Taux de gain</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{conversionRate}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div
                {...sectionMotion(0.18)}
                className="client-panel rounded-[2rem] p-5 sm:p-6"
              >
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
                                  {formatCurrency(Number.parseFloat(item.totalTTC) || 0)}
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
              </motion.div>

              <motion.div
                {...sectionMotion(0.2)}
                className="client-panel rounded-[2rem] p-5 sm:p-6"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Accès rapides</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Atelier quotidien
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {quickLinks.map((item) => (
                    <QuickLinkCard key={item.href} item={item} />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            {...sectionMotion(0.22)}
            className="client-panel rounded-[2rem] p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Activité récente</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Derniers devis
                </h2>
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
                              {item.numero} · {item.date}
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
                            {formatCurrency(Number.parseFloat(item.totalTTC) || 0)}
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
          </motion.section>
        </main>
      </div>

      <ClientMobileDock active="dashboard" />
    </div>
  );
}
