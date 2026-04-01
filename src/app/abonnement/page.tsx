"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { getSupportHref, isExternalSupportHref } from "@/lib/support";

const PLAN_FEATURES = [
  "Devis & factures avec acomptes et options",
  "Signature électronique en ligne et sur place",
  "Assistant IA pour rédiger vos devis plus vite",
  "Planning chantiers et suivi des dépenses",
  "Relances, suivi de lecture et avis Google",
  "Catalogue métier, logo et export comptable",
  "Factures récurrentes & automatisation",
  "Export CSV & livre URSSAF",
  "Vue kanban pour devis et factures",
  "Support prioritaire",
] as const;

const FREE_FEATURES = [
  "3 devis par mois",
  "Interface complète mobile & desktop",
  "Signature électronique",
  "Suivi du pipeline",
] as const;

const ACTIVATION_STEPS = [
  "Activation immédiate depuis votre espace client",
  "Premier devis accompagné si besoin",
  "Configuration entreprise et logo en quelques minutes",
] as const;

export default function AbonnementPage() {
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  const price = isAnnual ? 19 : 29;
  const billedLabel = isAnnual ? "228€ / an" : "29€ / mois";
  const savings = useMemo(() => 29 * 12 - 19 * 12, []);
  const supportHref = getSupportHref({
    subject: "Accompagnement Zolio Pro",
    message:
      "Bonjour, je souhaite être accompagné pour activer Zolio Pro et configurer mon premier devis.",
  });
  const supportIsExternal = isExternalSupportHref(supportHref);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnnual }),
      });
      const payload = await res.json();

      if (!res.ok || !payload.url) {
        throw new Error(payload.error || "Erreur lors de l'initialisation du paiement Stripe.");
      }

      window.location.href = payload.url;
    } catch (error) {
      logError("abonnement", error);
      toast.error(error instanceof Error ? error.message : "Impossible de lancer le paiement Stripe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientSubpageShell
      title="Abonnement Zolio Pro"
      description="Passez en version pro sans alourdir votre quotidien : une offre claire, lisible en mobile vertical et pensée pour activer votre flux devis rapidement."
      eyebrow="Conversion & abonnement"
      activeNav="tools"
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Tarif"
            value={`${price}€`}
            detail={isAnnual ? "Équivalent mensuel" : "Sans engagement annuel"}
            tone="violet"
          />
          <ClientHeroStat
            label="Facturation"
            value={billedLabel}
            detail={isAnnual ? "Paiement annuel" : "Paiement mensuel"}
            tone="slate"
          />
          <ClientHeroStat
            label="Économie"
            value={isAnnual ? `${savings}€` : "0€"}
            detail={isAnnual ? "Par an vs mensuel" : "Passez en annuel pour économiser"}
            tone="emerald"
          />
          <ClientHeroStat
            label="Support"
            value="Inclus"
            detail="Premier devis accompagné si besoin"
            tone="amber"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Offre claire sur mobile"
          description="Comparez vite le mensuel et l'annuel, puis activez Zolio Pro sans devoir faire défiler une page marketing trop dense."
          badge={isAnnual ? "Annuel -30%" : "Mensuel"}
          items={[
            {
              label: "Tarif",
              value: `${price}€`,
              detail: isAnnual ? "Équiv./mois" : "Par mois",
              tone: "violet",
            },
            {
              label: "Facturé",
              value: billedLabel,
              detail: isAnnual ? "Annuel" : "Mensuel",
              tone: "slate",
            },
            {
              label: "Économie",
              value: isAnnual ? `${savings}€` : "-",
              detail: isAnnual ? "Chaque année" : "Activez l'annuel",
              tone: "emerald",
            },
            {
              label: "Mise en route",
              value: "Offerte",
              detail: "Support inclus",
              tone: "amber",
            },
          ]}
        />
      }
    >
      <ClientSectionCard>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-[1.9rem] border border-violet-200/70 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 p-5 text-white shadow-[0_28px_90px_-45px_rgba(76,29,149,0.75)] sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-100">
                  <Sparkles size={13} />
                  Zolio Pro
                </span>
                <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                  Sans engagement
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Passez en mode pro, pas en mode usine à gaz.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Débloquez les fonctions qui comptent vraiment sur le terrain : devis illimités, signature,
                  facturation, planning et accompagnement pour démarrer sans friction.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnual(false)}
                    className={`rounded-[1rem] px-3 py-3 text-sm font-semibold transition ${
                      !isAnnual
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(true)}
                    className={`rounded-[1rem] px-3 py-3 text-sm font-semibold transition ${
                      isAnnual
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Annuel
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        -30%
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-100/80">
                    Offre active
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight sm:text-5xl">{price}€</span>
                    <span className="pb-1 text-sm text-slate-300">/ mois</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {isAnnual ? `Facturé ${billedLabel} · ${savings}€ économisés / an` : `Facturé ${billedLabel}`}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-2 text-xs font-semibold text-slate-100">
                  <Zap size={14} className="text-yellow-300" />
                  Activation rapide
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleSubscribe()}
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                      Redirection...
                    </span>
                  ) : (
                    <>
                      S&apos;abonner à Zolio Pro
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <a
                  href={supportHref}
                  target={supportIsExternal ? "_blank" : undefined}
                  rel={supportIsExternal ? "noreferrer" : undefined}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:border-violet-300/40 hover:bg-white/12 sm:w-auto"
                >
                  Être accompagné
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-[1.7rem] border border-emerald-200/70 bg-emerald-50/80 p-5 dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-200">
                Mise en route offerte
              </p>
              <div className="mt-4 space-y-3">
                {ACTIVATION_STEPS.map((step) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm dark:bg-white/10 dark:text-emerald-200">
                      <CheckCircle2 size={14} />
                    </span>
                    <p className="text-sm leading-6 text-emerald-950 dark:text-emerald-50">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-slate-200/70 bg-slate-50/85 p-5 dark:border-white/8 dark:bg-white/4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Réassurance
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Shield size={16} className="text-violet-500 dark:text-violet-200" />
                    Stripe sécurisé
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Paiement protégé et redirection immédiate vers le checkout sécurisé.
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Clock3 size={16} className="text-violet-500 dark:text-violet-200" />
                    Activation rapide
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Passez de l&apos;offre à votre premier devis pro sans tunnel complexe.
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <BadgeCheck size={16} className="text-violet-500 dark:text-violet-200" />
                    Accompagnement inclus
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Support disponible pour activer le compte et cadrer votre premier flux client.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Ce qui est inclus
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white sm:text-2xl">
                Les fonctions utiles au quotidien, sans page surchargée
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Tout est présenté en cartes verticales pour rester lisible au pouce, même sur un écran compact.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PLAN_FEATURES.map((feature) => (
              <div
                key={feature}
                className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-700 dark:bg-violet-500/12 dark:text-violet-200">
                    <CheckCircle2 size={15} />
                  </span>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
