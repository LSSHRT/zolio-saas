"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Calendar,
  CheckCircle,
  CreditCard,
  FileSignature,
  FileText,
  Filter,
  Receipt,
  Settings as SettingsIcon,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import {
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { EmptyState } from "@/components/empty-state";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TONE_CLASSES: Record<string, { icon: typeof Bell; bg: string; color: string; border: string }> = {
  emerald: { icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
  rose: { icon: TriangleAlert, bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
  amber: { icon: TrendingUp, bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
  violet: { icon: FileText, bg: "bg-violet-50 dark:bg-violet-500/10", color: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-500/20" },
  slate: { icon: Bell, bg: "bg-slate-50 dark:bg-slate-700/30", color: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
};

const TYPE_CONFIG: Record<string, typeof Bell> = {
  facture_paid: CreditCard,
  facture_created: Receipt,
  devis_signed: FileSignature,
  devis_created: FileText,
  subscription_activated: TrendingUp,
  subscription_cancelled: TriangleAlert,
};

type CategoryKey = "all" | "devis" | "factures" | "paiements" | "system";

const CATEGORY_MATCHERS: Record<Exclude<CategoryKey, "all">, (type: string) => boolean> = {
  devis: (t) => t.startsWith("devis_"),
  factures: (t) => t.startsWith("facture_") && t !== "facture_paid",
  paiements: (t) => t === "facture_paid",
  system: (t) => t.startsWith("subscription_") || t.startsWith("system_"),
};

const CATEGORY_LABELS: Record<CategoryKey, { label: string; icon: typeof Bell }> = {
  all: { label: "Toutes", icon: Filter },
  devis: { label: "Devis", icon: FileSignature },
  factures: { label: "Factures", icon: Receipt },
  paiements: { label: "Paiements", icon: CreditCard },
  system: { label: "Système", icon: SettingsIcon },
};

function getDateBucket(iso: string): "today" | "yesterday" | "week" | "older" {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  if (d >= startOfWeek) return "week";
  return "older";
}

const BUCKET_LABEL: Record<"today" | "yesterday" | "week" | "older", string> = {
  today: "Aujourd’hui",
  yesterday: "Hier",
  week: "Cette semaine",
  older: "Plus ancien",
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string | null;
  tone: string;
  read: boolean;
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<CategoryKey>("all");
  const { data, mutate, isLoading } = useSWR<{ notifications: NotificationItem[]; unreadCount: number }>(
    `/api/notifications?unread=${filter === "unread"}`,
    fetcher,
    { refreshInterval: 30000 },
  );

  const allNotifications = useMemo(() => data?.notifications ?? [], [data]);

  // Apply category filter on top of read/unread
  const notifications = useMemo(() => {
    if (category === "all") return allNotifications;
    const matcher = CATEGORY_MATCHERS[category];
    return allNotifications.filter((n) => matcher(n.type));
  }, [allNotifications, category]);

  // Group notifications by date bucket
  const grouped = useMemo(() => {
    const buckets: Record<"today" | "yesterday" | "week" | "older", NotificationItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    for (const n of notifications) {
      buckets[getDateBucket(n.createdAt)].push(n);
    }
    return buckets;
  }, [notifications]);

  const orderedBuckets = (Object.keys(grouped) as Array<keyof typeof grouped>).filter((k) => grouped[k].length > 0);

  // Per-category counts (computed against allNotifications so badges remain stable when filtering)
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = { all: allNotifications.length, devis: 0, factures: 0, paiements: 0, system: 0 };
    for (const n of allNotifications) {
      for (const key of Object.keys(CATEGORY_MATCHERS) as Array<Exclude<CategoryKey, "all">>) {
        if (CATEGORY_MATCHERS[key](n.type)) counts[key] += 1;
      }
    }
    return counts;
  }, [allNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      mutate();
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      mutate();
    } catch {}
  };

  return (
    <ClientSubpageShell
      title="Notifications"
      description="Tout ce qui s&apos;est passé dans votre compte Zolio."
      eyebrow="Centre de notifications"
      activeNav="tools"
      breadcrumbs={[{ label: "Outils" }, { label: "Notifications" }]}
      metaPills={[
        { icon: Calendar, label: new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }), tone: "slate" },
        ...(data?.unreadCount
          ? [{ icon: Bell, label: `${data.unreadCount} non lue${data.unreadCount > 1 ? "s" : ""}`, tone: "violet" as const }]
          : []),
        ...(allNotifications.length > 0
          ? [{ icon: TrendingUp, label: `${allNotifications.length} au total`, tone: "slate" as const }]
          : []),
      ]}
      focusLine={
        data?.unreadCount && data.unreadCount > 0 ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {data.unreadCount} événement{data.unreadCount > 1 ? "s" : ""} à traiter
            </span>
            {" "}· Cliquez sur une notification pour ouvrir le document concerné.
          </>
        ) : (
          <>Tout est à jour. Les nouveaux événements (signatures, paiements, relances) apparaîtront ici.</>
        )
      }
      mobilePrimaryAction={
        data?.unreadCount ? (
          <button
            onClick={markAllRead}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <CheckCircle size={16} />
            Tout marquer lu
          </button>
        ) : undefined
      }
    >
      {/* Filters bar */}
      <ClientSectionCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1">
            {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => {
              const { label, icon: Icon } = CATEGORY_LABELS[key];
              const count = categoryCounts[key];
              const isActive = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/30 dark:hover:text-violet-200"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {count > 0 ? (
                    <span
                      className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        isActive
                          ? "bg-violet-200 text-violet-800 dark:bg-violet-400/20 dark:text-violet-100"
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 lg:shrink-0">
            <button
              type="button"
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === "unread"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {filter === "unread" ? "Non lues uniquement" : "Toutes"}
            </button>
            {data?.unreadCount ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
              >
                <CheckCircle size={13} />
                Tout marquer lu
              </button>
            ) : null}
          </div>
        </div>
      </ClientSectionCard>

      {/* List */}
      {isLoading ? (
        <ClientSectionCard>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </ClientSectionCard>
      ) : notifications.length === 0 ? (
        <ClientSectionCard>
          <EmptyState
            icon={BellOff}
            title={
              filter === "unread"
                ? "Aucune notification non lue"
                : category !== "all"
                  ? `Rien dans la catégorie ${CATEGORY_LABELS[category].label}`
                  : "Vous êtes à jour"
            }
            description={
              filter === "unread"
                ? "Toutes vos notifications ont été lues. Repassez par ici quand un nouvel événement arrivera."
                : category !== "all"
                  ? "Aucun événement récent dans cette catégorie. Changez de filtre pour voir d'autres notifications."
                  : "Les nouvelles notifications (devis signés, factures payées, relances) apparaîtront ici en temps réel."
            }
            tone={filter === "unread" ? "emerald" : "slate"}
            actions={
              filter === "unread"
                ? [{ label: "Voir toutes les notifications", onClick: () => setFilter("all"), variant: "primary" }]
                : category !== "all"
                  ? [{ label: "Toutes les catégories", onClick: () => setCategory("all"), variant: "primary" }]
                  : undefined
            }
          />
        </ClientSectionCard>
      ) : (
        <div className="space-y-4">
          {orderedBuckets.map((bucketKey) => (
            <ClientSectionCard key={bucketKey}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {BUCKET_LABEL[bucketKey]}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {grouped[bucketKey].length} événement{grouped[bucketKey].length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[bucketKey].map((n) => {
                  const tone = TONE_CLASSES[n.tone] || TONE_CLASSES.slate;
                  const TypeIcon = TYPE_CONFIG[n.type] || tone.icon;

                  const content = (
                    <div
                      className={`flex items-start gap-4 rounded-2xl border p-4 transition hover:-translate-y-px hover:shadow-sm cursor-pointer ${
                        n.read
                          ? "border-slate-200/60 bg-white dark:border-white/8 dark:bg-white/4"
                          : `${tone.border} ${tone.bg}`
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.color}`}>
                        <TypeIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${n.read ? "text-slate-600 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                              {n.title}
                              {!n.read && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-violet-500" />}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {n.description}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );

                  if (n.href) {
                    return (
                      <Link href={n.href} key={n.id} onClick={() => { if (!n.read) markRead(n.id); }}>
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          {content}
                        </motion.div>
                      </Link>
                    );
                  }

                  return (
                    <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }} role="button" tabIndex={0}>
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        {content}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </ClientSectionCard>
          ))}
        </div>
      )}
    </ClientSubpageShell>
  );
}
