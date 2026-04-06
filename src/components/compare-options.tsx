"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Layers, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DevisOption {
  id: string;
  numero: string;
  nomClient: string;
  optionLabel: string | null;
  totalTTC: string;
  totalHT: string;
  tva: string;
  statut: string;
  lignes: Array<{ nomPrestation: string; quantite: number; prixUnitaire: number; totalLigne: number }>;
}

interface CompareOptionsProps {
  parentId: string;
}

const OPTION_COLORS: Record<string, string> = {
  basique: "text-slate-600 dark:text-slate-300",
  standard: "text-violet-600 dark:text-violet-400",
  premium: "text-amber-600 dark:text-amber-400",
};

const OPTION_BG: Record<string, string> = {
  basique: "bg-slate-50 dark:bg-slate-800/50",
  standard: "bg-violet-50 dark:bg-violet-500/10",
  premium: "bg-amber-50 dark:bg-amber-500/10",
};

export default function CompareOptions({ parentId }: CompareOptionsProps) {
  const [open, setOpen] = useState(false);

  // Fetch all devis to find children of this parent
  const { data } = useSWR<DevisOption[]>("/api/devis", fetcher);

  const options = useMemo(() => {
    if (!data) return [];
    return data.filter((d) => {
      // The API might not return devisParentId directly, so we check if there's a way to identify
      // For now, we'll use a different approach: fetch the parent devis details which should include options
      return false; // placeholder
    });
  }, [data]);

  // Alternative: fetch parent details
  const { data: parentData } = useSWR<{ devisOptions?: DevisOption[] }>(
    open ? `/api/devis/parent/${parentId}` : null,
    fetcher,
  );

  const childOptions = parentData?.devisOptions ?? [];

  if (childOptions.length < 2) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-violet-300 bg-violet-50/50 px-3 py-2 text-xs font-semibold text-violet-600 transition hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
      >
        <Layers size={14} />
        Comparer les options
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="rounded-xl border border-violet-200 bg-white p-3 dark:border-violet-800 dark:bg-slate-800/50">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Comparaison</h4>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={14} />
                </button>
              </div>

              {/* Grid comparison */}
              <div className="grid grid-cols-3 gap-2">
                {childOptions.map((opt) => (
                  <div key={opt.id} className={`rounded-lg p-2 ${OPTION_BG[opt.optionLabel || ""] || "bg-slate-50"}`}>
                    <p className={`text-center text-xs font-bold capitalize ${OPTION_COLORS[opt.optionLabel || ""]}`}>
                      {opt.optionLabel || "Option"}
                    </p>
                    <p className="mt-1 text-center text-lg font-black text-slate-900 dark:text-white">
                      {opt.totalTTC}€
                    </p>
                    <div className="mt-2 space-y-1">
                      {opt.lignes?.slice(0, 5).map((l, i) => (
                        <div key={i} className="text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{l.nomPrestation}</span>
                          <span className="ml-1">{l.totalLigne.toFixed(2)}€</span>
                        </div>
                      ))}
                      {opt.lignes && opt.lignes.length > 5 && (
                        <p className="text-[10px] text-violet-500">+{opt.lignes.length - 5} autres...</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
