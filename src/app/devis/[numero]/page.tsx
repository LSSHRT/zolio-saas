"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import NextImage from "next/image";
import { ArrowLeft, Trash2, Plus, Send, Check, Search, Save, PenTool, X, Loader2, Camera, Sparkles } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ClientMobileActionsMenu,
  type ClientMobileAction,
} from "@/components/client-shell";
import {
  DEFAULT_TRADE,
  TRADE_OPTIONS,
  getStarterCatalogForTrade,
  getTradeBundlesForTrade,
  getTradeDefinition,
  type TradeBundle,
  type TradeKey,
} from "@/lib/trades";

interface LigneDevis { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number; tva?: string; isOptional?: boolean; }

interface Prestation { id: string; categorie: string; nom: string; unite: string; prix: number; cout: number; }
interface GeneratedAILine { designation: string; quantite: number; unite: string; prixUnitaire: number; }
interface GenerateDevisResponse { lignes?: GeneratedAILine[]; }
interface DevisResult { totalTTC?: string | number; emailSent?: boolean; }
interface DevisInfo {
  numero?: string;
  nomClient?: string;
  emailClient?: string;
  statut?: string;
  tva?: string;
  acompte?: string;
  remise?: string;
  photos?: string[];
  lignes?: LigneDevis[];
  signingToken?: string;
}

