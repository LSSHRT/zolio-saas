"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Check,
  Zap,
  Infinity as InfinityIcon,
  ShieldCheck,
  Clock,
  TrendingUp,
} from "lucide-react";

type PaywallTrigger =
  | "quota_80"
  | "quota_100"
  | "feature_locked"
  | "manual";

export interface PaywallContext {
  used?: number;
  limit?: number;
  feature?: string;
  isAnnualPromo?: boolean;
}

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  context?: PaywallContext;
}

const BENEFITS: Array<{ icon: typeof Sparkles; title: string; description: string }> = [
  {
    icon: InfinityIcon,
    title: "Devis illimités",
    description: "Plus de plafond mensuel : créez autant de devis que vous voulez.",
  },
  {
    icon: Zap,
    title: "IA Gemini illimitée",
    description: "Générez des descriptions, prestations et relances en un clic.",
  },
  {
    icon: ShieldCheck,
    title: "Signature électronique illimitée",
    description: "Faites signer vos devis directement en ligne, avec preuve juridique.",
  },
  {
    icon: TrendingUp,
    title: "Statistiques avancées",
    description: "Trésorerie, conversion, top clients, échéances — votre cockpit complet.",
  },
];

function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as { plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void };
    if (w.plausible) w.plausible(name, { props: payload });
  } catch {
    /* noop */
  }
}

export function PaywallModal({ open, onClose, trigger, context }: PaywallModalProps) {
  const [countdown, setCountdown] = useState<string>("");
  const seenRef = useRef(false);

  const title = useMemo(() => {
    if (trigger === "quota_100") return "Vous avez atteint la limite mensuelle";
    if (trigger === "quota_80") return "Plus que quelques devis ce mois-ci";
    if (trigger === "feature_locked") return `Débloquez ${context?.feature ?? "cette fonctionnalité"}`;
    return "Passez en Zolio Pro";
  }, [trigger, context?.feature]);

  const subtitle = useMemo(() => {
    if (trigger === "quota_100") {
      return "Vous avez utilisé vos 3 devis gratuits du mois. Passez Pro pour continuer sans interruption.";
    }
    if (trigger === "quota_80" && context) {
      const remaining = Math.max(0, (context.limit ?? 3) - (context.used ?? 0));
      return `Il vous reste ${remaining} devis avant la fin du mois. Anticipez et passez Pro.`;
    }
    return "Levez toutes les limites et accélérez votre activité.";
  }, [trigger, context]);

  // Countdown timer (offre valable aujourd'hui)
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [open]);

  // Track paywall_seen once per open
  useEffect(() => {
    if (open && !seenRef.current) {
      seenRef.current = true;
      trackEvent("paywall_seen", { trigger, ...context });
    }
    if (!open) {
      seenRef.current = false;
    }
  }, [open, trigger, context]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 px-6 pt-6 pb-12 text-white sm:px-8 sm:pt-8">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                <Sparkles size={14} /> Zolio Pro
              </div>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{title}</h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base">{subtitle}</p>

              {/* Countdown */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur">
                <Clock size={13} />
                Offre valable aujourd&apos;hui · <span className="tabular-nums">{countdown}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="-mt-6 rounded-t-3xl bg-white px-6 pb-6 pt-6 dark:bg-slate-900 sm:px-8 sm:pb-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {BENEFITS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={b.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 dark:border-white/8 dark:bg-white/4"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30">
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-400">{b.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/abonnement?trial=1"
                  onClick={() => trackEvent("paywall_clicked", { cta: "trial", trigger })}
                  className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:shadow-violet-600/50"
                >
                  <Sparkles size={16} /> Tester 7 jours gratuits
                </Link>
                <Link
                  href="/abonnement"
                  onClick={() => trackEvent("paywall_clicked", { cta: "subscribe", trigger })}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Voir les tarifs
                </Link>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
                <Check size={12} className="text-emerald-500" />
                Sans engagement · <Check size={12} className="text-emerald-500" /> Annulable à tout moment
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
