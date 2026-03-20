"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import {
  CreationWizardFooter,
  CreationWizardPanel,
  CreationWizardShell,
  type CreationWizardStep,
} from "@/components/client-creation-wizard";
import { STARTER_CATEGORIES } from "@/lib/trades";

const STEPS: CreationWizardStep[] = [
  {
    title: "Base",
    description: "Catégorie, nom et unité de votre ligne catalogue.",
  },
  {
    title: "Prix",
    description: "Prix HT, coût estimé et stock éventuel.",
  },
];

const UNITS = ["m²", "ml", "heure", "forfait", "unité"];

const EMPTY_FORM = {
  categorie: "Autre",
  cout: "",
  nom: "",
  prix: "",
  stock: "",
  unite: "m²",
};

export default function NouvellePrestationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const canContinue = form.nom.trim().length > 0 && form.unite.trim().length > 0;
  const canSubmit = canContinue && form.prix.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Le nom et le prix HT sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de créer la prestation");
      }

      router.push("/catalogue?created=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de créer la prestation";
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <CreationWizardShell
      backHref="/catalogue"
      currentStep={step}
      description="Un parcours plus propre pour enrichir votre catalogue sans empiler un gros formulaire dans la page liste."
      eyebrow="Wizard catalogue"
      steps={STEPS}
      title="Nouvelle prestation"
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
                    toast.error("Renseignez au moins la catégorie, le nom et l’unité.");
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
                {saving ? "Création..." : "Ajouter au catalogue"}
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
                Base prestation
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Définissez la ligne métier
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Le catalogue doit rester simple à enrichir : une catégorie propre, un nom clair, puis l’unité de vente.
              </p>
            </div>

            <select
              value={form.categorie}
              onChange={(event) => setForm((current) => ({ ...current, categorie: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            >
              {STARTER_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={form.unite}
              onChange={(event) => setForm((current) => ({ ...current, unite: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={form.nom}
              onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
              placeholder="Nom de la prestation"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6 lg:col-span-2"
            />
          </div>
        </CreationWizardPanel>
      ) : (
        <CreationWizardPanel>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Prix & stock
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Ajoutez les repères économiques utiles
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Prix HT obligatoire. Coût et stock restent optionnels pour garder une création rapide.
              </p>
            </div>

            <input
              type="number"
              step="0.01"
              min="0"
              value={form.prix}
              onChange={(event) => setForm((current) => ({ ...current, prix: event.target.value }))}
              placeholder="Prix HT"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cout}
              onChange={(event) => setForm((current) => ({ ...current, cout: event.target.value }))}
              placeholder="Coût estimé"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              placeholder="Stock initial"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
          </div>
        </CreationWizardPanel>
      )}
    </CreationWizardShell>
  );
}
