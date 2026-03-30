"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type MobileDialogTone = "default" | "accent" | "danger";

function getToneClasses(tone: MobileDialogTone) {
  switch (tone) {
    case "accent":
      return "border-violet-200/80 bg-violet-50/90 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100";
    case "danger":
      return "border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100";
    default:
      return "border-slate-200/80 bg-white/90 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100";
  }
}

export function MobileDialog({
  actions,
  children,
  description,
  onClose,
  open,
  title,
  tone = "default",
}: {
  actions?: ReactNode;
  children?: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
  tone?: MobileDialogTone;
}) {
  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Safety: always reset overflow on unmount (page change)
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-6">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]"
        aria-label="Fermer la fenetre"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-h-[70vh] sm:max-h-[80vh] flex-col overflow-hidden rounded-t-[1.6rem] sm:rounded-[1.6rem] border border-slate-200/80 bg-white/96 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/96 sm:max-w-lg"
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-300/80 dark:bg-white/12" />
        </div>

        {/* Header - toujours visible */}
        <div className={`flex items-center justify-between gap-3 shrink-0 border-b px-4 py-3 sm:px-5 ${getToneClasses(tone)}`}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Action rapide</p>
            <h2 className="mt-0.5 text-base font-semibold text-slate-950 dark:text-white truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        {description ? (
          <p className="shrink-0 px-4 pt-3 text-sm text-slate-600 dark:text-slate-300 sm:px-5">{description}</p>
        ) : null}

        {/* Content scrollable */}
        {children ? (
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
            {children}
          </div>
        ) : null}

        {/* Actions footer */}
        {actions ? (
          <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:px-5 sm:pb-3 dark:border-white/10 dark:bg-slate-950/95">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
