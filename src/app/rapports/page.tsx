"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calculator,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  LineChart,
  Loader2,
  Users,
} from "lucide-react";
import useSWR from "swr";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DashboardData {
  acceptedRevenueHT: number;
  pipelineRevenueHT: number;
  monthlyData: { name: string; CA: number }[];
  topClients: { nom: string; devisCount: number; revenueHT: number }[];
  tresorerie?: { encaisse: number; aEncaisser: number; enRetard: number };
  benefice?: { caFacture: number; depenses: number; beneficeNet: number; margePct: number };
  echeances?: { numero: string; nomClient: string; totalTTC: number; joursRestants: number }[];
}

interface FactureSummary {
  total: number;
  payees: number;
  enAttente: number;
  enRetard: number;
  totalHT: number;
  totalTTC: number;
  totalPayeTTC: number;
}

interface DepenseSummary {
  total: number;
  totalTTC: number;
  parCategorie: { categorie: string; total: number; count: number }[];
}

export default function RapportsPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [trimestre, setTrimestre] = useState("");

  const { data: dashboard } = useSWR<DashboardData>("/api/dashboard/summary", fetcher);
  const { data: facturesData } = useSWR<{ data: any[] }>("/api/factures?page=1&limit=1000", fetcher);
  const { data: depensesData } = useSWR<{ data: any[] }>("/api/depenses?page=1&limit=1000", fetcher);

  const factures = useMemo(() => facturesData?.data ?? [], [facturesData]);
  const depenses = useMemo(() => depensesData?.data ?? [], [depensesData]);

  // Calcul des stats factures
  const factureSummary: FactureSummary = useMemo(() => {
    const anneeFiltre = (d: string) => new Date(d).getFullYear() === annee;
    const filtered = factures.filter((f) => anneeFiltre(f.date));

    return {
      total: filtered.length,
      payees: filtered.filter((f) => f.statut === "Payée").length,
      enAttente: filtered.filter((f) => f.statut === "Émise" || f.statut === "En attente").length,
      enRetard: filtered.filter((f) => f.statut === "En retard").length,
      totalHT: filtered.reduce((s, f) => s + (f.totalHT || 0), 0),
      totalTTC: filtered.reduce((s, f) => s + (f.totalTTC || 0), 0),
      totalPayeTTC: filtered.filter((f) => f.statut === "Payée").reduce((s, f) => s + (f.totalTTC || 0), 0),
    };
  }, [factures, annee]);

  // Calcul des stats dépenses
  const depenseSummary: DepenseSummary = useMemo(() => {
    const anneeFiltre = (d: string) => new Date(d).getFullYear() === annee;
    const filtered = depenses.filter((d) => anneeFiltre(d.date));
    const catMap = new Map<string, { total: number; count: number }>();

    for (const d of filtered) {
      const cat = d.categorie || "Autre";
      const existing = catMap.get(cat) || { total: 0, count: 0 };
      existing.total += d.montant || d.montantTTC || 0;
      existing.count++;
      catMap.set(cat, existing);
    }

    return {
      total: filtered.length,
      totalTTC: filtered.reduce((s, d) => s + (d.montant || d.montantTTC || 0), 0),
      parCategorie: Array.from(catMap.entries())
        .map(([cat, { total, count }]) => ({ categorie: cat, total, count }))
        .sort((a, b) => b.total - a.total),
    };
  }, [depenses, annee]);

  // TVA collectée (sur factures payées)
  const tvaCollectee = factureSummary.totalPayeTTC - factureSummary.payees
    ? factures
        .filter((f) => f.statut === "Payée" && new Date(f.date).getFullYear() === annee)
        .reduce((s, f) => {
          const ht = f.totalHT || 0;
          const ttc = f.totalTTC || 0;
          return s + (ttc - ht);
        }, 0)
    : 0;

  // TVA déductible (dépenses)
  const tvaDeductible = depenseSummary.totalTTC * (20 / 120); // approximation 20%

  const annees = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear()]);
    for (const f of factures) {
      const y = new Date(f.date).getFullYear();
      if (y >= 2024) s.add(y);
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [factures]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

  const rapportCards: {
    id: string;
    title: string;
    description: string;
    icon: typeof FileText;
    href: string;
    color: string;
    bg: string;
    ring: string;
  }[] = [
    {
      id: "export-fec",
      title: "Export FEC",
      description: "Fichier des Écritures Comptables — format officiel pour votre expert-comptable.",
      icon: FileDown,
      href: `/api/export/fec?year=${annee}`,
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      ring: "ring-emerald-300/40 dark:ring-emerald-400/20",
    },
    {
      id: "export-tva",
      title: "Rapport TVA",
      description: `TVA collectée et déductible pour ${annee}.`,
      icon: Calculator,
      href: `/api/export/tva?annee=${annee}&format=json`,
      color: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      ring: "ring-amber-300/40 dark:ring-amber-400/20",
    },
    {
      id: "export-csv",
      title: "Export CSV",
      description: "Toutes vos factures et dépenses en CSV — compatible Excel et Google Sheets.",
      icon: Download,
      href: `/api/export/csv?year=${annee}`,
      color: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      ring: "ring-violet-300/40 dark:ring-violet-400/20",
    },
    {
      id: "export-urssaf",
      title: "Livre URSSAF",
      description: "Livre des recettes pour vos déclarations URSSAF / auto-entrepreneur.",
      icon: Users,
      href: "/factures",
      color: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-50 dark:bg-slate-700/30",
      ring: "ring-slate-300/40 dark:ring-slate-400/20",
    },
  ];

  return (
    <ClientSubpageShell
      title="Rapports & exports"
      description="Vos chiffres clés, exports comptables et bilans — tout centralisé pour votre comptable."
      eyebrow="Centre de rapports"
      activeNav="tools"
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="CA encaissé"
            value={formatCurrency(dashboard?.benefice?.caFacture ?? factureSummary.totalPayeTTC)}
            detail="Factures réglées"
            tone="emerald"
          />
          <ClientHeroStat
            label="Dépenses"
            value={formatCurrency(dashboard?.benefice?.depenses ?? depenseSummary.totalTTC)}
            detail={`${depenseSummary.total} opérations`}
            tone="rose"
          />
          <ClientHeroStat
            label="Bénéfice net"
            value={formatCurrency(dashboard?.benefice?.beneficeNet ?? (factureSummary.totalPayeTTC - depenseSummary.totalTTC))}
            detail={`Marge : ${dashboard?.benefice?.margePct ?? (factureSummary.totalPayeTTC > 0 ? Math.round(((factureSummary.totalPayeTTC - depenseSummary.totalTTC) / factureSummary.totalPayeTTC) * 100) : 0)}%`}
            tone="violet"
          />
          <ClientHeroStat
            label="TVA à reverser"
            value={formatCurrency(Math.max(0, tvaCollectee - tvaDeductible))}
            detail={`Collectée ${formatCurrency(tvaCollectee)} / Déductible ${formatCurrency(tvaDeductible)}`}
            tone="amber"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Bilan rapide"
          description="Vos chiffres clés de l'année."
          badge={String(annee)}
          items={[
            {
              label: "CA encaissé",
              value: formatCurrency(dashboard?.benefice?.caFacture ?? factureSummary.totalPayeTTC),
              detail: "Factures réglées",
              tone: "emerald",
            },
            {
              label: "Dépenses",
              value: formatCurrency(depenseSummary.totalTTC),
              detail: `${depenseSummary.total} opérations`,
              tone: "rose",
            },
            {
              label: "Bénéfice",
              value: formatCurrency(dashboard?.benefice?.beneficeNet ?? (factureSummary.totalPayeTTC - depenseSummary.totalTTC)),
              detail: `Marge ${dashboard?.benefice?.margePct ?? 0}%`,
              tone: "violet",
            },
            {
              label: "TVA nette",
              value: formatCurrency(Math.max(0, tvaCollectee - tvaDeductible)),
              detail: "À reverser",
              tone: "amber",
            },
          ]}
        />
      }
      mobilePrimaryAction={
        <div className="flex items-center gap-2">
          <select
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {annees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      }
    >
      {/* Sélecteur année */}
      <ClientSectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Année :</p>
          <div className="flex flex-wrap gap-2">
            {annees.map((a) => (
              <button
                key={a}
                onClick={() => setAnnee(a)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  a === annee
                    ? "bg-gradient-zolio text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </ClientSectionCard>

      {/* Graphique revenus mensuels */}
      {dashboard?.monthlyData && dashboard.monthlyData.some((m) => m.CA > 0) && (
        <ClientSectionCard>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <LineChart size={16} />
            Revenus mensuels ({annee})
          </h2>
          <div className="flex items-end gap-2 h-40">
            {dashboard.monthlyData.map((m, i) => {
              const maxCA = Math.max(...dashboard.monthlyData.map((x) => x.CA));
              const pct = maxCA > 0 ? (m.CA / maxCA) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: "120px" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`absolute bottom-0 w-full rounded-t-lg ${
                        pct > 0
                          ? "bg-gradient-to-t from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.name}</span>
                  {m.CA > 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {Math.round(m.CA)}€
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ClientSectionCard>
      )}

      {/* Top clients — desktop only */}
      {dashboard?.topClients && dashboard.topClients.length > 0 && (
        <div className="hidden sm:block">
        <ClientSectionCard>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} />
            Top clients
          </h2>
          <div className="space-y-2">
            {dashboard.topClients.map((c, i) => (
              <div key={c.nom} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-xs font-bold text-slate-400 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{c.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.devisCount} devis</p>
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(c.revenueHT)}</p>
              </div>
            ))}
          </div>
        </ClientSectionCard>
        </div>
      )}

      {/* Top dépenses par catégorie — desktop only */}
      {depenseSummary.parCategorie.length > 0 && (
        <div className="hidden sm:block">
        <ClientSectionCard>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} />
            Dépenses par catégorie
          </h2>
          <div className="space-y-2">
            {depenseSummary.parCategorie.map((cat) => (
              <div key={cat.categorie} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{cat.categorie}</span>
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all"
                    style={{
                      width: `${depenseSummary.totalTTC > 0 ? (cat.total / depenseSummary.totalTTC) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{cat.count} opération{cat.count > 1 ? "s" : ""} · {depenseSummary.totalTTC > 0 ? Math.round((cat.total / depenseSummary.totalTTC) * 100) : 0}%</p>
              </div>
            ))}
          </div>
        </ClientSectionCard>
        </div>
      )}

      {/* Exports */}
      <ClientSectionCard>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
          <Download size={16} />
          Exports comptables ({annee})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {rapportCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                target={card.href.startsWith("/api") ? "_blank" : undefined}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-500/20"
              >
                <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${card.bg} ${card.color} ring-1 ${card.ring}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300">
                    {card.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.description}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-500 shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
