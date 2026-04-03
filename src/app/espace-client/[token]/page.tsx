"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  XCircle,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Euro,
} from "lucide-react";

type DevisItem = {
  numero: string;
  date: string;
  statut: string;
  totalTTC: number;
  optionLabel?: string | null;
};

type FactureItem = {
  numero: string;
  date: string;
  statut: string;
  totalTTC: number;
  dateEcheance?: string | null;
};

type ClientData = {
  clientEmail: string;
  devis: DevisItem[];
  factures: FactureItem[];
};

const statutConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  "En attente": { label: "En attente", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
  "Accepté": { label: "Accepté", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle },
  "Refusé": { label: "Refusé", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", icon: XCircle },
  "Signé": { label: "Signé", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle },
  "Émise": { label: "Émise", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: Clock },
  "Payée": { label: "Payée", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: CheckCircle },
  "En retard": { label: "En retard", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", icon: AlertTriangle },
  "Annulée": { label: "Annulée", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/20", icon: XCircle },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function EspaceClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/espace-client?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de connexion");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Lien invalide</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalDevis = data?.devis.reduce((s, d) => s + d.totalTTC, 0) ?? 0;
  const totalFactures = data?.factures.reduce((s, f) => s + f.totalTTC, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-white/8 dark:bg-slate-900/80">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-zolio text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Espace Client</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{data?.clientEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Summary */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-white/8 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Devis</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{data?.devis.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-white/8 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total devis</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalDevis)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-4 dark:border-white/8 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">Factures</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFactures)}</p>
          </div>
        </div>

        {/* Devis */}
        {data?.devis && data.devis.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <FileText size={16} /> Devis
            </h2>
            <div className="space-y-2">
              {data.devis.map((d) => {
                const cfg = statutConfig[d.statut] || statutConfig["En attente"];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={d.numero}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200/60 bg-white p-4 transition hover:border-violet-200 dark:border-white/8 dark:bg-white/5 dark:hover:border-violet-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">#{d.numero}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(d.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(d.totalTTC)}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    {d.optionLabel && (
                      <p className="mt-2 text-xs text-violet-600 dark:text-violet-400">
                        Option : <span className="font-medium capitalize">{d.optionLabel}</span>
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Factures */}
        {data?.factures && data.factures.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Euro size={16} /> Factures
            </h2>
            <div className="space-y-2">
              {data.factures.map((f) => {
                const cfg = statutConfig[f.statut] || statutConfig["Émise"];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={f.numero}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200/60 bg-white p-4 transition hover:border-violet-200 dark:border-white/8 dark:bg-white/5 dark:hover:border-violet-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">#{f.numero}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(f.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(f.totalTTC)}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    {f.dateEcheance && f.statut !== "Payée" && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Échéance : {formatDate(f.dateEcheance)}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {data?.devis.length === 0 && data?.factures.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun document pour le moment.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck size={12} />
          <span>Espace sécurisé — Propulsé par Zolio</span>
        </div>
      </div>
    </div>
  );
}
