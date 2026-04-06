"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCircle,
  FileText,
  Loader2,
  RotateCcw,
  Settings,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TONE_CLASSES: Record<string, { icon: typeof Bell; bg: string; color: string; border: string }> = {
  emerald: { icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" },
  rose: { icon: TriangleAlert, bg: "bg-rose-50 dark:bg-rose-500/10", color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20" },
  amber: { icon: TrendingUp, bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
  violet: { icon: FileText, bg: "bg-violet-50 dark:bg-violet-500/10", color: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-500/20" },
  slate: { icon: Bell, bg: "bg-slate-50 dark:bg-slate-700/30", color: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
};

const TYPE_CONFIG: Record<string, typeof Bell> = {
  facture_paid: CheckCircle,
  facture_created: FileText,
  devis_signed: CheckCircle,
  subscription_activated: TrendingUp,
  subscription_cancelled: TriangleAlert,
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
  const { data, mutate, isLoading } = useSWR<{ notifications: NotificationItem[]; unreadCount: number }>(
    `/api/notifications?unread=${filter === "unread"}`,
    fetcher,
    { refreshInterval: 30000 },
  );

  const notifications = useMemo(() => data?.notifications ?? [], [data]);

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
      description="Tout ce qui s'est passé dans votre compte Zolio."
      eyebrow="Centre de notifications"
      activeNav="tools"
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
      {/* Stats rapides */}
      <ClientSectionCard>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={24} className="text-violet-600 dark:text-violet-400" />
            {data?.unreadCount ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {data.unreadCount}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {data?.unreadCount ?? 0} notification{data?.unreadCount !== 1 ? "s" : ""} non lue{data?.unreadCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filter === "unread" ? "Affichées : non lues" : "Affichées : toutes"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filter === "unread"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {filter === "unread" ? "Non lues" : "Toutes"}
            </button>
            {data?.unreadCount ? (
              <button
                onClick={markAllRead}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 transition"
              >
                Tout marquer lu
              </button>
            ) : null}
          </div>
        </div>
      </ClientSectionCard>

      {/* Liste */}
      <ClientSectionCard>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <BellOff size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </p>
            {filter === "unread" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                Voir toutes les notifications
              </button>
            )}
            {filter === "all" && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Les notifications apparaîtront ici au fil de votre activité.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const tone = TONE_CLASSES[n.tone] || TONE_CLASSES.slate;
              const TypeIcon = TYPE_CONFIG[n.type] || tone.icon;

              const content = (
                <div
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition hover:shadow-sm cursor-pointer ${
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
                      <div>
                        <p className={`text-sm font-semibold ${n.read ? "text-slate-600 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}>
                          {n.title}
                          {!n.read && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-violet-500" />}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {n.description}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
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
        )}
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
