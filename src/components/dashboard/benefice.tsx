"use client";

import { formatCurrency } from "./shared";
import type { BeneficeSummary } from "./shared";

// ─── Bénéfice Net Section ─────────────────────────────────────────────
// Responsive — rendu unique pour mobile ET desktop

export function DashboardBenefice({ data }: { data: BeneficeSummary }) {
  if (!data || (data.caFacture === 0 && data.depenses === 0)) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Pas encore de données</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Payez vos premières factures et enregistrez des dépenses pour calculer votre bénéfice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-[1.45rem] border p-5 ${
        data.beneficeNet >= 0
          ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-transparent"
          : "border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-rose-100/40 dark:border-rose-500/20 dark:from-rose-500/10 dark:to-transparent"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              data.beneficeNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}>Bénéfice net</p>
            <p className={`mt-1 text-3xl font-bold ${
              data.beneficeNet >= 0 ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200"
            }`}>
              {data.beneficeNet >= 0 ? "+" : ""}{formatCurrency(data.beneficeNet)}
            </p>
          </div>
          <div className={`rounded-full px-4 py-2 text-sm font-bold ${
            data.margePct >= 70
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : data.margePct >= 40
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
          }`}>
            {data.margePct}% marge
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.2rem] border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-500/10 dark:bg-emerald-500/5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">CA encaissé</p>
          <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(data.caFacture)}</p>
        </div>
        <div className="rounded-[1.2rem] border border-rose-200/50 bg-rose-50/50 p-3 dark:border-rose-500/10 dark:bg-rose-500/5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Dépenses</p>
          <p className="mt-1 text-lg font-bold text-rose-800 dark:text-rose-200">{formatCurrency(data.depenses)}</p>
        </div>
      </div>
    </div>
  );
}
