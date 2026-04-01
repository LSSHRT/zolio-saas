"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  ChevronRight,
  Sparkles,
  TriangleAlert,
  Clock3,
  TrendingUp,
  Target,
  ListFilter,
  X,
  Eye,
} from "lucide-react";
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tone = "violet" | "rose" | "amber" | "emerald" | "slate";

interface Signal {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
  type?: string;
  createdAt?: string;
}

interface DbNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string | null;
  tone: string;
  read: boolean;
  createdAt: string;
}

type FilterKey = "all" | "unread" | "signal" | "action" | "success";

const FILTER_CONFIG: Record<FilterKey, { label: string; icon: typeof Check }> = {
  all: { label: "Tout", icon: Bell },
  unread: { label: "Non lues", icon: Eye },
  signal: { label: "Signaux", icon: TriangleAlert },
  action: { label: "Actions", icon: ListFilter },
  success: { label: "Succès", icon: TrendingUp },
};

function toneClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return { icon: "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20" };
    case "amber":
      return { icon: "bg-amber-400/12 text-amber-700 ring-amber-300/40 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/20" };
    case "rose":
      return { icon: "bg-rose-500/12 text-rose-700 ring-rose-300/40 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20" };
    case "slate":
      return { icon: "bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10" };
    case "violet":
    default:
      return { icon: "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-200 dark:ring-violet-400/20" };
  }
}

