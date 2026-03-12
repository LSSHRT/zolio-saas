"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Search, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Facture {
  numero: string;
  date: string;
  nomClient: string;
  emailClient: string;
  totalHT: string;
  tva: string;
  totalTTC: string;
  statut: string;
  devisRef: string;
}

const statutConfig: Record<string, { icon: any; color: string; bg: string }> = {
  "Émise": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  "En retard": { icon: Clock, color: "text-red-500", bg: "bg-red-50" },
};

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/factures")
      .then((r) => r.json())
      .then((data) => { setFactures(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = factures.filter(
    (f) => f.nomClient.toLowerCase().includes(search.toLowerCase()) || f.numero.toLowerCase().includes(search.toLowerCase())
  );

  const totalEncaisse = factures.reduce((s, f) => s + (parseFloat(f.totalTTC) || 0), 0);

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Mes Factures</h1>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        {/* Stats rapide */}
        <div className="flex gap-3">
          <div className="flex-[2] bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-white/70 text-xs font-medium">Chiffre d'Affaires Facturé</p>
            <p className="text-2xl font-bold mt-1">{totalEncaisse.toFixed(0)}€</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
            <p className="text-slate-500 text-xs font-medium">Factures</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{factures.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher par client ou n° facture..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>

        {/* Liste factures */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
            <FileText size={48} strokeWidth={1} />
            <p className="text-sm">{search ? "Aucun résultat" : "Aucune facture générée"}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 font-medium">{filtered.length} factures</p>
            {filtered.map((f, i) => {
              const config = statutConfig[f.statut] || statutConfig["Émise"];
              const Icon = config.icon;
              return (
                <motion.div
                  key={f.numero || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {f.nomClient.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{f.nomClient}</p>
                        <p className="text-xs text-slate-400">{f.numero} · {f.date}</p>
                      </div>
                    </div>
                    <div className={`${config.bg} ${config.color} px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1`}>
                      <Icon size={12} /> {f.statut}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400">Réf Devis</p>
                      <p className="text-sm font-semibold text-slate-700">{f.devisRef || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Total TTC</p>
                      <p className="text-lg font-bold text-slate-900">{f.totalTTC}€</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
