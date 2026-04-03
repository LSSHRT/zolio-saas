"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  CreationWizardFooter,
  CreationWizardPanel,
  CreationWizardShell,
  type CreationWizardStep,
} from "@/components/client-creation-wizard";
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

  return (
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
              Proposez 2 ou 3 versions au même client pour augmenter vos chances d'acceptation.
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
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre d'options</span>
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
  );
}
