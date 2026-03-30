"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tone = "violet" | "rose" | "amber" | "emerald" | "slate";

interface Signal {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
}

const toneColors: Record<Tone, { bg: string; badge: string }> = {
  violet: { bg: "bg-violet-50 dark:bg-violet-500/10", badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  slate: { bg: "bg-slate-50 dark:bg-slate-500/10", badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" },
};

export default function NotificationsPage() {
  const params = useSearchParams();
  const { data, isLoading } = useSWR("/api/dashboard/summary", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const signals: Signal[] = useMemo(() => {
    if (!data) return [];
    const s: Signal[] = [];

    if (data.totalQuotes === 0) {
      s.push({ id: "empty", title: "Premier devis", description: "Creez votre premier devis pour demarrer.", href: "/nouveau-devis", tone: "violet" });
    }
    if (data.followUpCount > 0) {
      s.push({ id: "follow", title: `${data.followUpCount} devis a relancer`, description: "Des clients attendent un rappel.", href: "/devis", tone: "rose" });
    }
    if (data.pendingCount > 0) {
      s.push({ id: "pending", title: `${data.pendingCount} devis en attente`, description: `${data.pipelineRevenueHT?.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} HT dans le pipe.`, href: "/devis", tone: "amber" });
    }
    if (data.conversionRate != null && data.conversionRate < 30) {
      s.push({ id: "rate", title: "Taux de conversion bas", description: `${data.conversionRate}% des devis sont acceptes.`, href: "/devis", tone: "amber" });
    }
    return s;
  }, [data]);

  const fmt = (n: number) => n?.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/dashboard" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Notifications</h1>
          {signals.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-semibold text-white">{signals.length}</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/70 p-4 dark:border-white/8">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-2" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/8">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Aucune notification</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tout est calme.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map(signal => {
              const colors = toneColors[signal.tone] || toneColors.slate;
              const card = (
                <div className={`rounded-2xl border border-slate-200/70 p-4 transition hover:shadow-sm dark:border-white/8 ${colors.bg}`}>
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-8 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${colors.badge}`}>{signal.tone}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950 dark:text-white">{signal.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{signal.description}</p>
                    </div>
                  </div>
                </div>
              );
              return signal.href ? (
                <Link key={signal.id} href={signal.href}>{card}</Link>
              ) : (
                <div key={signal.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
