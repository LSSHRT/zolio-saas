"use client";

import { Clock3, TriangleAlert, TrendingUp } from "lucide-react";
import { formatCurrency } from "./shared";
import type { TresorerieSummary } from "./shared";

function CashStatCard({
  title,
  value,
  tone,
  icon: Icon,
}: {
  title: string;
  value: number;
  tone: "emerald" | "violet" | "rose";
  icon: typeof TrendingUp;
}) {
  const classes =
    tone === "emerald"
      ? "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.96))] text-emerald-800 dark:border-emerald-400/15 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.86))] dark:text-emerald-200"
      : tone === "rose"
        ? "border-rose-200/70 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.96))] text-rose-800 dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(15,23,42,0.86))] dark:text-rose-200"
        : "border-violet-200/70 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(255,255,255,0.96))] text-violet-800 dark:border-violet-400/15 dark:bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(15,23,42,0.86))] dark:text-violet-200";

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.22)] ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75">{title}</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">{formatCurrency(value)}</p>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/50 dark:bg-white/8 dark:ring-white/10">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

export function DashboardTresorerie({ data }: { data: TresorerieSummary }) {
  if (!data || data.nombreFactures === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune facture</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Transformez vos devis acceptés en factures pour suivre votre trésorerie.
        </p>
      </div>
    );
  }

  const exposed = data.aEncaisser + data.enRetard;
  const secureRatio = exposed > 0 ? Math.min((data.encaisse / (data.encaisse + exposed)) * 100, 100) : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.24)] dark:border-white/8 dark:bg-white/4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Vision encaissement
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(data.encaisse)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {formatCurrency(exposed)} restent à surveiller entre factures ouvertes et impayés.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Taux de recouvrement
            </p>
            <p className={`mt-2 text-2xl font-semibold ${data.tauxRecouvrement >= 80 ? "text-emerald-700 dark:text-emerald-300" : data.tauxRecouvrement >= 50 ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300"}`}>
              {data.tauxRecouvrement}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-rose-500"
            style={{ width: `${secureRatio}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CashStatCard title="Encaissé" value={data.encaisse} tone="emerald" icon={TrendingUp} />
        <CashStatCard title="À encaisser" value={data.aEncaisser} tone="violet" icon={Clock3} />
        <CashStatCard title="En retard" value={data.enRetard} tone="rose" icon={TriangleAlert} />
      </div>
    </div>
  );
}
