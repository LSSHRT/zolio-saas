"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Package, Search, X, Trash2, Copy, Download, Pencil, Upload } from "lucide-react";
import Link from "next/link";

interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  unite: string;
  prixUnitaireHT: number;
  coutMatiere: number;
  stock?: number;
}

const CATEGORIES = ["Préparation", "Peinture", "Sol", "Plafond", "Façade", "Décoration", "Plomberie", "Électricité", "Menuiserie", "Autre"];

const SEED_CATALOG = [
  // Préparation
  { categorie: "Préparation", nom: "Lessivage des murs", unite: "m²", prixUnitaireHT: 5, coutMatiere: 0.5 },
  { categorie: "Préparation", nom: "Enduit de lissage complet", unite: "m²", prixUnitaireHT: 15, coutMatiere: 2 },
  { categorie: "Préparation", nom: "Dépose de papier peint", unite: "m²", prixUnitaireHT: 8, coutMatiere: 0 },
  { categorie: "Préparation", nom: "Ponçage mécanique", unite: "m²", prixUnitaireHT: 6, coutMatiere: 0.5 },
  { categorie: "Préparation", nom: "Impression fixante (Sous-couche)", unite: "m²", prixUnitaireHT: 7, coutMatiere: 1.5 },
  { categorie: "Préparation", nom: "Rebouchage trous et fissures", unite: "forfait", prixUnitaireHT: 45, coutMatiere: 5 },
  { categorie: "Préparation", nom: "Protection des sols et meubles", unite: "m²", prixUnitaireHT: 3, coutMatiere: 1 },
  // Peinture
  { categorie: "Peinture", nom: "Peinture acrylique mate (2 couches)", unite: "m²", prixUnitaireHT: 12, coutMatiere: 3 },
  { categorie: "Peinture", nom: "Peinture velours (2 couches)", unite: "m²", prixUnitaireHT: 14, coutMatiere: 4 },
  { categorie: "Peinture", nom: "Peinture satinée (2 couches)", unite: "m²", prixUnitaireHT: 15, coutMatiere: 4 },
  { categorie: "Peinture", nom: "Peinture laque (boiseries)", unite: "ml", prixUnitaireHT: 18, coutMatiere: 5 },
  { categorie: "Peinture", nom: "Peinture plafond sans traces", unite: "m²", prixUnitaireHT: 16, coutMatiere: 3.5 },
  { categorie: "Peinture", nom: "Peinture radiateur", unite: "unité", prixUnitaireHT: 35, coutMatiere: 5 },
  { categorie: "Peinture", nom: "Peinture porte (2 faces)", unite: "unité", prixUnitaireHT: 65, coutMatiere: 10 },
  // Sol
  { categorie: "Sol", nom: "Pose de parquet flottant", unite: "m²", prixUnitaireHT: 25, coutMatiere: 2 },
  { categorie: "Sol", nom: "Pose de plinthes", unite: "ml", prixUnitaireHT: 8, coutMatiere: 1 },
  { categorie: "Sol", nom: "Ragréage sol", unite: "m²", prixUnitaireHT: 12, coutMatiere: 4 },
  { categorie: "Sol", nom: "Pose de carrelage standard (hors fourniture)", unite: "m²", prixUnitaireHT: 45, coutMatiere: 5 },
  { categorie: "Sol", nom: "Pose de moquette", unite: "m²", prixUnitaireHT: 15, coutMatiere: 2 },
  { categorie: "Sol", nom: "Pose de lino", unite: "m²", prixUnitaireHT: 14, coutMatiere: 2 },
  { categorie: "Sol", nom: "Dépose de revêtement de sol existant", unite: "m²", prixUnitaireHT: 9, coutMatiere: 0 },
  // Plomberie
  { categorie: "Plomberie", nom: "Recherche de fuite", unite: "forfait", prixUnitaireHT: 150, coutMatiere: 0 },
  { categorie: "Plomberie", nom: "Remplacement mitigeur", unite: "unité", prixUnitaireHT: 80, coutMatiere: 0 },
  { categorie: "Plomberie", nom: "Pose de WC suspendu", unite: "unité", prixUnitaireHT: 350, coutMatiere: 20 },
  { categorie: "Plomberie", nom: "Débouchage canalisation", unite: "forfait", prixUnitaireHT: 120, coutMatiere: 0 },
  { categorie: "Plomberie", nom: "Pose de chauffe-eau électrique", unite: "unité", prixUnitaireHT: 250, coutMatiere: 30 },
  { categorie: "Plomberie", nom: "Création arrivée/évacuation d'eau", unite: "forfait", prixUnitaireHT: 180, coutMatiere: 25 },
  // Électricité
  { categorie: "Électricité", nom: "Création prise de courant", unite: "unité", prixUnitaireHT: 90, coutMatiere: 15 },
  { categorie: "Électricité", nom: "Remplacement tableau électrique", unite: "forfait", prixUnitaireHT: 800, coutMatiere: 300 },
  { categorie: "Électricité", nom: "Pose de luminaire/spot", unite: "unité", prixUnitaireHT: 45, coutMatiere: 5 },
  { categorie: "Électricité", nom: "Tirage de ligne électrique", unite: "ml", prixUnitaireHT: 12, coutMatiere: 3 },
  { categorie: "Électricité", nom: "Mise aux normes installation", unite: "forfait", prixUnitaireHT: 1500, coutMatiere: 400 },
  // Menuiserie
  { categorie: "Menuiserie", nom: "Pose porte intérieure", unite: "unité", prixUnitaireHT: 150, coutMatiere: 10 },
  { categorie: "Menuiserie", nom: "Montage meuble standard", unite: "heure", prixUnitaireHT: 45, coutMatiere: 0 },
  { categorie: "Menuiserie", nom: "Pose de cuisine aménagée", unite: "ml", prixUnitaireHT: 120, coutMatiere: 15 },
  { categorie: "Menuiserie", nom: "Réglage de fenêtre", unite: "unité", prixUnitaireHT: 40, coutMatiere: 0 },
  // Maçonnerie / Façade
  { categorie: "Façade", nom: "Création ouverture mur porteur", unite: "forfait", prixUnitaireHT: 1200, coutMatiere: 150 },
  { categorie: "Façade", nom: "Montage cloison placo (BA13)", unite: "m²", prixUnitaireHT: 35, coutMatiere: 12 },
  { categorie: "Façade", nom: "Pose de faux plafond (BA13)", unite: "m²", prixUnitaireHT: 45, coutMatiere: 15 },
  { categorie: "Façade", nom: "Isolation thermique (laine de verre)", unite: "m²", prixUnitaireHT: 25, coutMatiere: 10 },
  { categorie: "Façade", nom: "Ravalement de façade (peinture)", unite: "m²", prixUnitaireHT: 35, coutMatiere: 8 },
  
  // Toiture / Couverture
  { categorie: "Toiture", nom: "Nettoyage toiture et démoussage", unite: "m²", prixUnitaireHT: 15, coutMatiere: 2 },
  { categorie: "Toiture", nom: "Remplacement tuile défectueuse", unite: "unité", prixUnitaireHT: 25, coutMatiere: 5 },
  { categorie: "Toiture", nom: "Pose de gouttière zinc", unite: "ml", prixUnitaireHT: 45, coutMatiere: 15 },
  
  // Climatisation / Chauffage
  { categorie: "Climatisation", nom: "Entretien annuel climatisation", unite: "forfait", prixUnitaireHT: 120, coutMatiere: 0 },
  { categorie: "Climatisation", nom: "Pose climatiseur réversible (Mono-split)", unite: "forfait", prixUnitaireHT: 800, coutMatiere: 150 },
  
  // Paysagisme / Extérieur
  { categorie: "Paysagisme", nom: "Tonte de pelouse", unite: "heure", prixUnitaireHT: 40, coutMatiere: 5 },
  { categorie: "Paysagisme", nom: "Taille de haie", unite: "ml", prixUnitaireHT: 12, coutMatiere: 2 },
  { categorie: "Paysagisme", nom: "Création de terrasse bois", unite: "m²", prixUnitaireHT: 120, coutMatiere: 50 },

  // Extérieur / Autre
  { categorie: "Autre", nom: "Nettoyage fin de chantier", unite: "forfait", prixUnitaireHT: 150, coutMatiere: 10 },
  { categorie: "Autre", nom: "Évacuation des gravats", unite: "forfait", prixUnitaireHT: 120, coutMatiere: 20 },
  { categorie: "Autre", nom: "Déplacement / Frais kilométriques", unite: "forfait", prixUnitaireHT: 50, coutMatiere: 10 }
];

