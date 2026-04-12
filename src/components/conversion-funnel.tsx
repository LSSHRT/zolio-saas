"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { FunnelEtape } from "@/lib/client-dashboard";

const COLOR_MAP: Record<string, { bg: string; text: string; bar: string; lightBg: string }> = {
  violet: { bg: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", bar: "from-violet-500 to-violet-400", lightBg: "bg-violet-50 dark:bg-violet-500/10" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bar: "from-emerald-500 to-emerald-400", lightBg: "bg-emerald-50 dark:bg-emerald-500/10" },
  blue: { bg: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", bar: "from-blue-500 to-blue-400", lightBg: "bg-blue-50 dark:bg-blue-500/10" },
  amber: { bg: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", bar: "from-amber-500 to-amber-400", lightBg: "bg-amber-50 dark:bg-amber-500/10" },
};

export default function ConversionFunnel({ funnel, isLoading }: { funnel: FunnelEtape[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-100/50 dark:bg-white/5 px-4 py-3">
            <div className="h-3 w-3 shrink-0 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10 animate-pulse />
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-white/10 animate-pulse />
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10 animate-pulse />
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-slate-200 dark:bg-white/10 animate-pulse />
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-white/10 animate-pulse />
              </div>
            </div>
            <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse />
          </div>
        ))}
      </div>
    );
  }

  if (!funnel.length) return null;
  const maxCount = Math.max(...funnel.map((e) => e.count), 1);

  return (
    <div className="space-y-3">
      {funnel.map((etape, i) => {
        const colors = COLOR_MAP[etape.color] || COLOR_MAP.violet;
        const widthPct = Math.max((etape.count / maxCount) * 100, 12);
        const nextPct = i < funnel.length - 1 ? funnel[i + 1].pct : null;

        return (
          <motion.div
            key={etape.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative"
          >
            <div className={`flex items-center gap-3 rounded-xl ${colors.lightBg} px-4 py-3`}>
              <div className={`h-3 w-3 shrink-0 rounded-full ${colors.bg}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${colors.text}`}>{etape.label}</p>
                  {nextPct !== null && (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {etape.pct}% → {nextPct}%
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{etape.count} devis</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{etape.amount.toFixed(0)}€</p>
                </div>
              </div>
              {i < funnel.length - 1 && (
                <ChevronRight size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
