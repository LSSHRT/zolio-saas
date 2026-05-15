"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

// Lazy-load the heavy palette panel — only ships JS once the user opens it.
const CommandPalettePanel = dynamic(() => import("./command-palette-panel"), {
  ssr: false,
});

const STORAGE_KEY = "zolio-hinted-cmdk-closed";

export function CmdKLauncher() {
  const [hasSeenHint, setHasSeenHint] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setHasSeenHint(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "k" && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const openHandler = () => setOpen(true);
    document.addEventListener("keydown", handler);
    document.addEventListener("zolio:open-command-palette", openHandler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("zolio:open-command-palette", openHandler);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && <CommandPalettePanel open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>

      {/* Floating launcher — tablet only. Mobile uses dock, desktop uses sidebar. */}
      <div className="fixed bottom-6 left-4 z-20 hidden md:block lg:hidden">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur-sm ring-1 ring-slate-200/60 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/12 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:border-violet-500/30 dark:hover:text-violet-300"
        >
          <Search size={15} className="shrink-0" />
          <span>Rechercher…</span>
          <code className="rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-white/12 dark:bg-white/6 dark:text-slate-500">
            ⌘K
          </code>

          {/* First-time hint */}
          {hasSeenHint && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-slate-900"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasSeenHint(false);
                  localStorage.setItem(STORAGE_KEY, "1");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white dark:text-slate-900/60 dark:hover:text-slate-900"
              >
                ×
              </button>
              Appuyez sur <kbd>⌘K</kbd> pour lancer
            </motion.div>
          )}
        </motion.button>
      </div>
    </>
  );
}
