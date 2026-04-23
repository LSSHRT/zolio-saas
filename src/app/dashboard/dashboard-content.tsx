"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  ClientDesktopNav,
  ClientMobileDock,
} from "@/components/client-shell";
import DashboardChart from "@/components/DashboardChart";
import {
  DashboardRecentQuotes,
  DashboardFollowUps,
  DashboardEcheances,
  DashboardTopClients,
} from "@/components/dashboard/lists";
import { DashboardBenefice } from "@/components/dashboard/benefice";
import { DashboardTresorerie } from "@/components/dashboard/tresorerie";
import {
  formatCurrency,
  sectionMotion,
  type ClientDashboardSummary,
} from "@/components/dashboard/shared";

function getGreeting(firstName: string | null): string {
  const hour = new Date().getHours();
  const name = firstName ? ` ${firstName}` : "";
  if (hour < 12) return `Bonjour${name}`;
  if (hour < 18) return `Bonjour${name}`;
  return `Bonsoir${name}`;
}

function getFocusSignal(summary: ClientDashboardSummary) {
  if (summary.tresorerie.enRetard > 0) {
    return {
      title: `${formatCurrency(summary.tresorerie.enRetard)} en retard de paiement`,
      description: "Des factures nécessitent une relance urgente.",
      href: "/factures",
      tone: "rose" as const,
    };
  }
  if (summary.followUpCount > 0) {
    return {
      title: `${summary.followUpCount} devis à relancer`,
      description: "Des devis en attente depuis plus de 7 jours méritent votre attention.",
      href: "/devis",
      tone: "amber" as const,
    };
  }
  if (summary.echeances.length > 0) {
    return {
      title: `${summary.echeances.length} échéance${summary.echeances.length > 1 ? "s" : ""} dans les 14 jours`,
      description: "Des paiements sont attendus prochainement.",
      href: "/factures",
      tone: "amber" as const,
    };
  }
  return {
    title: "Tout est sous contrôle",
    description: "Aucune action urgente n'est requise pour le moment.",
    href: undefined,
    tone: "emerald" as const,
  };
}

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const QUICK_LINKS: QuickLink[] = [
  { href: "/nouveau-devis", label: "Nouveau devis", description: "Créer un devis", icon: FileText },
  { href: "/nouvelle-facture", label: "Nouvelle facture", description: "Émettre une facture", icon: Receipt },
  { href: "/clients/nouveau", label: "Nouveau client", description: "Ajouter un contact", icon: Users },
  { href: "/catalogue", label: "Catalogue", description: "Gérer les prestations", icon: Package },
  { href: "/planning", label: "Planning", description: "Voir le calendrier", icon: Calendar },
  { href: "/depenses", label: "Dépenses", description: "Suivre les coûts", icon: CreditCard },
];

