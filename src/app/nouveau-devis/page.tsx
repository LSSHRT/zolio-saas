"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Search, User, Package, Send, X, Trash2, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Client { id: string; nom: string; email: string; telephone: string; adresse: string; dateAjout: string; }
interface Prestation { id: string; categorie: string; nom: string; unite: string; prixUnitaireHT: number; coutMatiere: number; }
interface LigneDevis { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number; }

export default function NouveauDevisPage() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [tva, setTva] = useState("10");
  const [searchClient, setSearchClient] = useState("");
  const [searchPrestation, setSearchPrestation] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devisResult, setDevisResult] = useState<any>(null);

  const [isPro, setIsPro] = useState(true); // Défaut true pour éviter le flash
  const [checkingPro, setCheckingPro] = useState(true);

  // Formulaire nouveau client rapide
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nom: "", email: "", telephone: "", adresse: "" });

  useEffect(() => {
    // Vérifier l'abonnement via Clerk publicMetadata
    if (isLoaded) {
      if (user?.publicMetadata?.isPro === true) {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
      setCheckingPro(false);
    }

    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : []));
    fetch("/api/prestations").then((r) => r.json()).then((d) => setPrestations(Array.isArray(d) ? d : []));
  }, [isLoaded, user]);

  const totalHT = lignes.reduce((s, l) => s + l.totalLigne, 0);
  const totalTTC = totalHT * (1 + parseFloat(tva) / 100);

  const addLigne = (p: Prestation) => {
    setLignes([...lignes, { nomPrestation: p.nom, quantite: 1, unite: p.unite, prixUnitaire: p.prixUnitaireHT, totalLigne: p.prixUnitaireHT }]);
    setSearchPrestation("");
  };

  const updateQty = (idx: number, qty: number) => {
    const updated = [...lignes];
    updated[idx].quantite = qty;
    updated[idx].totalLigne = qty * updated[idx].prixUnitaire;
    setLignes(updated);
  };

  const removeLigne = (idx: number) => {
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const handleNewClient = async () => {
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
    const c = await res.json();
    setClients([...clients, c]);
    setSelectedClient(c);
    setShowNewClient(false);
    setNewClient({ nom: "", email: "", telephone: "", adresse: "" });
  };

  const handleSend = async () => {
    if (!selectedClient || lignes.length === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: selectedClient, lignes, tva }),
      });
      const result = await res.json();
      setDevisResult(result);
      setSuccess(true);
    } catch {
      alert("Erreur lors de la création du devis");
    }
    setSending(false);
  };

  const filteredClients = clients.filter((c) => c.nom.toLowerCase().includes(searchClient.toLowerCase()));
  const filteredPrestations = prestations.filter((p) => p.nom.toLowerCase().includes(searchPrestation.toLowerCase()) || p.categorie.toLowerCase().includes(searchPrestation.toLowerCase()));

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md mx-auto bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden items-center justify-center p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-emerald-600" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-slate-900 mb-2 text-center">Devis créé ! 🎉</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-slate-500 text-center text-sm mb-2">
          {devisResult?.numeroDevis} — {devisResult?.totalTTC}€ TTC
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-slate-400 text-center text-xs mb-8">
          Enregistré dans votre Google Sheets
        </motion.p>
        <Link href="/">
          <motion.button whileTap={{ scale: 0.96 }} className="px-8 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg">
            Retour à l&apos;accueil
          </motion.button>
        </Link>
      </div>
    );
  }

  // Paywall
  if (!checkingPro && !isPro) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md mx-auto bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative selection:bg-purple-200">
        <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
          <Link href="/">
            <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <ArrowLeft size={20} />
            </motion.div>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Nouveau Devis</h1>
        </header>
        
        <main className="flex-1 px-6 flex flex-col items-center justify-center text-center -mt-10">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 relative">
            <Lock size={32} className="text-slate-400" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-100 rounded-full border-4 border-white flex items-center justify-center">
              <Zap size={16} className="text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Fonctionnalité Premium</h2>
          <p className="text-slate-500 text-sm mb-8 px-4 leading-relaxed">
            La création de devis professionnels est réservée aux abonnés Zolio Pro. Gagnez 5h par semaine dès aujourd'hui.
          </p>

          <Link href="/abonnement" className="w-full">
            <motion.button whileTap={{ scale: 0.96 }} className="w-full py-4 bg-gradient-zolio text-white font-bold rounded-xl shadow-xl shadow-purple-500/20">
              Découvrir Zolio Pro
            </motion.button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 font-sans max-w-md mx-auto bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Nouveau Devis</h1>
      </header>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${step >= s ? "bg-gradient-zolio text-white shadow-md shadow-purple-500/30" : "bg-slate-100 text-slate-400"}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? "bg-gradient-zolio" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {step === 1 ? "Sélectionner un client" : step === 2 ? "Ajouter des prestations" : "Valider et envoyer"}
        </p>
      </div>

      {/* Step content */}
      <main className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait" custom={step}>
          {/* STEP 1: Client */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
              {selectedClient ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">{selectedClient.nom.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{selectedClient.nom}</p>
                    <p className="text-xs text-slate-500">{selectedClient.email}</p>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="text-slate-400"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher un client..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewClient(true)}
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
                    <Plus size={18} /> Créer un nouveau client
                  </motion.button>

                  {showNewClient && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2 border border-slate-200">
                      <input required placeholder="Nom" value={newClient.nom} onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      <input required type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      <input placeholder="Téléphone" value={newClient.telephone} onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      <input placeholder="Adresse" value={newClient.adresse} onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setShowNewClient(false)} className="flex-1 py-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl">Annuler</button>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={handleNewClient}
                          className="flex-1 py-2 text-sm text-white bg-gradient-zolio rounded-xl font-semibold">Ajouter</motion.button>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-2">
                    {filteredClients.map((c) => (
                      <motion.button key={c.id} whileTap={{ scale: 0.97 }} onClick={() => setSelectedClient(c)}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl text-left hover:bg-slate-50 transition">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{c.nom.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{c.nom}</p>
                          <p className="text-xs text-slate-400 truncate">{c.email}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* STEP 2: Prestations */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-4">
              {/* Search prestations */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher une prestation..." value={searchPrestation} onChange={(e) => setSearchPrestation(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>

              {/* Liste des prestations disponibles */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {filteredPrestations.map((p) => (
                  <motion.button key={p.id} whileTap={{ scale: 0.97 }} onClick={() => addLigne(p)}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-left hover:bg-blue-50 hover:border-blue-200 transition">
                    <Plus size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.nom}</p>
                      <p className="text-[10px] text-slate-400">{p.categorie}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.prixUnitaireHT}€/{p.unite}</span>
                  </motion.button>
                ))}
              </div>

              {/* Lignes ajoutées */}
              {lignes.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Lignes du devis ({lignes.length})</p>
                  <div className="flex flex-col gap-2">
                    {lignes.map((l, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{l.nomPrestation}</p>
                          <p className="text-[10px] text-slate-400">{l.prixUnitaire}€/{l.unite}</p>
                        </div>
                        <input type="number" min="1" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                          className="w-16 text-center py-1 px-2 bg-white border border-slate-200 rounded-lg text-sm" />
                        <span className="text-sm font-bold text-slate-800 w-16 text-right">{l.totalLigne.toFixed(0)}€</span>
                        <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Récapitulatif */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-5">
              {/* Client */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-2">Client</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">{selectedClient?.nom.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedClient?.nom}</p>
                    <p className="text-xs text-slate-500">{selectedClient?.email}</p>
                  </div>
                </div>
              </div>

              {/* Lignes */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-3">Prestations</p>
                {lignes.map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                    <div>
                      <p className="text-sm text-slate-800">{l.nomPrestation}</p>
                      <p className="text-[10px] text-slate-400">{l.quantite} {l.unite} × {l.prixUnitaire}€</p>
                    </div>
                    <p className="font-bold text-sm text-slate-800">{l.totalLigne.toFixed(2)}€</p>
                  </div>
                ))}
              </div>

              {/* TVA */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 font-medium">Taux TVA :</label>
                <select value={tva} onChange={(e) => setTva(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none">
                  <option value="0">0% (Auto-entrepreneur)</option>
                  <option value="10">10% (Rénovation)</option>
                  <option value="20">20% (Normal)</option>
                </select>
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
                <div className="h-px bg-white/20 my-2" />
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Total TTC</span>
                  <span className="font-bold text-lg">{totalTTC.toFixed(2)}€</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex gap-3 sm:rounded-b-[3rem]">
        {step > 1 && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(step - 1)}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Retour
          </motion.button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedClient) || (step === 2 && lignes.length === 0)}
            className="px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 text-sm disabled:opacity-40">
            Suivant <ArrowRight size={16} />
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSend} disabled={sending}
            className="px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 text-sm disabled:opacity-40">
            {sending ? "Envoi..." : <>Créer le devis <Send size={16} /></>}
          </motion.button>
        )}
      </div>
    </div>
  );
}
