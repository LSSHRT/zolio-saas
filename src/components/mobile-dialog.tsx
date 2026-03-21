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
    case "default":
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
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        aria-label="Fermer la fenêtre"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-white/96 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/96"
      >
        <div className={`border-b px-5 py-4 sm:px-6 ${getToneClasses(tone)}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-80">Action rapide</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:border-violet-400/20 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {children ? <div className="px-5 py-5 sm:px-6">{children}</div> : null}

        {actions ? (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-white/10">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
