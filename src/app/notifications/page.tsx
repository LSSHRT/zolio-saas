"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, ChevronRight, Sparkles, TriangleAlert, Clock3, TrendingUp, Target } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tone = "violet" | "rose" | "amber" | "emerald" | "slate";

interface Signal {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
}

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

function formatCurrency(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function NotificationsPage() {
  const { user } = useUser();
  const { data, isLoading } = useSWR("/api/dashboard/summary", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const isPro = user?.publicMetadata?.isPro === true;

  const signals: Signal[] = useMemo(() => {
    if (!data) return [];
    const s: Signal[] = [];

    if (data.totalQuotes === 0) {
      s.push({ id: "empty", title: "Premier devis a lancer", description: "Creez votre premier devis pour activer votre suivi d'activite.", href: "/nouveau-devis", tone: "violet" });
    }

    if (data.followUpCount > 0) {
      s.push({ id: "followups", title: `${data.followUpCount} devis a relancer`, description: "Des clients attendent encore une reponse ou un rappel.", href: "/devis", tone: "rose" });
    }

    if (data.pendingCount > 0) {
      s.push({ id: "pipeline", title: `${data.pendingCount} devis dans le pipe`, description: `${formatCurrency(data.pipelineRevenueHT)} HT encore en attente de validation.`, href: "/devis", tone: "amber" });
    }

    if (data.conversionRate != null && data.conversionRate < 30 && data.totalQuotes > 0) {
      s.push({ id: "rate", title: "Taux de conversion bas", description: `${data.conversionRate}% des devis sont acceptes.`, href: "/devis", tone: "amber" });
    }

    if (data.totalTTC >= (data.objectifActif || 5000)) {
      s.push({ id: "goal-hit", title: "Objectif atteint", description: "Le cap mensuel est atteint, vous pouvez viser plus haut.", tone: "emerald" });
    } else if (data.totalTTC > 0) {
      const target = data.objectifActif || 5000;
      s.push({ id: "goal-gap", title: "Objectif a suivre", description: `${formatCurrency(Math.max(target - data.totalTTC, 0))} TTC restants pour atteindre votre cap.`, href: "/dashboard", tone: "slate" });
    }

    if (!isPro) {
      s.push({ id: "upgrade", title: "Mode Starter actif", description: "Passez en PRO pour aller plus loin que le devis d'essai.", href: "/abonnement", tone: "violet" });
    }

    return s;
  }, [data, isPro]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/dashboard" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Notifications</h1>
            {signals.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-1.5 text-[10px] font-bold text-white">
                {signals.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[1.5rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
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
        ) : signals.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/8">
              <Bell size={28} className="text-slate-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Aucune notification</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tout est calme pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {signals.map((signal, index) => {
                const classes = toneClasses(signal.tone);
                const card = (
                  <motion.div
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
      </div>
    </div>
  );
}
