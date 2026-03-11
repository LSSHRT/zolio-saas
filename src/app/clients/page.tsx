"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, User, Search, Phone, Mail, MapPin, X } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateAjout: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter(
    (c) => c.nom.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newClient = await res.json();
      setClients([...clients, newClient]);
      setForm({ nom: "", email: "", telephone: "", adresse: "" });
      setShowForm(false);
    } catch (err) {
      alert("Erreur lors de l'ajout du client");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md mx-auto bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Mes Clients</h1>
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
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        {/* Add Form */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-50 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200"
          >
            <h2 className="font-semibold text-slate-800 mb-1">Nouveau Client</h2>
            <input required placeholder="Nom complet" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input required placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <input placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            <motion.button whileTap={{ scale: 0.96 }} disabled={saving} type="submit"
              className="mt-2 w-full py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50">
              {saving ? "Enregistrement..." : "Ajouter le client"}
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
            <p className="text-xs text-slate-500 font-medium">{filtered.length} client{filtered.length > 1 ? "s" : ""}</p>
            {filtered.map((client, i) => (
              <motion.div
                key={client.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {client.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{client.nom}</p>
                    <p className="text-xs text-slate-500">Ajouté le {client.dateAjout}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-13">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} /> <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.telephone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} /> <span>{client.telephone}</span>
                    </div>
                  )}
                  {client.adresse && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
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