function renderSignalIcon(tone: Tone, size = 17) {
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

function getCategory(signal: Signal | DbNotification): "signal" | "action" | "success" {
  if ("type" in signal && signal.type) {
    const t = signal.type.toLowerCase();
    if (t.includes("relance") || t.includes("rappel")) return "action";
    if (t.includes("paiement") || t.includes("success") || t.includes("goal")) return "success";
    return "signal";
  }
  if ("tone" in signal) {
    if (signal.tone === "emerald") return "success";
    if (signal.tone === "rose") return "action";
  }
  if ("description" in signal) {
    const desc = signal.description?.toLowerCase() || "";
    const title = signal.title?.toLowerCase() || "";
    if (desc.includes("objectif") || desc.includes("converti") || title.includes("atteint")) return "success";
    if (desc.includes("relancer") || desc.includes("attente") || desc.includes("réponse")) return "action";
  }
  return "signal";
}

function formatCurrency(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function NotificationsPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useSWR("/api/dashboard/summary", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const { data: notifData, mutate: mutateNotifs } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });

  const isPro = user?.publicMetadata?.isPro === true;

  const signals: Signal[] = useMemo(() => {
    if (!summary) return [];
    const s: Signal[] = [];

    if (summary.totalQuotes === 0) {
      s.push({ id: "empty", type: "signal", title: "Premier devis à lancer", description: "Créez votre premier devis pour activer votre suivi d'activité.", href: "/nouveau-devis", tone: "violet" });
    }

    if (summary.followUpCount > 0) {
      s.push({ id: "followups", type: "action", title: `${summary.followUpCount} devis à relancer`, description: "Des clients attendent encore une réponse ou un rappel.", href: "/devis", tone: "rose" });
    }

    if (summary.pendingCount > 0) {
      s.push({ id: "pipeline", type: "signal", title: `${summary.pendingCount} devis dans le pipe`, description: `${formatCurrency(summary.pipelineRevenueHT)} HT encore en attente de validation.`, href: "/devis", tone: "amber" });
    }

    if (summary.conversionRate != null && summary.conversionRate < 30 && summary.totalQuotes > 0) {
      s.push({ id: "rate", type: "signal", title: "Taux de conversion bas", description: `${summary.conversionRate}% des devis sont acceptés.`, href: "/devis", tone: "amber" });
    }

    if (summary.totalTTC >= (summary.objectifActif || 5000)) {
      s.push({ id: "goal-hit", type: "success", title: "Objectif atteint !", description: "Le cap mensuel est atteint, vous pouvez viser plus haut.", tone: "emerald" });
    } else if (summary.totalTTC > 0) {
      const target = summary.objectifActif || 5000;
      s.push({ id: "goal-gap", type: "signal", title: "Objectif à suivre", description: `${formatCurrency(Math.max(target - summary.totalTTC, 0))} TTC restants pour atteindre votre cap.`, href: "/dashboard", tone: "slate" });
    }

    if (!isPro) {
      s.push({ id: "upgrade", type: "signal", title: "Mode Starter actif", description: "Passez en PRO pour aller plus loin que le devis d'essai.", href: "/abonnement", tone: "violet" });
    }

    return s;
  }, [summary, isPro]);

  const dbNotifications: DbNotification[] = notifData?.notifications ?? [];
  const unreadCount: number = notifData?.unreadCount ?? 0;

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    mutateNotifs();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    mutateNotifs();
  }

  // Filtrage
  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      if (filter === "all") return true;
      if (filter === "unread") return true; // signals don't have read state, show all
      const cat = getCategory(s);
      return cat === filter;
    });
  }, [signals, filter]);

  const filteredDb = useMemo(() => {
    return dbNotifications.filter((n) => {
      if (filter === "all") return true;
      if (filter === "unread") return !n.read;
      const cat = getCategory(n);
      return cat === filter;
    });
  }, [dbNotifications, filter]);

  const totalVisible = filteredSignals.length + filteredDb.length;
  const allUnread = filteredDb.filter((n) => !n.read).length;

  const filterActions: ClientMobileAction[] = useMemo(
    () =>
      (Object.keys(FILTER_CONFIG) as FilterKey[]).map((key) => ({
        icon: FILTER_CONFIG[key].icon,
        label: FILTER_CONFIG[key].label,
        onClick: () => { setFilter(key); setShowFilters(false); },
        tone: filter === key ? "accent" : "default" as const,
      })),
    [filter],
  );

  return (
    <ClientSubpageShell
      title="Notifications"
      description="Restez alerté sur les relances, paiements et signaux business. Filtrez par urgence et marquez comme lu."
      activeNav="tools"
      eyebrow="Centre d'activité"
      mobilePrimaryAction={
        unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <Check size={16} />
            Tout marquer lu
          </button>
        ) : undefined
      }
      actions={
        <>
          <div className="flex gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(Object.keys(FILTER_CONFIG) as FilterKey[]).map((key) => {
                const FIcon = FILTER_CONFIG[key].icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      filter === key
                        ? "bg-white shadow text-brand-violet dark:bg-slate-700 dark:text-white"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    <FIcon size={13} />
                    <span className="hidden sm:inline">{FILTER_CONFIG[key].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Total"
            value={String(totalVisible)}
            detail={`${signals.length} signaux · ${filteredDb.length} notifs`}
            tone="violet"
          />
          <ClientHeroStat
            label="Non lues"
            value={String(allUnread)}
            detail={allUnread > 0 ? "À traiter" : "Tout est à jour"}
            tone="rose"
          />
          <ClientHeroStat
            label="En attente"
            value={String(signals.filter((s) => getCategory(s) === "action").length)}
            detail="Actions requises"
            tone="amber"
          />
          <ClientHeroStat
            label="Filtre actif"
            value={FILTER_CONFIG[filter].label}
            detail="Cliquez pour changer"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Activité & alertes"
          description="Vos signaux business, notifications et actions en attente, le tout filtrable en un geste."
          badge={`${totalVisible} visibles`}
          items={[
            {
              label: "Total",
              value: String(totalVisible),
              detail: `${signals.length} signaux · ${filteredDb.length} DB`,
              tone: "violet",
            },
            {
              label: "Non lues",
              value: String(allUnread),
              detail: allUnread > 0 ? "À traiter" : "Rien à faire",
              tone: "rose",
            },
            {
              label: "Actions",
              value: String(signals.filter((s) => getCategory(s) === "action").length),
              detail: "Requises",
              tone: "amber",
            },
            {
              label: "Filtre",
              value: FILTER_CONFIG[filter].label,
              detail: "Appuyez pour changer",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard>
        {summaryLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[1.5rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : totalVisible === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400">
            <Bell size={48} strokeWidth={1} />
            <p className="text-sm">
              {filter !== "all" ? "Aucun résultat pour ce filtre" : "Tout est calme pour le moment."}
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/6 dark:text-slate-300"
              >
                <X size={14} />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filtre mobile quick toggle */}
            <div className="md:hidden flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Filtre : {FILTER_CONFIG[filter].label}
              </span>
              <ClientMobileActionsMenu buttonLabel="Choisir un filtre" items={filterActions} />
            </div>

            <AnimatePresence initial={false}>
              {/* Notifications DB */}
              {filteredDb.map((notif, index) => {
                const tone = (notif.tone as Tone) || "violet";
                const classes = toneClasses(tone);
                const card = (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <div
                      className={`rounded-[1.5rem] border px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 ${
                        notif.read
                          ? "border-slate-200/50 bg-white/50 dark:border-white/4 dark:bg-white/2"
                          : "border-slate-200/70 bg-white/90 dark:border-white/8 dark:bg-white/4"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
                          {renderSignalIcon(tone)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{notif.title}</p>
                            {!notif.read && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{notif.description}</p>
                          <p className="mt-1 text-xs text-slate-400">{relativeTime(notif.createdAt)}</p>
                        </div>
                        {notif.href ? (
                          <div className="mt-1 text-violet-600 dark:text-violet-200">
                            <ChevronRight size={16} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );

                const handleClick = () => {
                  if (!notif.read) markRead(notif.id);
                };

                return notif.href ? (
                  <Link key={notif.id} href={notif.href} onClick={handleClick}>
                    {card}
                  </Link>
                ) : (
                  <div key={notif.id} onClick={handleClick}>{card}</div>
                );
              })}

              {/* Signaux calculés */}
              {filteredSignals.map((signal, index) => {
                const classes = toneClasses(signal.tone);
                const card = (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                  >
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/75 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 dark:border-white/8 dark:bg-white/4">
                      <div className="flex items-start gap-3">
                        <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${classes.icon}`}>
                          {renderSignalIcon(signal.tone)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">{signal.title}</p>
                            {signal.type && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/6 dark:text-slate-400">
                                {signal.type}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.description}</p>
                        </div>
                        {signal.href ? (
                          <div className="mt-1 text-violet-600 dark:text-violet-200">
                            <ChevronRight size={16} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );

                return signal.href ? (
                  <Link key={signal.id} href={signal.href}>
                    {card}
                  </Link>
                ) : (
                  <div key={signal.id}>{card}</div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ClientSectionCard>

      <MobileDialog
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrer les notifications"
        description="Choisissez quels types de notifications afficher."
        tone="accent"
        actions={
          <button
            type="button"
            onClick={() => { setFilter("all"); setShowFilters(false); }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
          >
            <X size={14} />
            Tout afficher
          </button>
        }
      >
        <div className="space-y-2">
          {(Object.keys(FILTER_CONFIG) as FilterKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setFilter(key); setShowFilters(false); }}
              className={`w-full min-h-12 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                filter === key
                  ? "bg-violet-50 text-brand-violet dark:bg-violet-500/10 dark:text-violet-200"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-3">
                {(function () { const C = FILTER_CONFIG[key].icon; return <C size={18} />; })()}
                {FILTER_CONFIG[key].label}
              </span>
            </button>
          ))}
        </div>
      </MobileDialog>
    </ClientSubpageShell>
  );
}
