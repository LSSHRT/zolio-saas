"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type MobileDialogTone = "default" | "accent" | "danger";


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
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Fermer"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex w-full max-w-lg max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Action rapide</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
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

        {description ? (
          <p className="px-5 pt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}

        {children ? (
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
        ) : null}

        {actions ? (
          <div className="border-t px-5 py-3">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
