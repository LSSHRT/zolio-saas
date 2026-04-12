import Image from "next/image";
import Link from "next/link";
import { Camera, Mail, ReceiptText, Save, Send, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";
import { ClientSectionCard } from "@/components/client-shell";
import type { Client, CreateDevisMode } from "../types";

type SummaryRailProps = {
  acompte: string;
  canSubmit: boolean;
  emailHint: string | null;
  hasLines: boolean;
  isPro: boolean;
  mode: CreateDevisMode | null;
  showActions?: boolean;
  onAcompteChange: (value: string) => void;
  onCreateAndSend: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemiseChange: (value: string) => void;
  onRemovePhoto: (index: number) => void;
  onSaveOnly: () => void;
  onTvaChange: (value: string) => void;
  photos: string[];
  remainingTrialQuotes: number | null;
  remise: string;
  selectedClient: Client | null;
  sticky?: boolean;
  totalHT: number;
  totalTTC: number;
  totalTVA: number;
  trialLocked: boolean;
  tva: string;
  marginEstimate: number;
};

const TVA_OPTIONS = [
  { label: "0% Auto", value: "0" },
  { label: "5.5%", value: "5.5" },
  { label: "10%", value: "10" },
  { label: "20%", value: "20" },
];

export function SummaryRail({
  acompte,
  canSubmit,
  emailHint,
  hasLines,
  isPro,
  mode,
  showActions = true,
  onAcompteChange,
  onCreateAndSend,
  onFileUpload,
  onRemiseChange,
  onRemovePhoto,
  onSaveOnly,
  onTvaChange,
  photos,
  remainingTrialQuotes,
  remise,
  selectedClient,
  sticky = true,
  totalHT,
  totalTTC,
  totalTVA,
  trialLocked,
  tva,
  marginEstimate,
}: SummaryRailProps) {
  const saveBusy = mode === "save";
  const sendBusy = mode === "send";

  return (
    <div className={sticky ? "space-y-5 xl:sticky xl:top-28 xl:self-start" : "space-y-5"}>
      <ClientSectionCard>
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Résumé &amp; actions
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Le devis se valide ici
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Réglez vos paramètres de prix, ajoutez vos annexes et choisissez explicitement entre création seule ou création + envoi.
              </p>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 ring-1 ring-violet-300/40 dark:text-violet-200 dark:ring-violet-400/20">
              <ReceiptText size={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Client lié
            </p>
            {selectedClient ? (
              <div className="mt-3 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-violet-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-violet-200 dark:ring-white/10">
                  <UserCircle2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{selectedClient.nom}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedClient.email || "Aucun email renseigné"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Aucun client sélectionné. Le cockpit reste visible, mais les CTA finaux resteront en attente.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 md:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                  Action express
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Si tout est prêt, envoyez le devis tout de suite depuis ce récapitulatif mobile.
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                {hasLines ? "Prêt" : "En cours"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 min-[390px]:grid-cols-2">
              <button
                type="button"
                onClick={onSaveOnly}
                disabled={!canSubmit || saveBusy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
              >
                <Save size={16} />
                {saveBusy ? "Sauvegarde..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={onCreateAndSend}
                disabled={!canSubmit || sendBusy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {sendBusy ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm font-medium text-slate-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-200">
              TVA globale
              <select
                value={tva}
                onChange={(event) => onTvaChange(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
              >
                {TVA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-base font-medium text-slate-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-200">
              Remise (%)
              <input
                type="number"
                min="0"
                value={remise}
                onChange={(event) => onRemiseChange(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
              />
            </label>

            <label className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm font-medium text-slate-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-200">
              Acompte (%)
              <input
                type="number"
                min="0"
                value={acompte}
                onChange={(event) => onAcompteChange(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
              />
            </label>
          </div>

          <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(15,23,42,0.92))] p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                  Total TTC
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{totalTTC.toFixed(2)}€</p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/10">
                {hasLines ? `${photos.length} photo${photos.length > 1 ? "s" : ""}` : "Prêt à chiffrer"}
              </div>
            </div>

            <details className="mt-5 rounded-[1.3rem] border border-white/12 bg-white/6 px-4 py-3 md:hidden">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                Voir le détail du total
              </summary>
              <div className="mt-3 grid gap-3">
                <div className="rounded-[1.1rem] bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">HT</p>
                  <p className="mt-2 text-xl font-semibold">{totalHT.toFixed(2)}€</p>
                </div>
                <div className="rounded-[1.1rem] bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">TVA</p>
                  <p className="mt-2 text-xl font-semibold">{totalTVA.toFixed(2)}€</p>
                </div>
                <div className="rounded-[1.1rem] bg-emerald-400/12 px-4 py-3 ring-1 ring-emerald-300/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">Marge estimée</p>
                  <p className="mt-2 text-xl font-semibold">{marginEstimate.toFixed(2)}€</p>
                </div>
              </div>
            </details>

            <div className="mt-5 hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-[1.3rem] bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">HT</p>
                <p className="mt-2 text-xl font-semibold">{totalHT.toFixed(2)}€</p>
              </div>
              <div className="rounded-[1.3rem] bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">TVA</p>
                <p className="mt-2 text-xl font-semibold">{totalTVA.toFixed(2)}€</p>
              </div>
              <div className="rounded-[1.3rem] bg-emerald-400/12 px-4 py-3 ring-1 ring-emerald-300/20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">Marge estimée</p>
                <p className="mt-2 text-xl font-semibold">{marginEstimate.toFixed(2)}€</p>
              </div>
            </div>
          </div>

          <details className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 md:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Annexes chantier
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} jointe(s)` : "Aucune photo jointe"}
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                Gérer
              </span>
            </summary>

            <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-white/8">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Ajoutez des photos si elles doivent apparaître en annexe PDF.
                </p>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20">
                  <Camera size={16} />
                  Ajouter
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileUpload}
                  />
                </label>
              </div>

              {photos.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 min-[420px]:grid-cols-3">
                  {photos.map((photo, index) => (
                    <div
                      key={`${photo.slice(0, 32)}-${index}`}
                      className="relative aspect-square overflow-hidden rounded-[1.1rem] border border-slate-200/70 dark:border-white/8"
                    >
                      <Image src={photo} alt={`Photo chantier ${index + 1}`} fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur"
                        aria-label="Supprimer la photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300/70 bg-white/60 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  Aucune photo jointe pour l’instant.
                </div>
              )}
            </div>
          </details>

          <div className="hidden rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 md:block">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Annexes chantier
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Ajoutez des photos si elles doivent apparaître en annexe PDF.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20">
                <Camera size={16} />
                Ajouter
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFileUpload}
                />
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={`${photo.slice(0, 32)}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-[1.1rem] border border-slate-200/70 dark:border-white/8"
                  >
                    <Image src={photo} alt={`Photo chantier ${index + 1}`} fill unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur"
                      aria-label="Supprimer la photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300/70 bg-white/60 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                Aucune photo jointe pour l’instant.
              </div>
            )}
          </div>

          {trialLocked ? (
            <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
              <p className="font-semibold">Essai terminé pour la création de devis</p>
              <p className="mt-2 leading-6 opacity-80">
                Votre essai est arrivé à sa limite. Passez en Pro pour créer des devis illimités sans quitter ce cockpit.
              </p>
              <Link
                href="/abonnement"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 font-semibold text-white shadow-brand"
              >
                <Sparkles size={16} />
                Passer à Zolio Pro
              </Link>
            </div>
          ) : null}

          {!trialLocked && emailHint ? (
            <>
              <details className="rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100 md:hidden">
                <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
                  Envoi email sous contrôle
                </summary>
                <div className="mt-3 flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 shrink-0" />
                  <p className="leading-6 opacity-80">{emailHint}</p>
                </div>
              </details>
              <div className="hidden rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100 md:block">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Envoi email sous contrôle</p>
                    <p className="mt-1 leading-6 opacity-80">{emailHint}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {!trialLocked && showActions ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSaveOnly}
                disabled={!canSubmit || mode !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
              >
                <Save size={16} />
                {saveBusy ? "Enregistrement..." : "Enregistrer le devis"}
              </button>

              <button
                type="button"
                onClick={onCreateAndSend}
                disabled={!canSubmit || mode !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-zolio px-4 py-3.5 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {sendBusy ? "Création + envoi..." : "Créer et envoyer"}
              </button>

              <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-xs leading-6 text-slate-500 dark:border-white/8 dark:bg-white/4 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-200" />
                  <p>
                    Le devis est toujours créé même si l’envoi email échoue. Vous serez redirigé vers le détail avec un retour clair sur le résultat.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <details className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-300 md:hidden">
            <summary className="cursor-pointer list-none font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
              État du compte
            </summary>
            <p className="mt-3 leading-6">
              {isPro
                ? "Zolio Pro actif. Création illimitée et workflow complet disponible."
                : remainingTrialQuotes !== null
                  ? `${remainingTrialQuotes} devis d’essai restant${remainingTrialQuotes > 1 ? "s" : ""}.`
                  : "Vérification de votre essai en cours..."}
            </p>
          </details>

          <div className="hidden rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-300 md:block">
            <p className="font-semibold text-slate-900 dark:text-white">État du compte</p>
            <p className="mt-2 leading-6">
              {isPro
                ? "Zolio Pro actif. Création illimitée et workflow complet disponible."
                : remainingTrialQuotes !== null
                  ? `${remainingTrialQuotes} devis d’essai restant${remainingTrialQuotes > 1 ? "s" : ""}.`
                  : "Vérification de votre essai en cours..."}
            </p>
          </div>
        </div>
      </ClientSectionCard>
    </div>
  );
}
