"use client";

import Link from "next/link";
import { TrendingUp, Clock3, TriangleAlert } from "lucide-react";
import { formatCurrency } from "./shared";
import type { TresorerieSummary } from "./shared";

// ─── Trésorerie Section ───────────────────────────────────────────────
// Responsive — rendu unique pour mobile ET desktop

export function DashboardTresorerie({ data }: { data: TresorerieSummary }) {
  if (!data || data.nombreFactures === 0) {
    return (
      <div className="rounded-[1.45rem] border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/4">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">Aucune facture</p>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Transformez vos devis acceptés en factures pour suivre votre trésorerie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Encaissé */}
      <div className="rounded-[1.45rem] border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
            <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Encaissé</p>
            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              {formatCurrency(data.encaisse)}
            </p>
          </div>
        </div>
      </div>

      {/* À encaisser */}
      <div className="rounded-[1.45rem] border border-violet-200/70 bg-violet-50/50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15">
            <Clock3 size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">À encaisser</p>
            <p className="text-lg font-bold text-violet-800 dark:text-violet-200">
              {formatCurrency(data.aEncaisser)}
            </p>
          </div>
        </div>
      </div>

      {/* En retard */}
      <div className={`rounded-[1.45rem] border p-4 ${data.enRetard > 0 ? "border-rose-200/70 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/10" : "border-slate-200/70 bg-slate-50/50 dark:border-white/8 dark:bg-white/4"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${data.enRetard > 0 ? "bg-rose-500/15" : "bg-slate-500/15"}`}>
              <TriangleAlert size={16} className={data.enRetard > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${data.enRetard > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>En retard</p>
              <p className={`text-lg font-bold ${data.enRetard > 0 ? "text-rose-800 dark:text-rose-200" : "text-slate-400"}`}>
                {formatCurrency(data.enRetard)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Recouvrement</p>
            <p className={`text-lg font-bold ${data.tauxRecouvrement >= 80 ? "text-emerald-600 dark:text-emerald-400" : data.tauxRecouvrement >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
              {data.tauxRecouvrement}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
