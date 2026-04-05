"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  CreditCard,
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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

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
  totalHT: number;
  tva: number;
  dateEcheance?: string | null;
  lignes?: { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number }[];
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
  const [paying, setPaying] = useState<string | null>(null);
  const [expandedFacture, setExpandedFacture] = useState<string | null>(null);

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

  const handlePayInvoice = async (numero: string) => {
    setPaying(numero);
    try {
      const res = await fetch("/api/factures/public-pay-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroFacture: numero, portalToken: token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erreur");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur paiement");
    } finally {
      setPaying(null);
    }
  };

  const unpaidCount = data?.factures.filter(
    (f) => f.statut !== "Payée" && f.statut !== "Annulée"
  ).length ?? 0;

  const totalUnpaid = data?.factures
    .filter((f) => f.statut !== "Payée" && f.statut !== "Annulée")
    .reduce((s, f) => s + f.totalTTC, 0) ?? 0;

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
            <p className="text-xs text-slate-500 dark:text-slate-400">Total factures</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFactures)}</p>
          </div>
        </div>

        {/* Impayés — alert box */}
        {unpaidCount > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/15 flex items-center justify-center">
                <CreditCard size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {unpaidCount} facture{unpaidCount > 1 ? "s" : ""} en attente de règlement
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Montant restant : {formatCurrency(totalUnpaid)}
                </p>
              </div>
            </div>
          </div>
        )}

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
                const canPay = f.statut !== "Payée" && f.statut !== "Annulée";
                return (
                  <motion.div
                    key={f.numero}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200/60 bg-white p-4 transition hover:border-violet-200 dark:border-white/8 dark:bg-white/5 dark:hover:border-violet-800"
                  >
                    <div className="flex items-center justify-between mb-2">
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
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Échéance : {formatDate(f.dateEcheance)}
                      </p>
                    )}
                    
                    {/* Lignes détaillées (expandable) */}
                    {f.lignes && f.lignes.length > 0 && (
                      <button
                        onClick={() => setExpandedFacture(expandedFacture === f.numero ? null : f.numero)}
                        className="mt-2 w-full text-left text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        {expandedFacture === f.numero ? "▾ Masquer le détail" : "▸ Voir le détail"}
                      </button>
                    )}
                    {expandedFacture === f.numero && f.lignes && (
                      <div className="mt-3 rounded-xl bg-slate-50 dark:bg-white/5 p-3 space-y-2">
                        {f.lignes.map((l, i) => (
                          <div key={i} className="flex items-start justify-between text-xs">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{l.nomPrestation}</p>
                              <p className="text-slate-500 dark:text-slate-400">{l.quantite} {l.unite} × {l.prixUnitaire.toFixed(2)}€</p>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white shrink-0">{l.totalLigne.toFixed(2)}€</p>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Total HT</span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">{f.totalHT.toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">TVA ({f.tva}%)</span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">{(f.totalTTC - f.totalHT).toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="font-semibold text-slate-800 dark:text-white">Total TTC</span>
                            <span className="font-bold text-slate-900 dark:text-white">{f.totalTTC.toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {canPay && (
                      <button
                        onClick={() => handlePayInvoice(f.numero)}
                        disabled={paying !== null}
                        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
                      >
                        {paying === f.numero ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            Payer en ligne
                            <ExternalLink size={14} />
                          </>
                        )}
                      </button>
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
          <span>Espace sécurisé — Paiement par Stripe — Propulsé par Zolio</span>
        </div>
      </div>
    </div>
  );
}
