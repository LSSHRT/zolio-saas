"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  HardHat,
  Palette,
  Sparkles,
  Wrench,
  Brush,
  Zap,
  Home,
  Car,
  TreePine,
  Shield,
} from "lucide-react";

const TRADES = [
  { key: "macon", label: "Maçon", icon: HardHat },
  { key: "electricien", label: "Électricien", icon: Zap },
  { key: "plombier", label: "Plombier", icon: Wrench },
  { key: "peintre", label: "Peintre", icon: Brush },
  { key: "menuisier", label: "Menuisier", icon: Home },
  { key: "paysagiste", label: "Paysagiste", icon: TreePine },
  { key: "couvreur", label: "Couvreur", icon: Shield },
  { key: "carreleur", label: "Carreleur", icon: Palette },
  { key: "garage", label: "Garagiste", icon: Car },
  { key: "autre", label: "Autre", icon: Sparkles },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [trade, setTrade] = useState("");
  const [company, setCompany] = useState({ nom: "", siret: "", telephone: "", adresse: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  const handleNext = () => {
    if (step === 1 && !trade) return toast.error("Sélectionnez votre métier");
    if (step === 2 && !company.nom.trim()) return toast.error("Nom de l'entreprise requis");
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save company info
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: trade,
          companyName: company.nom,
          companySiret: company.siret,
          companyPhone: company.telephone,
          companyAddress: company.adresse,
        },
      });

      // Import starter catalog
      const res = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });

      if (res.ok) {
        await user?.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingCompleted: true,
            starterCatalogImported: true,
          },
        });
        toast.success("Configuration terminée !");
        router.push("/dashboard");
      } else {
        toast.error("Erreur lors de l'import du catalogue");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${
                s <= step ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Métier */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quel est votre métier ?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Nous importerons automatiquement des prestations types adaptées.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TRADES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTrade(t.key)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                        trade === t.key
                          ? "border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-500/15 dark:text-violet-300"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-semibold">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Entreprise */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Votre entreprise</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Ces informations apparaîtront sur vos devis et factures.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom de l'entreprise *</span>
                  <input
                    value={company.nom}
                    onChange={(e) => setCompany({ ...company, nom: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="Entreprise Dupont SARL"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SIRET</span>
                  <input
                    value={company.siret}
                    onChange={(e) => setCompany({ ...company, siret: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="123 456 789 00012"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</span>
                  <input
                    value={company.telephone}
                    onChange={(e) => setCompany({ ...company, telephone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="06 12 34 56 78"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse</span>
                  <input
                    value={company.adresse}
                    onChange={(e) => setCompany({ ...company, adresse: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="12 rue du Chantier, 75001 Paris"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 3: Résumé */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tout est prêt ! 🎉</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Voici le résumé de votre configuration.
              </p>
              <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Métier</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    {TRADES.find((t) => t.key === trade)?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Entreprise</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{company.nom}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Un catalogue de prestations types sera importé automatiquement.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
            >
              Suivant
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? "Configuration..." : "Terminer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
