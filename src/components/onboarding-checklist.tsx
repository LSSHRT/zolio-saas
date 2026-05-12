"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Rocket,
  X,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  /** True if the step is already completed (driven by parent state) */
  done: boolean;
  /** Optional sub-CTA label override */
  ctaLabel?: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  /** When all steps are done, the component auto-collapses; this callback fires once. */
  onAllComplete?: () => void;
  /** Persist dismissed state under this key in localStorage */
  storageKey?: string;
  className?: string;
}

const DEFAULT_STORAGE_KEY = "zolio_onboarding_checklist";

interface StoredState {
  collapsed: boolean;
  dismissedAt: string | null;
  celebratedAt: string | null;
}

function readState(key: string): StoredState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { collapsed: false, dismissedAt: null, celebratedAt: null };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      collapsed: parsed.collapsed === true,
      dismissedAt: parsed.dismissedAt ?? null,
      celebratedAt: parsed.celebratedAt ?? null,
    };
  } catch {
    return { collapsed: false, dismissedAt: null, celebratedAt: null };
  }
}

function writeState(key: string, state: StoredState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Persistent gamified onboarding checklist for the dashboard.
 * - Visible until all steps are completed (then auto-hides after celebration)
 * - User can collapse / dismiss explicitly
 * - Confetti on full completion
 */
export function OnboardingChecklist({
  steps,
  onAllComplete,
  storageKey = DEFAULT_STORAGE_KEY,
  className,
}: OnboardingChecklistProps) {
  const [state, setState] = useState<StoredState>({ collapsed: false, dismissedAt: null, celebratedAt: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState(storageKey));
    setHydrated(true);
  }, [storageKey]);

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  // Confetti + onAllComplete (once)
  useEffect(() => {
    if (!hydrated) return;
    if (!allDone) return;
    if (state.celebratedAt) return;

    let cancelled = false;
    void (async () => {
      try {
        const confettiModule = await import("canvas-confetti");
        if (cancelled) return;
        const confetti = confettiModule.default;
        const fire = (particleRatio: number, opts: Record<string, unknown>) =>
          confetti({
            origin: { y: 0.7 },
            particleCount: Math.floor(180 * particleRatio),
            ...opts,
          });
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } catch {
        /* confetti optional */
      }
    })();

    const next: StoredState = { ...state, celebratedAt: new Date().toISOString() };
    setState(next);
    writeState(storageKey, next);
    onAllComplete?.();

    return () => {
      cancelled = true;
    };
  }, [allDone, hydrated, state, storageKey, onAllComplete]);

  const dismiss = () => {
    const next: StoredState = { ...state, dismissedAt: new Date().toISOString() };
    setState(next);
    writeState(storageKey, next);
  };

  const toggleCollapsed = () => {
    const next: StoredState = { ...state, collapsed: !state.collapsed };
    setState(next);
    writeState(storageKey, next);
  };

  const headline = useMemo(() => {
    if (allDone) return "Bravo, vous êtes prêt à signer vos premiers devis !";
    if (completed === 0) return "Votre cockpit en 5 étapes";
    if (percent < 50) return "Bonne lancée — continuez !";
    if (percent < 100) return "Plus que quelques étapes…";
    return "Cockpit prêt à décoller";
  }, [allDone, completed, percent]);

  if (!hydrated) return null;
  if (state.dismissedAt) return null;
  if (allDone && state.celebratedAt) {
    // Show a small "completed" badge for the rest of the session, then auto-hide
    const since = Date.now() - new Date(state.celebratedAt).getTime();
    if (since > 24 * 60 * 60 * 1000) return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-orange-500/5 p-5 ring-1 ring-violet-300/40 backdrop-blur dark:ring-violet-400/20 ${className ?? ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex flex-1 items-center gap-3 text-left"
          aria-expanded={!state.collapsed}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-violet-600/30">
            {allDone ? <Trophy size={20} /> : <Rocket size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                Démarrage Zolio
              </p>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10.5px] font-bold text-violet-700 dark:text-violet-200">
                {completed}/{total}
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white sm:text-base">{headline}</h3>
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 text-slate-400 transition-transform duration-300 ${state.collapsed ? "" : "rotate-180"}`}
          />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Masquer la checklist"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
        />
      </div>

      {/* Steps */}
      <AnimatePresence initial={false}>
        {!state.collapsed && (
          <motion.ul
            key="list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.id}>
                  {step.href && !step.done ? (
                    <Link
                      href={step.href}
                      className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/85 p-3.5 transition hover:border-violet-300/60 hover:bg-white dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/30 dark:hover:bg-white/8"
                    >
                      <StepIcon Icon={Icon} done={step.done} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-400">
                          {step.description}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="mt-1 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  ) : (
                    <div
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                        step.done
                          ? "border-emerald-200/70 bg-emerald-500/8 dark:border-emerald-400/20 dark:bg-emerald-500/8"
                          : "border-slate-200/70 bg-white/70 dark:border-white/8 dark:bg-white/4"
                      }`}
                    >
                      <StepIcon Icon={Icon} done={step.done} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            step.done ? "text-emerald-700 dark:text-emerald-200 line-through decoration-emerald-400/60" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function StepIcon({ Icon, done }: { Icon: LucideIcon; done: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
        done
          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
      }`}
    >
      {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
    </div>
  );
}

// Re-export Circle to silence TS unused import (kept in case consumers want it).
export const _Circle = Circle;