export default function DashboardContent({
  summary,
  firstName,
  companyTrade,
  canAccessAdmin,
}: {
  summary: ClientDashboardSummary;
  firstName: string | null;
  imageUrl: string | null;
  companyTrade: string | undefined;
  catalogImported: boolean;
  onboardingDone: boolean;
  canAccessAdmin: boolean;
  isPro: boolean;
}) {
  const [devisDrawer, setDevisDrawer] = useState<string | null>(null);

  const focusSignal = getFocusSignal(summary);
  const greeting = getGreeting(firstName);

  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-28 pt-16 text-slate-950 dark:text-white">
      {/* Background overlays */}
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      {/* Desktop top bar */}
      <ClientDesktopNav active="dashboard" />

      {/* Main content area */}
      <div className="flex min-h-screen w-full flex-col px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 xl:px-10">
        {/* Dashboard body */}
        <main className="flex-1 space-y-5 lg:space-y-6">
          {/* Hero greeting + focus signal */}
          <motion.section
            {...sectionMotion(0)}
            className="client-panel-strong overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-7"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-600 dark:text-violet-200">
                  Tableau de bord
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {greeting}
                </h1>
                {companyTrade && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {companyTrade}
                  </p>
                )}
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Voici un aperçu de votre activité. {summary.totalQuotes} devis créés, {summary.acceptedCount} acceptés.
                </p>
              </div>

              {/* Focus signal card */}
              <div className="shrink-0 lg:w-[340px]">
                {focusSignal.href ? (
                  <Link href={focusSignal.href} className="block">
                    <FocusCard signal={focusSignal} />
                  </Link>
                ) : (
                  <FocusCard signal={focusSignal} />
                )}
              </div>
            </div>
          </motion.section>

          {/* KPI strip */}
          <motion.section
            {...sectionMotion(0.08)}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <KpiCard
              label="Chiffre d'affaires"
              value={formatCurrency(summary.acceptedRevenueHT)}
              detail={`${summary.acceptedCount} devis acceptés`}
              tone="emerald"
              icon={TrendingUp}
            />
            <KpiCard
              label="Pipeline"
              value={formatCurrency(summary.pipelineRevenueHT)}
              detail={`${summary.pendingCount} devis en attente`}
              tone="violet"
              icon={Briefcase}
            />
            <KpiCard
              label="Taux de conversion"
              value={`${summary.conversionRate}%`}
              detail={`Moy. ${formatCurrency(summary.averageTicket)}/devis`}
              tone={summary.conversionRate >= 50 ? "emerald" : summary.conversionRate >= 30 ? "amber" : "rose"}
              icon={summary.conversionRate >= 50 ? TrendingUp : TrendingDown}
            />
            <KpiCard
              label="Délai de réponse"
              value={`${summary.avgResponseDays}j`}
              detail="Moyenne acceptés/refusés"
              tone={summary.avgResponseDays <= 3 ? "emerald" : summary.avgResponseDays <= 7 ? "amber" : "rose"}
              icon={Clock}
            />
          </motion.section>

          {/* Main grid: left (chart + financials + funnel + recent) / right (quick links + lists) */}
          <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
            {/* Left column */}
            <div className="space-y-5">
              {/* Revenue chart */}
              <motion.section
                {...sectionMotion(0.12)}
                className="client-panel rounded-2xl p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Chiffre d'affaires
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      Évolution sur 6 mois
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <TrendingUp size={12} />
                    HT
                  </span>
                </div>
                <div className="h-64">
                  <DashboardChart monthlyData={summary.monthlyData} />
                </div>
              </motion.section>

              {/* Benefice + Tresorerie */}
              <div className="grid gap-5 md:grid-cols-2">
                <motion.section {...sectionMotion(0.16)}>
                  <div className="client-panel rounded-2xl p-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Résultat net
                    </p>
                    <DashboardBenefice data={summary.benefice} />
                  </div>
                </motion.section>
                <motion.section {...sectionMotion(0.18)}>
                  <div className="client-panel rounded-2xl p-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Trésorerie
                    </p>
                    <DashboardTresorerie data={summary.tresorerie} />
                  </div>
                </motion.section>
              </div>

              {/* Sales funnel */}
              <motion.section
                {...sectionMotion(0.2)}
                className="client-panel rounded-2xl p-5 sm:p-6"
              >
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Tunnel de vente
                </p>
                <div className="space-y-3">
                  {summary.funnel.map((step) => (
                    <FunnelStep
                      key={step.label}
                      label={step.label}
                      count={step.count}
                      amount={step.amount}
                      pct={step.pct}
                      color={step.color}
                    />
                  ))}
                </div>
              </motion.section>

              {/* Recent quotes */}
              <motion.section {...sectionMotion(0.22)}>
                <div className="client-panel rounded-2xl p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Devis récents
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        Derniers devis créés
                      </p>
                    </div>
                    <Link
                      href="/devis"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                    >
                      Tout voir
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                  <DashboardRecentQuotes
                    items={summary.recentQuotes}
                    onSelectDevis={(n) => setDevisDrawer(n)}
                  />
                </div>
              </motion.section>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Quick links */}
              <motion.section {...sectionMotion(0.14)}>
                <div className="client-panel rounded-2xl p-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Accès rapide
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_LINKS.map((link) => (
                      <QuickLinkButton key={link.href} item={link} />
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* Follow-ups */}
              <motion.section {...sectionMotion(0.16)}>
                <div className="client-panel rounded-2xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Relances
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        Devis en attente +7j
                      </p>
                    </div>
                    {summary.followUpCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {summary.followUpCount}
                      </span>
                    )}
                  </div>
                  <DashboardFollowUps
                    items={summary.followUpQuotes}
                    onSelectDevis={(n) => setDevisDrawer(n)}
                  />
                </div>
              </motion.section>

              {/* Upcoming deadlines */}
              <motion.section {...sectionMotion(0.18)}>
                <div className="client-panel rounded-2xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Échéances
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        Prochains paiements
                      </p>
                    </div>
                    <Link
                      href="/factures"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                    >
                      Tout voir
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                  <DashboardEcheances items={summary.echeances} />
                </div>
              </motion.section>

              {/* Top clients */}
              <motion.section {...sectionMotion(0.2)}>
                <div className="client-panel rounded-2xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Top clients
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        Par chiffre d'affaires
                      </p>
                    </div>
                    <Link
                      href="/clients"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
                    >
                      Tout voir
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                  <DashboardTopClients items={summary.topClients} />
                </div>
              </motion.section>
            </div>
          </div>

          {/* Weekly summary strip */}
          <motion.section
            {...sectionMotion(0.24)}
            className="client-panel rounded-2xl p-5 sm:p-6"
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Cette semaine
            </p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <WeekStat label="Nouv. devis" value={summary.semaine.nouveauxDevis} />
              <WeekStat label="Acceptés" value={summary.semaine.devisAcceptes} tone="emerald" />
              <WeekStat label="Factures" value={summary.semaine.facturesEmises} />
              <WeekStat label="Payées" value={summary.semaine.facturesPayees} tone="emerald" />
              <WeekStat label="CA encaissé" value={formatCurrency(summary.semaine.caEncaisse)} tone="emerald" />
              <WeekStat label="Dépenses" value={formatCurrency(summary.semaine.depensesSemaine)} tone="rose" />
            </div>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="hidden border-t border-slate-200/40 py-4 text-center text-xs text-slate-400 dark:border-white/6 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-6">
            <span>© {new Date().getFullYear()} Zolio</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Link href="/cgu" className="transition hover:text-slate-600 dark:hover:text-slate-200">CGU</Link>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Link href="/cgv" className="transition hover:text-slate-600 dark:hover:text-slate-200">CGV</Link>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Link href="/mentions-legales" className="transition hover:text-slate-600 dark:hover:text-slate-200">Mentions légales</Link>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Link href="/politique-confidentialite" className="transition hover:text-slate-600 dark:hover:text-slate-200">Confidentialité</Link>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <Link href="/changelog" className="transition hover:text-slate-600 dark:hover:text-slate-200">Changelog</Link>
          </div>
        </footer>
      </div>

      {/* Mobile dock */}
      <ClientMobileDock active="dashboard" />
    </div>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────── */

