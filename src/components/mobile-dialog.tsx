"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            aria-label="Fermer"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-10 flex w-full max-w-lg max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-white/10 dark:bg-slate-900"
            data-testid="mobile-dialog"
          >
            {/* Drag Handle pour le swipe-to-dismiss */}
            <div className="flex w-full items-center justify-center pt-3 pb-1 sm:hidden touch-none">
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between gap-3 border-b px-5 py-3 sm:py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Action rapide</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                aria-label="Fermer"
                data-testid="mobile-dialog-close"
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
              <div className="border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
