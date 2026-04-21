"use client";

import { formatCurrency } from "./shared";
import type { BeneficeSummary } from "./shared";

export function DashboardBenefice({ data }: { data: BeneficeSummary }) {
  if (!data || (data.caFacture === 0 && data.depenses === 0)) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Pas encore de données</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Encaissez vos premières factures et enregistrez des dépenses pour suivre votre rentabilité.
        </p>
      </div>
    );
  }

  const positive = data.beneficeNet >= 0;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-[1.75rem] border p-5 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.24)] ${
          positive
            ? "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.96))] dark:border-emerald-400/15 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.86))]"
            : "border-rose-200/70 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.96))] dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(15,23,42,0.86))]"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Résultat net
            </p>
            <p className={`mt-2 text-3xl font-semibold tracking-tight ${positive ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
              {positive ? "+" : ""}
              {formatCurrency(data.beneficeNet)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {positive
                ? "Votre activité dégage actuellement une marge saine."
                : "Les dépenses pèsent plus lourd que le chiffre encaissé sur la période."}
            </p>
          </div>
          <div className={`rounded-[1.35rem] px-4 py-3 ${data.margePct >= 70 ? "bg-emerald-500/14 text-emerald-700 dark:text-emerald-300" : data.margePct >= 40 ? "bg-amber-500/14 text-amber-700 dark:text-amber-300" : "bg-rose-500/14 text-rose-700 dark:text-rose-300"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">Marge</p>
            <p className="mt-2 text-2xl font-semibold">{data.margePct}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.1),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.2)] dark:border-emerald-400/15 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.1),rgba(15,23,42,0.86))]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            CA encaissé
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-emerald-800 dark:text-emerald-200">
            {formatCurrency(data.caFacture)}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-rose-200/70 bg-[linear-gradient(135deg,rgba(244,63,94,0.1),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.2)] dark:border-rose-400/15 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.1),rgba(15,23,42,0.86))]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">
            Dépenses
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-rose-800 dark:text-rose-200">
            {formatCurrency(data.depenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
