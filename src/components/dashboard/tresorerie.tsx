"use client";

import { Clock3, TriangleAlert, TrendingUp } from "lucide-react";
import { formatCurrency } from "./shared";
import type { TresorerieSummary } from "./shared";

function FinanceStatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  detail: string;
  icon: typeof TrendingUp;
  tone: "emerald" | "violet" | "rose";
}) {
  const classes =
    tone === "emerald"
      ? "border-emerald-200/70 dark:border-emerald-400/15"
      : tone === "rose"
        ? "border-rose-200/70 dark:border-rose-400/15"
        : "border-violet-200/70 dark:border-violet-400/15";

  return (
    <div className={`rounded-[1.45rem] border bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:bg-white/4 ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {formatCurrency(value)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export function DashboardTresorerie({ data }: { data: TresorerieSummary }) {
  if (!data || data.nombreFactures === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune facture</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Émettez vos premières factures pour commencer à lire la trésorerie.
        </p>
      </div>
    );
  }

  const totalOpen = data.aEncaisser + data.enRetard;
  const securedRatio = data.encaisse + totalOpen > 0 ? Math.round((data.encaisse / (data.encaisse + totalOpen)) * 100) : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-[1.6rem] border border-slate-200/70 bg-white/84 p-5 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.22)] dark:border-white/8 dark:bg-white/4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Synthèse trésorerie
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {data.tauxRecouvrement}%
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Taux de recouvrement actuel sur les montants encaissés et exposés.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Exposition ouverte
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              {formatCurrency(totalOpen)}
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-rose-500"
            style={{ width: `${securedRatio}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceStatCard
          title="Encaissé"
          value={data.encaisse}
          detail="Déjà payé"
          icon={TrendingUp}
          tone="emerald"
        />
        <FinanceStatCard
          title="À encaisser"
          value={data.aEncaisser}
          detail="Factures ouvertes"
          icon={Clock3}
          tone="violet"
        />
        <FinanceStatCard
          title="En retard"
          value={data.enRetard}
          detail="Montants à relancer"
          icon={TriangleAlert}
          tone="rose"
        />
      </div>
    </div>
  );
}
