"use client";

import { useState, useEffect, use, useRef } from "react";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Send, Check, Search, Save, PenTool, X, Loader2, Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

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

interface Prestation { id: string; categorie: string; nom: string; unite: string; prix: number; cout: number; }

export default function EditDevisPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [devisInfo, setDevisInfo] = useState<any>(null);
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [tva, setTva] = useState("10");
  const [acompte, setAcompte] = useState("");
  const [remise, setRemise] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [searchPrestation, setSearchPrestation] = useState("");
  const [showForfaits, setShowForfaits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAddPrestation, setShowAddPrestation] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/devis/${numero}`).then((r) => r.json()),
      fetch("/api/prestations").then((r) => r.json()),
    ]).then(([devisData, prestData]) => {
      setDevisInfo(devisData);
      setLignes(devisData.lignes || []);
      // Extraire le taux TVA du string "10%"
      const tauxStr = (devisData.tva || "10%").replace("%", "");
      setTva(tauxStr);
      setAcompte(devisData.acompte || "");
      setRemise(devisData.remise || "");
      setPhotos(devisData.photos || []);
      setPrestations(Array.isArray(prestData) ? prestData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [numero]);

  const totalHTBase = lignes.filter(l => !l.isOptional).reduce((s, l) => s + l.totalLigne, 0);
  const montantRemise = totalHTBase * (parseFloat(remise) || 0) / 100;
  const totalHT = totalHTBase - montantRemise;
  // TTC calculé avec TVA par ligne
  const totalTTC = lignes.filter(l => !l.isOptional).reduce((sum, l) => sum + (l.totalLigne * (1 + parseFloat(l.tva || tva) / 100)), 0) * (1 - (parseFloat(remise) || 0) / 100);

  const margeEstimee = lignes.filter(l => !l.isOptional).reduce((sum, l) => {
    const p = prestations.find(prest => prest.nom === l.nomPrestation);
    const coutUnitaire = p ? (p.cout || 0) : 0;
    return sum + ((l.prixUnitaire - coutUnitaire) * l.quantite);
  }, 0) - montantRemise;

  const addLigne = (p: Prestation) => {
    setLignes([...lignes, { nomPrestation: p.nom, quantite: 1, unite: p.unite, prixUnitaire: p.prix, totalLigne: p.prix, tva, isOptional: false }]);
    setShowAddPrestation(false);
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

  const updatePrice = (idx: number, price: number) => {
    const updated = [...lignes];
    updated[idx].prixUnitaire = price;
    updated[idx].totalLigne = updated[idx].quantite * price;
    setLignes(updated);
  };

  const updateNom = (idx: number, nom: string) => {
    const updated = [...lignes];
    updated[idx].nomPrestation = nom;
    const found = prestations.find(p => p.nom === nom);
    if (found) {
      updated[idx].prixUnitaire = found.prix;
      updated[idx].unite = found.unite;
      updated[idx].totalLigne = updated[idx].quantite * found.prix;
    }
    setLignes(updated);
  };

  const addLigneLibre = () => {
    setLignes([...lignes, { nomPrestation: "", quantite: 1, unite: "U", prixUnitaire: 0, totalLigne: 0, tva, isOptional: false }]);
  };

  const removeLigne = (idx: number) => setLignes(lignes.filter((_, i) => i !== idx));

  const toggleOptional = (idx: number) => {
    const newLignes = [...lignes];
    newLignes[idx].isOptional = !newLignes[idx].isOptional;
    setLignes(newLignes);
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

  const handleSaveAndResend = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/devis/${numero}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lignes, tva, acompte, remise, photos }),
      });
      const data = await res.json();
      setResult(data);
      setSuccess(true);
    } catch {
      alert("Erreur lors de la modification");
    }
    setSaving(false);
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

  const handleCopySignLink = () => {
    const link = `${window.location.origin}/signer/${numero}${userId ? `?u=${userId}` : ''}`;
    navigator.clipboard.writeText(link);
    alert("Lien de signature copié ! Envoyez-le à votre client.");
  };

  const handleSignSurPlace = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Veuillez demander au client de dessiner sa signature.");
      return;
    }
    setSignLoading(true);
    try {
      const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/devis/${numero}${userId ? `?u=${userId}` : ''}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });
      if (res.ok) {
        setShowSignModal(false);
        alert("Devis signé avec succès !");
        window.location.href = "/devis";
      } else {
        alert("Erreur lors de l'enregistrement de la signature");
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setSignLoading(false);
    }
  };

  const filteredPrestations = prestations.filter((p) =>
    (p.nom || '').toLowerCase().includes((searchPrestation || '').toLowerCase()) || (p.categorie || '').toLowerCase().includes((searchPrestation || '').toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-emerald-600" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Devis mis à jour ! 🎉</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
          {numero} — {result?.totalTTC}€ TTC
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-slate-400 text-center text-xs mb-8">
          {result?.emailSent ? "📧 Email renvoyé au client avec le nouveau PDF" : "Enregistré dans Google Sheets (email non configuré)"}
        </motion.p>
        <Link href="/devis">
          <motion.button whileTap={{ scale: 0.96 }} className="px-8 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg">
            Retour aux devis
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/devis">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">Modifier le devis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{numero} · {devisInfo?.nomClient}</p>
        </div>
        {devisInfo?.statut === "En attente" && (
          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSignModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition shrink-0"
            >
              <PenTool size={14} />
              <span className="hidden sm:inline">Signer sur place</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleCopySignLink}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-100 text-violet-700 rounded-xl text-xs font-bold border border-violet-200 dark:bg-violet-900/50 dark:border-violet-700 dark:text-violet-300 hover:bg-violet-200 transition shrink-0"
            >
              <PenTool size={14} />
              <span className="hidden sm:inline">Lien signature</span>
            </motion.button>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 flex flex-col gap-5 overflow-y-auto">
        {/* Client info */}
        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-200 flex items-center gap-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <div className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">
            {(devisInfo?.nomClient || '').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{devisInfo?.nomClient}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{devisInfo?.emailClient}</p>
          </div>
        </div>

        {/* Lignes du devis */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Prestations ({lignes.length})</p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddPrestation(!showAddPrestation)}
              className="text-xs text-violet-600 font-semibold flex items-center gap-1">
              <Plus size={14} /> Ajouter
            </motion.button>
          </div>

          {/* Ajouter prestation */}
          {showAddPrestation && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher..." value={searchPrestation} onChange={(e) => setSearchPrestation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                {filteredPrestations.map((p) => (
                  <button key={p.id} onClick={() => addLigne(p)}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-left hover:bg-violet-50 transition text-sm">
                    <Plus size={14} className="text-violet-500 shrink-0" />
                    <span className="flex-1 truncate">{p.nom}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{p.prix}€/{p.unite}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Liste lignes */}
          <div className="flex flex-col gap-2">
            <datalist id="prestations-list-edit">
              {prestations.map(p => <option key={p.id} value={p.nom} />)}
            </datalist>

            {lignes.map((l, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 flex items-center mr-2">
                    <input 
                      type="text" 
                      list="prestations-list-edit"
                      value={l.nomPrestation}
                      onChange={(e) => updateNom(i, e.target.value)}
                      placeholder="Nom de la prestation..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {l.isOptional && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2 shrink-0">Optionnel</span>}
                  </div>
                  <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Quantité</label>
                    <input type="number" min="0.1" step="0.1" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Prix/{l.unite}</label>
                    <input type="number" min="0" step="0.01" value={l.prixUnitaire} onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div className="flex-none flex items-end mb-1 px-1">
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={!!l.isOptional} onChange={() => toggleOptional(i)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                      Option
                    </label>
                  </div>
                  <div className="w-20 text-right">
                    <label className="text-[10px] text-slate-400">Total</label>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{(l.totalLigne || 0).toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={addLigneLibre}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Plus size={16} /> Ligne libre
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border border-violet-200 text-violet-700 font-semibold rounded-xl hover:bg-violet-100 transition dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300"
              >
                <Sparkles size={16} /> Avec l'IA
              </button>
            </div>
          </div>
        </div>

        
        {/* TVA */}
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Taux TVA :</label>
          <select value={tva} onChange={(e) => setTva(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="0">0%</option>
            <option value="5.5">5.5%</option>
            <option value="10">10%</option>
            <option value="20">20%</option>
          </select>
        </div>

        {/* Remise */}
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Remise globale (%) :</label>
          <input type="number" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)}
            className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>

        {/* Acompte */}
        <div className="flex items-center gap-3 mt-4 mb-4">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Acompte à la signature (%) :</label>
          <input type="number" placeholder="0" value={acompte} onChange={(e) => setAcompte(e.target.value)}
            className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>

        {/* Photos */}
        <div className="mt-2 mb-6">
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

        {/* Transformer en facture (si accepté) */}
        {devisInfo?.statut === "Accepté" && (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={async () => {
              if (saving) return;
              try {
                // On s'assure d'avoir les données
                const res = await fetch("/api/factures", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    devisNumero: devisInfo.numero,
                    client: { nom: devisInfo.nomClient, email: devisInfo.emailClient },
                    lignes,
                    tva,
                    totalHT: totalHT.toFixed(2),
                    totalTTC: totalTTC.toFixed(2)
                  }),
                });
                if (res.ok) {
                  import('canvas-confetti').then((confetti) => {
                    confetti.default({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
                    setTimeout(() => {
                      window.location.href = "/factures";
                    }, 1500);
                  });
                } else {
                  alert("Erreur lors de la création de la facture");
                }
              } catch (e) {
                alert("Erreur réseau");
              }
            }}
            className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <Check size={16} /> Transformer en Facture
          </motion.button>
        )}
      </main>

      {/* Bottom action */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 flex gap-3 sm:rounded-b-[3rem]">
        <Link href="/devis" className="flex-1">
          <motion.button whileTap={{ scale: 0.96 }}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm">
            <ArrowLeft size={16} /> Annuler
          </motion.button>
        </Link>
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveAndResend} disabled={saving || lignes.length === 0}
          className="flex-[2] py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-brand flex items-center justify-center gap-2 text-sm disabled:opacity-40">
          {saving ? "Envoi..." : <><Save size={16} /> Sauvegarder & Renvoyer <Send size={14} /></>}
        </motion.button>
      </div>

      {/* Modal Signature sur place */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Faire signer le client</h2>
                <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">Demandez à {devisInfo?.nomClient} de signer ci-dessous pour valider le devis de {totalTTC.toFixed(2)}€ TTC.</p>
              
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 mb-4 relative">
                <SignaturePad 
                  ref={sigCanvas} 
                  penColor="black"
                  canvasProps={{ className: "w-full h-48 cursor-crosshair" }} 
                />
                <button onClick={() => sigCanvas.current?.clear()} className="absolute top-2 right-2 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
                  Effacer
                </button>
              </div>

              <button 
                onClick={handleSignSurPlace} 
                disabled={signLoading}
                className="w-full flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {signLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
                {signLoading ? "Enregistrement..." : "Valider la signature"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modale IA */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="text-brand-fuchsia" size={20} /> Rédiger avec l'IA</h3>
              <button onClick={() => setShowAIModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Décrivez les travaux à réaliser (ex: "Refaire une salle de bain de 10m2 avec douche italienne et peinture") et l'IA générera les lignes de devis pour vous.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Décrivez votre chantier..."
              className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4 resize-none"
            />
            <button
              onClick={generateWithAI}
              disabled={isGeneratingAI || !aiPrompt.trim()}
              className="w-full py-3 bg-gradient-zolio text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              {isGeneratingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={18} />}
              {isGeneratingAI ? "Génération..." : "Générer les lignes"}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
