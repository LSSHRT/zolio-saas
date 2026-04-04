"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Plus,
  FileText,
  Users,
  BarChart3,
  Settings,
  Receipt,
  FileCheck2,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

type CmdKItem = {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  section: string;
  action: () => void;
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS: Omit<CmdKItem, "action">[] = [
  {
    id: "new-devis",
    label: "Nouveau devis",
    shortcut: "N",
    icon: Plus,
    section: "Actions rapides",
  },
  {
    id: "new-facture",
    label: "Nouvelle facture",
    icon: FileText,
    section: "Actions rapides",
  },
  {
    id: "new-depense",
    label: "Nouvelle dépense",
    icon: Receipt,
    section: "Actions rapides",
  },
  {
    id: "devis",
    label: "Devis",
    icon: FileCheck2,
    section: "Navigation",
  },
  {
    id: "factures",
    label: "Factures",
    icon: FileText,
    section: "Navigation",
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    section: "Navigation",
  },
  {
    id: "depenses",
    label: "Dépenses",
    icon: Receipt,
    section: "Navigation",
  },
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: BarChart3,
    section: "Navigation",
  },
  {
    id: "parametres",
    label: "Paramètres",
    shortcut: "S",
    icon: Settings,
    section: "Navigation",
  },
];

const SECTION_ORDER = ["Actions rapides", "Navigation"];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CmdKItem[] = useMemo(() => {
    const nav: CmdKItem[] = NAV_ITEMS.map((item) => ({
      ...item,
      action: () => {
        const routes: Record<string, string> = {
          "new-devis": "/nouveau-devis",
          "devis": "/devis",
          "factures": "/factures",
          "clients": "/clients",
          "depenses": "/depenses",
          "dashboard": "/dashboard",
          "parametres": "/parametres",
          "new-facture": "/nouvelle-facture",
          "new-depense": "/depenses/nouveau",
        };
        const route = routes[item.id] ?? "/dashboard";
        router.push(route);
        onClose();
      },
    }));
    return nav;
  }, [router, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    return SECTION_ORDER.map((section) => ({
      section,
      items: filtered.filter((item) => item.section === section),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const allFlat = useMemo(
    () => grouped.flatMap((g) => g.items),
    [grouped]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allFlat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allFlat[selectedIndex];
        if (selected) selected.action();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [allFlat, selectedIndex, onClose]
  );

  // Global shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 md:top-[20%]"
      >
        {/* Search */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <Search size={20} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une action, une page…"
            className="flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div
          className="max-h-[26rem] overflow-y-auto overscroll-contain py-2"
          role="listbox"
        >
          {grouped.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Aucun résultat
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Essayez un autre terme de recherche.
              </p>
            </div>
          ) : (
            grouped.map((group, gi) => (
              <div key={group.section} className={gi > 0 ? "mt-2" : ""}>
                <div className="px-5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {group.section}
                  </p>
                </div>
                {group.items.map((item, ii) => {
                  const flatIdx = allFlat.findIndex((f) => f.id === item.id);
                  const selected = flatIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedIndex(flatIdx);
                        item.action();
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                        selected
                          ? "bg-violet-50 dark:bg-violet-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-white/4"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          item.section === "Actions rapides"
                            ? "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
                            : "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300"
                        }`}
                      >
                        <item.icon size={17} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                        {item.label}
                      </span>
                      {item.shortcut && (
                        <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-400 dark:border-white/10 dark:bg-white/6">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[11px] text-slate-400 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-mono uppercase dark:border-white/10 dark:bg-white/6">↑↓</kbd>
              <span>parcourir</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-mono uppercase dark:border-white/10 dark:bg-white/6">↵</kbd>
              <span>sélectionner</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-mono uppercase dark:border-white/10 dark:bg-white/6">esc</kbd>
            <span>fermer</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

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
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && <CommandPalette open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>

      {/* Floating launcher */}
      <div className="fixed bottom-24 left-4 z-40 sm:bottom-6">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur-sm ring-1 ring-slate-200/60 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/12 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:border-violet-500/30 dark:hover:text-violet-300"
        >
          <Search size={15} className="shrink-0" />
          <span className="hidden sm:inline">Rechercher…</span>
          <code className="hidden rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block dark:border-white/12 dark:bg-white/6 dark:text-slate-500">
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
