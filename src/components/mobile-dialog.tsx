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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Fermer"
      />

      {/* Full screen sur mobile, modal sur desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[85vh] flex-col overflow-hidden sm:rounded-2xl border-0 sm:border sm:border-slate-200 bg-white shadow-2xl dark:sm:border-white/10 dark:bg-slate-900"
      >
        {/* Header fixe */}
        <div className={`flex items-center justify-between gap-3 shrink-0 border-b px-5 py-4 ${getToneClasses(tone)}`}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Action rapide</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        {description ? (
          <p className="shrink-0 px-5 pt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}

        {/* Contenu scrollable */}
        {children ? (
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
        ) : null}

        {/* Actions footer */}
        {actions ? (
          <div className="shrink-0 border-t px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
