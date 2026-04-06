"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { group: "Navigation", items: [
    { keys: ["Cmd", "K"], desc: "Ouvrir la recherche globale" },
    { keys: ["?"], desc: "Afficher les raccourcis clavier" },
    { keys: ["Escape"], desc: "Fermer les modales / recherche" },
  ]},
  { group: "Actions rapides", items: [
    { keys: ["N"], desc: "Nouveau devis (depuis recherche)" },
    { keys: ["Cmd", "Entrée"], desc: "Créer une facture rapidement" },
  ]},
  { group: "Pages", items: [
    { keys: ["G", "D"], desc: "Aller au Dashboard" },
    { keys: ["G", "F"], desc: "Aller aux Factures" },
    { keys: ["G", "C"], desc: "Aller aux Clients" },
    { keys: ["G", "P"], desc: "Aller au Planning" },
  ]},
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Bouton d'accès */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        title="Raccourcis clavier (?)"
      >
        <Keyboard size={13} />
        <span className="hidden sm:inline">Raccourcis</span>
        <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-700 dark:text-slate-500">?</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Raccourcis clavier</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {SHORTCUTS.map((group) => (
                  <div key={group.group}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.group}
                    </h3>
                    <div className="space-y-1.5">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                          <span className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</span>
                          <div className="flex gap-1">
                            {item.keys.map((k, j) => (
                              <kbd
                                key={j}
                                className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
