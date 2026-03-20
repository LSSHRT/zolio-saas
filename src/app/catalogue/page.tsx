"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Package, Search, X, Trash2, Copy, Download, Pencil, Upload } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  DEFAULT_TRADE,
  STARTER_CATEGORIES,
  TRADE_OPTIONS,
  getStarterCatalogForTrade,
  getTradeDefinition,
  type TradeKey,
} from "@/lib/trades";

interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  unite: string;
  prix: number;
  cout: number;
  stock?: number;
}

export default function CataloguePage() {
  const { user } = useUser();
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ categorie: "Peinture", nom: "", unite: "m²", prix: "", cout: "", stock: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isImportingStarter, setIsImportingStarter] = useState(false);

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const activeTrade = companyTrade?.key ?? selectedTrade;
  const activeTradeDefinition = getTradeDefinition(activeTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const starterCount = getStarterCatalogForTrade(activeTrade).length;

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => { setPrestations(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (companyTrade) {
      setSelectedTrade(companyTrade.key);
      setForm((current) => ({ ...current, categorie: current.categorie || "Autre" }));
    }
  }, [companyTrade]);

  const filtered = useMemo(() => prestations.filter(
    (p) => (p.nom || '').toLowerCase().includes((search || '').toLowerCase()) || (p.categorie || '').toLowerCase().includes((search || '').toLowerCase())
  ), [prestations, search]);

  const reloadPrestations = async () => {
    const response = await fetch("/api/prestations");
    const data = await response.json();
    setPrestations(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/prestations/${editingId}` : "/api/prestations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prix: parseFloat(form.prix), cout: parseFloat(form.cout) || 0, stock: parseFloat(form.stock) || 0 }),
      });
      const data = await res.json();
      if (editingId) {
        setPrestations(prestations.map(p => p.id === editingId ? { ...p, ...data.data, id: editingId } : p));
      } else {
        setPrestations([...prestations, data]);
      }
      setForm({ categorie: "Peinture", nom: "", unite: "m²", prix: "", cout: "", stock: "" });
      setEditingId(null);
      setShowForm(false);
    } catch {
      alert("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  const handleImportStarterCatalog = async () => {
    if (!user || !activeTradeDefinition) return;

    setIsImportingStarter(true);
    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: activeTradeDefinition.key }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'importer le starter métier");
      }

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: activeTradeDefinition.key,
          onboardingCompleted: true,
          starterCatalogImported: true,
        },
      });

      await reloadPrestations();
      toast.success(
        payload.imported > 0
          ? `${payload.imported} prestation(s) importée(s) pour ${activeTradeDefinition.label.toLowerCase()}`
          : `Starter ${activeTradeDefinition.label.toLowerCase()} déjà présent`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'importer le starter métier";
      toast.error(message);
    } finally {
      setIsImportingStarter(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette prestation ?")) return;
    try {
      const res = await fetch(`/api/prestations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPrestations(prestations.filter((p) => p.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const handleEdit = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom,
      unite: p.unite,
      prix: p.prix.toString(),
      cout: p.cout ? p.cout.toString() : "",
      stock: p.stock !== undefined ? p.stock.toString() : ""
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom + " (Copie)",
      unite: p.unite,
      prix: p.prix.toString(),
      cout: p.cout ? p.cout.toString() : "",
      stock: p.stock !== undefined ? p.stock.toString() : ""
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length < 2) return alert("Le fichier CSV est vide ou ne contient pas de données valides.");
      
      const separator = lines[0].includes(';') ? ';' : ',';
      
      if (!confirm(`Voulez-vous importer ces ${lines.length - 1} prestations depuis votre fichier ?`)) {
        e.target.value = ''; // reset input
        return;
      }
      
      setLoading(true);
      const newItems: Array<{ categorie: string; nom: string; unite: string; prix: number; cout: number }> = [];
      try {
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
          
          // Essayer de déduire les colonnes: Categorie, Nom, Unite, PrixHT, CoutMatiere
          // Au minimum: Nom (col 1 ou 0) et PrixHT (col 2 ou 3)
          let categorie = "Autre";
          let nom = "Prestation sans nom";
          let unite = "forfait";
          let prix = 0;
          let cout = 0;
          
          if (columns.length >= 4) {
            categorie = columns[0] || "Autre";
            nom = columns[1] || "Prestation sans nom";
            unite = columns[2] || "forfait";
            prix = parseFloat(columns[3].replace(',', '.')) || 0;
            if (columns[4]) cout = parseFloat(columns[4].replace(',', '.')) || 0;
          } else if (columns.length >= 2) {
            nom = columns[0] || "Prestation sans nom";
            prix = parseFloat(columns[1].replace(',', '.')) || 0;
          }

          newItems.push({ categorie, nom, unite, prix, cout });
        }
        
        await fetch("/api/prestations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItems),
        });
        
        // Rafraîchir
        const res = await fetch("/api/prestations");
        const data = await res.json();
        setPrestations(Array.isArray(data) ? data : []);
        alert("Importation terminée avec succès !");
      } catch {
        alert("Erreur lors de l'importation du fichier.");
      }
      setLoading(false);
      e.target.value = ''; // reset input
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-violet-400/12 to-fuchsia-400/8 dark:from-violet-500/20 dark:to-fuchsia-600/10 blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-fuchsia-400/8 to-orange-400/6 dark:from-fuchsia-600/15 dark:to-orange-500/5 blur-[100px] -z-10 pointer-events-none"></div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0c0a1d]/80 border-b border-violet-100/50 dark:border-violet-500/10 transition-all flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/dashboard">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Catalogue</h1>
        <div className="flex-1" />
        <label className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Importer un fichier CSV">
          <Upload size={18} />
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setShowForm(!showForm); if(showForm) setEditingId(null); setForm({ categorie: "Peinture", nom: "", unite: "m²", prix: "", cout: "", stock: "" }); }}
          className="w-10 h-10 bg-gradient-zolio rounded-full flex items-center justify-center text-white shadow-brand"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        <div className="rounded-[2rem] border border-violet-200/70 bg-violet-50/80 p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                Starter métier
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                Catalogue {activeTradeDefinition?.label.toLowerCase()} prêt à l&apos;emploi
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choisissez votre métier, importez votre base starter et enrichissez-la ensuite avec vos propres lignes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TRADE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedTrade(option.key)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    activeTrade === option.key
                      ? "bg-violet-600 text-white shadow-brand"
                      : "bg-white/80 text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleImportStarterCatalog}
                disabled={isImportingStarter}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
              >
                <Download size={16} />
                {isImportingStarter ? "Import..." : `Importer ${starterCount} lignes starter`}
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {prestations.length} prestation{prestations.length > 1 ? "s" : ""} déjà enregistrée{prestations.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher une prestation..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                  setSelectedIds(new Set(filtered.map((item: Prestation) => item.id)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout ({filtered.length})
          </label>
        </div>


        {showForm && (
            <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{editingId ? "Modifier la Prestation" : "Nouvelle Prestation"}</h2>
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              {STARTER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Nom de la prestation" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            <div className="flex gap-3">
              <select value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                <option value="m²">m²</option>
                <option value="ml">ml</option>
                <option value="heure">Heure</option>
                <option value="forfait">Forfait</option>
                <option value="unité">Unité</option>
              </select>
              <input required type="number" step="0.01" placeholder="Prix HT €" value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
            <input type="number" step="0.01" placeholder="Coût matière estimé (optionnel)" value={form.cout}
              onChange={(e) => setForm({ ...form, cout: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            <input type="number" step="0.01" placeholder="Stock initial (optionnel)" value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-brand disabled:opacity-50">
              {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter au catalogue"}
            </motion.button>
          </motion.form>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm">{search ? "Aucun résultat" : "Aucune prestation"}</p>
            {!search && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={handleImportStarterCatalog}
                  disabled={isImportingStarter}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  {isImportingStarter ? "Import..." : `Starter ${activeTradeDefinition?.shortLabel || "métier"} (${starterCount})`}
                </button>
                <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  Importer depuis CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} prestation{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((p, i) => (
              <motion.div key={p.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-brand-violet flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.categorie} · {p.unite}
                    {p.stock !== undefined && p.stock > 0 && <span className="ml-2 text-brand-violet bg-violet-100 dark:bg-violet-900/30 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-md">Stock: {p.stock}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.prix}€</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">HT/{p.unite}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
<button
                    onClick={() => handleDuplicate(p)}
                    className="p-2 text-slate-400 hover:text-brand-violet hover:bg-violet-50 dark:bg-violet-500/10 dark:hover:bg-violet-50 dark:bg-violet-500/100/10 rounded-lg transition-colors"
                    title="Dupliquer"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
