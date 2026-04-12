"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

type AdminConfirmDialogProps = {
  dialog: {
    title: string;
    description: string;
    confirmLabel: string;
    tone: "brand" | "danger" | "warning";
  } | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function toneButtonClasses(tone: "brand" | "danger" | "warning") {
  switch (tone) {
    case "danger":
      return "bg-red-500 hover:bg-red-400 text-white";
    case "warning":
      return "bg-amber-400 hover:bg-amber-300 text-slate-950";
    default:
      return "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white hover:opacity-90";
  }
}

export function AdminConfirmDialog({
  dialog,
  isPending,
  onClose,
  onConfirm,
}: AdminConfirmDialogProps) {
  return (
    <AnimatePresence>
      {dialog && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="admin-panel-strong w-full max-w-lg rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200 ring-1 ring-amber-200/15">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-white">{dialog.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{dialog.description}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${toneButtonClasses(dialog.tone)}`}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  dialog.confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
