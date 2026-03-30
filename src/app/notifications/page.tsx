"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SummaryData {
  totalQuotes: number;
  followUpCount: number;
  pendingCount: number;
  pipelineRevenueHT: number;
  starterCatalogCount: number;
}

type Tone = "violet" | "rose" | "amber" | "emerald" | "slate";

interface Signal {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: Tone;
}

function buildSignals(d: SummaryData): Signal[] {
  const signals: Signal[] = [];
  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  if (d.totalQuotes === 0) {
    signals.push({ id: "empty", title: "Premier devis a lancer", description: "Creez votre premier devis pour activer votre suivi d'activite.", href: "/nouveau-devis", tone: "violet" });
  }

  if (d.followUpCount > 0) {
    signals.push({ id: "followups", title: `${d.followUpCount} devis a relancer`, description: "Des clients attendent encore une reponse ou un rappel.", href: "/devis", tone: "rose" });
  }

  if (d.pendingCount > 0) {
    signals.push({ id: "pipeline", title: `${d.pendingCount} devis dans le pipe`, description: `${fmt(d.pipelineRevenueHT)} HT encore en attente de validation.`, href: "/devis", tone: "amber" });
  }

  if (d.starterCatalogCount > 0) {
    signals.push({ id: "catalog", title: "Catalogue de depart disponible", description: "Importez les prestations pre-remplies pour votre metier.", href: "/catalogue", tone: "emerald" });
  }

  return signals;
}

const toneStyles: Record<Tone, { bg: string; icon: string }> = {
  violet: { bg: "bg-violet-50 dark:bg-violet-500/10", icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" },
  slate: { bg: "bg-slate-50 dark:bg-slate-500/10", icon: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<SummaryData>("/api/dashboard/summary", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const signals = data ? buildSignals(data) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button type="button" onClick={() => router.back()} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Notifications</h1>
          {signals.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-semibold text-white">{signals.length}</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/70 p-4 dark:border-white/8">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-white/10" />
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
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Aucune notification</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tout est calme pour le moment.</p>
            <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Retour au dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => {
              const styles = toneStyles[signal.tone] || toneStyles.slate;
              const card = (
                <div className={`rounded-2xl border border-slate-200/70 p-4 transition hover:shadow-sm dark:border-white/8 ${styles.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950 dark:text-white">{signal.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{signal.description}</p>
                      {signal.href && (
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                          Voir
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                      )}
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
