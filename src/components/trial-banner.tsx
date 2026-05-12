"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

interface TrialBannerProps {
  trialEndsAt: string | Date | null | undefined;
  className?: string;
}

/**
 * Displays a persistent banner during a Pro trial showing days remaining.
 * Hidden when no trial or trial has ended.
 */
export function TrialBanner({ trialEndsAt, className }: TrialBannerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const info = useMemo(() => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt).getTime();
    if (!Number.isFinite(end)) return null;
    const diff = end - now;
    if (diff <= 0) return null;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return { days, hours, end };
  }, [trialEndsAt, now]);

  if (!info) return null;

  const isLastDay = info.days <= 1;
  const tone = isLastDay
    ? { ring: "ring-amber-500/40", bg: "from-amber-500/15 via-amber-500/5 to-transparent", chip: "bg-amber-500 text-white", text: "text-amber-700 dark:text-amber-200" }
    : { ring: "ring-violet-500/30", bg: "from-violet-500/10 via-violet-500/5 to-transparent", chip: "bg-violet-500 text-white", text: "text-violet-700 dark:text-violet-200" };

  const label = isLastDay
    ? `Dernier jour d'essai (${info.hours}h restantes)`
    : `Essai Pro · ${info.days} jour${info.days > 1 ? "s" : ""} restant${info.days > 1 ? "s" : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2.5 rounded-2xl bg-gradient-to-br ${tone.bg} p-3.5 ring-1 ${tone.ring} backdrop-blur sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.chip} shadow-md`}>
          <Sparkles size={16} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${tone.text}`}>{label}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
            <Clock size={11} /> Ajoutez une carte pour continuer en Pro après l&apos;essai.
          </p>
        </div>
      </div>
      <Link
        href="/abonnement"
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-3.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 transition hover:shadow-violet-600/40 sm:self-auto"
      >
        Confirmer Pro <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
}
