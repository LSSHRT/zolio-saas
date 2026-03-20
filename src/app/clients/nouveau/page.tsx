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

const STEPS: CreationWizardStep[] = [
  {
    title: "Identité",
    description: "Nommer clairement la fiche client avant tout.",
  },
  {
    title: "Contact",
    description: "Email, téléphone et adresse pour les relances et les devis.",
  },
];

const EMPTY_FORM = {
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
};

export default function NouveauClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const canContinue = form.nom.trim().length > 0;

  const handleNext = () => {
    if (!canContinue) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    setStep(1);
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de créer le client");
      }

      router.push("/clients?created=1");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de créer le client";
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <CreationWizardShell
      backHref="/clients"
      currentStep={step}
      description="Un parcours plus lisible sur mobile pour créer une fiche claire sans se perdre dans la liste clients."
      eyebrow="Wizard client"
      steps={STEPS}
      title="Nouveau client"
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
                onClick={handleNext}
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
                disabled={saving || !canContinue}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Création..." : "Créer le client"}
              </button>
            )}
          </div>
        </CreationWizardFooter>
      }
    >
      {step === 0 ? (
        <CreationWizardPanel>
          <div className="max-w-2xl space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Identité
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Commencez par le nom du client
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Le nom suffit pour créer la fiche. Les infos de contact peuvent être complétées juste après.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom complet
              </span>
              <input
                type="text"
                value={form.nom}
                onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                placeholder="Ex: Martin Dupont"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </label>
          </div>
        </CreationWizardPanel>
      ) : (
        <CreationWizardPanel>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Contact & adresse
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Ajoutez de quoi relancer et facturer plus vite
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ces champs restent facultatifs, mais ils accélèrent ensuite l’envoi des devis et le suivi.
              </p>
            </div>

            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              type="text"
              value={form.telephone}
              onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))}
              placeholder="Téléphone"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              type="text"
              value={form.adresse}
              onChange={(event) => setForm((current) => ({ ...current, adresse: event.target.value }))}
              placeholder="Adresse / chantier"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6 lg:col-span-2"
            />
          </div>
        </CreationWizardPanel>
      )}
    </CreationWizardShell>
  );
}
