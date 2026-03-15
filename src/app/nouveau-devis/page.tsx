"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Search, User, Package, Send, X, Trash2, Lock, Zap, Camera, Image as ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Client { id: string; nom: string; email: string; telephone: string; adresse: string; dateAjout: string; }
interface Prestation { id: string; categorie: string; nom: string; unite: string; prix: number; cout: number; }
interface LigneDevis { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number; tva?: string; isOptional?: boolean; }


const FORFAITS = [
  { nom: "Rénovation SDB (Complète)", lignes: [
      { nomPrestation: "Démolition et évacuation", quantite: 1, unite: "Forfait", prixUnitaire: 500, totalLigne: 500 },
      { nomPrestation: "Plomberie (Alimentation et évacuation)", quantite: 1, unite: "Forfait", prixUnitaire: 1200, totalLigne: 1200 },
      { nomPrestation: "Pose carrelage mural et sol", quantite: 15, unite: "m²", prixUnitaire: 60, totalLigne: 900 },
      { nomPrestation: "Peinture plafond (hydrofuge)", quantite: 6, unite: "m²", prixUnitaire: 35, totalLigne: 210 }
    ]
  },
  { nom: "Peinture Pièce (Standard 15m²)", lignes: [
      { nomPrestation: "Protection des sols et meubles", quantite: 1, unite: "Forfait", prixUnitaire: 150, totalLigne: 150 },
      { nomPrestation: "Préparation des murs (enduit, ponçage)", quantite: 40, unite: "m²", prixUnitaire: 15, totalLigne: 600 },
      { nomPrestation: "Peinture 2 couches (Murs & Plafond)", quantite: 55, unite: "m²", prixUnitaire: 25, totalLigne: 1375 }
    ]
  },
  { nom: "Tableau Électrique (Mise aux normes)", lignes: [
      { nomPrestation: "Dépose de l'ancien tableau", quantite: 1, unite: "Forfait", prixUnitaire: 200, totalLigne: 200 },
      { nomPrestation: "Fourniture et pose tableau 3 rangées", quantite: 1, unite: "Unité", prixUnitaire: 950, totalLigne: 950 },
      { nomPrestation: "Contrôle et test de l'installation", quantite: 1, unite: "Forfait", prixUnitaire: 150, totalLigne: 150 }
    ]
  }
];


