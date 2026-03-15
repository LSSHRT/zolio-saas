"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, User, Search, Phone, Mail, MapPin, X, Trash2, Pencil, History, FileText, CheckCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateAjout: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ClientsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/clients', fetcher);
  const clients = Array.isArray(data) ? data : [];
  const loading = isLoading && !data;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = clients.filter(
    (c) => (c.nom || '').toLowerCase().includes((search || '').toLowerCase()) || (c.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/clients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur serveur");
        }
        const updatedClient = await res.json();
        mutate(clients.map((c: Client) => c.id === editingId ? updatedClient : c), false);
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur serveur");
        }
        const newClient = await res.json();
        mutate([...clients, newClient], false);
      }
      setForm({ nom: "", email: "", telephone: "", adresse: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  const handleEdit = (client: Client) => {
    setForm({ nom: client.nom, email: client.email || "", telephone: client.telephone || "", adresse: client.adresse || "" });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate(clients.filter((c: Client) => c.id !== id), false);
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
        const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    if (successCount > 0) {
      mutate(clients.filter((item: any) => !selectedIds.has(item.id)), false);
      setSelectedIds(new Set());
    }
    setIsDeletingBulk(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        alert("Le fichier est vide ou ne contient que les en-têtes.");
        return;
      }
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const parsedData = [];

      for (let i = 1; i < lines.length; i++) {
        // Split par virgule mais gère très basiquement (les vrais CSV peuvent avoir des quotes)
        // On fait simple ici : split par virgule
        const values = lines[i].split(',').map(v => v.trim());
        const item: any = {};
        headers.forEach((h, index) => {
          if (h.includes('nom')) item.nom = values[index] || "";
          else if (h.includes('email')) item.email = values[index] || "";
          else if (h.includes('tel') || h.includes('tél')) item.telephone = values[index] || "";
          else if (h.includes('adresse')) item.adresse = values[index] || "";
        });
        if (item.nom) parsedData.push(item);
      }

      if (parsedData.length === 0) {
        alert("Aucune donnée valide trouvée. Vérifiez que la colonne 'nom' existe.");
        return;
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (res.ok) {
        mutate();
        alert(`${parsedData.length} client(s) importé(s) avec succès !`);
      } else {
        alert("Erreur lors de l'importation.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Clients</h1>
        <div className="flex-1" />
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-50"
          title="Importer un fichier CSV"
        >
          {isImporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setForm({ nom: "", email: "", telephone: "", adresse: "" });
            } else {
              setShowForm(true);
            }
          }}
          className="w-10 h-10 bg-gradient-zolio rounded-full flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </header>

      <main className="flex-1 px-6 flex flex-col gap-6">
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500"
          />
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


        {/* Add Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{editingId ? "Modifier le client" : "Nouveau Client"}</h2>
            <input required placeholder="Nom complet" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <input required placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <input placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-fuchsia-500/20 disabled:opacity-50">
              {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter le client"}
            </motion.button>
          </motion.form>
        )}

        {/* Client List */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36 mb-1.5" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-24" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-48" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (
          filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
              <User size={48} strokeWidth={1} />
              <p className="text-sm">{search ? "Aucun résultat" : "Aucun client pour l'instant"}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} client{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((client, i) => (
              <motion.div
                key={client.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.15) }}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-fuchsia-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {(client.nom || '').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{client.nom}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajouté le {client.dateAjout}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setHistoryClient(client)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Voir l'historique"
                    >
                      <History size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 text-slate-400 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-13">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail size={12} /> <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.telephone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Phone size={12} /> <span>{client.telephone}</span>
                    </div>
                  )}
                  {client.adresse && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} /> <span className="truncate">{client.adresse}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          )
        )}
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {historyClient && (
          <HistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}


function HistoryModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { data: devis } = useSWR('/api/devis', fetcher);
  const { data: factures } = useSWR('/api/factures', fetcher);

  const history = useMemo(() => {
    let items: any[] = [];
    if (devis && Array.isArray(devis)) {
      devis.filter((d: any) => d.nomClient === client.nom || d.emailClient === client.email).forEach((d: any) => {
        items.push({ type: 'devis', id: d.numero, date: d.date, montant: d.totalTTC, statut: d.statut });
      });
    }
    if (factures && Array.isArray(factures)) {
      factures.filter((f: any) => f.nomClient === client.nom || f.emailClient === client.email).forEach((f: any) => {
        items.push({ type: 'facture', id: f.numero, date: f.date, montant: f.totalTTC, statut: 'Payé' });
      });
    }
    
    // Sort by date desc (naive string sort since dates are often DD/MM/YYYY, but let's try our best)
    // Assuming DD/MM/YYYY
    return items.sort((a, b) => {
      const partsA = a.date.split('/');
      const partsB = b.date.split('/');
      if (partsA.length === 3 && partsB.length === 3) {
        const da = new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime();
        const db = new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime();
        return db - da;
      }
      return b.date.localeCompare(a.date);
    });
  }, [devis, factures, client]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Historique Client</h2>
            <p className="text-sm text-slate-500">{client.nom}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Aucune activité enregistrée pour ce client.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8">
              {history.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-[11px] bg-white dark:bg-slate-800 p-0.5 rounded-full border-2 ${item.type === 'facture' ? 'border-green-500' : 'border-fuchsia-500'}`}>
                    {item.type === 'facture' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-fuchsia-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {item.type === 'facture' ? 'Facture' : 'Devis'} #{item.id}
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.date}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.statut === 'Accepté' || item.type === 'facture' ? 'bg-green-100 text-green-700' :
                        item.statut === 'Refusé' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.statut || 'En attente'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">{item.montant} €</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
