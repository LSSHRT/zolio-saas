"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, FileText, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PlanningItem({ devis, mutate }: { devis: any; mutate: any }) {
  const [dateDebut, setDateDebut] = useState(devis.dateDebut || "");
  const [dateFin, setDateFin] = useState(devis.dateFin || "");
  const [saving, setSaving] = useState(false);

  const isPlanned = devis.dateDebut || devis.dateFin;
  const hasChanged = dateDebut !== (devis.dateDebut || "") || dateFin !== (devis.dateFin || "");

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/devis/${devis.numero}/planning`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateDebut, dateFin }),
    });
    setSaving(false);
    mutate();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{devis.nomClient}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
          <FileText className="w-4 h-4" /> {devis.numero} — {devis.totalTTC}€
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Début</label>
            <input 
              type="date" 
              value={dateDebut} 
              onChange={(e) => setDateDebut(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <span className="mt-4">-</span>
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Fin</label>
            <input 
              type="date" 
              value={dateFin} 
              onChange={(e) => setDateFin(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {hasChanged ? (
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        ) : (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap
            ${isPlanned ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}
          >
            {isPlanned ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {isPlanned ? "Planifié" : "À planifier"}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PlanningPage() {
  const { data: devis, mutate, isLoading } = useSWR('/api/devis', fetcher, { revalidateOnFocus: false, keepPreviousData: true });
  
  const devisAccepte = Array.isArray(devis) ? devis.filter((d) => d.statut === "Accepté") : [];

  // Trier: les non-planifiés en premier, puis tri par date de début
  const sortedDevis = [...devisAccepte].sort((a, b) => {
    if (!a.dateDebut && b.dateDebut) return -1;
    if (a.dateDebut && !b.dateDebut) return 1;
    if (a.dateDebut && b.dateDebut) return a.dateDebut.localeCompare(b.dateDebut);
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-b dark:border-slate-700/50 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3 sm:rounded-t-[3rem]">
        <Link href="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Planning & Chantiers</h1>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full px-4 pt-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
          <CalendarIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Retrouvez ici la liste de vos chantiers validés (devis acceptés). Vous pouvez leur assigner des dates pour mieux vous organiser !
          </p>
        </div>

        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDevis.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Aucun chantier prévu pour le moment.</p>
                <p className="text-sm text-slate-400 mt-1">Acceptez des devis pour les voir apparaître ici.</p>
              </div>
            ) : (
              sortedDevis.map((d) => (
                <PlanningItem key={d.numero} devis={d} mutate={mutate} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
