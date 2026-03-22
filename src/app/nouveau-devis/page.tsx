"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Rocket, Save, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  CreationWizardFooter,
  CreationWizardPanel,
  CreationWizardShell,
  type CreationWizardStep,
} from "@/components/client-creation-wizard";
import {
  DEFAULT_TRADE,
  getStarterCatalogForTrade,
  getTradeBundlesForTrade,
  getTradeDefinition,
  type TradeKey,
} from "@/lib/trades";
import { AIAssistant } from "./components/AIAssistant";
import { ClientSelector } from "./components/ClientSelector";
import { LineEditor } from "./components/LineEditor";
import { SummaryRail } from "./components/SummaryRail";
import type {
  Client,
  CreateDevisMode,
  DevisResult,
  GenerateDevisResponse,
  LigneDevis,
  Prestation,
  QuickClientForm,
} from "./types";

const TRIAL_QUOTE_LIMIT = 3;
const DRAFT_STORAGE_PREFIX = "zolio:nouveau-devis:draft:";

type CreateDevisDraft = {
  acompte: string;
  lignes: LigneDevis[];
  photos: string[];
  remise: string;
  savedAt: string;
  selectedClientId: string;
  selectedTrade: TradeKey;
  step: number;
  tva: string;
  version: 1;
};

function getDraftStorageKey(userId?: string | null) {
  return userId ? `${DRAFT_STORAGE_PREFIX}${userId}` : null;
}

function isDraftEmpty(draft: CreateDevisDraft) {
  return (
    draft.selectedClientId === "" &&
    draft.lignes.length === 0 &&
    draft.photos.length === 0 &&
    draft.acompte === "" &&
    draft.remise === "" &&
    draft.step === 0
  );
}

function parseDraft(value: string): CreateDevisDraft | null {
  try {
    const parsedDraft = JSON.parse(value) as Partial<CreateDevisDraft>;
    if (parsedDraft.version !== 1 || !Array.isArray(parsedDraft.lignes)) {
      return null;
    }

    const normalizedStep = typeof parsedDraft.step === "number" ? parsedDraft.step : 0;
    const normalizedTrade =
      typeof parsedDraft.selectedTrade === "string" && getTradeDefinition(parsedDraft.selectedTrade)
        ? (parsedDraft.selectedTrade as TradeKey)
        : DEFAULT_TRADE;

    return {
      acompte: typeof parsedDraft.acompte === "string" ? parsedDraft.acompte : "",
      lignes: parsedDraft.lignes,
      photos: Array.isArray(parsedDraft.photos) ? parsedDraft.photos.filter((photo): photo is string => typeof photo === "string") : [],
      remise: typeof parsedDraft.remise === "string" ? parsedDraft.remise : "",
      savedAt: typeof parsedDraft.savedAt === "string" ? parsedDraft.savedAt : new Date().toISOString(),
      selectedClientId: typeof parsedDraft.selectedClientId === "string" ? parsedDraft.selectedClientId : "",
      selectedTrade: normalizedTrade,
      step: normalizedStep,
      tva: typeof parsedDraft.tva === "string" ? parsedDraft.tva : "10",
      version: 1,
    };
  } catch {
    return null;
  }
}

function buildDraftSnapshot({
  acompte,
  lignes,
  photos,
  remise,
  selectedClientId,
  selectedTrade,
  step,
  tva,
}: Omit<CreateDevisDraft, "savedAt" | "version">): CreateDevisDraft {
  return {
    acompte,
    lignes,
    photos,
    remise,
    savedAt: new Date().toISOString(),
    selectedClientId,
    selectedTrade,
    step,
    tva,
    version: 1,
  };
}

function formatDraftSavedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WIZARD_STEPS: CreationWizardStep[] = [
  {
    title: "Client",
    description: "Choisissez le bon contact ou créez-le directement ici.",
  },
  {
    title: "Chiffrage",
    description: "Packs métier, catalogue, lignes libres et IA en renfort.",
  },
  {
    title: "Validation",
    description: "TVA, remise, acompte, photos et choix d’envoi final.",
  },
];

const EMPTY_CLIENT_FORM: QuickClientForm = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
};

