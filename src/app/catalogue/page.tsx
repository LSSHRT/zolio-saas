"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Package, Search, X, Trash2, Copy, Download } from "lucide-react";
import Link from "next/link";

interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  unite: string;
  prixUnitaireHT: number;
  coutMatiere: number;
}

const CATEGORIES = ["Préparation", "Peinture", "Sol", "Plafond", "Façade", "Décoration", "Autre"];

const SEED_CATALOG = [
  { categorie: "Préparation", nom: "Lessivage des murs", unite: "m²", prixUnitaireHT: 5, coutMatiere: 0.5 },
  { categorie: "Préparation", nom: "Enduit de lissage complet", unite: "m²", prixUnitaireHT: 15, coutMatiere: 2 },
  { categorie: "Peinture", nom: "Peinture acrylique mate (2 couches)", unite: "m²", prixUnitaireHT: 12, coutMatiere: 3 },
  { categorie: "Peinture", nom: "Peinture velours (2 couches)", unite: "m²", prixUnitaireHT: 14, coutMatiere: 4 },
  { categorie: "Sol", nom: "Pose de parquet flottant", unite: "m²", prixUnitaireHT: 25, coutMatiere: 0 }
];

export default function CataloguePage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => { setPrestations(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = prestations.filter(
    (p) => p.nom.toLowerCase().includes(search.toLowerCase()) || p.categorie.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prixUnitaireHT: parseFloat(form.prixUnitaireHT), coutMatiere: parseFloat(form.coutMatiere) || 0 }),
      });
      const newP = await res.json();
      setPrestations([...prestations, newP]);
      setForm({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "" });
      setShowForm(false);
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
    setSaving(false);
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
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom + " (Copie)",
      unite: p.unite,
      prixUnitaireHT: p.prixUnitaireHT.toString(),
      coutMatiere: p.coutMatiere ? p.coutMatiere.toString() : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeed = async () => {
    if (!confirm("Voulez-vous importer le catalogue type avec 5 prestations de base ?")) return;
    setLoading(true);
    try {
      for (const item of SEED_CATALOG) {
        await fetch("/api/prestations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      const res = await fetch("/api/prestations");
      const data = await res.json();
      setPrestations(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Erreur lors de l'import");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Catalogue</h1>
        <div className="flex-1" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 bg-gradient-zolio rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher une prestation..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Nouvelle Prestation</h2>
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Nom de la prestation" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <div className="flex gap-3">
              <select value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="m²">m²</option>
                <option value="ml">ml</option>
                <option value="heure">Heure</option>
                <option value="forfait">Forfait</option>
                <option value="unité">Unité</option>
              </select>
              <input required type="number" step="0.01" placeholder="Prix HT €" value={form.prixUnitaireHT}
                onChange={(e) => setForm({ ...form, prixUnitaireHT: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <input type="number" step="0.01" placeholder="Coût matière estimé (optionnel)" value={form.coutMatiere}
              onChange={(e) => setForm({ ...form, coutMatiere: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50">
              {saving ? "Enregistrement..." : "Ajouter au catalogue"}
            </motion.button>
          </motion.form>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm">{search ? "Aucun résultat" : "Aucune prestation"}</p>
            {!search && (
              <button
                onClick={handleSeed}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Importer catalogue type
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} prestation{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((p, i) => (
              <motion.div key={p.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.categorie} · {p.unite}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.prixUnitaireHT}€</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">HT/{p.unite}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
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
