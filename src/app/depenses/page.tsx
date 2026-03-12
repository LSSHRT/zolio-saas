"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Search, ArrowLeft, Receipt, Calendar, CreditCard, Tag } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Depense {
  id: string;
  date: string;
  description: string;
  montantTTC: number;
  tvaDeductible: number;
  categorie: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DepensesPage() {
  const { data: depenses, error, mutate } = useSWR<Depense[]>("/api/depenses", fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    montantTTC: "",
    tvaDeductible: "",
    categorie: "Achats Matériaux"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = [
    "Achats Matériaux",
    "Sous-traitance",
    "Outillage & Équipement",
    "Véhicule & Carburant",
    "Assurances",
    "Frais Bancaires",
    "Repas & Déplacements",
    "Autre"
  ];

  const filteredDepenses = depenses?.filter((d) =>
    d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalTTC = filteredDepenses.reduce((acc, d) => acc + d.montantTTC, 0);
  const totalTVA = filteredDepenses.reduce((acc, d) => acc + d.tvaDeductible, 0);
  const totalHT = totalTTC - totalTVA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          montantTTC: parseFloat(formData.montantTTC),
          tvaDeductible: parseFloat(formData.tvaDeductible || "0")
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout");

      await mutate();
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        montantTTC: "",
        tvaDeductible: "",
        categorie: "Achats Matériaux"
      });
    } catch (error) {
      alert("Erreur lors de l'enregistrement de la dépense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;
    setDeletingId(id);

    try {
      const response = await fetch(`/api/depenses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur de suppression");
      await mutate();
    } catch (error) {
      alert("Impossible de supprimer la dépense.");
    } finally {
      setDeletingId(null);
    }
  };

  if (error) return <div className="p-4 text-red-500">Erreur de chargement.</div>;

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="text-fuchsia-500" /> Dépenses & Achats
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white p-2 md:px-4 md:py-2 rounded-full md:rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          {showForm ? <ArrowLeft size={20} /> : <Plus size={20} />}
          <span className="hidden md:block">{showForm ? "Retour" : "Nouvelle Dépense"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Ajouter une dépense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <Calendar size={16} /> Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <Tag size={16} /> Catégorie
                  </label>
                  <select
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white"
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Fournisseur</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Matériaux Leroy Merlin, Carburant Total..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    <CreditCard size={16} /> Montant TTC (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white"
                    value={formData.montantTTC}
                    onChange={(e) => setFormData({ ...formData, montantTTC: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">TVA Déductible (€) (Optionnel)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white"
                    value={formData.tvaDeductible}
                    onChange={(e) => setFormData({ ...formData, tvaDeductible: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer la dépense"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total TTC</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{totalTTC.toFixed(2)} €</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total HT</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{totalHT.toFixed(2)} €</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">TVA Récupérable</p>
                <p className="text-lg font-bold text-emerald-600 font-mono">{totalTVA.toFixed(2)} €</p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-fuchsia-500 outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Liste des dépenses */}
            {!depenses ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                ))}
              </div>
            ) : filteredDepenses.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Receipt className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
                <p className="text-slate-500 dark:text-slate-400">Aucune dépense trouvée.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDepenses.map((depense) => (
                  <div key={depense.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-shadow group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          {depense.categorie}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(depense.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-white">{depense.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">{depense.montantTTC.toFixed(2)} €</p>
                        {depense.tvaDeductible > 0 && (
                          <p className="text-[10px] text-emerald-600">TVA: {depense.tvaDeductible.toFixed(2)}€</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(depense.id)}
                        disabled={deletingId === depense.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}