"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Send, Check, Search, Save } from "lucide-react";
import Link from "next/link";

interface LigneDevis { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number; }
interface Prestation { id: string; categorie: string; nom: string; unite: string; prixUnitaireHT: number; coutMatiere: number; }

export default function EditDevisPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);

  const [loading, setLoading] = useState(true);
  const [devisInfo, setDevisInfo] = useState<any>(null);
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [tva, setTva] = useState("10");
  const [acompte, setAcompte] = useState("");
  const [remise, setRemise] = useState("");
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [searchPrestation, setSearchPrestation] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAddPrestation, setShowAddPrestation] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/devis/${numero}`).then((r) => r.json()),
      fetch("/api/prestations").then((r) => r.json()),
    ]).then(([devisData, prestData]) => {
      setDevisInfo(devisData);
      setLignes(devisData.lignes || []);
      // Extraire le taux TVA du string "10%"
      const tauxStr = (devisData.tva || "10%").replace("%", "");
      setTva(tauxStr);
      setAcompte(devisData.acompte || "");
      setRemise(devisData.remise || "");
      setPrestations(Array.isArray(prestData) ? prestData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [numero]);

  const totalHTBase = lignes.reduce((s, l) => s + l.totalLigne, 0);
  const montantRemise = totalHTBase * (parseFloat(remise) || 0) / 100;
  const totalHT = totalHTBase - montantRemise;
  const totalTTC = totalHT * (1 + parseFloat(tva) / 100);

  const addLigne = (p: Prestation) => {
    setLignes([...lignes, { nomPrestation: p.nom, quantite: 1, unite: p.unite, prixUnitaire: p.prixUnitaireHT, totalLigne: p.prixUnitaireHT }]);
    setShowAddPrestation(false);
    setSearchPrestation("");
  };

  const updateQty = (idx: number, qty: number) => {
    const updated = [...lignes];
    updated[idx].quantite = qty;
    updated[idx].totalLigne = qty * updated[idx].prixUnitaire;
    setLignes(updated);
  };

  const updatePrice = (idx: number, price: number) => {
    const updated = [...lignes];
    updated[idx].prixUnitaire = price;
    updated[idx].totalLigne = updated[idx].quantite * price;
    setLignes(updated);
  };

  const removeLigne = (idx: number) => setLignes(lignes.filter((_, i) => i !== idx));

  const handleSaveAndResend = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/devis/${numero}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lignes, tva, acompte, remise }),
      });
      const data = await res.json();
      setResult(data);
      setSuccess(true);
    } catch {
      alert("Erreur lors de la modification");
    }
    setSaving(false);
  };

  const filteredPrestations = prestations.filter((p) =>
    p.nom.toLowerCase().includes(searchPrestation.toLowerCase()) || p.categorie.toLowerCase().includes(searchPrestation.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden items-center justify-center p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-emerald-600" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Devis mis à jour ! 🎉</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
          {numero} — {result?.totalTTC}€ TTC
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-slate-400 text-center text-xs mb-8">
          {result?.emailSent ? "📧 Email renvoyé au client avec le nouveau PDF" : "Enregistré dans Google Sheets (email non configuré)"}
        </motion.p>
        <Link href="/devis">
          <motion.button whileTap={{ scale: 0.96 }} className="px-8 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg">
            Retour aux devis
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/devis">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Modifier le devis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{numero} · {devisInfo?.nomClient}</p>
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-5 overflow-y-auto">
        {/* Client info */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            {devisInfo?.nomClient?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{devisInfo?.nomClient}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{devisInfo?.emailClient}</p>
          </div>
        </div>

        {/* Lignes du devis */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Prestations ({lignes.length})</p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddPrestation(!showAddPrestation)}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              <Plus size={14} /> Ajouter
            </motion.button>
          </div>

          {/* Ajouter prestation */}
          {showAddPrestation && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher..." value={searchPrestation} onChange={(e) => setSearchPrestation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                {filteredPrestations.map((p) => (
                  <button key={p.id} onClick={() => addLigne(p)}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-left hover:bg-blue-50 transition text-sm">
                    <Plus size={14} className="text-blue-500 shrink-0" />
                    <span className="flex-1 truncate">{p.nom}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{p.prixUnitaireHT}€/{p.unite}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Liste lignes */}
          <div className="flex flex-col gap-2">
            {lignes.map((l, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 truncate">{l.nomPrestation}</p>
                  <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Quantité</label>
                    <input type="number" min="0.1" step="0.1" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Prix/{l.unite}</label>
                    <input type="number" min="0" step="0.01" value={l.prixUnitaire} onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div className="w-20 text-right">
                    <label className="text-[10px] text-slate-400">Total</label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{l.totalLigne.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        {/* TVA */}
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Taux TVA :</label>
          <select value={tva} onChange={(e) => setTva(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none">
            <option value="0">0%</option>
            <option value="5.5">5.5%</option>
            <option value="10">10%</option>
            <option value="20">20%</option>
          </select>
        </div>

        {/* Remise */}
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Remise globale (%) :</label>
          <input type="number" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)}
            className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>


        {/* Totaux */}
        <div className="bg-gradient-zolio rounded-2xl p-5 text-white">
          <div className="flex justify-between mb-2">
            <span className="text-white/70 text-sm">Total HT</span>
            <span className="font-semibold">{totalHT.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-white/70 text-sm">TVA ({tva}%)</span>
            <span className="font-semibold">{(totalTTC - totalHT).toFixed(2)}€</span>
          </div>
          <div className="h-px bg-white dark:bg-slate-900/20 my-2" />
          <div className="flex justify-between">
            <span className="font-bold text-lg">Total TTC</span>
            <span className="font-bold text-lg">{totalTTC.toFixed(2)}€</span>
          </div>
        </div>

        {/* Transformer en facture (si accepté) */}
        {devisInfo?.statut === "Accepté" && (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={async () => {
              if (saving) return;
              try {
                // On s'assure d'avoir les données
                const res = await fetch("/api/factures", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    devisNumero: devisInfo.numero,
                    client: { nom: devisInfo.nomClient, email: devisInfo.emailClient },
                    lignes,
                    tva,
                    totalHT: totalHT.toFixed(2),
                    totalTTC: totalTTC.toFixed(2)
                  }),
                });
                if (res.ok) {
                  window.location.href = "/factures";
                } else {
                  alert("Erreur lors de la création de la facture");
                }
              } catch (e) {
                alert("Erreur réseau");
              }
            }}
            className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm mt-1"
          >
            <Check size={16} /> Transformer en Facture
          </motion.button>
        )}
      </main>

      {/* Bottom action */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex gap-3 sm:rounded-b-[3rem]">
        <Link href="/devis" className="flex-1">
          <motion.button whileTap={{ scale: 0.96 }}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> Annuler
          </motion.button>
        </Link>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveAndResend} disabled={saving || lignes.length === 0}
          className="flex-[2] py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-40">
          {saving ? "Envoi..." : <><Save size={16} /> Sauvegarder & Renvoyer <Send size={14} /></>}
        </motion.button>
      </div>
    </div>
  );
}
