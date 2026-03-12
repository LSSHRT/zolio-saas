"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, User, Search, Phone, Mail, MapPin, X, Trash2, Pencil } from "lucide-react";
import Link from "next/link";

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
  const { data, error, isLoading, mutate } = useSWR('/api/clients', fetcher, { revalidateOnFocus: true, keepPreviousData: true });
  const clients = Array.isArray(data) ? data : [];
  const loading = isLoading && !data;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = clients.filter(
    (c) => c.nom.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
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
        const updatedClient = await res.json();
        mutate(clients.map((c: Client) => c.id === editingId ? updatedClient : c), false);
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const newClient = await res.json();
        mutate([...clients, newClient], false);
      }
      setForm({ nom: "", email: "", telephone: "", adresse: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
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
          className="w-10 h-10 bg-gradient-zolio rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30"
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
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((item: any) => item.id)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout (${filtered.length})
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
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input required placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50">
              {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Ajouter le client"}
            </motion.button>
          </motion.form>
        )}

        {/* Client List */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
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
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {client.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{client.nom}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajouté le {client.dateAjout}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
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
        )}
      </main>
    </div>
  );
}
