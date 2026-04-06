"use client";

import { useState } from "react";
import { Loader2, Percent } from "lucide-react";
import { MobileDialog } from "@/components/mobile-dialog";

interface AcompteModalProps {
  open: boolean;
  onClose: () => void;
  devisNumero: string;
  onSuccess: (facture: { numero: string; totalTTC: number; tauxAcompte: number }) => void;
}

const PRESETS = [30, 40, 50];

export default function AcompteModal({ open, onClose, devisNumero, onSuccess }: AcompteModalProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedTaux, setSelectedTaux] = useState(30);
  const [customTaux, setCustomTaux] = useState("");
  const [loading, setLoading] = useState(false);

  const taux = mode === "preset" ? selectedTaux : Number(customTaux) || 0;

  const handleCreate = async () => {
    if (taux <= 0 || taux > 100) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devis/${devisNumero}/acompte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tauxAcompte: taux }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      onSuccess(data.facture);
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileDialog open={open} onClose={onClose} title="Facture d'acompte" tone="accent">
      <div className="space-y-6 py-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Créer une facture d'acompte pour le devis <strong className="text-slate-800 dark:text-white">{devisNumero}</strong>.
          Le montant sera calculé proportionnellement au total du devis.
        </p>

        {/* Présélection */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Taux d'acompte
          </p>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                disabled={mode !== "preset"}
                onClick={() => {
                  setMode("preset");
                  setSelectedTaux(p);
                }}
                className={`flex-1 rounded-xl py-3 text-center text-sm font-bold transition ${
                  mode === "preset" && selectedTaux === p
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Custom */}
        <div>
          <button
            onClick={() => setMode("custom")}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 transition ${
              mode === "custom"
                ? "border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
            }`}
          >
            <Percent size={18} className="text-slate-400" />
            <input
              type="number"
              min={1}
              max={100}
              placeholder="Taux personnalisé"
              value={customTaux}
              onChange={(e) => setCustomTaux(e.target.value)}
              onFocus={() => setMode("custom")}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-white outline-none"
            />
            <span className="text-xs text-slate-400">%</span>
          </button>
        </div>

        {/* Résumé */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Acompte à payer</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {taux > 0 ? `${taux}%` : "—"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || taux <= 0 || taux > 100}
            className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Création...
              </span>
            ) : (
              `Créer l'acompte (${taux}%)`
            )}
          </button>
        </div>
      </div>
    </MobileDialog>
  );
}