export default function CataloguePage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [form, setForm] = useState({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "", stock: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      const url = editingId ? `/api/prestations/${editingId}` : "/api/prestations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, prixUnitaireHT: parseFloat(form.prixUnitaireHT), coutMatiere: parseFloat(form.coutMatiere) || 0, stock: parseFloat(form.stock) || 0 }),
      });
      const data = await res.json();
      if (editingId) {
        setPrestations(prestations.map(p => p.id === editingId ? { ...p, ...data.data, id: editingId } : p));
      } else {
        setPrestations([...prestations, data]);
      }
      setForm({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "", stock: "" });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
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

  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} élément(s) ?`)) return;
    setIsDeletingBulk(true);
    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(`/api/prestations/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    if (successCount > 0) {
      setPrestations(prestations.filter((item: any) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    }
    setIsDeletingBulk(false);
  };


    
  const handleEdit = (p: Prestation) => {
    setForm({
      categorie: p.categorie,
      nom: p.nom,
      unite: p.unite,
      prixUnitaireHT: p.prixUnitaireHT.toString(),
      coutMatiere: p.coutMatiere ? p.coutMatiere.toString() : "",
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
      prixUnitaireHT: p.prixUnitaireHT.toString(),
      coutMatiere: p.coutMatiere ? p.coutMatiere.toString() : "",
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
      let newItems = [];
      try {
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
          
          // Essayer de déduire les colonnes: Categorie, Nom, Unite, PrixHT, CoutMatiere
          // Au minimum: Nom (col 1 ou 0) et PrixHT (col 2 ou 3)
          let categorie = "Autre";
          let nom = "Prestation sans nom";
          let unite = "forfait";
          let prixUnitaireHT = 0;
          let coutMatiere = 0;
          
          if (columns.length >= 4) {
            categorie = columns[0] || "Autre";
            nom = columns[1] || "Prestation sans nom";
            unite = columns[2] || "forfait";
            prixUnitaireHT = parseFloat(columns[3].replace(',', '.')) || 0;
            if (columns[4]) coutMatiere = parseFloat(columns[4].replace(',', '.')) || 0;
          } else if (columns.length >= 2) {
            nom = columns[0] || "Prestation sans nom";
            prixUnitaireHT = parseFloat(columns[1].replace(',', '.')) || 0;
          }

          newItems.push({ categorie, nom, unite, prixUnitaireHT, coutMatiere });
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
      } catch (err) {
        alert("Erreur lors de l'importation du fichier.");
      }
      setLoading(false);
      e.target.value = ''; // reset input
    };
    reader.readAsText(file);
  };

  const handleSeed = async () => {
    const qtyStr = prompt(`Combien de prestations voulez-vous importer depuis le catalogue métier ? (Max: ${SEED_CATALOG.length})`, SEED_CATALOG.length.toString());
    if (!qtyStr) return;
    
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return;
    
    const limit = Math.min(qty, SEED_CATALOG.length);
    const itemsToImport = SEED_CATALOG.slice(0, limit);

    if (!confirm(`Voulez-vous importer ces ${limit} prestation(s) métier ?`)) return;
    setLoading(true);
    try {
      await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemsToImport),
      });

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
        <label className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Importer un fichier CSV">
          <Upload size={18} />
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setShowForm(!showForm); if(showForm) setEditingId(null); setForm({ categorie: "Peinture", nom: "", unite: "m²", prixUnitaireHT: "", coutMatiere: "" }); }}
          className="w-10 h-10 bg-gradient-zolio rounded-full flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher une prestation..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500" />
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((item: any) => item.id)));
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
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required placeholder="Nom de la prestation" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <div className="flex gap-3">
              <select value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30">
                <option value="m²">m²</option>
                <option value="ml">ml</option>
                <option value="heure">Heure</option>
                <option value="forfait">Forfait</option>
                <option value="unité">Unité</option>
              </select>
              <input required type="number" step="0.01" placeholder="Prix HT €" value={form.prixUnitaireHT}
                onChange={(e) => setForm({ ...form, prixUnitaireHT: e.target.value })}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            </div>
            <input type="number" step="0.01" placeholder="Coût matière estimé (optionnel)" value={form.coutMatiere}
              onChange={(e) => setForm({ ...form, coutMatiere: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <input type="number" step="0.01" placeholder="Stock initial (optionnel)" value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-fuchsia-500/20 disabled:opacity-50">
              {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter au catalogue"}
            </motion.button>
          </motion.form>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm">{search ? "Aucun résultat" : "Aucune prestation"}</p>
            {!search && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={handleSeed}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Importer catalogue type (+40)
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
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{p.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.categorie} · {p.unite}
                    {p.stock !== undefined && p.stock > 0 && <span className="ml-2 text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-900/30 px-1.5 py-0.5 rounded-md">Stock: {p.stock}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.prixUnitaireHT}€</p>
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
                    className="p-2 text-slate-400 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 rounded-lg transition-colors"
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
