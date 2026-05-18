"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import type { AddressSearchHit } from "@/app/api/geocode/search/route";

export type { AddressSearchHit } from "@/app/api/geocode/search/route";

type Props = {
  onSelect: (hit: AddressSearchHit) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  helperText?: string;
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; results: AddressSearchHit[] };

const MIN_QUERY = 3;
const DEBOUNCE_MS = 400;

export default function AddressSearch({
  onSelect,
  placeholder = "Rechercher une adresse (rue, code postal, ville)…",
  className = "",
  autoFocus = false,
  helperText = "Tape le début d'une adresse — les coordonnées (rue, code postal, ville) sont préremplies depuis OpenStreetMap.",
}: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) {
      setState({ status: "idle" });
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: "loading" });

      fetch(`/api/geocode/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return (await res.json()) as { results?: AddressSearchHit[]; error?: string };
        })
        .then((payload) => {
          if (controller.signal.aborted) return;
          if (payload.error) {
            setState({ status: "error", message: payload.error });
            return;
          }
          setState({ status: "ok", results: payload.results ?? [] });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const message = error instanceof Error ? error.message : "Erreur";
          setState({ status: "error", message });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [trimmed]);

  const reset = () => {
    setQuery("");
    setState({ status: "idle" });
    abortRef.current?.abort();
  };

  const handlePick = (hit: AddressSearchHit) => {
    onSelect(hit);
    reset();
  };

  return (
    <div className={className}>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Rechercher une adresse"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 pr-9 text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900"
        />
        {query ? (
          <button
            type="button"
            onClick={reset}
            aria-label="Effacer la recherche d'adresse"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8"
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>

      {state.status === "loading" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 size={14} className="animate-spin" aria-hidden />
          Recherche en cours…
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {state.message || "Annuaire d'adresses indisponible — saisie manuelle possible ci-dessous."}
        </div>
      )}

      {state.status === "ok" && state.results.length === 0 && trimmed.length >= MIN_QUERY && (
        <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Aucune adresse trouvée. Tu peux saisir manuellement l&apos;adresse ci-dessous.
        </div>
      )}

      {state.status === "ok" && state.results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Résultats de l'annuaire d'adresses"
          className="mt-2 max-h-72 space-y-1.5 overflow-y-auto"
        >
          {state.results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => handlePick(hit)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
                  aria-hidden
                >
                  <MapPin size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {hit.voie || hit.label}
                  </span>
                  {hit.codePostal || hit.ville ? (
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {[hit.codePostal, hit.ville].filter(Boolean).join(" ")}
                    </span>
                  ) : null}
                  {hit.pays ? (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {hit.pays}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
