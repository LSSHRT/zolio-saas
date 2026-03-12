"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Search, Send, Pencil, Trash2, Check, X } from "lucide-react";
import Link from "next/link";

interface Devis {
  numero: string;
  date: string;
  nomClient: string;
  emailClient: string;
  totalHT: string;
  tva: string;
  totalTTC: string;
  statut: string;
  lienPdf: string;
}

const statutConfig: Record<string, { icon: any; color: string; bg: string }> = {
  "En attente": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "En attente (Modifié)": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "Accepté": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Refusé": { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatut, setUpdatingStatut] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/devis")
      .then((r) => r.json())
      .then((data) => { setDevis(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (numero: string) => {
    if (!confirm(`Supprimer définitivement le devis ${numero} ?`)) return;
    setDeleting(numero);
    try {
      await fetch(`/api/devis/${numero}`, { method: "DELETE" });
      setDevis(devis.filter((d) => d.numero !== numero));
    } catch {
      alert("Erreur lors de la suppression");
    }
    setDeleting(null);
  };

  const handleUpdateStatut = async (numero: string, newStatut: string) => {
    setUpdatingStatut(numero);
    try {
      const res = await fetch(`/api/devis/${numero}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        setDevis(devis.map((d) => d.numero === numero ? { ...d, statut: newStatut } : d));
      } else {
        alert("Erreur lors de la mise à jour du statut");
      }
    } catch {
      alert("Erreur réseau");
    }
    setUpdatingStatut(null);
  };

  const isEnAttente = (statut: string) =>
    statut === "En attente" || statut === "En attente (Modifié)";

  const filtered = devis.filter(
    (d) => d.nomClient.toLowerCase().includes(search.toLowerCase()) || d.numero.toLowerCase().includes(search.toLowerCase())
  );

  const totalMois = devis.reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalValide = devis.filter((d) => d.statut === "Accepté").reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalAttente = devis.filter((d) => isEnAttente(d.statut)).reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Devis</h1>
        <div className="flex-1" />
        <Link href="/nouveau-devis">
          <motion.button whileTap={{ scale: 0.9 }}
            className="px-4 py-2 bg-gradient-zolio text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2">
            <FileText size={16} /> Nouveau
          </motion.button>
        </Link>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        {/* Stats rapide */}
        <div className="flex gap-3">
          <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-white/70 text-xs font-medium">✓ CA Validé</p>
            <p className="text-2xl font-bold mt-1">{totalValide.toFixed(0)}€</p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-4 text-white">
            <p className="text-white/70 text-xs font-medium">⏳ En attente</p>
            <p className="text-2xl font-bold mt-1">{totalAttente.toFixed(0)}€</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-gradient-zolio rounded-2xl p-4 text-white">
            <p className="text-white/70 text-xs font-medium">Total TTC (tous devis)</p>
            <p className="text-2xl font-bold mt-1">{totalMois.toFixed(0)}€</p>
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Devis émis</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{devis.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher par client ou n° devis..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>

        {/* Liste devis */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
            <FileText size={48} strokeWidth={1} />
            <p className="text-sm">{search ? "Aucun résultat" : "Aucun devis encore"}</p>
            <Link href="/nouveau-devis">
              <motion.button whileTap={{ scale: 0.96 }} className="mt-4 px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg text-sm">
                Créer mon premier devis
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} devis</p>
            {filtered.map((d, i) => {
              const config = statutConfig[d.statut] || statutConfig["En attente"];
              const Icon = config.icon;
              const pending = isEnAttente(d.statut);
              const isUpdating = updatingStatut === d.numero;
              return (
                <motion.div
                  key={d.numero || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {d.nomClient.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.nomClient}</p>
                        <p className="text-xs text-slate-400">{d.numero} · {d.date}</p>
                      </div>
                    </div>
                    <div className={`${config.bg} ${config.color} px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1`}>
                      <Icon size={12} /> {d.statut}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400">Total HT</p>
                      <p className="text-sm font-semibold text-slate-700">{d.totalHT}€</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">TVA</p>
                      <p className="text-sm font-semibold text-slate-700">{d.tva}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Total TTC</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{d.totalTTC}€</p>
                    </div>
                  </div>

                  {/* Boutons Valider / Refuser pour les devis en attente */}
                  <AnimatePresence>
                    {pending && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                      >
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleUpdateStatut(d.numero, "Accepté")}
                          disabled={isUpdating}
                          className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-100 hover:border-emerald-400 transition disabled:opacity-50"
                        >
                          <Check size={16} /> {isUpdating ? "..." : "Valider"}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleUpdateStatut(d.numero, "Refusé")}
                          disabled={isUpdating}
                          className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-red-100 hover:border-red-400 transition disabled:opacity-50"
                        >
                          <X size={16} /> {isUpdating ? "..." : "Refuser"}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 mt-3">
                    <Link href={`/devis/${d.numero}`} className="flex-1">
                      <motion.button whileTap={{ scale: 0.96 }}
                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition">
                        <Pencil size={14} /> Modifier
                      </motion.button>
                    </Link>
                    <motion.button whileTap={{ scale: 0.96 }}
                      onClick={() => handleDelete(d.numero)}
                      disabled={deleting === d.numero}
                      className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-red-200 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-1 text-sm hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50">
                      <Trash2 size={14} /> {deleting === d.numero ? "..." : ""}
                    </motion.button>
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