export default function EditDevisPage({ params }: { params: Promise<{ numero: string }> }) {
  const { user } = useUser();
  const { numero } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [devisInfo, setDevisInfo] = useState<DevisInfo | null>(null);
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
  const [result, setResult] = useState<DevisResult | null>(null);
  const [showAddPrestation, setShowAddPrestation] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isImportingStarter, setIsImportingStarter] = useState(false);
  const sigCanvas = useRef<{ clear: () => void; isEmpty: () => boolean; getTrimmedCanvas: () => HTMLCanvasElement } | null>(null);
  const creationToastHandled = useRef(false);

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const activeTrade = companyTrade?.key ?? selectedTrade;
  const activeTradeDefinition = getTradeDefinition(activeTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const activeTradeMeta = activeTradeDefinition ?? getTradeDefinition(DEFAULT_TRADE)!;
  const forfaits = useMemo(() => getTradeBundlesForTrade(activeTrade), [activeTrade]);
  const starterCount = getStarterCatalogForTrade(activeTrade).length;

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

  useEffect(() => {
    if (companyTrade) {
      setSelectedTrade(companyTrade.key);
    }
  }, [companyTrade]);

  useEffect(() => {
    const created = searchParams.get("created");
    if (!created || creationToastHandled.current) {
      return;
    }

    creationToastHandled.current = true;
    const reason = searchParams.get("reason");

    if (created === "saved") {
      toast.success("Devis créé. Aucun email n’a été envoyé.");
    } else if (created === "sent") {
      toast.success("Devis créé et email envoyé au client.");
    } else if (created === "send_skipped") {
      if (reason === "missing_client_email") {
        toast.success("Devis créé, mais aucun email client n’est renseigné.");
      } else if (reason === "smtp_not_configured") {
        toast.success("Devis créé, mais l’envoi email n’est pas configuré.");
      } else if (reason === "send_failed") {
        toast.success("Devis créé, mais l’email n’a pas pu être envoyé.");
      } else {
        toast.success("Devis créé, mais l’email a été ignoré.");
      }
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

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

  const applyForfait = (forfait: TradeBundle) => {
    const nextLignes = forfait.lignes.map((line) => ({ ...line, tva }));
    setLignes([...lignes, ...nextLignes]);
    setShowForfaits(false);
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
      const data = (await res.json()) as GenerateDevisResponse;
      if (data.lignes && Array.isArray(data.lignes)) {
        const newLignes = data.lignes.map((line) => ({
          nomPrestation: line.designation,
          quantite: line.quantite,
          unite: line.unite,
          prixUnitaire: line.prixUnitaire,
          totalLigne: line.quantite * line.prixUnitaire,
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

  const handleImportStarterCatalog = async () => {
    if (!user || !activeTradeDefinition) return;

    setIsImportingStarter(true);
    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: activeTradeDefinition.key }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'importer le starter métier");
      }

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: activeTradeDefinition.key,
          onboardingCompleted: true,
          starterCatalogImported: true,
        },
      });

      const prestationsResponse = await fetch("/api/prestations");
      const nextPrestations = await prestationsResponse.json();
      setPrestations(Array.isArray(nextPrestations) ? nextPrestations : []);
      toast.success(
        payload.imported > 0
          ? `${payload.imported} prestation(s) importée(s) pour ${activeTradeDefinition.label.toLowerCase()}`
          : `Starter ${activeTradeDefinition.label.toLowerCase()} déjà présent`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'importer le starter métier";
      toast.error(message);
    } finally {
      setIsImportingStarter(false);
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
        const img = new window.Image();
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
    if (!devisInfo?.signingToken) {
      alert("Impossible de générer le lien de signature.");
      return;
    }
    const link = `${window.location.origin}/signer/${numero}?token=${encodeURIComponent(devisInfo.signingToken)}`;
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
      if (!devisInfo?.signingToken) {
        alert("Lien de signature indisponible.");
        return;
      }
      const signatureBase64 = sigCanvas.current!.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(devisInfo.signingToken)}`, {
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
    } catch {
      alert("Erreur réseau");
    } finally {
      setSignLoading(false);
    }
  };

  const filteredPrestations = prestations.filter((p) =>
    (p.nom || '').toLowerCase().includes((searchPrestation || '').toLowerCase()) || (p.categorie || '').toLowerCase().includes((searchPrestation || '').toLowerCase())
  );
  const mobileHeaderActions: ClientMobileAction[] =
    devisInfo?.statut === "En attente"
      ? [
          {
            icon: PenTool,
            label: "Signer sur place",
            onClick: () => setShowSignModal(true),
            tone: "accent",
          },
          {
            icon: PenTool,
            label: "Copier le lien de signature",
            onClick: handleCopySignLink,
          },
        ]
      : [];

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
        {devisInfo?.statut === "En attente" ? (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSignModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition shrink-0"
              >
                <PenTool size={14} />
                <span>Signer sur place</span>
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleCopySignLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-100 text-violet-700 rounded-xl text-xs font-bold border border-violet-200 dark:bg-violet-900/50 dark:border-violet-700 dark:text-violet-300 hover:bg-violet-200 transition shrink-0"
              >
                <PenTool size={14} />
                <span>Lien signature</span>
              </motion.button>
            </div>
            <ClientMobileActionsMenu items={mobileHeaderActions} panelAlign="left" />
          </>
        ) : null}
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

        <details className="rounded-3xl border border-violet-200/70 bg-violet-50/80 p-4 dark:border-violet-500/20 dark:bg-violet-500/10 md:hidden">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                  Packs métier
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {activeTradeMeta.label} prêt à ajuster
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Packs, starter et catalogue restent repliés pour garder l’édition compacte.
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                {starterCount} starter
              </span>
            </div>
          </summary>

          <div className="mt-4 space-y-4 border-t border-violet-200/70 pt-4 dark:border-violet-400/20">
            <div className="flex flex-wrap gap-2">
              {TRADE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedTrade(option.key)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    activeTrade === option.key
                      ? "bg-violet-600 text-white shadow-brand"
                      : "bg-white/80 text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setShowForfaits(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/20 dark:bg-white/8 dark:text-violet-200"
              >
                <Plus size={16} />
                Ouvrir les packs
              </button>
              <button
                type="button"
                onClick={handleImportStarterCatalog}
                disabled={isImportingStarter}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
              >
                {isImportingStarter ? "Import..." : `Importer ${starterCount} lignes starter`}
              </button>
            </div>
          </div>
        </details>

        <div className="hidden rounded-3xl border border-violet-200/70 bg-violet-50/80 p-4 dark:border-violet-500/20 dark:bg-violet-500/10 md:block">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                Packs métier
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {activeTradeMeta.label} prêt à ajuster
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Réinjectez vos packs rapides métier ou importez votre starter catalogue si vous repartez d&apos;une base vide.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TRADE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedTrade(option.key)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      activeTrade === option.key
                        ? "bg-violet-600 text-white shadow-brand"
                        : "bg-white/80 text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowForfaits(true)}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/20 dark:bg-white/8 dark:text-violet-200"
              >
                <Plus size={16} />
                Ouvrir les packs {activeTradeMeta.shortLabel.toLowerCase()}
              </button>
              <button
                type="button"
                onClick={handleImportStarterCatalog}
                disabled={isImportingStarter}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60"
              >
                {isImportingStarter ? "Import..." : `Importer ${starterCount} lignes starter`}
              </button>
            </div>
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
                {filteredPrestations.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/80 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {prestations.length === 0 ? "Aucune prestation dans votre catalogue" : "Aucune prestation trouvée"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {prestations.length === 0
                        ? "Importez le starter métier ou ajoutez une ligne libre pour continuer."
                        : "Essayez un autre mot-clé ou utilisez une ligne libre."}
                    </p>
                  </div>
                )}
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
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400">Quantité</label>
                    <input type="number" min="0.1" step="0.1" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Prix/{l.unite}</label>
                    <input type="number" min="0" step="0.01" value={l.prixUnitaire} onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                      className="w-full py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mt-0.5" />
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <label className="text-[10px] text-slate-400">Total</label>
                    <p className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-sm">{(l.totalLigne || 0).toFixed(2)}€</p>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={!!l.isOptional} onChange={() => toggleOptional(i)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                      Option
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button
                onClick={addLigneLibre}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Plus size={16} /> Ligne libre
              </button>
              <button
                onClick={() => setShowForfaits(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border border-violet-200 text-violet-700 font-semibold rounded-xl hover:bg-violet-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <Plus size={16} /> Packs
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-50 border border-violet-200 text-violet-700 font-semibold rounded-xl hover:bg-violet-100 transition dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300"
              >
                <Sparkles size={16} /> Avec l&apos;IA
              </button>
            </div>
          </div>
        </div>

        
        <div className="mt-4 mb-4 grid gap-3 md:grid-cols-3">
          <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            Taux TVA
            <select value={tva} onChange={(e) => setTva(e.target.value)}
              className="mt-3 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="0">0%</option>
              <option value="5.5">5.5%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </label>
          <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            Remise globale (%)
            <input type="number" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)}
              className="mt-3 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </label>
          <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            Acompte à la signature (%)
            <input type="number" placeholder="0" value={acompte} onChange={(e) => setAcompte(e.target.value)}
              className="mt-3 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </label>
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
                  <NextImage src={p} alt={`Photo ${i}`} fill unoptimized className="object-cover" />
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/70 text-sm">Total TTC</p>
              <p className="mt-2 text-3xl font-bold">{totalTTC.toFixed(2)}€</p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-100 px-2 py-1 rounded-md" title="Estimation de votre marge nette">
              {photos.length} photo{photos.length > 1 ? "s" : ""}
            </span>
          </div>

          <details className="mt-4 rounded-xl border border-white/12 bg-white/6 px-4 py-3 md:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
              Voir le détail du total
            </summary>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Total HT</span>
                <span className="font-semibold">{totalHT.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">TVA ({tva}%)</span>
                <span className="font-semibold">{(totalTTC - totalHT).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Marge estimée</span>
                <span className="font-semibold">{margeEstimee.toFixed(2)}€</span>
              </div>
            </div>
          </details>

          <div className="mt-4 hidden space-y-2 md:block">
            <div className="flex justify-between">
              <span className="text-white/70 text-sm">Total HT</span>
              <span className="font-semibold">{totalHT.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70 text-sm">TVA ({tva}%)</span>
              <span className="font-semibold">{(totalTTC - totalHT).toFixed(2)}€</span>
            </div>
            <div className="h-px bg-white/20 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Marge estimée</span>
              <span className="font-semibold">{margeEstimee.toFixed(2)}€</span>
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
    } catch {
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
          className="min-w-0 flex-[1.35] py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg shadow-brand flex items-center justify-center gap-2 text-sm disabled:opacity-40">
          {saving ? "Envoi..." : <><Save size={16} /> <span className="sm:hidden">Sauvegarder</span><span className="hidden sm:inline">Sauvegarder & Renvoyer</span> <Send size={14} className="hidden sm:block" /></>}
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
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="text-brand-fuchsia" size={20} /> Rédiger avec l&apos;IA</h3>
              <button onClick={() => setShowAIModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Décrivez les travaux à réaliser (ex: &quot;Refaire une salle de bain de 10m2 avec douche italienne et peinture&quot;) et l&apos;IA générera les lignes de devis pour vous.
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

      {showForfaits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Packs rapides
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {activeTradeMeta.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Ajoutez un pack métier complet, puis ajustez les quantités et options directement dans le devis.
                </p>
              </div>
              <button onClick={() => setShowForfaits(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {forfaits.map((forfait) => (
                <button
                  key={forfait.nom}
                  type="button"
                  onClick={() => applyForfait(forfait)}
                  className="w-full rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-left transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{forfait.nom}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {forfait.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200">
                      {forfait.lignes.length} lignes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