export default function NouveauDevisPage() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [tva, setTva] = useState("10");
  const [acompte, setAcompte] = useState("");
  const [remise, setRemise] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [searchClient, setSearchClient] = useState("");
  const [searchPrestation, setSearchPrestation] = useState("");
  const [showForfaits, setShowForfaits] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devisResult, setDevisResult] = useState<any>(null);

  const [isPro, setIsPro] = useState(true); // Défaut true pour éviter le flash
  const [checkingPro, setCheckingPro] = useState(true);
  const [devisCount, setDevisCount] = useState<number | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);

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

    fetch("/api/clients").then((r) => r.json()).then((d) => {
      setClients(Array.isArray(d) ? d : []);
      setIsLoadingClients(false);
    }).catch(() => setIsLoadingClients(false));
    fetch("/api/prestations").then((r) => r.json()).then((d) => setPrestations(Array.isArray(d) ? d : []));
    fetch("/api/devis").then((r) => r.json()).then((d) => setDevisCount(Array.isArray(d) ? d.length : 0));
  }, [isLoaded, user]);

  const totalHTBase = lignes.filter(l => !l.isOptional).reduce((s, l) => s + l.totalLigne, 0);
  const montantRemise = totalHTBase * (parseFloat(remise) || 0) / 100;
  const totalHT = totalHTBase - montantRemise;
  // TTC est calculé en fonction de la TVA de chaque ligne ou de la TVA globale
  const totalTTC = lignes.filter(l => !l.isOptional).reduce((sum, l) => sum + (l.totalLigne * (1 + parseFloat(l.tva || tva) / 100)), 0) * (1 - (parseFloat(remise) || 0) / 100);

  const margeEstimee = lignes.filter(l => !l.isOptional).reduce((sum, l) => {
    const p = prestations.find(prest => prest.nom === l.nomPrestation);
    const coutUnitaire = p ? (p.cout || 0) : 0;
    return sum + ((l.prixUnitaire - coutUnitaire) * l.quantite);
  }, 0) - montantRemise;

  const addLigne = (p: Prestation) => {
    setLignes([...lignes, { nomPrestation: p.nom, quantite: 1, unite: p.unite, prixUnitaire: p.prix, totalLigne: p.prix, tva, isOptional: false }]);
    setSearchPrestation("");
  };

  const updateTva = (idx: number, newTva: string) => {
    const updated = [...lignes];
    updated[idx].tva = newTva;
    setLignes(updated);
  };

  const updateQty = (idx: number, qty: number) => {
    const updated = [...lignes];
    updated[idx].quantite = qty;
    updated[idx].totalLigne = qty * updated[idx].prixUnitaire;
    setLignes(updated);
  };

  const updateNom = (idx: number, nom: string) => {
    const updated = [...lignes];
    updated[idx].nomPrestation = nom;
    // Auto-complétion du prix si trouvé dans le catalogue
    const found = prestations.find(p => p.nom === nom);
    if (found) {
      updated[idx].prixUnitaire = found.prix;
      updated[idx].unite = found.unite;
      updated[idx].totalLigne = updated[idx].quantite * found.prix;
    }
    setLignes(updated);
  };

  const updatePrix = (idx: number, prix: number) => {
    const updated = [...lignes];
    updated[idx].prixUnitaire = prix;
    updated[idx].totalLigne = updated[idx].quantite * prix;
    setLignes(updated);
  };

  const addLigneLibre = () => {
    setLignes([...lignes, { nomPrestation: "", quantite: 1, unite: "U", prixUnitaire: 0, totalLigne: 0, tva, isOptional: false }]);
  };

  
  const applyForfait = (forfait: any) => {
    const newLignes = forfait.lignes.map((l: any) => ({ ...l, tva }));
    setLignes([...lignes, ...newLignes]);
    setShowForfaits(false);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/generate-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt })
      });
      const data = await res.json();
      if (data.lignes && Array.isArray(data.lignes)) {
        const newLignes = data.lignes.map((l: any) => ({
          nomPrestation: l.designation,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          totalLigne: l.quantite * l.prixUnitaire,
          tva: tva,
          isOptional: false
        }));
        setLignes([...lignes, ...newLignes]);
        setShowAIModal(false);
        setAiPrompt("");
      }
    } catch (error) {
      console.error("Erreur IA", error);
      alert("Erreur lors de la génération avec l'IA");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const toggleOptional = (idx: number) => {
    const newLignes = [...lignes];
    newLignes[idx].isOptional = !newLignes[idx].isOptional;
    setLignes(newLignes);
  };

  const removeLigne = (idx: number) => {
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const handleNewClient = async () => {
    setIsAddingClient(true);
    try {
      const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur serveur");
      }
      const c = await res.json();
      setClients([...clients, c]);
      setSelectedClient(c);
      setShowNewClient(false);
      setNewClient({ nom: "", email: "", telephone: "", adresse: "" });
    } catch (error: any) {
      alert(error.message || "Erreur lors de la création du client");
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleSend = async () => {
    if (!selectedClient || lignes.length === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient.id, client: selectedClient.nom, lignes, tva, acompte, remise, photos }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur serveur");
      setDevisResult(result);
      setSuccess(true);
    } catch (error: any) {
      alert("Erreur lors de la création du devis: " + (error?.message || ""));
    }
    setSending(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.4); // forte compression
          setPhotos(prev => [...prev, base64]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const filteredClients = clients.filter((c) => (c.nom || '').toLowerCase().includes((searchClient || '').toLowerCase()));
  const filteredPrestations = prestations.filter((p) => (p.nom || '').toLowerCase().includes((searchPrestation || '').toLowerCase()) || (p.categorie || '').toLowerCase().includes((searchPrestation || '').toLowerCase()));

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden items-center justify-center p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-emerald-600" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Devis créé ! 🎉</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
          {devisResult?.numero} — {devisResult?.totalTTC}€ TTC
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-slate-400 text-center text-xs mb-8">
          Enregistré avec succès
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
  if (!checkingPro && !isPro && devisCount !== null && devisCount >= 3) {
    return (
      <div className="flex flex-col min-h-screen font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative selection:bg-fuchsia-200">
        <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
          <Link href="/">
            <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
              <ArrowLeft size={20} />
            </motion.div>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nouveau Devis</h1>
        </header>
        
        <main className="flex-1 px-6 flex flex-col items-center justify-center text-center -mt-10">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 relative">
            <Lock size={32} className="text-slate-400" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-violet-100 rounded-full border-4 border-white flex items-center justify-center">
              <Zap size={16} className="text-fuchsia-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Fonctionnalité Premium</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-4 leading-relaxed">
            Vous avez atteint la limite de 3 devis gratuits. Passez à la version Zolio Pro pour créer des devis illimités.
          </p>

          <Link href="/abonnement" className="w-full">
            <motion.button whileTap={{ scale: 0.96 }} className="w-full py-4 bg-gradient-zolio text-white font-bold rounded-xl shadow-xl shadow-fuchsia-500/20">
              Découvrir Zolio Pro
            </motion.button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nouveau Devis</h1>
      </header>

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                ${step >= s ? "bg-gradient-zolio text-white shadow-md shadow-fuchsia-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? "bg-gradient-zolio" : "bg-slate-100 dark:bg-slate-800"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                <div className="bg-fuchsia-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">{(selectedClient.nom || '').charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{selectedClient.nom}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedClient.email}</p>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="text-slate-400"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher un client..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
                  </div>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowNewClient(true)}
                    className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 text-slate-500 dark:text-slate-400 text-sm">
                    <Plus size={18} /> Créer un nouveau client
                  </motion.button>

                  {showNewClient && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-700">
                      <input required placeholder="Nom" value={newClient.nom} onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
                      <input required type="email" placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
                      <input placeholder="Téléphone" value={newClient.telephone} onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
                      <input placeholder="Adresse" value={newClient.adresse} onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setShowNewClient(false)} className="flex-1 py-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">Annuler</button>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={handleNewClient} disabled={isAddingClient}
                          className="flex-1 py-2 text-sm text-white bg-gradient-zolio rounded-xl font-semibold disabled:opacity-70 flex justify-center items-center">
                          {isAddingClient ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Ajout...
                            </span>
                          ) : "Ajouter"}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {isLoadingClients ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-fuchsia-200 border-t-fuchsia-500 rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Chargement de vos clients...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredClients.length === 0 && searchClient === "" && !showNewClient && (
                        <p className="text-center text-sm text-slate-400 py-4">Aucun client. Commencez par en créer un !</p>
                      )}
                      {filteredClients.length === 0 && searchClient !== "" && (
                        <p className="text-center text-sm text-slate-400 py-4">Aucun client trouvé pour "{searchClient}".</p>
                      )}
                      {filteredClients.map((c) => (
                        <motion.button key={c.id} whileTap={{ scale: 0.97 }} onClick={() => setSelectedClient(c)}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-left hover:bg-slate-50 dark:bg-slate-800 transition">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs">{(c.nom || '').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{c.nom}</p>
                            <p className="text-xs text-slate-400 truncate">{c.email}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30" />
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => setShowForfaits(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border border-violet-200 text-violet-700 font-semibold rounded-xl hover:bg-violet-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <Package size={18} /> Forfait rapide
                </button>
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700 font-semibold rounded-xl hover:bg-fuchsia-100 transition dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-300"
                >
                  <Sparkles size={18} /> Rédiger avec l'IA
                </button>
              </div>


              {/* Liste des prestations disponibles */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {filteredPrestations.map((p) => (
                  <motion.button key={p.id} whileTap={{ scale: 0.97 }} onClick={() => addLigne(p)}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-left hover:bg-fuchsia-50 hover:border-violet-200 transition">
                    <Plus size={16} className="text-fuchsia-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.nom}</p>
                      <p className="text-[10px] text-slate-400">{p.categorie}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.prix}€/{p.unite}</span>
                  </motion.button>
                ))}
              </div>

              {/* Lignes ajoutées */}
              {lignes.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Lignes du devis ({lignes.length})</p>
                  
                  <datalist id="prestations-list">
                    {prestations.map(p => <option key={p.id} value={p.nom} />)}
                  </datalist>

                  <div className="flex flex-col gap-2">
                    {lignes.map((l, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px] flex flex-col">
                          <input 
                            type="text" 
                            list="prestations-list"
                            value={l.nomPrestation}
                            onChange={(e) => updateNom(i, e.target.value)}
                            placeholder="Nom de la prestation..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="number" 
                              value={l.prixUnitaire} 
                              onChange={(e) => updatePrix(i, parseFloat(e.target.value) || 0)}
                              className="w-20 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-slate-600 dark:text-slate-400"
                            />
                            <span className="text-[10px] text-slate-400">€ / {l.unite}</span>
                          </div>
                        </div>
                        <input type="number" min="1" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                          className="w-16 text-center py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                        <select value={l.tva || tva} onChange={(e) => updateTva(i, e.target.value)} className="w-16 text-center py-1 px-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-fuchsia-500">
                            <option value="0">0%</option>
                            <option value="5.5">5.5%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                          </select>
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                            <input type="checkbox" checked={!!l.isOptional} onChange={() => toggleOptional(i)} className="rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                            Option
                          </label>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-16 text-right">{(l.totalLigne || 0).toFixed(0)}€</span>
                        <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={addLigneLibre}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Plus size={18} /> Ajouter une ligne libre
              </button>
            </motion.div>
          )}

          {/* STEP 3: Récapitulatif */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col gap-5">
              {/* Client */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Client</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">{(selectedClient?.nom || '').charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{selectedClient?.nom}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedClient?.email}</p>
                  </div>
                </div>
              </div>

              {/* Lignes */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">Prestations</p>
                {lignes.map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {l.nomPrestation} {l.isOptional && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">Optionnel</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">{l.quantite} {l.unite} × {l.prixUnitaire}€</p>
                    </div>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{(l.totalLigne || 0).toFixed(2)}€</p>
                  </div>
                ))}
              </div>

              
              {/* TVA */}
              <div className="flex items-center gap-3 mt-4">
                <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Taux TVA :</label>
                <select value={tva} onChange={(e) => setTva(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                  <option value="0">0% (Auto-entrepreneur)</option>
                  <option value="5.5">5.5% (Rénovation)</option>
                  <option value="10">10% (Intermédiaire)</option>
                  <option value="20">20% (Standard)</option>
                </select>
              </div>

              {/* Remise */}
              <div className="flex items-center gap-3 mt-4">
                <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Remise globale (%) :</label>
                <input type="number" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
              </div>

              {/* Acompte */}
              <div className="flex items-center gap-3 mt-4 mb-4">
                <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Acompte à la signature (%) :</label>
                <input type="number" placeholder="0" value={acompte} onChange={(e) => setAcompte(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
              </div>


              {/* Photos */}
              <div className="mt-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
                    <Camera size={16} /> Photos du chantier (Annexe)
                  </label>
                  <label className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 px-3 py-1.5 rounded-lg cursor-pointer font-medium hover:bg-violet-200 transition-colors">
                    + Ajouter
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={p} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total TTC</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-md" title="Estimation de votre marge nette">
                      Marge est. : {margeEstimee.toFixed(2)}€
                    </span>
                    <span className="font-bold text-lg">{totalTTC.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex gap-3 sm:rounded-b-[3rem]">
        {step > 1 && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(step - 1)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold rounded-xl flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Retour
          </motion.button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedClient) || (step === 2 && lignes.length === 0)}
            className="px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-fuchsia-500/20 flex items-center gap-2 text-sm disabled:opacity-40">
            Suivant <ArrowRight size={16} />
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSend} disabled={sending}
            className="px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-fuchsia-500/20 flex items-center gap-2 text-sm disabled:opacity-40">
            {sending ? "Envoi..." : <>Créer le devis <Send size={16} /></>}
          </motion.button>
        )}
      </div>
      {/* Modale IA */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="text-fuchsia-500" size={20} /> Rédiger avec l'IA</h3>
                <button onClick={() => setShowAIModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Décrivez les travaux à réaliser (ex: "Refaire une salle de bain de 10m2 avec douche italienne et peinture") et l'IA générera les lignes de devis pour vous.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Décrivez votre chantier..."
                className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 mb-4 resize-none"
              />
              <button
                onClick={generateWithAI}
                disabled={isGeneratingAI || !aiPrompt.trim()}
                className="w-full py-3 bg-gradient-zolio text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {isGeneratingAI ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
                {isGeneratingAI ? "Génération..." : "Générer les lignes"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
