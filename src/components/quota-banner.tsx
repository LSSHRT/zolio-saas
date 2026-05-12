"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Infinity as InfinityIcon, ArrowRight } from "lucide-react";

interface QuotaBannerProps {
  used: number;
  limit: number;
  onUpgradeClick: () => void;
  className?: string;
}

/**
 * Inline banner shown in the dashboard when the user is approaching/has reached
 * their free-tier quota. Visible at ≥ 60% usage.
 *
 * - 60%-79%: gentle nudge (slate)
 * - 80%-99%: amber warning
 * - 100%: rose blocking state
 */
export function QuotaBanner({ used, limit, onUpgradeClick, className }: QuotaBannerProps) {
  const ratio = limit > 0 ? used / limit : 0;
  if (ratio < 0.6) return null;

  const isMaxed = used >= limit;
  const isWarning = ratio >= 0.8 && !isMaxed;

  const tone = isMaxed
    ? { ring: "ring-rose-500/30", bg: "from-rose-500/10 via-rose-500/5 to-transparent", text: "text-rose-700 dark:text-rose-200", chip: "bg-rose-500 text-white", bar: "bg-rose-500" }
    : isWarning
    ? { ring: "ring-amber-500/30", bg: "from-amber-500/10 via-amber-500/5 to-transparent", text: "text-amber-700 dark:text-amber-200", chip: "bg-amber-500 text-white", bar: "bg-amber-500" }
    : { ring: "ring-violet-500/30", bg: "from-violet-500/10 via-violet-500/5 to-transparent", text: "text-violet-700 dark:text-violet-200", chip: "bg-violet-500 text-white", bar: "bg-violet-500" };

  const remaining = Math.max(0, limit - used);
  const title = isMaxed
    ? "Limite mensuelle atteinte"
    : isWarning
    ? `Plus que ${remaining} devis ce mois-ci`
    : `Vous avez utilisé ${used} de vos ${limit} devis gratuits`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tone.bg} p-4 ring-1 ${tone.ring} backdrop-blur sm:p-5 ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.chip} shadow-md`}>
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${tone.text}`}>{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-400">
              Pro = devis illimités, IA illimitée, paiement en ligne, signature avancée.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 text-xs font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-violet-600/40 sm:self-auto"
        >
          <Zap size={14} /> Passer Pro
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, ratio * 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full ${tone.bar}`}
        />
      </div>

      {/* Mini comparator */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10.5px]">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-2 py-1.5 font-medium text-slate-600 dark:bg-white/4 dark:text-slate-400">
          <InfinityIcon size={12} className="text-violet-500" /> Devis illimités
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-2 py-1.5 font-medium text-slate-600 dark:bg-white/4 dark:text-slate-400">
          <Zap size={12} className="text-violet-500" /> IA illimitée
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-2 py-1.5 font-medium text-slate-600 dark:bg-white/4 dark:text-slate-400">
          <Sparkles size={12} className="text-violet-500" /> Paiement en ligne
        </div>
      </div>
    </motion.div>
  );
}
