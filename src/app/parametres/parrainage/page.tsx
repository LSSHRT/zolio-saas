"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Sparkles,
  Users,
  Award,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { MetricTile } from "@/components/desktop";
import { EmptyState } from "@/components/empty-state";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

interface ReferralData {
  code: string | null;
  count: number;
  isPro: boolean;
}

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://zolio.site";

export default function ParrainagePage() {
  const { data, mutate, isLoading } = useSWR<ReferralData>("/api/referral", fetcher, {
    revalidateOnFocus: false,
  });
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = data?.code ?? null;
  const count = data?.count ?? 0;

  const link = useMemo(() => (code ? `${APP_URL}/?ref=${code}` : ""), [code]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/referral", { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
      await mutate();
      toast.success("Votre lien de parrainage est prêt !");
    } catch {
      toast.error("Impossible de générer le lien.");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copie impossible.");
    }
  };

  // Auto-clear copied state if user navigates away
  useEffect(() => () => setCopied(false), []);

  const shareText = useMemo(
    () =>
      `Salut ! Je teste Zolio pour mes devis et factures, c'est super pratique. ` +
      `Avec mon lien tu démarres avec 1 mois Pro offert : ${link}`,
    [link],
  );

  const shareWhatsApp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const shareSms = `sms:?body=${encodeURIComponent(shareText)}`;
  const shareMail = `mailto:?subject=${encodeURIComponent("Essaie Zolio avec mon lien parrainage")}&body=${encodeURIComponent(shareText)}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Zolio · Parrainage", text: shareText, url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  };

  return (
    <ClientSubpageShell
      title="Parrainez vos collègues"
      description="1 mois Pro offert pour chaque artisan que vous parrainez — et 1 mois Pro offert pour lui aussi."
      eyebrow="Programme de parrainage"
      activeNav="tools"
      summary={
        <div className="grid gap-4 md:grid-cols-3 lg:hidden">
          <ClientHeroStat
            label="Filleuls inscrits"
            value={String(count)}
            detail={count === 0 ? "Lancez-vous !" : count === 1 ? "Premier filleul 🎉" : "Continuez !"}
            tone="violet"
          />
          <ClientHeroStat
            label="Mois Pro gagnés"
            value={String(count)}
            detail="1 mois par filleul converti"
            tone="emerald"
          />
          <ClientHeroStat
            label="Code"
            value={code ? code.slice(-6).toUpperCase() : "—"}
            detail={code ? "Actif" : "Pas encore généré"}
            tone="amber"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Votre parrainage"
          items={[
            { label: "Filleuls", value: String(count), detail: "Inscrits via votre lien", tone: "violet" },
            { label: "Mois Pro", value: String(count), detail: "Cumulés", tone: "emerald" },
            { label: "Code", value: code ? code.slice(-6).toUpperCase() : "—", detail: "Votre identifiant", tone: "amber" },
          ]}
        />
      }
    >
      {/* ─── Mobile view (< lg) — préservée ──────────────────────── */}
      <div className="lg:hidden">
        <ClientSectionCard>
          {isLoading ? (
            <div className="grid gap-4">
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-white/6 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/6 animate-pulse" />
            </div>
          ) : !code ? (
            <EmptyState
              icon={Gift}
              tone="violet"
              title="Activez votre lien de parrainage"
              description="Générez votre lien unique et partagez-le. Pour chaque artisan qui s'inscrit et active Pro grâce à vous, vous recevez 1 mois Pro gratuit."
              actions={[
                {
                  label: generating ? "Génération..." : "Générer mon lien",
                  onClick: generate,
                  variant: "primary",
                  icon: Sparkles,
                },
              ]}
              footnote="Votre filleul reçoit aussi 1 mois Pro offert. Win-win."
            />
          ) : (
            <div className="space-y-6">
              {/* Lien partageable */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-500/8 via-fuchsia-500/4 to-orange-500/4 p-5 dark:border-violet-400/20"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-200">
                  Votre lien personnel
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="flex-1 truncate rounded-xl border border-slate-200/70 bg-white/85 px-4 py-3 font-mono text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950/40 dark:text-white">
                    {link}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-violet-600/40"
                  >
                    {copied ? (
                      <>
                        <Check size={16} /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copier
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Partage rapide */}
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Partager rapidement</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => void handleNativeShare()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <Share2 size={15} /> Partager
                  </button>
                  <a
                    href={shareWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:border-emerald-400/20 dark:text-emerald-200"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <a
                    href={shareSms}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-200/70 bg-blue-500/10 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-500/15 dark:border-blue-400/20 dark:text-blue-200"
                  >
                    <MessageCircle size={15} /> SMS
                  </a>
                  <a
                    href={shareMail}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <Mail size={15} /> E-mail
                  </a>
                </div>
              </div>

              {/* Comment ça marche */}
              <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 dark:border-white/8 dark:bg-white/4 sm:grid-cols-3">
                <Step n={1} icon={Share2} title="Partagez" description="Envoyez votre lien à un confrère artisan." />
                <Step n={2} icon={Users} title="Il s'inscrit" description="Il crée son compte via votre lien." />
                <Step n={3} icon={Award} title="Vous gagnez" description="1 mois Pro offert pour vous deux." />
              </div>
            </div>
          )}
        </ClientSectionCard>
      </div>

      {/* ─── Desktop view (lg+) — v2 dense ──────────────────────── */}
      <div className="hidden lg:block lg:space-y-6">
        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricTile
            label="Filleuls inscrits"
            value={String(count)}
            detail={count === 0 ? "Lancez-vous !" : count === 1 ? "Premier filleul" : "Continuez !"}
            icon={Users}
            tone="neutral"
          />
          <MetricTile
            label="Mois Pro gagnés"
            value={String(count)}
            detail="1 mois par filleul converti"
            icon={Award}
            tone="success"
          />
          <MetricTile
            label="Code"
            value={code ? code.slice(-6).toUpperCase() : "—"}
            detail={code ? "Actif" : "Pas encore généré"}
            icon={Gift}
            tone={code ? "success" : "neutral"}
          />
          <MetricTile
            label="Statut"
            value={data?.isPro ? "Pro" : "Gratuit"}
            detail={data?.isPro ? "Abonnement actif" : "Passe Pro pour booster"}
            icon={BadgeCheck}
            tone={data?.isPro ? "success" : "warning"}
          />
        </div>

        {/* Body 2-col */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            {/* Lien & partage */}
            <section className="lg-v2-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="lg-v2-eyebrow">Votre lien personnel</p>
                  <p className="mt-1 text-sm lg-v2-text-muted">
                    Partagez ce lien unique. Vous et votre filleul recevez 1 mois Pro offert.
                  </p>
                </div>
                {code ? (
                  <span className="lg-v2-pill lg-v2-pill-success">Actif</span>
                ) : (
                  <span className="lg-v2-pill">Inactif</span>
                )}
              </div>

              {isLoading ? (
                <div className="grid gap-3">
                  <div className="h-12 rounded-xl bg-slate-100 dark:bg-white/6 animate-pulse" />
                  <div className="h-24 rounded-2xl bg-slate-100 dark:bg-white/6 animate-pulse" />
                </div>
              ) : !code ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border lg-v2-divider p-10 text-center">
                  <Gift size={42} strokeWidth={1.5} className="text-[var(--v2-primary)]" aria-hidden />
                  <div className="max-w-md">
                    <p className="text-base font-semibold lg-v2-text-strong">Activez votre lien de parrainage</p>
                    <p className="mt-1 text-sm lg-v2-text-muted">
                      Générez votre lien unique et partagez-le. Pour chaque artisan qui s&apos;inscrit et active Pro grâce à vous, vous recevez 1 mois Pro gratuit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={generating}
                    className="lg-v2-btn lg-v2-btn-primary disabled:opacity-50"
                  >
                    <Sparkles size={14} aria-hidden /> {generating ? "Génération..." : "Générer mon lien"}
                  </button>
                  <p className="text-xs lg-v2-text-subtle">
                    Votre filleul reçoit aussi 1 mois Pro offert. Win-win.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-stretch gap-3">
                    <code className="flex-1 truncate rounded-xl border lg-v2-divider bg-[var(--v2-panel-muted)] px-4 py-3 font-mono text-sm lg-v2-text-strong">
                      {link}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="lg-v2-btn lg-v2-btn-primary px-5"
                    >
                      {copied ? (
                        <>
                          <Check size={14} aria-hidden /> Copié
                        </>
                      ) : (
                        <>
                          <Copy size={14} aria-hidden /> Copier
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <p className="lg-v2-eyebrow mb-2">Partager rapidement</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => void handleNativeShare()}
                        className="lg-v2-btn lg-v2-btn-secondary justify-center"
                      >
                        <Share2 size={14} aria-hidden /> Partager
                      </button>
                      <a
                        href={shareWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="lg-v2-btn lg-v2-btn-secondary justify-center"
                      >
                        <MessageCircle size={14} aria-hidden /> WhatsApp
                      </a>
                      <a
                        href={shareSms}
                        className="lg-v2-btn lg-v2-btn-secondary justify-center"
                      >
                        <MessageCircle size={14} aria-hidden /> SMS
                      </a>
                      <a
                        href={shareMail}
                        className="lg-v2-btn lg-v2-btn-secondary justify-center"
                      >
                        <Mail size={14} aria-hidden /> E-mail
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Comment ça marche (table-like) */}
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Comment ça marche</p>
              <p className="mt-1 text-sm lg-v2-text-muted">3 étapes pour gagner du Pro gratuit.</p>
              <div className="mt-4 overflow-hidden rounded-xl border lg-v2-divider">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="lg-v2-table-header w-12 text-center">#</th>
                      <th className="lg-v2-table-header">Étape</th>
                      <th className="lg-v2-table-header">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="lg-v2-table-row">
                      <td className="lg-v2-table-cell text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--v2-primary-soft)] text-xs font-bold text-[var(--v2-primary)]">1</span>
                      </td>
                      <td className="lg-v2-table-cell">
                        <span className="inline-flex items-center gap-2 text-sm font-medium lg-v2-text-strong">
                          <Share2 size={14} className="text-[var(--v2-primary)]" aria-hidden /> Partagez
                        </span>
                      </td>
                      <td className="lg-v2-table-cell text-sm lg-v2-text-muted">
                        Envoyez votre lien à un confrère artisan via WhatsApp, SMS ou e-mail.
                      </td>
                    </tr>
                    <tr className="lg-v2-table-row">
                      <td className="lg-v2-table-cell text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--v2-primary-soft)] text-xs font-bold text-[var(--v2-primary)]">2</span>
                      </td>
                      <td className="lg-v2-table-cell">
                        <span className="inline-flex items-center gap-2 text-sm font-medium lg-v2-text-strong">
                          <Users size={14} className="text-[var(--v2-primary)]" aria-hidden /> Il s&apos;inscrit
                        </span>
                      </td>
                      <td className="lg-v2-table-cell text-sm lg-v2-text-muted">
                        Il crée son compte Zolio via votre lien dédié.
                      </td>
                    </tr>
                    <tr className="lg-v2-table-row bg-[var(--v2-panel-muted)]">
                      <td className="lg-v2-table-cell text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--v2-success-soft)] text-xs font-bold text-[var(--v2-success)]">3</span>
                      </td>
                      <td className="lg-v2-table-cell">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold lg-v2-text-strong">
                          <Award size={14} className="text-[var(--v2-success)]" aria-hidden /> Vous gagnez
                        </span>
                      </td>
                      <td className="lg-v2-table-cell text-sm font-medium text-[var(--v2-success)]">
                        1 mois Pro offert pour vous deux.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right rail (sticky) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Actions</p>
              <p className="mt-1 text-sm lg-v2-text-muted">Gérez et partagez votre lien.</p>
              <div className="mt-4 flex flex-col gap-2">
                {code ? (
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="lg-v2-btn lg-v2-btn-primary justify-center"
                  >
                    {copied ? (
                      <>
                        <Check size={14} aria-hidden /> Copié
                      </>
                    ) : (
                      <>
                        <Copy size={14} aria-hidden /> Copier le lien
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={generate}
                    disabled={generating}
                    className="lg-v2-btn lg-v2-btn-primary justify-center disabled:opacity-50"
                  >
                    <Sparkles size={14} aria-hidden /> {generating ? "Génération..." : "Générer mon lien"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  disabled={!code}
                  className="lg-v2-btn lg-v2-btn-secondary justify-center disabled:opacity-50"
                >
                  <Share2 size={14} aria-hidden /> Partager…
                </button>
              </div>
            </section>

            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Récompense</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--v2-success-soft)] text-[var(--v2-success)]">
                    <Gift size={16} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold lg-v2-text-strong">+1 mois Pro</p>
                    <p className="text-xs lg-v2-text-muted">
                      Crédité automatiquement à chaque filleul converti.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--v2-primary-soft)] text-[var(--v2-primary)]">
                    <BadgeCheck size={16} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold lg-v2-text-strong">Cumulable</p>
                    <p className="text-xs lg-v2-text-muted">
                      Pas de limite : plus vous parrainez, plus vous gagnez.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Conseil</p>
              <p className="mt-2 inline-flex items-start gap-2 text-sm lg-v2-text-muted">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--v2-primary)]" aria-hidden />
                <span>
                  Personnalisez votre message à votre confrère : précisez ce que Zolio vous a apporté concrètement.
                </span>
              </p>
            </section>
          </aside>
        </div>
      </div>
    </ClientSubpageShell>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  description,
}: {
  n: number;
  icon: typeof Gift;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-violet-500/30">
        {n}
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
          <Icon size={13} className="text-violet-500" /> {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}
