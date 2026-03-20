"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import {
  CreationWizardFooter,
  CreationWizardPanel,
  CreationWizardShell,
  type CreationWizardStep,
} from "@/components/client-creation-wizard";

const STEPS: CreationWizardStep[] = [
  {
    title: "Cadre",
    description: "Date et catégorie de la dépense.",
  },
  {
    title: "Montant",
    description: "Description fournisseur et montant TTC.",
  },
];

const CATEGORIES = [
  "Achats Matériaux",
  "Sous-traitance",
  "Outillage & Équipement",
  "Véhicule & Carburant",
  "Assurances",
  "Frais Bancaires",
  "Repas & Déplacements",
  "Autre",
];

export default function NouvelleDepensePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categorie: CATEGORIES[0],
    date: new Date().toISOString().split("T")[0],
    description: "",
    montant: "",
  });

  const amountLabel = useMemo(() => {
    const value = Number.parseFloat(form.montant || "0");
    return Number.isFinite(value) ? `${value.toFixed(2)} €` : "0,00 €";
  }, [form.montant]);

  const canContinue = Boolean(form.date && form.categorie);
  const canSubmit = Boolean(form.description.trim() && form.montant.trim());

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("La description et le montant TTC sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d’ajouter la dépense");
      }

      router.push("/depenses?created=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d’ajouter la dépense";
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <CreationWizardShell
      backHref="/depenses"
      currentStep={step}
      description="Un flux plus lisible pour enregistrer une dépense sans ouvrir un gros formulaire inline dans la liste."
      eyebrow="Wizard dépense"
      steps={STEPS}
      title="Nouvelle dépense"
      footer={
        <CreationWizardFooter>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Étape {step + 1} sur {STEPS.length}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
              >
                Précédent
              </button>
            ) : null}

            {step === 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (!canContinue) {
                    toast.error("Renseignez la date et la catégorie.");
                    return;
                  }
                  setStep(1);
                }}
                disabled={!canContinue}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuer
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving || !canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Enregistrement..." : "Enregistrer la dépense"}
              </button>
            )}
          </div>
        </CreationWizardFooter>
      }
    >
      {step === 0 ? (
        <CreationWizardPanel>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Cadre
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Datez et classez la dépense
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                On garde le flux simple : d’abord le contexte comptable, ensuite le montant et le fournisseur.
              </p>
            </div>

            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />

            <select
              value={form.categorie}
              onChange={(event) => setForm((current) => ({ ...current, categorie: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </CreationWizardPanel>
      ) : (
        <CreationWizardPanel>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                  Montant
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                  Décrivez ce que vous avez payé
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Fournisseur ou description, puis montant TTC. Le reste de la page dépense continue d’utiliser le modèle existant.
                </p>
              </div>

              <input
                type="text"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Ex: Matériaux Leroy Merlin"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />

              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montant}
                onChange={(event) => setForm((current) => ({ ...current, montant: event.target.value }))}
                placeholder="Montant TTC"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </div>

            <div className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Aperçu
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{form.categorie}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {amountLabel}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Cette version conserve le modèle dépenses actuel: date, catégorie, description et montant TTC.
              </p>
            </div>
          </div>
        </CreationWizardPanel>
      )}
    </CreationWizardShell>
  );
}
