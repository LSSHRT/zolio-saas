"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Calculator, Download, FileSpreadsheet, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { MetricTile } from "@/components/desktop";

interface TvaData {
  periode: string;
  tvaCollectee: number;
  tvaDepenses: number;
  solde: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function formatMontant(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function TvaPage() {
  const [annee, setAnnee] = useState(String(CURRENT_YEAR));
  const [trimestre, setTrimestre] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ annee });
    if (trimestre) params.set("trimestre", trimestre);
    return `/api/export/tva?${params.toString()}`;
  }, [annee, trimestre]);

  const { data, isLoading } = useSWR<TvaData>(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const handleExportPennylane = useCallback(() => {
    if (!data) return;
    const year = annee;
    const a = document.createElement("a");
    a.href = `/api/export/pennylane?annee=${year}`;
    a.click();
    toast.success("Export Pennylane en cours...");
  }, [data, annee]);

  const handleExportPdf = useCallback(async () => {
    if (!data) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Récapitulatif TVA", 20, 25);

      doc.setFontSize(12);
      doc.text(`Période : ${data.periode}`, 20, 40);

      doc.setFontSize(11);
      doc.text(`TVA collectée : ${formatMontant(data.tvaCollectee)}`, 20, 58);
      doc.text(`TVA sur dépenses : ${formatMontant(data.tvaDepenses)}`, 20, 68);

      doc.setLineWidth(0.5);
      doc.line(20, 75, 190, 75);

      doc.setFontSize(13);
      const soldeLabel = data.solde >= 0 ? "Solde à payer" : "Solde à récupérer";
      doc.text(`${soldeLabel} : ${formatMontant(Math.abs(data.solde))}`, 20, 88);

      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text("Généré par Zolio", 20, 280);

      doc.save(`zolio-tva-${annee}${trimestre ? `-t${trimestre}` : ""}.pdf`);
      toast.success("PDF exporté avec succès.");
    } catch {
      toast.error("Erreur lors de l'export PDF.");
    }
  }, [data, annee, trimestre]);

  return (
    <ClientSubpageShell
      title="Récapitulatif TVA"
      description="TVA collectée et déductible par période. Export PDF pour votre comptable."
      activeNav="tools"
      eyebrow="Fiscalité"
      breadcrumbs={[{ label: "Outils" }, { label: "TVA" }]}
      metaPills={[
        {
          icon: Calculator,
          label: trimestre ? `Trimestre ${trimestre} ${annee}` : `Année ${annee}`,
          tone: "slate",
        },
        ...(data
          ? [
              { icon: TrendingUp, label: `${formatMontant(data.tvaCollectee)} collectée`, tone: "emerald" as const },
              { icon: TrendingDown, label: `${formatMontant(data.tvaDepenses)} déductible`, tone: "amber" as const },
            ]
          : []),
      ]}
      focusLine={
        !data ? (
          <>Sélectionnez une année et un trimestre pour calculer votre TVA sur la période.</>
        ) : data.solde >= 0 ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Solde à reverser : {formatMontant(data.solde)}
            </span>
            {" "}· Provisionnez ce montant pour la prochaine échéance fiscale.
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Solde à récupérer : {formatMontant(Math.abs(data.solde))}
            </span>
            {" "}· Vos dépenses ont généré plus de TVA que vos encaissements sur la période.
          </>
        )
      }
      mobilePrimaryAction={
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!data}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
        >
          <Download size={16} />
          Exporter PDF
        </button>
      }
      mobileSecondaryActions={
        data ? [
          {
            label: "Pennylane",
            icon: Download,
            onClick: handleExportPennylane,
            tone: "default" as const,
          },
        ] : []
      }
      actions={
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!data}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
        >
          <Download size={16} />
          Exporter PDF
        </button>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ClientHeroStat
            label="TVA collectée"
            value={data ? formatMontant(data.tvaCollectee) : "—"}
            detail="Factures payées dans la période"
            tone="emerald"
          />
          <ClientHeroStat
            label="TVA sur dépenses"
            value={data ? formatMontant(data.tvaDepenses) : "—"}
            detail="Dépenses enregistrées (est. 20%)"
            tone="amber"
          />
          <ClientHeroStat
            label="Solde"
            value={data ? formatMontant(Math.abs(data.solde)) : "—"}
            detail={data ? (data.solde >= 0 ? "À payer" : "À récupérer") : ""}
            tone={data && data.solde >= 0 ? "rose" : "emerald"}
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Fiscalité"
          description="TVA collectée vs TVA déductible"
          badge={data?.periode || ""}
          items={[
            {
              label: "Collectée",
              value: data ? formatMontant(data.tvaCollectee) : "—",
              detail: "Factures payées",
              tone: "emerald",
            },
            {
              label: "Dépenses",
              value: data ? formatMontant(data.tvaDepenses) : "—",
              detail: "Estimation 20%",
              tone: "amber",
            },
            {
              label: "Solde",
              value: data ? formatMontant(Math.abs(data.solde)) : "—",
              detail: data ? (data.solde >= 0 ? "À payer" : "À récupérer") : "",
              tone: data && data.solde >= 0 ? "rose" : "emerald",
            },
          ]}
        />
      }
    >
      {/* ─── Mobile view (< lg) — wizard préservé ────────────────── */}
      <div className="space-y-4 sm:space-y-6 lg:hidden">
      <ClientSectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Année
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6 dark:text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Trimestre (optionnel)
            </label>
            <select
              value={trimestre}
              onChange={(e) => setTrimestre(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6 dark:text-white"
            >
              <option value="">Année complète</option>
              <option value="1">T1 (Jan - Mar)</option>
              <option value="2">T2 (Avr - Juin)</option>
              <option value="3">T3 (Juil - Sep)</option>
              <option value="4">T4 (Oct - Déc)</option>
            </select>
          </div>
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200/70 bg-slate-100/60 p-6 dark:border-white/8 dark:bg-white/4"
              >
                <div className="mb-3 h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-6 w-32 rounded bg-slate-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Période : {data.periode}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5 dark:border-emerald-400/15 dark:bg-emerald-500/6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                    <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">TVA collectée</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Factures payées</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatMontant(data.tvaCollectee)}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5 dark:border-amber-400/15 dark:bg-amber-500/6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
                    <TrendingDown size={18} className="text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">TVA sur dépenses</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Estimation à 20%</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {formatMontant(data.tvaDepenses)}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-5 ${
                data.solde >= 0
                  ? "border-rose-200/70 bg-rose-50/60 dark:border-rose-400/15 dark:bg-rose-500/6"
                  : "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-400/15 dark:bg-emerald-500/6"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      data.solde >= 0 ? "bg-rose-100 dark:bg-rose-500/15" : "bg-emerald-100 dark:bg-emerald-500/15"
                    }`}
                  >
                    <Wallet
                      size={18}
                      className={data.solde >= 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {data.solde >= 0 ? "Solde à payer" : "Solde à récupérer"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">TVA collectée - TVA déductible</p>
                  </div>
                </div>
                <p
                  className={`text-lg font-bold ${
                    data.solde >= 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {formatMontant(Math.abs(data.solde))}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {!isLoading && !data && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400">
            <Calculator size={48} strokeWidth={1} />
            <p className="text-sm">Aucune donnée disponible pour cette période.</p>
          </div>
        )}
      </ClientSectionCard>
      </div>

      {/* ─── Desktop view (lg+) — v2 dense ──────────────────────── */}
      <div className="hidden lg:block lg:space-y-6">
        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricTile
            label="Période"
            value={trimestre ? `T${trimestre} ${annee}` : annee}
            detail={trimestre ? "Trimestre sélectionné" : "Année complète"}
            icon={Calculator}
            tone="neutral"
          />
          <MetricTile
            label="TVA collectée"
            value={data ? formatMontant(data.tvaCollectee) : "—"}
            detail="Factures payées dans la période"
            icon={TrendingUp}
            tone="success"
          />
          <MetricTile
            label="TVA déductible"
            value={data ? formatMontant(data.tvaDepenses) : "—"}
            detail="Dépenses enregistrées (est. 20%)"
            icon={TrendingDown}
            tone="warning"
          />
          <MetricTile
            label={data && data.solde < 0 ? "À récupérer" : "À reverser"}
            value={data ? formatMontant(Math.abs(data.solde)) : "—"}
            detail={data ? (data.solde >= 0 ? "Solde net positif" : "Crédit de TVA") : "—"}
            icon={Wallet}
            tone={data ? (data.solde >= 0 ? "danger" : "success") : "neutral"}
          />
        </div>

        {/* Body 2-col */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            {/* Filtres période */}
            <section className="lg-v2-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="lg-v2-eyebrow">Période</p>
                  <p className="mt-1 text-sm lg-v2-text-muted">Sélectionnez l&apos;année et, si besoin, le trimestre à analyser.</p>
                </div>
                {data ? (
                  <span className="text-xs lg-v2-text-subtle tabular-nums">{data.periode}</span>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="v2-tva-annee" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] lg-v2-text-subtle">
                    Année
                  </label>
                  <select
                    id="v2-tva-annee"
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    className="lg-v2-input"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="v2-tva-trimestre" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] lg-v2-text-subtle">
                    Trimestre (optionnel)
                  </label>
                  <select
                    id="v2-tva-trimestre"
                    value={trimestre}
                    onChange={(e) => setTrimestre(e.target.value)}
                    className="lg-v2-input"
                  >
                    <option value="">Année complète</option>
                    <option value="1">T1 (Jan - Mar)</option>
                    <option value="2">T2 (Avr - Juin)</option>
                    <option value="3">T3 (Juil - Sep)</option>
                    <option value="4">T4 (Oct - Déc)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Détails période */}
            <section className="lg-v2-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="lg-v2-eyebrow">Détails</p>
                  <p className="mt-1 text-sm lg-v2-text-muted">Ventilation de la TVA pour la période sélectionnée.</p>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex animate-pulse items-center justify-between rounded-xl border lg-v2-divider px-4 py-4"
                    >
                      <div className="h-4 w-32 rounded bg-slate-200/70 dark:bg-white/8" />
                      <div className="h-5 w-24 rounded bg-slate-200/70 dark:bg-white/8" />
                    </div>
                  ))}
                </div>
              ) : data ? (
                <div className="overflow-hidden rounded-xl border lg-v2-divider">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="lg-v2-table-header">Poste</th>
                        <th className="lg-v2-table-header">Base</th>
                        <th className="lg-v2-table-header text-right">Montant TVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="lg-v2-table-row">
                        <td className="lg-v2-table-cell">
                          <span className="inline-flex items-center gap-2 text-sm font-medium lg-v2-text-strong">
                            <TrendingUp size={14} className="text-[var(--v2-success)]" aria-hidden />
                            TVA collectée
                          </span>
                        </td>
                        <td className="lg-v2-table-cell text-sm lg-v2-text-muted">Factures payées</td>
                        <td className="lg-v2-table-cell text-right text-sm font-semibold tabular-nums text-[var(--v2-success)]">
                          {formatMontant(data.tvaCollectee)}
                        </td>
                      </tr>
                      <tr className="lg-v2-table-row">
                        <td className="lg-v2-table-cell">
                          <span className="inline-flex items-center gap-2 text-sm font-medium lg-v2-text-strong">
                            <TrendingDown size={14} className="text-[var(--v2-warning)]" aria-hidden />
                            TVA déductible
                          </span>
                        </td>
                        <td className="lg-v2-table-cell text-sm lg-v2-text-muted">Dépenses (est. 20%)</td>
                        <td className="lg-v2-table-cell text-right text-sm font-semibold tabular-nums text-[var(--v2-warning)]">
                          -{formatMontant(data.tvaDepenses)}
                        </td>
                      </tr>
                      <tr className="lg-v2-table-row bg-[var(--v2-panel-muted)]">
                        <td className="lg-v2-table-cell">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold lg-v2-text-strong">
                            <Wallet size={14} className={data.solde >= 0 ? "text-[var(--v2-danger)]" : "text-[var(--v2-success)]"} aria-hidden />
                            {data.solde >= 0 ? "Solde à reverser" : "Solde à récupérer"}
                          </span>
                        </td>
                        <td className="lg-v2-table-cell text-sm lg-v2-text-muted">Net période</td>
                        <td
                          className={`lg-v2-table-cell text-right text-base font-bold tabular-nums ${
                            data.solde >= 0 ? "text-[var(--v2-danger)]" : "text-[var(--v2-success)]"
                          }`}
                        >
                          {formatMontant(Math.abs(data.solde))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center lg-v2-text-subtle">
                  <Calculator size={48} strokeWidth={1} aria-hidden />
                  <p className="text-sm">Aucune donnée disponible pour cette période.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right rail (sticky) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Exports</p>
              <p className="mt-1 text-sm lg-v2-text-muted">Téléchargez le récapitulatif pour votre comptable.</p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={!data}
                  className="lg-v2-btn lg-v2-btn-primary justify-center disabled:opacity-50"
                >
                  <Download size={14} aria-hidden /> Exporter PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportPennylane}
                  disabled={!data}
                  className="lg-v2-btn lg-v2-btn-secondary justify-center disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} aria-hidden /> Export Pennylane
                </button>
              </div>
            </section>

            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Conseil</p>
              <p className="mt-2 inline-flex items-start gap-2 text-sm lg-v2-text-muted">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--v2-primary)]" aria-hidden />
                <span>
                  Provisionnez le solde à reverser dès chaque encaissement pour éviter la mauvaise surprise à l&apos;échéance fiscale.
                </span>
              </p>
            </section>
          </aside>
        </div>
      </div>
    </ClientSubpageShell>
  );
}
