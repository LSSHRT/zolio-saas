"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FileText, Rocket } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { ClientHeroStat, ClientSubpageShell } from "@/components/client-shell";
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

const EMPTY_CLIENT_FORM: QuickClientForm = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

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

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const activeTrade = companyTrade?.key ?? selectedTrade;
  const activeTradeDefinition = getTradeDefinition(activeTrade) ?? getTradeDefinition(DEFAULT_TRADE)!;
  const tradeBundles = useMemo(() => getTradeBundlesForTrade(activeTrade), [activeTrade]);
  const starterCount = getStarterCatalogForTrade(activeTrade).length;

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  useEffect(() => {
    if (companyTrade) {
      setSelectedTrade(companyTrade.key);
    }
  }, [companyTrade]);

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
          console.error("Erreur de chargement du cockpit devis", error);
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

  const totalHTBase = lignes
    .filter((ligne) => !ligne.isOptional)
    .reduce((sum, ligne) => sum + ligne.totalLigne, 0);
  const discountAmount = totalHTBase * (Number.parseFloat(remise) || 0) / 100;
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
  const optionalCount = lignes.filter((ligne) => ligne.isOptional).length;
  const remainingTrialQuotes = !isPro && devisCount !== null ? Math.max(TRIAL_QUOTE_LIMIT - devisCount, 0) : null;
  const trialLocked = !checkingPro && !isPro && devisCount !== null && devisCount >= TRIAL_QUOTE_LIMIT;
  const canEdit = hasClient && !trialLocked;
  const canSubmit = hasClient && hasLines && !trialLocked;
  const emailHint = selectedClient && !selectedClient.email
    ? "Ce client n’a pas d’email. Le devis sera bien créé, mais l’envoi sera naturellement ignoré."
    : null;

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
      current.map((ligne, lineIndex) =>
        lineIndex === index ? { ...ligne, tva: nextTva } : ligne,
      ),
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
        throw new Error("Impossible de générer les lignes IA");
      }

      if (payload.lignes && Array.isArray(payload.lignes)) {
        setLignes((current) => [
          ...current,
          ...payload.lignes!.map((line) => ({
            nomPrestation: line.designation,
            quantite: line.quantite,
            unite: line.unite,
            prixUnitaire: line.prixUnitaire,
            totalLigne: line.quantite * line.prixUnitaire,
            tva,
            isOptional: false,
          })),
        ]);
      }

      setShowAIModal(false);
      setAiPrompt("");
      toast.success("Les lignes IA ont été ajoutées au devis.");
    } catch (error) {
      console.error("Erreur IA", error);
      toast.error("Erreur lors de la génération avec l’IA.");
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

      router.push(`/devis/${payload.numero}?${buildCreationQuery(mode, payload)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création du devis";
      toast.error(message);
      setSubmitMode(null);
    }
  };

  return (
    <ClientSubpageShell
      title="Nouveau devis"
      description="Un cockpit 1 page orienté vitesse: client d’abord, chiffrage ensuite, IA en renfort seulement quand elle fait gagner du temps."
      activeNav="devis"
      eyebrow="Cockpit devis"
      actions={
        <Link
          href="/devis"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:text-white"
        >
          <FileText size={16} />
          Mes devis
        </Link>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Client"
            value={selectedClient ? "OK" : "0"}
            detail={selectedClient ? selectedClient.nom : "À sélectionner"}
            tone={selectedClient ? "emerald" : "slate"}
          />
          <ClientHeroStat
            label="Lignes"
            value={String(lignes.length)}
            detail={`${optionalCount} option${optionalCount > 1 ? "s" : ""} • flow inline`}
            tone="violet"
          />
          <ClientHeroStat
            label="Total TTC"
            value={formatCurrency(totalTTC)}
            detail={`Marge estimée ${formatCurrency(marginEstimate)}`}
            tone="amber"
          />
          <ClientHeroStat
            label={isPro ? "Mode" : "Essai"}
            value={isPro ? "PRO" : String(remainingTrialQuotes ?? 0)}
            detail={
              isPro
                ? "Création illimitée active"
                : remainingTrialQuotes !== null
                  ? "devis d’essai restants"
                  : "vérification en cours"
            }
            tone={trialLocked ? "rose" : "slate"}
          />
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {!isBooting && trialLocked ? (
            <div className="rounded-[2rem] border border-rose-300/40 bg-rose-500/10 px-5 py-5 text-sm text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
              <div className="flex items-start gap-3">
                <Rocket size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Votre essai a atteint sa limite de création</p>
                  <p className="mt-2 leading-6 opacity-80">
                    Le cockpit reste disponible pour préparer le devis, mais les actions finales sont bloquées tant que vous n’êtes pas passé en Pro.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

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
            searchValue={searchClient}
            selectedClient={selectedClient}
            showNewClient={showNewClient}
            onToggleNewClient={() => setShowNewClient((current) => !current)}
          />

          <LineEditor
            activeTrade={activeTrade}
            activeTradeDefinition={activeTradeDefinition}
            canEdit={canEdit}
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
        </div>

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
          totalHT={totalHT}
          totalTTC={totalTTC}
          totalTVA={totalTVA}
          trialLocked={trialLocked}
          tva={tva}
          marginEstimate={marginEstimate}
        />
      </div>

      <AIAssistant
        isGenerating={isGeneratingAI}
        onClose={() => setShowAIModal(false)}
        onGenerate={() => void generateWithAI()}
        onPromptChange={setAiPrompt}
        open={showAIModal}
        prompt={aiPrompt}
      />
    </ClientSubpageShell>
  );
}
