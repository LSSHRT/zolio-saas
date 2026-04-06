"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Download,
  FileText,
  Link2,
  Mail,
  Send,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientMobileActionsMenu,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";

interface FactureDetail {
  id: string;
  numero: string;
  nomClient: string;
  emailClient: string;
  totalHT: number;
  tva: number;
  totalTTC: number;
  statut: string;
  date: string;
  dateEcheance: string | null;
  devisRef: string | null;
  devisStatut: string | null;
  stripePaymentLink: string | null;
  stripeSessionId: string | null;
  derniereRelanceNiveau: number;
  derniereRelanceDate: string | null;
  createdAt: string;
}

const REMINDER_LABELS: Record<number, string> = {
  0: "Aucune",
  1: "Rappel amical",
  2: "2e rappel",
  3: "Mise en demeure",
};

export default function FactureDetailPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState<FactureDetail | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [creatingPayLink, setCreatingPayLink] = useState(false);
  const [sendingRelance, setSendingRelance] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const googleReviewLink =
    (user?.unsafeMetadata?.companyGoogleReview as string) ||
    (user?.publicMetadata?.companyGoogleReview as string);

  useEffect(() => {
    fetch(`/api/factures/${numero}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFacture(data);
      })
      .catch(() => {
        toast.error("Facture introuvable");
        router.push("/factures");
      })
      .finally(() => setLoading(false));
  }, [numero, router]);

  const handleMarkAsPaid = async () => {
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/factures/${numero}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "Payée" }),
      });
      if (!res.ok) throw new Error("Erreur");
      setFacture((prev) => (prev ? { ...prev, statut: "Payée" } : null));
      toast.success("Facture marquée comme payée !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePayLink = async () => {
    setCreatingPayLink(true);
    try {
      const res = await fetch(`/api/factures/pay-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroFacture: numero }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      window.open(data.url, "_blank");
      toast.success("Lien de paiement Stripe ouvert");
    } catch (err) {
      logError("invoice-paylink", err);
      toast.error(err instanceof Error ? err.message : "Impossible de créer le lien de paiement");
    } finally {
      setCreatingPayLink(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/factures/${numero}/pdf`, "_blank");
  };

  const handleRelance = async () => {
    if (!facture?.emailClient) {
      toast.error("Aucun email client");
      return;
    }
    setSendingRelance(true);
    try {
      const res = await fetch(`/api/factures/${numero}/relances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: facture.emailClient }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      toast.success("Email de relance envoyé");
      fetch(`/api/factures/${numero}`).then((r) => r.json()).then((data) => setFacture(data));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la relance");
    } finally {
      setSendingRelance(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/factures/${numero}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Facture supprimée");
      router.push("/factures");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReviewRequest = () => {
    if (!googleReviewLink) {
      toast.error("Lien Google Reviews non configuré dans les paramètres");
      return;
    }
    const subject = encodeURIComponent(`Merci pour votre avis — ${facture?.nomClient || ""}`);
    const body = encodeURIComponent(
      `Bonjour ${facture?.nomClient || ""},\n\nMerci pour votre confiance ! Si vous avez un moment, votre avis nous aide énormément : ${googleReviewLink}\n\nCordialement.`,
    );
    window.location.href = `mailto:${facture?.emailClient || ""}?subject=${subject}&body=${body}`;
  };

  const isLate = () => {
    if (!facture || facture.statut === "Payée" || !facture.dateEcheance) return false;
    return new Date(facture.dateEcheance) < new Date();
  };

  const formatDateFR = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const statutColor = (statut: string) => {
    switch (statut) {
      case "Payée":
        return "bg-blue-50 text-blue-700 ring-blue-300/30 dark:text-blue-200 dark:ring-blue-400/20";
      case "En retard":
        return "bg-rose-50 text-rose-700 ring-rose-300/30 dark:text-rose-200 dark:ring-rose-400/20";
      case "Annulée":
        return "bg-slate-100 text-slate-600 ring-slate-300/30 dark:text-slate-300 dark:ring-slate-400/20";
      default:
        return "bg-emerald-50 text-emerald-700 ring-emerald-300/30 dark:text-emerald-200 dark:ring-emerald-400/20";
    }
  };

  const getMobileActions = (): ClientMobileAction[] => {
    const actions: ClientMobileAction[] = [
      { icon: Download, label: "Télécharger PDF", onClick: handleDownloadPDF },
    ];

    if (facture?.statut !== "Payée") {
      actions.push(
        { icon: Clock, label: "Relancer le client", onClick: handleRelance },
        {
          icon: Link2,
          label: creatingPayLink ? "Création..." : "Paiement en ligne",
          onClick: handlePayLink,
          disabled: creatingPayLink,
          tone: "accent",
        },
      );
    }

    if (facture?.statut === "Payée" && googleReviewLink) {
      actions.push({ icon: Mail, label: "Demander un avis Google", onClick: handleReviewRequest });
    }

    actions.push({
      icon: Trash2,
      label: deleting ? "Suppression..." : "Supprimer",
      onClick: () => setShowDeleteDialog(true),
      disabled: deleting,
      tone: "danger",
    });

    return actions;
  };

  const late = isLate();
  const displayStatut = facture?.statut === "Payée" ? "Payée" : late ? "En retard" : facture?.statut || "";

  const sectionMotion = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  if (loading) {
    return (
      <ClientSubpageShell
        title="Facture"
        description="Chargement..."
        activeNav="factures"
        eyebrow="Facture"
      >
        <div className="flex items-center justify-center py-20 text-slate-400">Chargement...</div>
      </ClientSubpageShell>
    );
  }

  if (!facture) {
    return (
      <ClientSubpageShell
        title="Facture introuvable"
        description="Cette facture n'existe pas."
        activeNav="factures"
        eyebrow="Erreur"
      >
        <div className="flex items-center justify-center py-20 text-slate-400">Facture introuvable</div>
      </ClientSubpageShell>
    );
  }

  return (
    <ClientSubpageShell
      title={`Facture ${facture.numero}`}
      description={`Facture pour ${facture.nomClient}`}
      activeNav="factures"
      eyebrow={`Facture · ${formatDateFR(facture.date)}`}
      backHref="/factures"
      mobilePrimaryAction={
        facture.statut !== "Payée" ? (
          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={markingPaid}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <BadgeCheck size={16} />
            {markingPaid ? "Mise à jour..." : "Marquer payée"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <Download size={16} />
            PDF
          </button>
        )
      }
      mobileSecondaryActions={getMobileActions()}
    >
      {/* Header Card */}
      <motion.div {...sectionMotion}>
        <ClientSectionCard>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                {(facture.nomClient || "").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-950 dark:text-white">
                  {facture.nomClient}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {facture.emailClient || "Pas d'email"}
                </p>
              </div>
            </div>
            <div
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${statutColor(displayStatut)}`}
            >
              {displayStatut}
            </div>
          </div>

          {late && facture.statut !== "Payée" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle size={16} />
              <span>
                Facture en retard — Échéance : {formatDateFR(facture.dateEcheance)}
              </span>
            </div>
          )}
        </ClientSectionCard>
      </motion.div>

      {/* Montants */}
      <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.05 }}>
        <ClientSectionCard>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <FileText size={16} />
            Montants
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Total HT</p>
              <p className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-200">
                {formatCurrency(facture.totalHT)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">TVA</p>
              <p className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-200">
                {facture.tva}%
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-4 py-3 dark:from-emerald-500/10 dark:to-emerald-500/5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600/70 dark:text-emerald-400/70">
                Total TTC
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {formatCurrency(facture.totalTTC)}
              </p>
            </div>
          </div>
        </ClientSectionCard>
      </motion.div>

      {/* Informations */}
      <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.1 }}>
        <ClientSectionCard>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Clock size={16} />
            Informations
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">Date de facturation</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {formatDateFR(facture.date)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">Date d'échéance</span>
              <span className={`text-sm font-semibold ${late && facture.statut !== "Payée" ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>
                {formatDateFR(facture.dateEcheance)}
              </span>
            </div>
            {facture.devisRef && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50 sm:col-span-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Devis lié</span>
                <Link
                  href={`/devis/${facture.devisRef}`}
                  className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  {facture.devisRef}
                  {facture.devisStatut && (
                    <span className="ml-2 text-xs text-slate-400">({facture.devisStatut})</span>
                  )}
                </Link>
              </div>
            )}
          </div>
        </ClientSectionCard>
      </motion.div>

      {/* Paiement Stripe */}
      {facture.stripeSessionId && (
        <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.12 }}>
          <ClientSectionCard>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <BadgeCheck size={16} />
              Paiement Stripe
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Payé via Stripe</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Session : {facture.stripeSessionId.slice(0, 20)}...</p>
              </div>
              <a
                href={`https://dashboard.stripe.com/payments/${facture.stripeSessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Voir sur Stripe
              </a>
            </div>
          </ClientSectionCard>
        </motion.div>
      )}

      {/* Relances */}
      {facture.derniereRelanceNiveau > 0 && (
        <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.15 }}>
          <ClientSectionCard>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <Send size={16} />
              Historique relances
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Dernière relance : <strong>{REMINDER_LABELS[facture.derniereRelanceNiveau] || "Inconnue"}</strong>
                </span>
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
                  {formatDateFR(facture.derniereRelanceDate)}
                </span>
              </div>
            </div>
          </ClientSectionCard>
        </motion.div>
      )}

      {/* Actions Desktop */}
      <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.2 }}>
        <ClientSectionCard>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Actions
          </div>
          <div className="flex flex-wrap gap-3">
            {facture.statut === "Payée" ? (
              googleReviewLink ? (
                <button
                  type="button"
                  onClick={handleReviewRequest}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  <Mail size={15} />
                  Demander un avis Google
                </button>
              ) : null
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  <BadgeCheck size={15} />
                  {markingPaid ? "Mise à jour..." : "Marquer payée"}
                </button>
                <button
                  type="button"
                  onClick={handleRelance}
                  disabled={sendingRelance}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  <Send size={15} />
                  {sendingRelance ? "Envoi..." : "Relancer"}
                </button>
                <button
                  type="button"
                  onClick={handlePayLink}
                  disabled={creatingPayLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {creatingPayLink ? "Création..." : "Lien de paiement"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Download size={15} />
              Télécharger PDF
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/20 dark:bg-transparent dark:text-rose-300"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        </ClientSectionCard>
      </motion.div>

      {/* Delete Dialog */}
      <MobileDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Supprimer la facture"
        description={`Supprimer la facture ${facture.numero} ? Cette action est irréversible.`}
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      />
    </ClientSubpageShell>
  );
}
