"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import type ReactSignatureCanvas from "react-signature-canvas";
import dynamic from "next/dynamic";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import NextImage from "next/image";
import { ArrowLeft, Trash2, Plus, Send, Check, Search, Save, PenTool, X, Loader2, Camera, Sparkles, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ClientMobileActionsMenu,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import AcompteModal from "@/components/acompte-modal";
import { Banknote } from "lucide-react";
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
interface GenerateDevisResponse { error?: string; lignes?: GeneratedAILine[]; }
interface DevisResult { totalTTC?: string | number; emailSent?: boolean; emailSkippedReason?: string; error?: string; }
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
  factures?: Array<{ id: string; numero: string; totalTTC: number; statut: string; date: string }>;
  notes?: string;
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
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [showAcompteModal, setShowAcompteModal] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const sigCanvas = useRef<ReactSignatureCanvas | null>(null);
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
      setNotesDraft(devisData.notes || "");
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
      if (!res.ok) {
        throw new Error(data.error || "Impossible de générer les lignes IA");
      }
      if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
        throw new Error(data.error || "Aucune ligne exploitable n’a été générée");
      }
      const generatedLines = data.lignes;
      const newLignes = generatedLines.map((line) => ({
        nomPrestation: line.designation,
        quantite: line.quantite,
        unite: line.unite,
        prixUnitaire: line.prixUnitaire,
        totalLigne: line.quantite * line.prixUnitaire,
        tva: tva,
        isOptional: false
      }));
      setLignes((current) => [...current, ...newLignes]);
      setShowAIModal(false);
      setAiPrompt("");
      toast.success(`${newLignes.length} ligne(s) ajoutée(s) avec l’IA.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la génération avec l’IA.";
      toast.error(message);
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
        body: JSON.stringify({ lignes, tva, acompte, remise, photos, resendEmail: true }),
      });
      const data = (await res.json()) as DevisResult;
      if (!res.ok) {
        throw new Error(data.error || "Impossible d’enregistrer les modifications");
      }
      setResult(data);
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la modification du devis.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
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

  const handleCopySignLink = async () => {
    if (!devisInfo?.signingToken) {
      toast.error("Impossible de générer le lien de signature.");
      return;
    }
    const link = `${window.location.origin}/signer/${numero}?token=${encodeURIComponent(devisInfo.signingToken)}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien de signature copié. Vous pouvez l’envoyer au client.");
    } catch {
      toast.error("Impossible de copier le lien de signature.");
    }
  };

  const handleSignSurPlace = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Veuillez demander au client de dessiner sa signature.");
      return;
    }
    setSignLoading(true);
    try {
      if (!devisInfo?.signingToken) {
        toast.error("Lien de signature indisponible.");
        return;
      }
      const signatureCanvas = sigCanvas.current;
      if (!signatureCanvas) {
        toast.error("Le module de signature n’est pas prêt. Réessayez dans un instant.");
        return;
      }
      const signatureBase64 = signatureCanvas.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(devisInfo.signingToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de l'enregistrement de la signature");
      }
      setShowSignModal(false);
      toast.success("Devis signé avec succès.");
      router.push("/devis");
    } catch {
      toast.error("Erreur lors de l’enregistrement de la signature.");
    } finally {
      setSignLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (savingNotes || !devisInfo?.numero) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/devis/${devisInfo.numero}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setDevisInfo((prev) => (prev ? { ...prev, notes: notesDraft } : null));
      setEditNotes(false);
      toast.success("Notes enregistrées");
    } catch {
      toast.error("Impossible de sauvegarder les notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (isCreatingInvoice || saving) {
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devisNumero: devisInfo?.numero,
          client: { nom: devisInfo?.nomClient, email: devisInfo?.emailClient },
          lignes,
          tva,
          totalHT: totalHT.toFixed(2),
          totalTTC: totalTTC.toFixed(2),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création de la facture");
      }

      const confetti = await import("canvas-confetti");
      confetti.default({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      toast.success("Facture créée avec succès.");
      setTimeout(() => {
        router.push("/factures");
      }, 900);
    } catch {
      toast.error("Erreur lors de la création de la facture.");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const filteredPrestations = prestations.filter((p) =>
    (p.nom || "").toLowerCase().includes((searchPrestation || "").toLowerCase()) ||
    (p.categorie || "").toLowerCase().includes((searchPrestation || "").toLowerCase())
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
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center overflow-hidden bg-white/80 px-6 pb-24 font-sans backdrop-blur-sm dark:bg-[#0c0a1d]/95 md:max-w-3xl lg:max-w-5xl sm:my-4 sm:min-h-[850px] sm:rounded-[3rem] sm:shadow-brand-lg">
        <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-full bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 blur-3xl dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center bg-white/80 px-6 pb-24 font-sans backdrop-blur-sm dark:bg-[#0c0a1d]/95 md:max-w-3xl lg:max-w-5xl sm:my-4 sm:min-h-[850px] sm:rounded-[3rem] sm:shadow-brand-lg">
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
          {result?.emailSent
            ? "Email renvoyé au client avec le nouveau PDF."
            : result?.emailSkippedReason === "missing_client_email"
              ? "Devis enregistré, mais aucun email client n’est renseigné."
              : result?.emailSkippedReason === "smtp_not_configured"
                ? "Devis enregistré, mais l’envoi email n’est pas configuré."
                : result?.emailSkippedReason === "send_failed"
                  ? "Devis enregistré, mais l’email n’a pas pu être envoyé."
                  : result?.emailSkippedReason === "user_unavailable"
                    ? "Devis enregistré, mais le compte utilisateur est indisponible pour l’envoi."
                    : "Devis enregistré sans renvoi email."}
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
      <header className="flex items-center gap-2 p-4 pt-8 sm:gap-4 sm:p-6 sm:pt-10">
        <Link href="/devis">
          <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </motion.div>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate sm:text-xl">Modifier le devis</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate sm:text-xs">{numero} · {devisInfo?.nomClient}</p>
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

      <main className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto sm:px-6 sm:gap-5">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-base font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {l.isOptional && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2 shrink-0">Optionnel</span>}
                  </div>
                  <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400">Quantité</label>
                    <input type="number" min="0.1" step="any" inputMode="decimal" value={l.quantite} onChange={(e) => updateQty(i, parseFloat(e.target.value) || 1)}
                      className="w-full py-2 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base mt-0.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Prix/{l.unite}</label>
                    <input type="number" min="0" step="any" inputMode="decimal" value={l.prixUnitaire} onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                      className="w-full py-2 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base mt-0.5" />
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
              className="mt-3 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="0">0%</option>
              <option value="5.5">5.5%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </label>
          <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-base font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            Remise globale (%)
            <input type="number" placeholder="0" step="any" inputMode="decimal" value={remise} onChange={(e) => setRemise(e.target.value)}
              className="mt-3 w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </label>
          <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            Acompte à la signature (%)
            <input type="number" placeholder="0" step="any" inputMode="decimal" value={acompte} onChange={(e) => setAcompte(e.target.value)}
              className="mt-3 w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500" />
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

        {/* Factures liées */}
        {devisInfo?.factures && devisInfo.factures.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Factures liées</p>
            {devisInfo.factures.map((f: any) => (
              <Link
                key={f.numero}
                href={`/factures/${f.numero}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-violet-500/30"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-violet-500" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{f.numero}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    f.statut === "Payée" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : f.statut === "En retard" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                  }`}>{f.statut}</span>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{Number(f.totalTTC).toFixed(2)}€</span>
              </Link>
            ))}
          </div>
        )}

        {/* Notes internes */}
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Notes internes</p>
            <button onClick={() => setEditNotes(!editNotes)} className="text-xs text-violet-500 hover:text-violet-600">
              {editNotes ? "Annuler" : "Modifier"}
            </button>
          </div>
          {editNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Ajouter une note interne..."
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex-1 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {savingNotes ? "..." : "Enregistrer"}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              {devisInfo?.notes ? (
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{devisInfo.notes}</p>
              ) : (
                <p className="text-sm italic text-slate-400">Aucune note pour ce devis.</p>
              )}
            </div>
          )}
        </div>

        {/* Facture d'acompte (si accepté/signé) */}
        {(devisInfo?.statut === "Accepté" || devisInfo?.statut === "Signé") && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAcompteModal(true)}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-bold text-violet-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <Banknote size={16} />
            Créer facture d'acompte
          </motion.button>
        )}

        {/* Transformer en facture (si accepté) */}
        {devisInfo?.statut === "Accepté" && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCreateInvoice}
            disabled={isCreatingInvoice || saving}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 shadow-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {isCreatingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isCreatingInvoice ? "Création..." : "Transformer en Facture"}
          </motion.button>
        )}
      </main>

      {/* Bottom action */}
      <div className="sticky bottom-0 left-0 right-0 mt-auto border-t border-slate-100 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:rounded-b-[3rem]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/devis" className="flex-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft size={16} /> Annuler
            </motion.button>
          </Link>
          <a
            href={`/api/devis/${numero}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-900/40"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Aperçu PDF</span>
          </a>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSaveAndResend}
            disabled={saving || lignes.length === 0}
            className="min-w-0 flex-[1.35] rounded-xl bg-gradient-zolio py-3 text-sm font-semibold text-white shadow-lg shadow-brand flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              "Envoi..."
            ) : (
              <>
                <Save size={16} />
                <span className="sm:hidden">Sauvegarder</span>
                <span className="hidden sm:inline">Sauvegarder et renvoyer</span>
                <Send size={14} className="hidden sm:block" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      <MobileDialog
        open={showSignModal}
        onClose={() => !signLoading && setShowSignModal(false)}
        title="Faire signer le client"
        description={`Demandez à ${devisInfo?.nomClient ?? "votre client"} de signer pour valider le devis de ${totalTTC.toFixed(2)}€ TTC.`}
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowSignModal(false)}
              disabled={signLoading}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50 sm:w-auto dark:border-white/10 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSignSurPlace}
              disabled={signLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
            >
              {signLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
              {signLoading ? "Enregistrement..." : "Valider la signature"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.4rem] border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60">
            <SignaturePad
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ className: "h-52 w-full cursor-crosshair" }}
            />
            <button
              type="button"
              onClick={() => sigCanvas.current?.clear()}
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-violet-50 dark:bg-slate-900/90 dark:text-violet-200 dark:ring-white/10"
            >
              Effacer
            </button>
          </div>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
            Faites signer en mode portrait puis validez pour enregistrer immédiatement la signature sur ce devis.
          </p>
        </div>
      </MobileDialog>

      <MobileDialog
        open={showAIModal}
        onClose={() => !isGeneratingAI && setShowAIModal(false)}
        title="Rédiger avec l’IA"
        description="Décrivez le chantier en quelques phrases. L’IA prépare les lignes de devis, prêtes à être ajustées ensuite."
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowAIModal(false)}
              disabled={isGeneratingAI}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50 sm:w-auto dark:border-white/10 dark:text-slate-200 dark:hover:border-violet-400/20 dark:hover:text-white"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={generateWithAI}
              disabled={isGeneratingAI || !aiPrompt.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50 sm:w-auto"
            >
              {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={16} />}
              {isGeneratingAI ? "Génération..." : "Générer les lignes"}
            </button>
          </>
        }
      >
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Exemple : rénovation complète d’une salle de bain de 10 m² avec dépose, plomberie, carrelage et peinture."
          className="h-40 w-full resize-none rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </MobileDialog>

      <MobileDialog
        open={showForfaits}
        onClose={() => setShowForfaits(false)}
        title={`Packs rapides ${activeTradeMeta.label}`}
        description="Ajoutez un pack métier complet, puis ajustez les quantités et options directement dans le devis."
      >
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
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
      </MobileDialog>

      <AcompteModal
        open={showAcompteModal}
        onClose={() => setShowAcompteModal(false)}
        devisNumero={numero}
        onSuccess={(facture) => {
          toast.success(`Facture d'acompte ${facture.numero} créée — ${facture.totalTTC.toFixed(2)}€ (${facture.tauxAcompte}%)`);
          // Recharger les infos du devis pour afficher le lien vers la facture
          fetch(`/api/devis/${numero}`)
            .then((r) => r.json())
            .then((data) => {
              setDevisInfo(data);
              setLignes(data.lignes || []);
              const tauxStr = (data.tva || "10%").replace("%", "");
              setTva(tauxStr);
              setAcompte(data.acompte || "");
              setRemise(data.remise || "");
              setPhotos(data.photos || []);
            });
        }}
      />
    </div>
  );
}
