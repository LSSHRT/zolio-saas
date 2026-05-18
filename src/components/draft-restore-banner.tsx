"use client";

import { Save, X } from "lucide-react";
import { formatDraftTime } from "@/lib/draft-storage";

type Props = {
  /** Time the draft was last persisted. When null/undefined, the banner
   *  renders nothing. */
  savedAt: Date | null | undefined;
  /** Called when the user clicks "Effacer". */
  onDiscard: () => void;
  /** Optional override text. Defaults to "Brouillon restauré". */
  label?: string;
};

export function DraftRestoreBanner({ savedAt, onDiscard, label = "Brouillon restauré" }: Props) {
  const formatted = formatDraftTime(savedAt ?? null);
  if (!formatted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 text-sm text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Save size={16} aria-hidden className="shrink-0" />
        <span className="truncate">
          <span className="font-semibold">{label}</span>
          <span className="text-violet-700/80 dark:text-violet-200/80"> · {formatted}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onDiscard}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-300/60 bg-white/80 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:border-violet-400 hover:bg-white dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-white/10"
      >
        <X size={12} aria-hidden />
        Effacer
      </button>
    </div>
  );
}