function buildCreationQuery(mode: CreateDevisMode, result: DevisResult) {
  const params = new URLSearchParams();

  if (mode === "save") {
    params.set("created", "saved");
    return params.toString();
  }

  if (result.emailSent) {
    params.set("created", "sent");
    return params.toString();
  }

  params.set("created", "send_skipped");
  if (result.emailSkippedReason) {
    params.set("reason", result.emailSkippedReason);
  }

  return params.toString();
}

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 500;
        const scale = maxWidth / image.width;
        canvas.width = maxWidth;
        canvas.height = image.height * scale;
        const context = canvas.getContext("2d");
        context?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.4));
      };
      image.onerror = () => reject(new Error("Impossible de charger l'image"));
      image.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export default function NouveauDevisPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [lignes, setLignes] = useState<LigneDevis[]>([]);
  const [tva, setTva] = useState("10");
  const [acompte, setAcompte] = useState("");
  const [remise, setRemise] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [searchClient, setSearchClient] = useState("");
  const [searchPrestation, setSearchPrestation] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [submitMode, setSubmitMode] = useState<CreateDevisMode | null>(null);
  const [isPro, setIsPro] = useState(true);
  const [checkingPro, setCheckingPro] = useState(true);
  const [devisCount, setDevisCount] = useState<number | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState<QuickClientForm>(EMPTY_CLIENT_FORM);
  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isImportingStarter, setIsImportingStarter] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const draftReadyRef = useRef(false);
  const lastDraftFingerprintRef = useRef("");

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const activeTrade = companyTrade?.key ?? selectedTrade;
  const activeTradeDefinition = getTradeDefinition(activeTrade) ?? getTradeDefinition(DEFAULT_TRADE)!;
  const tradeBundles = useMemo(() => getTradeBundlesForTrade(activeTrade), [activeTrade]);
  const starterCount = getStarterCatalogForTrade(activeTrade).length;

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const draftStorageKey = getDraftStorageKey(user?.id);

  useEffect(() => {
    if (companyTrade) {
      setSelectedTrade(companyTrade.key);
    }
  }, [companyTrade]);

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") {
      draftReadyRef.current = true;
      return;
    }

    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      draftReadyRef.current = true;
      return;
    }

    const parsedDraft = parseDraft(rawDraft);
    if (!parsedDraft) {
      window.localStorage.removeItem(draftStorageKey);
      draftReadyRef.current = true;
      return;
    }

    setSelectedClientId(parsedDraft.selectedClientId);
    setLignes(parsedDraft.lignes);
    setTva(parsedDraft.tva);
    setAcompte(parsedDraft.acompte);
    setRemise(parsedDraft.remise);
    setPhotos(parsedDraft.photos);
    setSelectedTrade(parsedDraft.selectedTrade);
    setStep(Math.min(parsedDraft.step, WIZARD_STEPS.length - 1));
    setDraftSavedAt(parsedDraft.savedAt);
    setDraftStatus("saved");
    lastDraftFingerprintRef.current = rawDraft;
    draftReadyRef.current = true;
  }, [draftStorageKey]);

  useEffect(() => {
    if (isLoaded) {
      setIsPro(user?.publicMetadata?.isPro === true);
      setCheckingPro(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsBooting(true);

      try {
        const [clientsResponse, prestationsResponse, devisResponse] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/prestations"),
          fetch("/api/devis"),
        ]);

        const [clientsPayload, prestationsPayload, devisPayload] = await Promise.all([
          clientsResponse.json(),
          prestationsResponse.json(),
          devisResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        setClients(Array.isArray(clientsPayload) ? clientsPayload : []);
        setPrestations(Array.isArray(prestationsPayload) ? prestationsPayload : []);
        setDevisCount(Array.isArray(devisPayload) ? devisPayload.length : 0);
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur de chargement du wizard devis", error);
          toast.error("Impossible de charger toutes les données du devis.");
        }
      } finally {
        if (!cancelled) {
          setIsBooting(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined" || !draftReadyRef.current) {
      return;
    }

    const draft = buildDraftSnapshot({
      acompte,
      lignes,
      photos,
      remise,
      selectedClientId,
      selectedTrade,
      step,
      tva,
    });

    if (isDraftEmpty(draft)) {
      window.localStorage.removeItem(draftStorageKey);
      lastDraftFingerprintRef.current = "";
      setDraftStatus("idle");
      setDraftSavedAt(null);
      return;
    }

    const nextFingerprint = JSON.stringify(draft);
    if (nextFingerprint === lastDraftFingerprintRef.current) {
      return;
    }

    setDraftStatus("saving");
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey, nextFingerprint);
      lastDraftFingerprintRef.current = nextFingerprint;
      setDraftStatus("saved");
      setDraftSavedAt(draft.savedAt);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [acompte, draftStorageKey, lignes, photos, remise, selectedClientId, selectedTrade, step, tva]);

  const filteredClients = useMemo(() => {
    const search = searchClient.trim().toLowerCase();
    if (!search) {
      return clients;
    }

    return clients.filter((client) =>
      [client.nom, client.email, client.telephone].some((value) =>
        (value || "").toLowerCase().includes(search),
      ),
    );
  }, [clients, searchClient]);

  const recentClients = useMemo(() => clients.slice(0, 4), [clients]);

  const filteredPrestations = useMemo(() => {
    const search = searchPrestation.trim().toLowerCase();
    if (!search) {
      return prestations;
    }

    return prestations.filter((prestation) =>
      [prestation.nom, prestation.categorie].some((value) =>
        (value || "").toLowerCase().includes(search),
      ),
    );
  }, [prestations, searchPrestation]);

  const expressPrestations = useMemo(() => {
    const catalog = searchPrestation.trim() ? filteredPrestations : prestations;
    return catalog.slice(0, 4);
  }, [filteredPrestations, prestations, searchPrestation]);

  const totalHTBase = lignes
    .filter((ligne) => !ligne.isOptional)
    .reduce((sum, ligne) => sum + ligne.totalLigne, 0);
  const discountAmount = (totalHTBase * (Number.parseFloat(remise) || 0)) / 100;
  const totalHT = totalHTBase - discountAmount;
  const totalTTC =
    lignes
      .filter((ligne) => !ligne.isOptional)
      .reduce((sum, ligne) => sum + ligne.totalLigne * (1 + Number.parseFloat(ligne.tva || tva) / 100), 0) *
    (1 - (Number.parseFloat(remise) || 0) / 100);
  const totalTVA = totalTTC - totalHT;
  const marginEstimate =
    lignes
      .filter((ligne) => !ligne.isOptional)
      .reduce((sum, ligne) => {
        const prestation = prestations.find((item) => item.nom === ligne.nomPrestation);
        const unitCost = prestation?.cout || 0;
        return sum + (ligne.prixUnitaire - unitCost) * ligne.quantite;
      }, 0) - discountAmount;

  const hasClient = Boolean(selectedClient);
  const hasLines = lignes.length > 0;
  const remainingTrialQuotes = !isPro && devisCount !== null ? Math.max(TRIAL_QUOTE_LIMIT - devisCount, 0) : null;
  const trialLocked = !checkingPro && !isPro && devisCount !== null && devisCount >= TRIAL_QUOTE_LIMIT;
  const canEdit = hasClient && !trialLocked;
  const canSubmit = hasClient && hasLines && !trialLocked;
  const emailHint =
    selectedClient && !selectedClient.email
      ? "Ce client n’a pas d’email. Le devis sera bien créé, mais l’envoi sera naturellement ignoré."
      : null;
  const draftSavedLabel = formatDraftSavedAt(draftSavedAt);

  const addLineFromPrestation = (prestation: Prestation) => {
    setLignes((current) => [
      ...current,
      {
        nomPrestation: prestation.nom,
        quantite: 1,
        unite: prestation.unite,
        prixUnitaire: prestation.prix,
        totalLigne: prestation.prix,
        tva,
        isOptional: false,
      },
    ]);
    setSearchPrestation("");
  };

  const addFreeLine = () => {
    setLignes((current) => [
      ...current,
      {
        nomPrestation: "",
        quantite: 1,
        unite: "U",
        prixUnitaire: 0,
        totalLigne: 0,
        tva,
        isOptional: false,
      },
    ]);
  };

  const applyBundle = (bundle: { lignes: LigneDevis[] }) => {
    setLignes((current) => [
      ...current,
      ...bundle.lignes.map((line) => ({
        ...line,
        tva,
        isOptional: false,
      })),
    ]);
  };

  const updateLineTva = (index: number, nextTva: string) => {
    setLignes((current) =>
      current.map((ligne, lineIndex) => (lineIndex === index ? { ...ligne, tva: nextTva } : ligne)),
    );
  };

  const updateLineQty = (index: number, nextQty: number) => {
    setLignes((current) =>
      current.map((ligne, lineIndex) =>
        lineIndex === index
          ? {
              ...ligne,
              quantite: nextQty,
              totalLigne: nextQty * ligne.prixUnitaire,
            }
          : ligne,
      ),
    );
  };

  const updateLineName = (index: number, nextName: string) => {
    setLignes((current) =>
      current.map((ligne, lineIndex) => {
        if (lineIndex !== index) {
          return ligne;
        }

        const found = prestations.find((prestation) => prestation.nom === nextName);
        if (!found) {
          return { ...ligne, nomPrestation: nextName };
        }

        return {
          ...ligne,
          nomPrestation: found.nom,
          unite: found.unite,
          prixUnitaire: found.prix,
          totalLigne: ligne.quantite * found.prix,
        };
      }),
    );
  };

  const updateLinePrice = (index: number, nextPrice: number) => {
    setLignes((current) =>
      current.map((ligne, lineIndex) =>
        lineIndex === index
          ? {
              ...ligne,
              prixUnitaire: nextPrice,
              totalLigne: ligne.quantite * nextPrice,
            }
          : ligne,
      ),
    );
  };

  const toggleLineOptional = (index: number) => {
    setLignes((current) =>
      current.map((ligne, lineIndex) =>
        lineIndex === index ? { ...ligne, isOptional: !ligne.isOptional } : ligne,
      ),
    );
  };

  const removeLine = (index: number) => {
    setLignes((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const handleImportStarterCatalog = async () => {
    if (!user || !activeTradeDefinition) {
      return;
    }

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

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      const payload = (await response.json()) as GenerateDevisResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de générer les lignes IA");
      }

      if (!Array.isArray(payload.lignes) || payload.lignes.length === 0) {
        throw new Error(payload.error || "Aucune ligne exploitable n’a été générée");
      }

      const generatedLines = payload.lignes;

      setLignes((current) => [
        ...current,
        ...generatedLines.map((line) => ({
          nomPrestation: line.designation,
          quantite: line.quantite,
          unite: line.unite,
          prixUnitaire: line.prixUnitaire,
          totalLigne: line.quantite * line.prixUnitaire,
          tva,
          isOptional: false,
        })),
      ]);

      setShowAIModal(false);
      setAiPrompt("");
      toast.success(`${generatedLines.length} ligne(s) IA ajoutée(s) au devis.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la génération avec l’IA.";
      toast.error(message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.nom.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    setIsAddingClient(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Erreur lors de la création du client");
      }

      setClients((current) => [payload, ...current]);
      setSelectedClientId(payload.id);
      setShowNewClient(false);
      setSearchClient("");
      setNewClient(EMPTY_CLIENT_FORM);
      toast.success("Client ajouté et prêt pour le devis.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création du client";
      toast.error(message);
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    try {
      const compressedPhotos = await Promise.all(files.map((file) => compressImage(file)));
      setPhotos((current) => [...current, ...compressedPhotos]);
      toast.success(`${compressedPhotos.length} photo(s) ajoutée(s) au devis.`);
    } catch (error) {
      console.error("Erreur de compression photo", error);
      toast.error("Impossible d’ajouter ces photos.");
    } finally {
      event.target.value = "";
    }
  };

  const handleCreate = async (mode: CreateDevisMode) => {
    if (!selectedClient) {
      toast.error("Choisissez un client avant de créer le devis.");
      return;
    }

    if (lignes.length === 0) {
      toast.error("Ajoutez au moins une ligne au devis.");
      return;
    }

    setSubmitMode(mode);

    try {
      const response = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          client: selectedClient.nom,
          lignes,
          tva,
          acompte,
          remise,
          photos,
          sendNow: mode === "send",
        }),
      });

      const payload = (await response.json()) as DevisResult & { error?: string };
      if (!response.ok || !payload.numero) {
        throw new Error(payload.error || "Impossible de créer le devis");
      }

      if (draftStorageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
        lastDraftFingerprintRef.current = "";
        setDraftStatus("idle");
        setDraftSavedAt(null);
      }

      router.push(`/devis/${payload.numero}?${buildCreationQuery(mode, payload)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création du devis";
      toast.error(message);
      setSubmitMode(null);
    }
  };

  const canContinue = step === 0 ? hasClient : step === 1 ? hasLines : canSubmit;

  const handleNextStep = () => {
    if (step === 0 && !hasClient) {
      toast.error("Choisissez ou créez un client avant de continuer.");
      return;
    }

    if (step === 1 && !hasLines) {
      toast.error("Ajoutez au moins une ligne ou un pack avant de continuer.");
      return;
    }

    setStep((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  };

  return (
    <CreationWizardShell
      backHref="/devis"
      currentStep={step}
      description="Retour à un vrai parcours guidé: client d’abord, chiffrage ensuite, validation à la fin. Plus lisible sur téléphone, plus net sur ordinateur."
      eyebrow="Wizard devis"
      steps={WIZARD_STEPS}
      title="Nouveau devis"
      footer={
        <CreationWizardFooter
          mobileMeta={
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Étape {step + 1} sur {WIZARD_STEPS.length}
                {step === 0 ? " • sélection du client" : step === 1 ? " • composition du devis" : " • validation finale"}
              </div>
              <div className="font-medium text-violet-700 dark:text-violet-200">
                {draftStatus === "saving"
                  ? "Brouillon en cours de sauvegarde…"
                  : draftSavedLabel
                    ? `Brouillon enregistré à ${draftSavedLabel}`
                    : "Brouillon local prêt dès la première saisie"}
              </div>
            </div>
          }
          mobilePrimaryAction={
            step < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canContinue || trialLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 0 ? "Continuer vers le chiffrage" : "Continuer vers la validation"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleCreate("send")}
                disabled={!canSubmit || submitMode !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {submitMode === "send" ? "Création + envoi..." : "Créer et envoyer"}
              </button>
            )
          }
          mobileSecondaryActions={
            step === 0
              ? [
                  {
                    href: "/devis",
                    icon: FileText,
                    label: "Retour aux devis",
                  },
                ]
              : step === 1
                ? [
                    {
                      icon: ArrowLeft,
                      label: "Revenir au client",
                      onClick: () => setStep(0),
                    },
                  ]
                : [
                    {
                      icon: ArrowLeft,
                      label: "Revenir au chiffrage",
                      onClick: () => setStep(1),
                    },
                    {
                      disabled: !canSubmit || submitMode !== null,
                      icon: Save,
                      label: submitMode === "save" ? "Enregistrement..." : "Enregistrer le devis",
                      onClick: () => void handleCreate("save"),
                      tone: "accent",
                    },
                  ]
          }
        >
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            <div>
              Étape {step + 1} sur {WIZARD_STEPS.length}
              {step === 0 ? " • sélection du client" : step === 1 ? " • composition du devis" : " • validation finale"}
            </div>
            <div className="font-medium text-violet-700 dark:text-violet-200">
              {draftStatus === "saving"
                ? "Brouillon en cours de sauvegarde…"
                : draftSavedLabel
                  ? `Brouillon enregistré à ${draftSavedLabel}`
                  : "Brouillon local prêt dès la première saisie"}
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 sm:w-auto"
              >
                Précédent
              </button>
            ) : (
              <Link
                href="/devis"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 sm:w-auto"
              >
                <FileText size={16} />
                Mes devis
              </Link>
            )}

            {step < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!canContinue || trialLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {step === 0 ? "Continuer vers le chiffrage" : "Continuer vers la validation"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleCreate("save")}
                  disabled={!canSubmit || submitMode !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 sm:w-auto"
                >
                  <Save size={16} />
                  {submitMode === "save" ? "Enregistrement..." : "Enregistrer le devis"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreate("send")}
                  disabled={!canSubmit || submitMode !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Send size={16} />
                  {submitMode === "send" ? "Création + envoi..." : "Créer et envoyer"}
                </button>
              </>
            )}
          </div>
        </CreationWizardFooter>
      }
    >
      <div className="space-y-6">
        {!isBooting && trialLocked ? (
          <CreationWizardPanel>
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-300/40 bg-rose-500/10 px-4 py-4 text-sm text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
              <Rocket size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Votre essai a atteint sa limite de création</p>
                <p className="mt-2 leading-6 opacity-80">
                  Le parcours reste consultable pour préparer le devis, mais les actions finales sont bloquées tant que vous n’êtes pas passé en Pro.
                </p>
              </div>
            </div>
          </CreationWizardPanel>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.div
              key="step-client"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.24 }}
            >
              <ClientSelector
                filteredClients={filteredClients}
                isCreating={isAddingClient}
                isLoading={isBooting}
                newClient={newClient}
                onClearSelection={() => setSelectedClientId("")}
                onCreateClient={handleCreateClient}
                onNewClientChange={(field, value) =>
                  setNewClient((current) => ({ ...current, [field]: value }))
                }
                onSearchChange={setSearchClient}
                onSelectClient={(client) => setSelectedClientId(client.id)}
                recentClients={recentClients}
                onToggleNewClient={() => setShowNewClient((current) => !current)}
                searchValue={searchClient}
                selectedClient={selectedClient}
                showNewClient={showNewClient}
              />
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="step-chiffrage"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.24 }}
            >
              <LineEditor
                activeTrade={activeTrade}
                activeTradeDefinition={activeTradeDefinition}
                canEdit={canEdit}
                expressPrestations={expressPrestations}
                filteredPrestations={filteredPrestations}
                hasClient={hasClient}
                isImportingStarter={isImportingStarter}
                lignes={lignes}
                onAddFreeLine={addFreeLine}
                onAddPrestation={addLineFromPrestation}
                onApplyBundle={applyBundle}
                onImportStarter={handleImportStarterCatalog}
                onOpenAI={() => setShowAIModal(true)}
                onRemoveLine={removeLine}
                onSearchChange={setSearchPrestation}
                onSelectTrade={setSelectedTrade}
                onToggleOptional={toggleLineOptional}
                onUpdateNom={updateLineName}
                onUpdatePrix={updateLinePrice}
                onUpdateQty={updateLineQty}
                onUpdateTva={updateLineTva}
                prestationSearch={searchPrestation}
                prestations={prestations}
                starterCount={starterCount}
                tradeBundles={tradeBundles}
              />
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-validation"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.24 }}
            >
              <SummaryRail
                acompte={acompte}
                canSubmit={canSubmit}
                emailHint={emailHint}
                hasLines={hasLines}
                isPro={isPro}
                mode={submitMode}
                onAcompteChange={setAcompte}
                onCreateAndSend={() => void handleCreate("send")}
                onFileUpload={handleFileUpload}
                onRemiseChange={setRemise}
                onRemovePhoto={(index) =>
                  setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))
                }
                onSaveOnly={() => void handleCreate("save")}
                onTvaChange={setTva}
                photos={photos}
                remainingTrialQuotes={remainingTrialQuotes}
                remise={remise}
                selectedClient={selectedClient}
                showActions={false}
                sticky={false}
                totalHT={totalHT}
                totalTTC={totalTTC}
                totalTVA={totalTVA}
                trialLocked={trialLocked}
                tva={tva}
                marginEstimate={marginEstimate}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AIAssistant
        isGenerating={isGeneratingAI}
        onClose={() => setShowAIModal(false)}
        onGenerate={() => void generateWithAI()}
        onPromptChange={setAiPrompt}
        open={showAIModal}
        prompt={aiPrompt}
      />
    </CreationWizardShell>
  );
}
