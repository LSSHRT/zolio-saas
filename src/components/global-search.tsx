"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Receipt, Users, CreditCard, Search, X } from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/lib/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const QUICK_ACTIONS = [
  { id: "new-devis", label: "Nouveau devis", href: "/nouveau-devis", icon: FileText },
  { id: "new-facture", label: "Nouvelle facture", href: "/nouvelle-facture", icon: Receipt },
  { id: "new-client", label: "Nouveau client", href: "/clients", icon: Users },
  { id: "new-depense", label: "Nouvelle dépense", href: "/depenses", icon: CreditCard },
];

const ICONS = {
  devis: FileText,
  facture: Receipt,
  client: Users,
  depense: CreditCard,
};

const BADGE_COLORS: Record<string, string> = {
  "En attente": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Accepté: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Payée: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Émise: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En retard": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

interface SearchResult {
  type: "devis" | "facture" | "client" | "depense";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  amount: number | null;
  badge: string;
  date: string | null;
}

export function GlobalSearch({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useSWR<{ results: SearchResult[] }>(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const results = useMemo(() => data?.results ?? [], [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback(() => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  }, []);

  return (
    <div ref={containerRef} className={`relative mx-auto mt-4 max-w-xl ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition dark:bg-slate-800/80 ${
          focused
            ? "border-violet-400 ring-4 ring-violet-500/10 dark:border-violet-500 dark:ring-violet-500/20"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <Search size={18} className="shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Rechercher un client, devis, facture..."
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
        />
        {query && (
          <button onClick={() => setQuery("")} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        )}
        <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-flex dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500">
          ⌘K
        </kbd>
      </div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Quick actions (no query) */}
            {query.length < 2 && (
              <div className="space-y-0.5">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actions rapides</p>
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link key={a.id} href={a.href} onClick={handleSelect}>
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-violet-50 dark:hover:bg-violet-500/10">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                          <Icon size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Search results */}
            {query.length >= 2 && (
              results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">Aucun résultat pour « {query} »</p>
              ) : (
                <div className="space-y-0.5">
                  {results.map((r) => {
                    const Icon = ICONS[r.type];
                    return (
                      <Link key={`${r.type}:${r.id}`} href={r.href} onClick={handleSelect}>
                        <motion.div
                          whileHover={{ backgroundColor: "rgba(124,58,237,0.06)" }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition dark:hover:bg-violet-500/10"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{r.title}</p>
                            <p className="truncate text-xs text-slate-400">{r.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {r.badge && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_COLORS[r.badge] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                                {r.badge}
                              </span>
                            )}
                            {r.amount !== null && (
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.amount.toFixed(2)}€</span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