function FocusCard({ signal }: { signal: { title: string; description: string; href?: string; tone: string } }) {
  const toneBorder =
    signal.tone === "rose"
      ? "border-rose-200/60 dark:border-rose-400/15"
      : signal.tone === "amber"
        ? "border-amber-200/60 dark:border-amber-400/15"
        : "border-emerald-200/60 dark:border-emerald-400/15";

  const toneStripe =
    signal.tone === "rose"
      ? "from-rose-500 to-orange-300"
      : signal.tone === "amber"
        ? "from-amber-500 to-amber-300"
        : "from-emerald-500 to-emerald-300";

  const toneIcon =
    signal.tone === "rose"
      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : signal.tone === "amber"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  const Icon = signal.tone === "rose" ? TrendingDown : signal.tone === "amber" ? Clock : TrendingUp;

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-white/90 p-4 shadow-md transition hover:-translate-y-0.5 dark:bg-white/5 ${toneBorder}`}>
      <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${toneStripe}`} />
      <div className="flex items-start gap-3 pl-2">
        <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneIcon}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white">
            {signal.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {signal.description}
          </p>
          {signal.href && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Ouvrir
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: LucideIcon;
}) {
  const border =
    tone === "emerald"
      ? "border-emerald-200/50 dark:border-emerald-400/12"
      : tone === "amber"
        ? "border-amber-200/50 dark:border-amber-400/12"
        : tone === "rose"
          ? "border-rose-200/50 dark:border-rose-400/12"
          : "border-violet-200/50 dark:border-violet-400/12";

  const iconBg =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : tone === "rose"
          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : "bg-violet-500/10 text-violet-700 dark:text-violet-300";

  return (
    <div className={`client-kpi-card rounded-2xl border bg-white/90 p-4 dark:bg-white/5 ${border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  count,
  amount,
  pct,
  color,
}: {
  label: string;
  count: number;
  amount: number;
  pct: number;
  color: string;
}) {
  const gradient =
    color === "emerald"
      ? "from-emerald-500 to-emerald-300"
      : color === "amber"
        ? "from-amber-500 to-amber-300"
        : color === "blue"
          ? "from-blue-500 to-blue-300"
          : "from-violet-500 to-fuchsia-400";

  const barBg =
    color === "emerald"
      ? "bg-emerald-500/10 dark:bg-emerald-500/10"
      : color === "amber"
        ? "bg-amber-500/10 dark:bg-amber-500/10"
        : color === "blue"
          ? "bg-blue-500/10 dark:bg-blue-500/10"
          : "bg-violet-500/10 dark:bg-violet-500/10";

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{count}</p>
      </div>
      <div className="flex-1">
        <div className={`h-2.5 overflow-hidden rounded-full ${barBg}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-24 shrink-0 text-right">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {formatCurrency(amount)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{pct}%</p>
      </div>
    </div>
  );
}

function QuickLinkButton({ item }: { item: QuickLink }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200/50 bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300/60 hover:bg-violet-50/50 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20"
    >
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-950 dark:text-white">{item.label}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.description}</p>
      </div>
    </Link>
  );
}

function WeekStat({
  label,
  value,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "rose"
        ? "text-rose-700 dark:text-rose-300"
        : "text-slate-950 dark:text-white";

  return (
    <div className="rounded-xl border border-slate-200/40 bg-white/70 px-3 py-2.5 dark:border-white/6 dark:bg-white/4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold tracking-tight ${color}`}>
        {typeof value === "number" ? value : value}
      </p>
    </div>
  );
}
