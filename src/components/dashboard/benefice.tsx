"use client";

import { formatCurrency } from "./shared";
import type { BeneficeSummary } from "./shared";

function ResultDetail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
}) {
  return (
    <div className={`rounded-[1.4rem] border bg-white/84 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:bg-white/4 ${tone === "emerald" ? "border-emerald-200/70 dark:border-emerald-400/15" : "border-rose-200/70 dark:border-rose-400/15"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-3 text-xl font-semibold tracking-tight ${tone === "emerald" ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
        {value}
      </p>
    </div>
  );
}

export function DashboardBenefice({ data }: { data: BeneficeSummary }) {
  if (!data || (data.caFacture === 0 && data.depenses === 0)) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune donnée de résultat</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Encaissez des factures et enregistrez des dépenses pour calculer la rentabilité.
        </p>
      </div>
    );
  }

  const positive = data.beneficeNet >= 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-[1.6rem] border bg-white/84 p-5 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.22)] dark:bg-white/4 ${positive ? "border-emerald-200/70 dark:border-emerald-400/15" : "border-rose-200/70 dark:border-rose-400/15"}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Résultat net
            </p>
            <p className={`mt-3 text-3xl font-semibold tracking-tight ${positive ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
              {positive ? "+" : ""}
              {formatCurrency(data.beneficeNet)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {positive
                ? "Votre activité reste rentable sur les montants encaissés."
                : "Les dépenses dépassent actuellement le chiffre effectivement encaissé."}
            </p>
          </div>
          <div className={`rounded-[1.3rem] px-4 py-3 ${data.margePct >= 70 ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : data.margePct >= 40 ? "bg-amber-500/12 text-amber-700 dark:text-amber-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">Marge</p>
            <p className="mt-2 text-2xl font-semibold">{data.margePct}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ResultDetail
          label="CA encaissé"
          value={formatCurrency(data.caFacture)}
          tone="emerald"
        />
        <ResultDetail
          label="Dépenses"
          value={formatCurrency(data.depenses)}
          tone="rose"
        />
      </div>
    </div>
  );
}
