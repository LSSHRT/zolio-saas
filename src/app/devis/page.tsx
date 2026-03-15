"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Search, Send, Pencil, Trash2, Check, X, Copy , LayoutGrid, List, Mail, PenTool, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@clerk/nextjs";

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
  lu_le?: string;
}

const statutConfig: Record<string, { icon: any; color: string; bg: string }> = {
  "En attente": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "En attente (Modifié)": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "Accepté": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Refusé": { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DevisPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR('/api/devis', fetcher);
  const devis = Array.isArray(data) ? data : [];
  const loading = isLoading && !data;
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatut, setUpdatingStatut] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const handleDuplicate = async (numero: string) => {
    setDuplicating(numero);
    try {
      const res = await fetch(`/api/devis/${numero}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.numero) {
        router.push(`/devis/${data.numero}`);
      } else {
        alert("Erreur lors de la duplication");
        setDuplicating(null);
      }
    } catch {
      alert("Erreur réseau");
      setDuplicating(null);
    }
  };

  const handleDelete = async (numero: string) => {
    if (!confirm(`Supprimer définitivement le devis ${numero} ?`)) return;
    setDeleting(numero);
    try {
      await fetch(`/api/devis/${numero}`, { method: "DELETE" });
      mutate(devis.filter((d: Devis) => d.numero !== numero), false);
    } catch {
      alert("Erreur lors de la suppression");
    }
    setDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} élément(s) ?`)) return;
    setIsDeletingBulk(true);
    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(`/api/devis/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    if (successCount > 0) {
      mutate(devis.filter((item: any) => !selectedIds.has(item.numero)), false);
      setSelectedIds(new Set());
    }
    setIsDeletingBulk(false);
  };


    const handleCopySignLink = (numero: string) => {
    const link = `${window.location.origin}/signer/${numero}${userId ? `?u=${userId}` : ''}`;
    navigator.clipboard.writeText(link);
    alert("Lien de signature copié ! Envoyez-le à votre client.");
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
        mutate(devis.map((d: Devis) => d.numero === numero ? { ...d, statut: newStatut } : d), false);
        if (newStatut === "Accepté") {
          import('canvas-confetti').then((confetti) => {
            confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          });
        }
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
    (d) => (d.nomClient || '').toLowerCase().includes((search || '').toLowerCase()) || (d.numero || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const totalMois = devis.reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalValide = devis.filter((d) => d.statut === "Accepté").reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalAttente = devis.filter((d) => isEnAttente(d.statut)).reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-violet-400/12 to-fuchsia-400/8 dark:from-violet-500/20 dark:to-fuchsia-600/10 blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-fuchsia-400/8 to-orange-400/6 dark:from-fuchsia-600/15 dark:to-orange-500/5 blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0c0a1d]/80 border-b border-violet-100/50 dark:border-violet-500/10 transition-all flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Devis</h1>
        <div className="flex-1" />
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-brand-violet dark:text-white' : 'text-slate-400'}`}>
            <List size={16} />
          </button>
          <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded-md ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow text-brand-violet dark:text-white' : 'text-slate-400'}`}>
            <LayoutGrid size={16} />
          </button>
        </div>
        <Link href="/nouveau-devis">
          <motion.button whileTap={{ scale: 0.9 }}
            className="px-4 py-2 bg-gradient-zolio text-white text-sm font-semibold rounded-xl shadow-brand flex items-center gap-2">
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
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((item: any) => item.numero)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout ({filtered.length})
          </label>
        </div>


        {/* Skeleton loading */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-1.5" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-16" />
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-12" />
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste devis */}

        {/* Vue Kanban */}
        {viewMode === "kanban" && !loading && filtered.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {["En attente", "Accepté", "Refusé"].map(colStatus => {
              const colDevis = filtered.filter(d => 
                colStatus === "En attente" ? isEnAttente(d.statut) : d.statut === colStatus
              );
              
              const colConfig = statutConfig[colStatus === "En attente" ? "En attente" : colStatus];
              const ColIcon = colConfig.icon;

              return (
                <div key={colStatus} className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col gap-3 snap-start">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold ${colConfig.color} flex items-center gap-2`}>
                      <ColIcon size={16} /> {colStatus}
                    </h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 font-semibold">{colDevis.length}</span>
                  </div>
                  
                  {colDevis.map((d, i) => {
                    const pending = isEnAttente(d.statut);
                    const isUpdating = updatingStatut === d.numero;
                    return (
                      <motion.div
                        key={d.numero || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{d.nomClient}</p>
                              {d.lu_le && <span title={`Vu le ${new Date(d.lu_le).toLocaleDateString()}`}><Eye className="w-3 h-3 text-blue-500" /></span>}
                            </div>
                            <p className="text-xs text-slate-400">{d.numero}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{d.totalTTC}€</p>
                        </div>
                        
                        {pending && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateStatut(d.numero, "Accepté")} disabled={isUpdating} className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"><Check size={14} className="inline mr-1"/>Valider</button>
                            <button onClick={() => handleUpdateStatut(d.numero, "Refusé")} disabled={isUpdating} className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition"><X size={14} className="inline mr-1"/>Refuser</button>
                            <button onClick={(e) => {
                              e.preventDefault();
                              const subject = encodeURIComponent(`Relance : Devis #${d.numero}`);
                              const body = encodeURIComponent(`Bonjour ${d.nomClient},\n\nSauf erreur de notre part, nous n'avons pas eu de retour concernant le devis #${d.numero} d'un montant de ${d.totalTTC}€.\n\nRestant à votre disposition pour toute question.\n\nCordialement,`);
                              window.location.href = `mailto:${d.emailClient || ''}?subject=${subject}&body=${body}`;
                            }} className="py-1.5 px-2 bg-violet-50 dark:bg-violet-500/10 text-brand-violet text-xs font-semibold rounded-lg hover:bg-violet-100 dark:bg-violet-900/30 transition" title="Relancer par email">
                              <Mail size={14}/>
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                           <Link href={`/devis/${d.numero}`} className="flex-1">
                             <button className="w-full py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">Ouvrir</button>
                           </Link>
                           {pending && (
                             <button onClick={() => handleCopySignLink(d.numero)} className="flex-1 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-lg hover:bg-violet-200 dark:hover:bg-violet-800 transition flex items-center justify-center gap-1 border border-violet-200 dark:border-violet-700">
                               <PenTool size={12}/> Lien signature
                             </button>
                           )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Liste devis */}
        {!loading && (
          filtered.length === 0 ? (
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
          transition={{ delay: Math.min(i * 0.03, 0.15) }}
                  className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-brand-violet flex items-center justify-center font-bold text-sm shrink-0">
                        {(d.nomClient || '').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.nomClient}</p>
                          {d.lu_le && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-1" title={`Vu le ${new Date(d.lu_le).toLocaleDateString()}`}><Eye className="w-3 h-3"/> Vu</span>}
                        </div>
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
                          className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-100 hover:border-emerald-400 transition disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={(e) => {
                            e.preventDefault();
                            const subject = encodeURIComponent(`Relance : Devis #${d.numero}`);
                            const body = encodeURIComponent(`Bonjour ${d.nomClient},\n\nSauf erreur de notre part, nous n'avons pas eu de retour concernant le devis #${d.numero} d'un montant de ${d.totalTTC}€.\n\nRestant à votre disposition pour toute question.\n\nCordialement,`);
                            window.location.href = `mailto:${d.emailClient || ''}?subject=${subject}&body=${body}`;
                          }}
                          className="flex-1 py-2.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 text-brand-violet font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-100 hover:border-violet-400 transition"
                        >
                          <Mail size={16} /> Relancer
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 mt-3">
                    <Link href={`/devis/${d.numero}`} className="flex-1">
                      <motion.button whileTap={{ scale: 0.96 }}
                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-50 dark:bg-violet-500/10 hover:border-violet-300 hover:text-brand-violet transition">
                        <Pencil size={14} /> Modifier
                      </motion.button>
                    </Link>
                    {pending && (
                      <motion.button whileTap={{ scale: 0.96 }}
                        onClick={() => handleCopySignLink(d.numero)}
                        className="flex-1 py-2.5 bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-200 dark:hover:bg-violet-800 transition">
                        <PenTool size={14} /> Lien signature
                      </motion.button>
                    )}
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
          )
        )}
      </main>
    </div>
  );
}
