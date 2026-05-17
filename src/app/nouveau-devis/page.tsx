"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
  Rocket,
  Save,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  CreationWizardFooter,
  CreationWizardPanel,
  CreationWizardShell,
  type CreationWizardStep,
} from "@/components/client-creation-wizard";
import {
  ClientSubpageShell,
  type ClientMetaPill,
} from "@/components/client-shell";
import {
  DEFAULT_TRADE,
  getStarterCatalogForTrade,
  getTradeBundlesForTrade,
  getTradeDefinition,
  type TradeKey,
} from "@/lib/trades";
import { AIAssistant } from "./components/AIAssistant";
import { ClientSelector } from "@/components/document-form/ClientSelector";
import { LineEditor } from "@/components/document-form/LineEditor";
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

const TRIAL_QUOTE_LIMIT = 5;
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
    description: "TVA, remise, acompte, photos et choix d'envoi final.",
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
  const [errors, setErrors] = useState<Record<string, string>>({});
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
          logError("devis-wizard-load", error);
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
      ? "Ce client n'a pas d'email. Le devis sera bien créé, mais l'envoi sera naturellement ignoré."
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
        throw new Error(payload.error || "Aucune ligne exploitable n'a été générée");
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
      const message = error instanceof Error ? error.message : "Erreur lors de la génération avec l'IA.";
      toast.error(message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateClient = async () => {
    const currentErrors: Record<string, string> = {};

    if (!newClient.nom.trim()) {
      currentErrors.nom = "Le nom du client est obligatoire.";
    }

    if (newClient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) {
      currentErrors.email = "L'adresse email n'est pas valide.";
    }

    if (newClient.telephone && newClient.telephone.length < 8) {
      currentErrors.telephone = "Le numéro de téléphone est trop court.";
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    setErrors({});
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
  };;

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
      logError("devis-photo-compress", error);
      toast.error("Impossible d'ajouter ces photos.");
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

      // Quota atteint (plan gratuit 3 devis/mois)
      if (response.status === 429 && payload.error === "Quota atteint") {
        toast.error("Quota de 3 devis atteint ce mois. Passez en Pro pour continuer.", {
          action: { label: "Voir les offres", onClick: () => router.push("/abonnement") },
        });
        setSubmitMode(null);
        return;
      }

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

  // ─── Desktop v2 meta pills (header) ──────────────────────────────────
  const desktopMetaPills: ClientMetaPill[] = [
    ...(selectedClient
      ? [{ icon: Users, label: selectedClient.nom, tone: "emerald" as const }]
      : []),
    ...(lignes.length > 0
      ? [
          {
            label: `${lignes.length} ligne${lignes.length > 1 ? "s" : ""}`,
            tone: "slate" as const,
          },
        ]
      : []),
    ...(totalTTC > 0
      ? [{ label: `${totalTTC.toFixed(2)}€ TTC`, tone: "violet" as const }]
      : []),
    ...(draftSavedLabel
      ? [
          {
            icon: Save,
            label: `Brouillon · ${draftSavedLabel}`,
            tone: "slate" as const,
          },
        ]
      : []),
  ];

  const aReglerDesktop = Math.max(
    0,
    totalTTC - (Number.parseFloat(acompte) || 0),
  );

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
    <>
    <div className="lg:hidden">
    <CreationWizardShell
      backHref="/devis"
      currentStep={step}
      description="Retour à un vrai parcours guidé: client d'abord, chiffrage ensuite, validation à la fin. Plus lisible sur téléphone, plus net sur ordinateur."
      eyebrow="Wizard devis"
      steps={WIZARD_STEPS}
      title="Nouveau devis"
      headerExtra={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            draftStatus === "saving"
              ? "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
              : draftSavedLabel
                ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-slate-200/70 bg-white/80 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          }`}
          aria-live="polite"
        >
          {draftStatus === "saving" ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Sauvegarde…
            </>
          ) : draftSavedLabel ? (
            <>
              <Save size={11} />
              Enregistré à {draftSavedLabel}
            </>
          ) : (
            <>
              <Save size={11} />
              Autosauvegarde active
            </>
          )}
        </span>
      }
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
                  ? "Brouillon en cours de sauvegarde..."
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
                ? "Brouillon en cours de sauvegarde..."
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
            <div className="flex items-start gap-3 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-4 text-sm text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
              <Rocket size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Votre essai a atteint sa limite</p>
                <p className="mt-2 leading-6 opacity-80">
                  {isPro && devisCount !== null && devisCount >= TRIAL_QUOTE_LIMIT
                    ? "Passez en Pro pour créer des devis illimités."
                    : "Le parcours reste consultable pour préparer le devis, mais les actions finales sont bloquées. Passez en Pro ou attendez le mois prochain."}
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
                errors={errors}
                onCreateClient={handleCreateClient}
                onNewClientChange={(field, value) =>
                  setNewClient((current) => ({ ...current, [field]: value }))
                }
                onSearchChange={setSearchClient}
                onSelectClient={(client) => setSelectedClientId(client.id)}
                onSiretPrefill={(hit) =>
                  setNewClient((current) => ({
                    ...current,
                    nom: hit.nom,
                    adresse: hit.adresse || current.adresse,
                  }))
                }
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

    </CreationWizardShell>
    </div>

    {/* ─── Desktop dense single-page form (hidden lg:block) ─── */}
    <div className="hidden lg:block">
      <ClientSubpageShell
        title="Nouveau devis"
        description="Création complète — client, chiffrage et options sur un seul écran."
        eyebrow="Création"
        activeNav="devis"
        backHref="/devis"
        breadcrumbs={[
          { label: "Devis", href: "/devis" },
          { label: "Nouveau devis" },
        ]}
        metaPills={desktopMetaPills}
        showMobileDock={false}
        mobilePrimaryAction={null}
      >
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* LEFT 8/12 : Client + Chiffrage + Options */}
          <form
            className="lg:col-span-8 space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            {trialLocked ? (
              <section
                className="lg-v2-panel border-l-4 p-5"
                style={{ borderLeftColor: "var(--v2-danger)" }}
              >
                <div className="flex items-start gap-3">
                  <Rocket
                    size={18}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--v2-danger)" }}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold lg-v2-text-strong">
                      Votre essai a atteint sa limite
                    </p>
                    <p className="mt-1 text-xs lg-v2-text-muted">
                      Passez en Pro pour créer des devis illimités, ou attendez le mois prochain.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* CLIENT */}
            <section className="lg-v2-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="lg-v2-eyebrow">Client</p>
                  <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                    {selectedClient ? "Client sélectionné" : "Choisir un client"}
                  </h2>
                  <p className="mt-1 text-xs lg-v2-text-subtle">
                    Sélectionnez un contact existant ou créez-en un nouveau.
                  </p>
                </div>
                {!selectedClient ? (
                  <button
                    type="button"
                    onClick={() => setShowNewClient((value) => !value)}
                    className="lg-v2-btn lg-v2-btn-secondary"
                  >
                    <UserPlus size={14} aria-hidden />
                    {showNewClient ? "Fermer" : "Nouveau client"}
                  </button>
                ) : null}
              </div>

              {selectedClient ? (
                <div className="mt-4 flex items-center gap-3 rounded-lg border lg-v2-divider lg-v2-panel-muted px-4 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--v2-primary)" }}
                    aria-hidden
                  >
                    {selectedClient.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold lg-v2-text-strong">
                      {selectedClient.nom}
                    </p>
                    <p className="truncate text-xs lg-v2-text-muted">
                      {selectedClient.email || selectedClient.telephone || selectedClient.adresse || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClientId("")}
                    className="lg-v2-btn lg-v2-btn-ghost !px-2"
                    aria-label="Retirer le client sélectionné"
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ) : showNewClient ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="col-span-2 block">
                    <span className="text-xs font-medium lg-v2-text-muted">
                      Nom <span style={{ color: "var(--v2-danger)" }}>*</span>
                    </span>
                    <input
                      value={newClient.nom}
                      onChange={(event) =>
                        setNewClient((current) => ({ ...current, nom: event.target.value }))
                      }
                      className="lg-v2-input mt-1.5"
                      placeholder="Nom du client"
                    />
                    {errors.nom ? (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--v2-danger)" }}
                      >
                        {errors.nom}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium lg-v2-text-muted">Email</span>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(event) =>
                        setNewClient((current) => ({ ...current, email: event.target.value }))
                      }
                      className="lg-v2-input mt-1.5"
                      placeholder="client@example.com"
                    />
                    {errors.email ? (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--v2-danger)" }}
                      >
                        {errors.email}
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium lg-v2-text-muted">Téléphone</span>
                    <input
                      value={newClient.telephone}
                      onChange={(event) =>
                        setNewClient((current) => ({ ...current, telephone: event.target.value }))
                      }
                      className="lg-v2-input mt-1.5"
                      placeholder="06 12 34 56 78"
                    />
                    {errors.telephone ? (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--v2-danger)" }}
                      >
                        {errors.telephone}
                      </p>
                    ) : null}
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-xs font-medium lg-v2-text-muted">Adresse</span>
                    <input
                      value={newClient.adresse}
                      onChange={(event) =>
                        setNewClient((current) => ({ ...current, adresse: event.target.value }))
                      }
                      className="lg-v2-input mt-1.5"
                      placeholder="Adresse"
                    />
                  </label>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewClient(false);
                        setErrors({});
                        setNewClient(EMPTY_CLIENT_FORM);
                      }}
                      className="lg-v2-btn lg-v2-btn-ghost"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateClient()}
                      disabled={isAddingClient}
                      className="lg-v2-btn lg-v2-btn-primary"
                    >
                      {isAddingClient ? "Ajout..." : "Ajouter le client"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative mt-4">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 lg-v2-text-subtle"
                      aria-hidden
                    />
                    <input
                      type="text"
                      value={searchClient}
                      onChange={(event) => setSearchClient(event.target.value)}
                      placeholder="Rechercher un client par nom ou email…"
                      className="lg-v2-input pl-9"
                      aria-label="Rechercher un client"
                    />
                  </div>
                  <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border lg-v2-divider">
                    {filteredClients.length === 0 ? (
                      <p className="px-4 py-10 text-center text-sm lg-v2-text-subtle">
                        {clients.length === 0
                          ? "Vous n'avez pas encore de clients. Créez-en un pour démarrer."
                          : "Aucun client ne correspond à cette recherche."}
                      </p>
                    ) : (
                      <ul className="divide-y lg-v2-divider">
                        {filteredClients.slice(0, 8).map((client) => (
                          <li key={client.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedClientId(client.id)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--v2-panel-muted)]"
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor: "var(--v2-primary-soft)",
                                  color: "var(--v2-primary)",
                                }}
                                aria-hidden
                              >
                                {client.nom.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium lg-v2-text-strong">
                                  {client.nom}
                                </p>
                                <p className="truncate text-xs lg-v2-text-subtle">
                                  {client.email || client.telephone || "—"}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* CHIFFRAGE / PRESTATIONS */}
            <section className="lg-v2-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="lg-v2-eyebrow">Chiffrage</p>
                  <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                    Lignes{" "}
                    <span className="font-normal lg-v2-text-subtle">
                      ({lignes.length})
                    </span>
                  </h2>
                  <p className="mt-1 text-xs lg-v2-text-subtle">
                    Catalogue {activeTradeDefinition.label.toLowerCase()}, pack métier, génération IA ou ligne libre.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(true)}
                    disabled={!canEdit}
                    className="lg-v2-btn lg-v2-btn-secondary"
                  >
                    <Sparkles size={14} aria-hidden /> Générer avec l&apos;IA
                  </button>
                  <button
                    type="button"
                    onClick={() => addFreeLine()}
                    disabled={!canEdit}
                    className="lg-v2-btn lg-v2-btn-primary"
                  >
                    <Plus size={14} aria-hidden /> Ligne libre
                  </button>
                </div>
              </div>

              {tradeBundles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tradeBundles.map((bundle, index) => (
                    <button
                      key={`bundle-${index}`}
                      type="button"
                      onClick={() => applyBundle(bundle)}
                      disabled={!canEdit}
                      className="inline-flex items-center gap-1.5 rounded-lg border lg-v2-divider bg-transparent px-2.5 py-1 text-xs font-medium lg-v2-text-muted transition hover:bg-[var(--v2-panel-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                      title={bundle.description}
                    >
                      <Tag size={12} aria-hidden /> {bundle.nom}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="relative mt-4">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 lg-v2-text-subtle"
                  aria-hidden
                />
                <input
                  type="text"
                  value={searchPrestation}
                  onChange={(event) => setSearchPrestation(event.target.value)}
                  placeholder="Rechercher dans le catalogue…"
                  className="lg-v2-input pl-9"
                  aria-label="Rechercher une prestation"
                  disabled={!canEdit}
                />
              </div>

              {searchPrestation && filteredPrestations.length > 0 ? (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border lg-v2-divider">
                  <ul className="divide-y lg-v2-divider">
                    {filteredPrestations.slice(0, 6).map((prestation) => (
                      <li key={prestation.id}>
                        <button
                          type="button"
                          onClick={() => addLineFromPrestation(prestation)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition hover:bg-[var(--v2-panel-muted)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium lg-v2-text-strong">
                              {prestation.nom}
                            </p>
                            <p className="truncate text-xs lg-v2-text-subtle">
                              {prestation.categorie} · {prestation.unite}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums lg-v2-text">
                            {prestation.prix.toFixed(2)}€
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {lignes.length > 0 ? (
                <div className="mt-4 overflow-hidden rounded-lg border lg-v2-divider">
                  <table
                    className="w-full border-collapse text-left"
                    aria-label="Lignes du devis"
                  >
                    <thead>
                      <tr>
                        <th className="lg-v2-table-header">Désignation</th>
                        <th className="lg-v2-table-header w-20 !text-right">Qté</th>
                        <th className="lg-v2-table-header w-16">Unité</th>
                        <th className="lg-v2-table-header w-28 !text-right">P.U. €</th>
                        <th className="lg-v2-table-header w-24">TVA</th>
                        <th className="lg-v2-table-header w-28 !text-right">Total €</th>
                        <th className="lg-v2-table-header w-12" aria-label="Optionnelle"></th>
                        <th className="lg-v2-table-header w-10" aria-label="Supprimer"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((line, index) => (
                        <tr
                          key={`row-${index}`}
                          className={
                            line.isOptional
                              ? "bg-[var(--v2-warning-soft)]/30"
                              : index % 2 === 0
                                ? "bg-[var(--v2-panel)]"
                                : "bg-[var(--v2-panel-muted)]/40"
                          }
                        >
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={line.nomPrestation}
                              onChange={(event) =>
                                updateLineName(index, event.target.value)
                              }
                              className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                              aria-label={`Désignation ligne ${index + 1}`}
                              placeholder="Désignation"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.5"
                              value={line.quantite}
                              onChange={(event) =>
                                updateLineQty(index, Number(event.target.value) || 0)
                              }
                              className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-right text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                              aria-label={`Quantité ligne ${index + 1}`}
                            />
                          </td>
                          <td className="px-2 py-2 text-sm lg-v2-text-muted">{line.unite}</td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.prixUnitaire}
                              onChange={(event) =>
                                updateLinePrice(index, Number(event.target.value) || 0)
                              }
                              className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-right text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                              aria-label={`Prix unitaire ligne ${index + 1}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={line.tva ?? tva}
                              onChange={(event) =>
                                updateLineTva(index, event.target.value)
                              }
                              className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                              aria-label={`TVA ligne ${index + 1}`}
                            >
                              <option value="0">0%</option>
                              <option value="5.5">5,5%</option>
                              <option value="10">10%</option>
                              <option value="20">20%</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 text-right text-sm font-medium tabular-nums lg-v2-text-strong">
                            {line.totalLigne.toFixed(2)}€
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleLineOptional(index)}
                              className="inline-flex h-6 items-center justify-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={
                                line.isOptional
                                  ? {
                                      backgroundColor: "var(--v2-warning-soft)",
                                      color: "var(--v2-warning)",
                                    }
                                  : {
                                      backgroundColor: "var(--v2-panel-muted)",
                                      color: "var(--v2-text-subtle)",
                                    }
                              }
                              aria-pressed={line.isOptional}
                              title={
                                line.isOptional
                                  ? "Ligne optionnelle (exclue du total)"
                                  : "Marquer la ligne comme optionnelle"
                              }
                            >
                              OPT
                            </button>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="lg-v2-btn lg-v2-btn-ghost !px-2"
                              aria-label={`Supprimer la ligne ${index + 1}`}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed lg-v2-divider px-4 py-8 text-center text-sm lg-v2-text-subtle">
                  Aucune ligne pour le moment. Ajoutez-en via le catalogue, l&apos;IA, un pack métier ou en ligne libre.
                </p>
              )}
            </section>

            {/* OPTIONS */}
            <section className="lg-v2-panel p-6">
              <p className="lg-v2-eyebrow">Réglages globaux</p>
              <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                TVA / Remise / Acompte / Photos
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs font-medium lg-v2-text-muted">
                    TVA par défaut
                  </span>
                  <select
                    value={tva}
                    onChange={(event) => setTva(event.target.value)}
                    className="lg-v2-input mt-1.5"
                  >
                    <option value="0">0%</option>
                    <option value="5.5">5,5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium lg-v2-text-muted">
                    Remise globale (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={remise}
                    onChange={(event) => setRemise(event.target.value)}
                    placeholder="0"
                    className="lg-v2-input mt-1.5"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium lg-v2-text-muted">
                    Acompte versé (€)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={acompte}
                    onChange={(event) => setAcompte(event.target.value)}
                    placeholder="0"
                    className="lg-v2-input mt-1.5"
                  />
                </label>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium lg-v2-text-muted">
                    Photos jointes ({photos.length})
                  </p>
                  <label className="lg-v2-btn lg-v2-btn-ghost cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => void handleFileUpload(event)}
                    />
                    <Plus size={14} aria-hidden /> Ajouter
                  </label>
                </div>
                {photos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {photos.map((src, index) => (
                      <div key={`photo-${index}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Photo ${index + 1}`}
                          className="aspect-square w-full rounded-lg border lg-v2-divider object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPhotos((current) =>
                              current.filter((_, photoIndex) => photoIndex !== index),
                            )
                          }
                          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                          aria-label={`Supprimer la photo ${index + 1}`}
                        >
                          <X size={10} aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </form>

          {/* RIGHT 4/12 sticky summary rail */}
          <aside className="self-start lg:col-span-4 lg:sticky lg:top-6 space-y-4">
            <div className="lg-v2-panel p-6">
              <p className="lg-v2-eyebrow">Total TTC</p>
              <p className="mt-3 text-[32px] font-semibold leading-none lg-v2-text-strong tabular-nums">
                {totalTTC.toFixed(2)}€
              </p>
              <p className="mt-2 text-xs lg-v2-text-muted">
                {lignes.length} ligne{lignes.length !== 1 ? "s" : ""} · TVA {tva}% par défaut
              </p>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">Sous-total HT</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">
                    {totalHTBase.toFixed(2)}€
                  </dd>
                </div>
                {discountAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="lg-v2-text-muted">Remise ({remise}%)</dt>
                    <dd
                      className="font-medium tabular-nums"
                      style={{ color: "var(--v2-warning)" }}
                    >
                      −{discountAmount.toFixed(2)}€
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">HT net</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">
                    {totalHT.toFixed(2)}€
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="lg-v2-text-muted">TVA</dt>
                  <dd className="font-medium tabular-nums lg-v2-text">
                    {totalTVA.toFixed(2)}€
                  </dd>
                </div>
                {Number.parseFloat(acompte) > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="lg-v2-text-muted">Acompte versé</dt>
                    <dd
                      className="font-medium tabular-nums"
                      style={{ color: "var(--v2-success)" }}
                    >
                      −{Number.parseFloat(acompte).toFixed(2)}€
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t lg-v2-divider pt-2">
                  <dt className="font-medium lg-v2-text-strong">À régler</dt>
                  <dd
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--v2-danger)" }}
                  >
                    {aReglerDesktop.toFixed(2)}€
                  </dd>
                </div>
                {marginEstimate !== 0 ? (
                  <div className="mt-3 flex items-center justify-between rounded-lg border lg-v2-divider lg-v2-panel-muted px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide lg-v2-text-subtle">
                      Marge estimée
                    </dt>
                    <dd
                      className="font-semibold tabular-nums"
                      style={{
                        color:
                          marginEstimate >= 0
                            ? "var(--v2-success)"
                            : "var(--v2-danger)",
                      }}
                    >
                      {marginEstimate >= 0 ? "+" : ""}
                      {marginEstimate.toFixed(2)}€
                    </dd>
                  </div>
                ) : null}
              </dl>

              {remainingTrialQuotes !== null ? (
                <p
                  className="mt-4 rounded-lg border px-3 py-2 text-xs"
                  style={{
                    borderColor: "var(--v2-warning-soft)",
                    backgroundColor: "var(--v2-warning-soft)",
                    color: "var(--v2-warning)",
                  }}
                >
                  Essai : {remainingTrialQuotes} devis restant{remainingTrialQuotes > 1 ? "s" : ""}.
                </p>
              ) : null}

              {emailHint ? (
                <p className="mt-3 rounded-lg border lg-v2-divider lg-v2-panel-muted px-3 py-2 text-xs lg-v2-text-muted">
                  {emailHint}
                </p>
              ) : null}

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleCreate("send")}
                  disabled={!canSubmit || submitMode !== null}
                  className="w-full lg-v2-btn lg-v2-btn-primary"
                >
                  <Send size={14} aria-hidden />
                  {submitMode === "send" ? "Envoi en cours..." : "Créer et envoyer"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreate("save")}
                  disabled={!canSubmit || submitMode !== null}
                  className="w-full lg-v2-btn lg-v2-btn-secondary"
                >
                  <Save size={14} aria-hidden />
                  {submitMode === "save" ? "Enregistrement..." : "Enregistrer le devis"}
                </button>
                <Link
                  href="/devis"
                  className="w-full lg-v2-btn lg-v2-btn-ghost block text-center"
                >
                  <ArrowLeft size={14} aria-hidden /> Retour aux devis
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </ClientSubpageShell>
    </div>

    <AIAssistant
      isGenerating={isGeneratingAI}
      onClose={() => setShowAIModal(false)}
      onGenerate={() => void generateWithAI()}
      onPromptChange={setAiPrompt}
      open={showAIModal}
      prompt={aiPrompt}
    />
    </>
  );
}
