"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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
import { ClientSelector } from "../components/ClientSelector";
import type { Client, LigneDevis, QuickClientForm } from "../types";

const OPTION_LABELS = [
  { value: "basique", label: "Basique", color: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700", text: "text-slate-700 dark:text-slate-200" },
  { value: "standard", label: "Standard", color: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-200" },
  { value: "premium", label: "Premium", color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-200" },
] as const;

const TVA_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "5.5%", value: "5.5" },
  { label: "10%", value: "10" },
  { label: "20%", value: "20" },
];

const WIZARD_STEPS: CreationWizardStep[] = [
  { title: "Client", description: "Choisissez le client pour ce devis multi-options." },
  { title: "Options", description: "Configurez 2 ou 3 versions du devis." },
  { title: "Validation", description: "Vérifiez et créez les devis d'un coup." },
];

type OptionDraft = {
  lignes: LigneDevis[];
  remise: string;
  tva: string;
};

const emptyOption = (): OptionDraft => ({
  lignes: [],
  remise: "",
  tva: "20",
});

export default function NouveauDevisOptionsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchClient, setSearchClient] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState<QuickClientForm>({ nom: "", email: "", telephone: "", adresse: "" });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Options
  const [optionCount, setOptionCount] = useState<2 | 3>(3);
  const [options, setOptions] = useState<OptionDraft[]>([emptyOption(), emptyOption(), emptyOption()]);

  // Load clients
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data?.clients ?? data ?? []);
        setClientsLoading(false);
      })
      .catch(() => setClientsLoading(false));
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchClient) return clients;
    const q = searchClient.toLowerCase();
    return clients.filter((c) => c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, searchClient]);

  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);

  // Totals
  const optionTotals = useMemo(() => {
    return options.slice(0, optionCount).map((opt) => {
      const totalHT = opt.lignes.reduce((s, l) => s + (l.totalLigne || l.quantite * l.prixUnitaire), 0);
      const remiseVal = parseFloat(opt.remise) || 0;
      const tvaVal = parseFloat(opt.tva) || 20;
      const afterRemise = totalHT * (1 - remiseVal / 100);
      const totalTTC = afterRemise * (1 + tvaVal / 100);
      return { totalHT, totalTTC, remise: remiseVal, tva: tvaVal };
    });
  }, [options, optionCount]);

  const allOptionsHaveLines = options.slice(0, optionCount).every((o) => o.lignes.length > 0);

  // Client creation
  const handleCreateClient = async () => {
    if (!newClient.nom) { toast.error("Le nom du client est requis"); return; }
    setIsCreatingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (data.client) {
        setClients((prev) => [data.client, ...prev]);
        setSelectedClient(data.client);
        setShowNewClient(false);
        setNewClient({ nom: "", email: "", telephone: "", adresse: "" });
        toast.success(`Client "${data.client.nom}" créé`);
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setIsCreatingClient(false);
  };

  // Lignes handlers
  const addLigne = (optIndex: number) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[optIndex] = {
        ...copy[optIndex],
        lignes: [...copy[optIndex].lignes, { nomPrestation: "", quantite: 1, unite: "U", prixUnitaire: 0, totalLigne: 0, tva: copy[optIndex].tva || "20" }],
      };
      return copy;
    });
  };

  const removeLigne = (optIndex: number, ligneIndex: number) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[optIndex] = { ...copy[optIndex], lignes: copy[optIndex].lignes.filter((_, i) => i !== ligneIndex) };
      return copy;
    });
  };

  const updateLigne = (optIndex: number, ligneIndex: number, field: keyof LigneDevis, value: string | number) => {
    setOptions((prev) => {
      const copy = [...prev];
      const lignes = [...copy[optIndex].lignes];
      lignes[ligneIndex] = { ...lignes[ligneIndex], [field]: value };
      if (field === "quantite" || field === "prixUnitaire") {
        const q = field === "quantite" ? (value as number) : lignes[ligneIndex].quantite;
        const p = field === "prixUnitaire" ? (value as number) : lignes[ligneIndex].prixUnitaire;
        lignes[ligneIndex].totalLigne = q * p;
      }
      copy[optIndex] = { ...copy[optIndex], lignes };
      return copy;
    });
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedClient) { toast.error("Sélectionnez un client"); return; }
    if (!allOptionsHaveLines) { toast.error("Chaque option doit avoir au moins une ligne"); return; }

    setSubmitting(true);
    try {
      const payload = {
        options: options.slice(0, optionCount).map((opt, i) => ({
          label: OPTION_LABELS[i].value,
          clientId: selectedClient.id,
          lignes: opt.lignes.map((l) => ({
            nomPrestation: l.nomPrestation,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            tva: l.tva || opt.tva || "20",
            isOptional: false,
          })),
          remise: parseFloat(opt.remise) || 0,
          tva: parseFloat(opt.tva) || 20,
        })),
      };

      const res = await fetch("/api/devis/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.devis) {
        toast.success(`${data.devis.length} devis créés avec succès !`);
        router.push("/devis");
      } else {
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSubmitting(false);
  };

  const canContinue = step === 0 ? selectedClient !== null : true;

  // ─── Desktop v2 helpers ────────────────────────────────────────────
  const totalTTCGlobal = optionTotals.reduce((sum, t) => sum + t.totalTTC, 0);

  const desktopMetaPills: ClientMetaPill[] = [
    ...(selectedClient
      ? [{ icon: Users, label: selectedClient.nom, tone: "emerald" as const }]
      : []),
    {
      icon: Layers,
      label: `${optionCount} option${optionCount > 1 ? "s" : ""}`,
      tone: "violet" as const,
    },
    ...(allOptionsHaveLines
      ? [{ label: `${totalTTCGlobal.toFixed(0)}€ cumul TTC`, tone: "slate" as const }]
      : []),
  ];

  // Desktop option color tokens (mapped to v2 status soft colors)
  const desktopOptionTone: Array<"slate" | "primary" | "warning"> = [
    "slate",
    "primary",
    "warning",
  ];
  const toneColors: Record<
    "slate" | "primary" | "warning",
    { dot: string; text: string; border: string; softBg: string }
  > = {
    slate: {
      dot: "var(--v2-text-subtle)",
      text: "var(--v2-text)",
      border: "var(--v2-border)",
      softBg: "var(--v2-panel-muted)",
    },
    primary: {
      dot: "var(--v2-primary)",
      text: "var(--v2-primary)",
      border: "var(--v2-primary)",
      softBg: "var(--v2-primary-soft)",
    },
    warning: {
      dot: "var(--v2-warning)",
      text: "var(--v2-warning)",
      border: "var(--v2-warning)",
      softBg: "var(--v2-warning-soft)",
    },
  };

  return (
    <>
    <div className="lg:hidden">
    <CreationWizardShell
      backHref="/devis"
      currentStep={step}
      description={WIZARD_STEPS[step].description}
      steps={WIZARD_STEPS}
      title="Devis multi-options"
      eyebrow="Parcours guidé"
      aside={
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Layers size={16} className="text-brand-violet" />
              Multi-options
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Proposez 2 ou 3 versions au même client pour augmenter vos chances d&apos;acceptation.
            </p>
            <div className="mt-4 space-y-2">
              {OPTION_LABELS.slice(0, optionCount).map((opt, i) => (
                <div key={opt.value} className="flex items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 rounded-full ${opt.color}`} />
                  <span className="text-slate-600 dark:text-slate-300">{opt.label}</span>
                  <span className="ml-auto font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {optionTotals[i]?.totalTTC.toFixed(0)}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      footer={
        <CreationWizardFooter
          mobileMeta={
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Étape {step + 1} sur {WIZARD_STEPS.length}
            </div>
          }
          mobilePrimaryAction={
            step < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 0 ? "Continuer vers les options" : "Continuer vers la validation"}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allOptionsHaveLines || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? "Création..." : "Créer les devis"}
              </button>
            )
          }
          mobileSecondaryActions={
            step === 0
              ? [{ href: "/devis", icon: FileText, label: "Retour aux devis" }]
              : step === 1
                ? [{ icon: ArrowLeft, label: "Revenir au client", onClick: () => setStep(0) }]
                : [{ icon: ArrowLeft, label: "Revenir aux options", onClick: () => setStep(1) }]
          }
        >
          {step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 0 ? "Continuer vers les options" : "Continuer vers la validation"}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allOptionsHaveLines || submitting}
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? "Création..." : "Créer les devis"}
            </button>
          )}
        </CreationWizardFooter>
      }
    >
      {/* Step 0: Client */}
      <CreationWizardPanel className={step === 0 ? "" : "hidden"}>
        <ClientSelector
          filteredClients={filteredClients}
          isCreating={isCreatingClient}
          isLoading={clientsLoading}
          newClient={newClient}
          onClearSelection={() => setSelectedClient(null)}
          onCreateClient={handleCreateClient}
          onNewClientChange={(field, value) => setNewClient((p) => ({ ...p, [field]: value }))}
          onSearchChange={setSearchClient}
          onSelectClient={setSelectedClient}
          recentClients={recentClients}
          searchValue={searchClient}
          selectedClient={selectedClient}
          showNewClient={showNewClient}
          onToggleNewClient={() => setShowNewClient((p) => !p)}
        />
      </CreationWizardPanel>

      {/* Step 1: Options config */}
      <CreationWizardPanel className={step === 1 ? "" : "hidden"}>
        <div className="space-y-4">
          {/* Option count toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/60 p-4 dark:border-white/8 dark:bg-white/5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre d&apos;options</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                onClick={() => setOptionCount(2)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${optionCount === 2 ? "bg-white text-slate-800 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500"}`}
              >
                2 options
              </button>
              <button
                onClick={() => setOptionCount(3)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${optionCount === 3 ? "bg-white text-slate-800 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500"}`}
              >
                3 options
              </button>
            </div>
          </div>

          {/* Option editors */}
          {options.slice(0, optionCount).map((opt, optIdx) => {
            const cfg = OPTION_LABELS[optIdx];
            const totals = optionTotals[optIdx];
            return (
              <div key={optIdx} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${cfg.color}`} />
                    <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {totals.totalTTC.toFixed(2)}€ <span className="text-xs font-normal text-slate-500">TTC</span>
                  </span>
                </div>

                {/* Lines */}
                <div className="space-y-2">
                  {opt.lignes.map((ligne, ligneIdx) => (
                    <div key={ligneIdx} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/80 p-2 dark:bg-slate-900/40">
                      <input
                        type="text"
                        placeholder="Prestation"
                        value={ligne.nomPrestation}
                        onChange={(e) => updateLigne(optIdx, ligneIdx, "nomPrestation", e.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:focus:border-violet-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={ligne.quantite || ""}
                        onChange={(e) => updateLigne(optIdx, ligneIdx, "quantite", parseFloat(e.target.value) || 0)}
                        className="w-16 rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-center text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:focus:border-violet-500"
                        placeholder="Qté"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ligne.prixUnitaire || ""}
                        onChange={(e) => updateLigne(optIdx, ligneIdx, "prixUnitaire", parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-right text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:focus:border-violet-500"
                        placeholder="Prix"
                      />
                      <span className="w-16 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {(ligne.totalLigne || ligne.quantite * ligne.prixUnitaire).toFixed(0)}€
                      </span>
                      <button onClick={() => removeLigne(optIdx, ligneIdx)} className="shrink-0 text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addLigne(optIdx)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  <Plus size={14} /> Ajouter une ligne
                </button>

                {/* Remise & TVA */}
                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Remise %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={opt.remise}
                      onChange={(e) => {
                        setOptions((prev) => {
                          const copy = [...prev];
                          copy[optIdx] = { ...copy[optIdx], remise: e.target.value };
                          return copy;
                        });
                      }}
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900/40 dark:focus:border-violet-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">TVA</label>
                    <select
                      value={opt.tva}
                      onChange={(e) => {
                        setOptions((prev) => {
                          const copy = [...prev];
                          copy[optIdx] = { ...copy[optIdx], tva: e.target.value };
                          return copy;
                        });
                      }}
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900/40 dark:focus:border-violet-500"
                    >
                      {TVA_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CreationWizardPanel>

      {/* Step 2: Review & Submit */}
      <CreationWizardPanel className={step === 2 ? "" : "hidden"}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 dark:border-white/8 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <FileText size={16} />
              Récapitulatif
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Client : <span className="font-medium text-slate-700 dark:text-slate-200">{selectedClient?.nom}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {optionCount} option{optionCount > 1 ? "s" : ""} configurée{optionCount > 1 ? "s" : ""}
            </p>
          </div>

          {options.slice(0, optionCount).map((opt, i) => {
            const cfg = OPTION_LABELS[i];
            const totals = optionTotals[i];
            return (
              <div key={i} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${cfg.color}`} />
                    <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {opt.lignes.map((l, j) => (
                    <div key={j} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>{l.nomPrestation || "—"} × {l.quantite}</span>
                      <span className="font-medium">{(l.totalLigne || l.quantite * l.prixUnitaire).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200/60 pt-2 text-sm font-bold dark:border-slate-700/60">
                  <span className={cfg.text}>Total TTC</span>
                  <span className="text-slate-900 dark:text-white">{totals.totalTTC.toFixed(2)}€</span>
                </div>
              </div>
            );
          })}

          {!allOptionsHaveLines && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <Sparkles size={14} />
              Chaque option doit avoir au moins une ligne.
            </div>
          )}
        </div>
      </CreationWizardPanel>
    </CreationWizardShell>
    </div>

    {/* ─── Desktop dense single-page form (hidden lg:block) ─── */}
    <div className="hidden lg:block">
      <ClientSubpageShell
        title="Devis multi-options"
        description="Proposez 2 ou 3 versions du devis au même client."
        eyebrow="Création"
        activeNav="devis"
        backHref="/devis"
        breadcrumbs={[
          { label: "Devis", href: "/devis" },
          { label: "Devis multi-options" },
        ]}
        metaPills={desktopMetaPills}
        showMobileDock={false}
        mobilePrimaryAction={null}
      >
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* LEFT 8/12 : Client + Configuration + Options */}
          <form
            className="lg:col-span-8 space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            {/* CLIENT */}
            <section className="lg-v2-panel p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="lg-v2-eyebrow">Client</p>
                  <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                    {selectedClient ? "Client sélectionné" : "Choisir un client"}
                  </h2>
                  <p className="mt-1 text-xs lg-v2-text-subtle">
                    Les {optionCount} versions du devis seront envoyées au même client.
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
                    onClick={() => setSelectedClient(null)}
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
                        setNewClient({ nom: "", email: "", telephone: "", adresse: "" });
                      }}
                      className="lg-v2-btn lg-v2-btn-ghost"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateClient()}
                      disabled={isCreatingClient}
                      className="lg-v2-btn lg-v2-btn-primary"
                    >
                      {isCreatingClient ? "Ajout..." : "Ajouter le client"}
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
                    {clientsLoading ? (
                      <p className="px-4 py-10 text-center text-sm lg-v2-text-subtle">
                        Chargement…
                      </p>
                    ) : filteredClients.length === 0 ? (
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
                              onClick={() => setSelectedClient(client)}
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

            {/* CONFIGURATION (option count) */}
            <section className="lg-v2-panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="lg-v2-eyebrow">Configuration</p>
                  <h2 className="mt-1 text-base font-semibold lg-v2-text-strong">
                    Nombre d&apos;options
                  </h2>
                  <p className="mt-1 text-xs lg-v2-text-subtle">
                    Le client recevra {optionCount} devis distincts à la même adresse.
                  </p>
                </div>
                <div
                  className="inline-flex rounded-lg border lg-v2-divider p-0.5"
                  role="radiogroup"
                  aria-label="Nombre d'options"
                >
                  {([2, 3] as const).map((count) => {
                    const isActive = optionCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setOptionCount(count)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold transition"
                        style={
                          isActive
                            ? {
                                backgroundColor: "var(--v2-primary)",
                                color: "var(--v2-primary-foreground)",
                              }
                            : { color: "var(--v2-text-muted)" }
                        }
                      >
                        {count} options
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* OPTIONS */}
            {options.slice(0, optionCount).map((opt, optIdx) => {
              const cfg = OPTION_LABELS[optIdx];
              const tone = desktopOptionTone[optIdx];
              const colors = toneColors[tone];
              const totals = optionTotals[optIdx];
              return (
                <section
                  key={`opt-${optIdx}`}
                  className="lg-v2-panel p-6"
                  style={{ borderLeft: `3px solid ${colors.border}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="lg-v2-eyebrow"
                        style={{ color: colors.text }}
                      >
                        Option {optIdx + 1}
                      </p>
                      <h2 className="mt-1 flex items-center gap-2 text-base font-semibold lg-v2-text-strong">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: colors.dot }}
                          aria-hidden
                        />
                        {cfg.label}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="lg-v2-eyebrow">Total TTC</p>
                      <p
                        className="mt-0.5 text-xl font-semibold tabular-nums"
                        style={{ color: colors.text }}
                      >
                        {totals.totalTTC.toFixed(2)}€
                      </p>
                    </div>
                  </div>

                  {opt.lignes.length > 0 ? (
                    <div className="mt-4 overflow-hidden rounded-lg border lg-v2-divider">
                      <table
                        className="w-full border-collapse text-left"
                        aria-label={`Lignes de l'option ${cfg.label}`}
                      >
                        <thead>
                          <tr>
                            <th className="lg-v2-table-header">Désignation</th>
                            <th className="lg-v2-table-header w-20 !text-right">Qté</th>
                            <th className="lg-v2-table-header w-16">Unité</th>
                            <th className="lg-v2-table-header w-28 !text-right">P.U. €</th>
                            <th className="lg-v2-table-header w-28 !text-right">Total €</th>
                            <th
                              className="lg-v2-table-header w-10"
                              aria-label="Supprimer"
                            ></th>
                          </tr>
                        </thead>
                        <tbody>
                          {opt.lignes.map((ligne, ligneIdx) => (
                            <tr
                              key={`row-${optIdx}-${ligneIdx}`}
                              className={
                                ligneIdx % 2 === 0
                                  ? "bg-[var(--v2-panel)]"
                                  : "bg-[var(--v2-panel-muted)]/40"
                              }
                            >
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={ligne.nomPrestation}
                                  onChange={(event) =>
                                    updateLigne(
                                      optIdx,
                                      ligneIdx,
                                      "nomPrestation",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                                  aria-label={`Désignation ligne ${ligneIdx + 1} de l'option ${cfg.label}`}
                                  placeholder="Désignation"
                                />
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.5"
                                  value={ligne.quantite || ""}
                                  onChange={(event) =>
                                    updateLigne(
                                      optIdx,
                                      ligneIdx,
                                      "quantite",
                                      parseFloat(event.target.value) || 0,
                                    )
                                  }
                                  className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-right text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                                  aria-label={`Quantité ligne ${ligneIdx + 1} de l'option ${cfg.label}`}
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={ligne.unite}
                                  onChange={(event) =>
                                    updateLigne(
                                      optIdx,
                                      ligneIdx,
                                      "unite",
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                                  aria-label={`Unité ligne ${ligneIdx + 1} de l'option ${cfg.label}`}
                                />
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={ligne.prixUnitaire || ""}
                                  onChange={(event) =>
                                    updateLigne(
                                      optIdx,
                                      ligneIdx,
                                      "prixUnitaire",
                                      parseFloat(event.target.value) || 0,
                                    )
                                  }
                                  className="w-full rounded border lg-v2-divider bg-transparent px-2 py-1 text-right text-sm focus:border-[var(--v2-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--v2-primary-soft)]"
                                  aria-label={`Prix unitaire ligne ${ligneIdx + 1} de l'option ${cfg.label}`}
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-2 py-2 text-right text-sm font-medium tabular-nums lg-v2-text-strong">
                                {(ligne.totalLigne || ligne.quantite * ligne.prixUnitaire).toFixed(2)}€
                              </td>
                              <td className="px-2 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeLigne(optIdx, ligneIdx)}
                                  className="lg-v2-btn lg-v2-btn-ghost !px-2"
                                  aria-label={`Supprimer la ligne ${ligneIdx + 1}`}
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
                    <p className="mt-4 rounded-lg border border-dashed lg-v2-divider px-4 py-6 text-center text-sm lg-v2-text-subtle">
                      Ajoutez au moins une ligne pour cette option.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => addLigne(optIdx)}
                      className="lg-v2-btn lg-v2-btn-secondary"
                    >
                      <Plus size={14} aria-hidden /> Ajouter une ligne
                    </button>
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="block">
                        <span className="text-xs font-medium lg-v2-text-muted">
                          Remise %
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={opt.remise}
                          onChange={(event) => {
                            const next = event.target.value;
                            setOptions((prev) => {
                              const copy = [...prev];
                              copy[optIdx] = { ...copy[optIdx], remise: next };
                              return copy;
                            });
                          }}
                          placeholder="0"
                          className="lg-v2-input mt-1.5 w-24"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium lg-v2-text-muted">
                          TVA
                        </span>
                        <select
                          value={opt.tva}
                          onChange={(event) => {
                            const next = event.target.value;
                            setOptions((prev) => {
                              const copy = [...prev];
                              copy[optIdx] = { ...copy[optIdx], tva: next };
                              return copy;
                            });
                          }}
                          className="lg-v2-input mt-1.5 w-28"
                        >
                          {TVA_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  {totals.totalHT > 0 ? (
                    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t lg-v2-divider pt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <dt className="lg-v2-text-muted">HT</dt>
                        <dd className="font-medium tabular-nums lg-v2-text">
                          {totals.totalHT.toFixed(2)}€
                        </dd>
                      </div>
                      {totals.remise > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <dt className="lg-v2-text-muted">Remise</dt>
                          <dd
                            className="font-medium tabular-nums"
                            style={{ color: "var(--v2-warning)" }}
                          >
                            −{totals.remise}%
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <dt className="lg-v2-text-muted">TVA</dt>
                        <dd className="font-medium tabular-nums lg-v2-text">
                          {totals.tva}%
                        </dd>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <dt className="lg-v2-text-muted">Total TTC</dt>
                        <dd
                          className="font-semibold tabular-nums"
                          style={{ color: colors.text }}
                        >
                          {totals.totalTTC.toFixed(2)}€
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </section>
              );
            })}
          </form>

          {/* RIGHT 4/12 sticky summary rail */}
          <aside className="self-start lg:col-span-4 lg:sticky lg:top-6 space-y-4">
            <div className="lg-v2-panel p-6">
              <p className="lg-v2-eyebrow">Récapitulatif</p>
              <h3 className="mt-1 text-base font-semibold lg-v2-text-strong">
                {selectedClient ? selectedClient.nom : "Aucun client sélectionné"}
              </h3>
              <p className="mt-1 text-xs lg-v2-text-subtle">
                {optionCount} version{optionCount > 1 ? "s" : ""} du devis seront créées.
              </p>

              <div className="mt-5 space-y-2">
                {optionTotals.map((totals, idx) => {
                  const cfg = OPTION_LABELS[idx];
                  const tone = desktopOptionTone[idx];
                  const colors = toneColors[tone];
                  const hasLines = options[idx].lignes.length > 0;
                  return (
                    <div
                      key={`rail-${idx}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: hasLines ? colors.softBg : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: colors.dot }}
                          aria-hidden
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: colors.text }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: colors.text }}
                        >
                          {totals.totalTTC.toFixed(2)}€
                        </span>
                        {!hasLines ? (
                          <p className="text-[10px] uppercase tracking-wide lg-v2-text-subtle">
                            — vide
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allOptionsHaveLines ? (
                <p
                  className="mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{
                    borderColor: "var(--v2-warning-soft)",
                    backgroundColor: "var(--v2-warning-soft)",
                    color: "var(--v2-warning)",
                  }}
                >
                  <Sparkles size={14} aria-hidden className="mt-0.5 shrink-0" />
                  <span>Chaque option doit contenir au moins une ligne.</span>
                </p>
              ) : null}

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!selectedClient || !allOptionsHaveLines || submitting}
                  className="w-full lg-v2-btn lg-v2-btn-primary"
                >
                  <Send size={14} aria-hidden />
                  {submitting
                    ? "Création..."
                    : `Créer les ${optionCount} devis`}
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
    </>
  );
}
