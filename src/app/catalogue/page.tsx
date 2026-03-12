"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Package, Search, X } from "lucide-react";
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

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Catalogue</h1>
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
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
            className="bg-slate-50 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-1">Nouvelle Prestation</h2>
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Nom de la prestation" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <div className="flex gap-3">
              <select value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="m²">m²</option>
                <option value="ml">ml</option>
                <option value="heure">Heure</option>
                <option value="forfait">Forfait</option>
                <option value="unité">Unité</option>
              </select>
              <input required type="number" step="0.01" placeholder="Prix HT €" value={form.prixUnitaireHT}
                onChange={(e) => setForm({ ...form, prixUnitaireHT: e.target.value })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <input type="number" step="0.01" placeholder="Coût matière estimé (optionnel)" value={form.coutMatiere}
              onChange={(e) => setForm({ ...form, coutMatiere: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
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
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 font-medium">{filtered.length} prestation{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((p, i) => (
              <motion.div key={p.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.nom}</p>
                  <p className="text-xs text-slate-500">{p.categorie} · {p.unite}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 text-sm">{p.prixUnitaireHT}€</p>
                  <p className="text-[10px] text-slate-500">HT/{p.unite}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
