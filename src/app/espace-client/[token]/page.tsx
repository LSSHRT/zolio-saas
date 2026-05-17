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
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE — preserved as-is                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 lg:hidden">
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESKTOP — v2 dense (KPI strip + 2-col body)                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="hidden min-h-screen lg-v2-workspace lg:block">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Top bar */}
          <header className="mb-6 flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-zolio text-white">
                <Building2 size={22} aria-hidden />
              </div>
              <div>
                <p className="lg-v2-eyebrow">Espace client</p>
                <h1 className="mt-1 text-xl font-bold tracking-tight lg-v2-text-strong">
                  Vos documents
                </h1>
                <p className="text-sm lg-v2-text-muted">{data?.clientEmail}</p>
              </div>
            </div>
            <span className="lg-v2-pill">
              <ShieldCheck size={12} aria-hidden /> Espace sécurisé
            </span>
          </header>

          {/* KPI strip */}
          <section className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="lg-v2-panel p-4">
              <p className="lg-v2-eyebrow">Devis</p>
              <p className="lg-v2-kpi-value mt-2 text-2xl">{data?.devis.length ?? 0}</p>
              <p className="mt-1 text-xs lg-v2-text-muted">
                {formatCurrency(totalDevis)} cumulé
              </p>
            </div>
            <div className="lg-v2-panel p-4">
              <p className="lg-v2-eyebrow">Total factures</p>
              <p className="lg-v2-kpi-value mt-2 text-2xl">{formatCurrency(totalFactures)}</p>
              <p className="mt-1 text-xs lg-v2-text-muted">
                {data?.factures.length ?? 0} document{(data?.factures.length ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
            <div className="lg-v2-panel p-4">
              <p className="lg-v2-eyebrow">En attente</p>
              <p
                className="lg-v2-kpi-value mt-2 text-2xl"
                style={{ color: unpaidCount > 0 ? "var(--v2-warning)" : "var(--v2-text-strong)" }}
              >
                {formatCurrency(totalUnpaid)}
              </p>
              <p className="mt-1 text-xs lg-v2-text-muted">
                {unpaidCount} facture{unpaidCount > 1 ? "s" : ""} à régler
              </p>
            </div>
          </section>

          {/* Body: 2-col grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: documents (8/12) */}
            <div className="space-y-6 lg:col-span-8">
              {/* Devis section */}
              {data?.devis && data.devis.length > 0 && (
                <section className="lg-v2-panel p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="lg-v2-text-subtle" aria-hidden />
                      <p className="lg-v2-eyebrow">Devis</p>
                    </div>
                    <span className="lg-v2-pill">{data.devis.length}</span>
                  </div>
                  <div className="space-y-2">
                    {data.devis.map((d) => {
                      const cfg = statutConfig[d.statut] || statutConfig["En attente"];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={d.numero}
                          className="lg-v2-panel-muted flex items-center justify-between gap-4 p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}
                            >
                              <Icon size={16} aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold lg-v2-text-strong">
                                #{d.numero}
                              </p>
                              <p className="text-xs lg-v2-text-subtle">{formatDate(d.date)}</p>
                              {d.optionLabel && (
                                <p className="mt-0.5 text-xs lg-v2-text-muted">
                                  Option :{" "}
                                  <span className="font-medium capitalize lg-v2-text-strong">
                                    {d.optionLabel}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold lg-v2-text-strong tabular-nums">
                              {formatCurrency(d.totalTTC)}
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Factures section */}
              {data?.factures && data.factures.length > 0 && (
                <section className="lg-v2-panel p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Euro size={14} className="lg-v2-text-subtle" aria-hidden />
                      <p className="lg-v2-eyebrow">Factures</p>
                    </div>
                    <span className="lg-v2-pill">{data.factures.length}</span>
                  </div>
                  <div className="space-y-2">
                    {data.factures.map((f) => {
                      const cfg = statutConfig[f.statut] || statutConfig["Émise"];
                      const Icon = cfg.icon;
                      const canPay = f.statut !== "Payée" && f.statut !== "Annulée";
                      return (
                        <div key={f.numero} className="lg-v2-panel-muted p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.color}`}
                              >
                                <Icon size={16} aria-hidden />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold lg-v2-text-strong">
                                  #{f.numero}
                                </p>
                                <p className="text-xs lg-v2-text-subtle">{formatDate(f.date)}</p>
                                {f.dateEcheance && f.statut !== "Payée" && (
                                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--v2-warning)]">
                                    <AlertTriangle size={11} aria-hidden />
                                    Échéance {formatDate(f.dateEcheance)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold lg-v2-text-strong tabular-nums">
                                {formatCurrency(f.totalTTC)}
                              </p>
                              <span
                                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                          </div>

                          {/* Lignes détail */}
                          {f.lignes && f.lignes.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedFacture(
                                  expandedFacture === f.numero ? null : f.numero,
                                )
                              }
                              className="mt-2 text-xs font-medium text-[var(--v2-primary)] hover:underline"
                            >
                              {expandedFacture === f.numero
                                ? "▾ Masquer le détail"
                                : "▸ Voir le détail"}
                            </button>
                          )}
                          {expandedFacture === f.numero && f.lignes && (
                            <div
                              className="mt-3 space-y-2 rounded-xl p-3"
                              style={{ backgroundColor: "var(--v2-panel)" }}
                            >
                              {f.lignes.map((l, i) => (
                                <div key={i} className="flex items-start justify-between text-xs">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="truncate font-medium lg-v2-text">
                                      {l.nomPrestation}
                                    </p>
                                    <p className="lg-v2-text-muted">
                                      {l.quantite} {l.unite} × {l.prixUnitaire.toFixed(2)}€
                                    </p>
                                  </div>
                                  <p className="shrink-0 font-semibold lg-v2-text-strong tabular-nums">
                                    {l.totalLigne.toFixed(2)}€
                                  </p>
                                </div>
                              ))}
                              <div
                                className="mt-2 space-y-1 border-t pt-2"
                                style={{ borderColor: "var(--v2-divider)" }}
                              >
                                <div className="flex justify-between text-xs">
                                  <span className="lg-v2-text-muted">Total HT</span>
                                  <span className="font-medium lg-v2-text tabular-nums">
                                    {f.totalHT.toFixed(2)}€
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="lg-v2-text-muted">TVA ({f.tva}%)</span>
                                  <span className="font-medium lg-v2-text tabular-nums">
                                    {(f.totalTTC - f.totalHT).toFixed(2)}€
                                  </span>
                                </div>
                                <div className="mt-1 flex justify-between text-xs">
                                  <span className="font-semibold lg-v2-text-strong">
                                    Total TTC
                                  </span>
                                  <span className="font-bold lg-v2-text-strong tabular-nums">
                                    {f.totalTTC.toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {canPay && (
                            <button
                              onClick={() => handlePayInvoice(f.numero)}
                              disabled={paying !== null}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {paying === f.numero ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" aria-hidden />
                                  Chargement...
                                </>
                              ) : (
                                <>
                                  <CreditCard size={16} aria-hidden />
                                  Payer en ligne
                                  <ExternalLink size={14} aria-hidden />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {data?.devis.length === 0 && data?.factures.length === 0 && (
                <section className="lg-v2-panel p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 lg-v2-text-subtle" aria-hidden />
                  <p className="mt-3 text-sm lg-v2-text-muted">
                    Aucun document pour le moment.
                  </p>
                </section>
              )}
            </div>

            {/* Right rail: alerts + info (4/12, sticky) */}
            <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6 self-start">
              {unpaidCount > 0 && (
                <section
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: "var(--v2-warning)",
                    backgroundColor: "var(--v2-warning-soft)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard
                      size={14}
                      style={{ color: "var(--v2-warning)" }}
                      aria-hidden
                    />
                    <p className="lg-v2-eyebrow" style={{ color: "var(--v2-warning)" }}>
                      À régler
                    </p>
                  </div>
                  <p
                    className="mt-3 text-2xl font-bold tabular-nums"
                    style={{ color: "var(--v2-warning)" }}
                  >
                    {formatCurrency(totalUnpaid)}
                  </p>
                  <p className="mt-1 text-sm lg-v2-text-muted">
                    {unpaidCount} facture{unpaidCount > 1 ? "s" : ""} en attente de règlement
                  </p>
                </section>
              )}

              <section className="lg-v2-panel p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={14}
                    className="text-[var(--v2-success)]"
                    aria-hidden
                  />
                  <p className="lg-v2-eyebrow">Sécurité</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm lg-v2-text-muted">
                  <li className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                    Espace privé, accessible via un lien unique
                  </li>
                  <li className="flex items-start gap-2">
                    <CreditCard size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                    Paiement traité par Stripe
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                    Reçu par email après chaque règlement
                  </li>
                </ul>
              </section>

              <p className="px-1 text-center text-xs lg-v2-text-subtle">
                Propulsé par Zolio · Paiement Stripe sécurisé
              </p>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
