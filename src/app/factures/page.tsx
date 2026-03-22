"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle,
  Clock,
  Download,
  FileText,
  MessageSquareQuote,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";

interface Facture {
  numero: string;
  date: string;
  nomClient: string;
  emailClient: string;
  totalHT: string;
  tva: string;
  totalTTC: string;
  statut: string;
  devisRef: string;
}

const statutConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  "Émise": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Payée": { icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
  "En retard": { icon: Clock, color: "text-red-500", bg: "bg-red-50" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FacturesPage() {
  const { user } = useUser();
  const { data, isLoading, mutate } = useSWR("/api/factures", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const factures = useMemo<Facture[]>(() => (Array.isArray(data) ? data : []), [data]);
  const loading = isLoading && !data;
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [pendingDeleteFacture, setPendingDeleteFacture] = useState<Facture | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const googleReviewLink =
    (user?.unsafeMetadata?.companyGoogleReview as string) ||
    (user?.publicMetadata?.companyGoogleReview as string);

  const isLate = (facture: Facture) => {
    if (facture.statut === "Payée" || !facture.date) return false;
    const parts = facture.date.split("/");
    if (parts.length !== 3) return false;
    const issueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    const diffTime = Date.now() - issueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  };

  const filtered = useMemo(
    () =>
      factures.filter(
        (facture: Facture) =>
          (facture.nomClient || "").toLowerCase().includes(search.toLowerCase()) ||
          (facture.numero || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [factures, search],
  );

  const totalFacture = useMemo(
    () => factures.reduce((sum: number, facture: Facture) => sum + (parseFloat(facture.totalTTC) || 0), 0),
    [factures],
  );
  const totalPaid = useMemo(
    () =>
      factures
        .filter((facture: Facture) => facture.statut === "Payée")
        .reduce((sum: number, facture: Facture) => sum + (parseFloat(facture.totalTTC) || 0), 0),
    [factures],
  );
  const lateInvoices = useMemo(
    () => factures.filter((facture: Facture) => isLate(facture)).length,
    [factures],
  );
  const paidInvoices = useMemo(
    () => factures.filter((facture: Facture) => facture.statut === "Payée").length,
    [factures],
  );

  const handleDelete = async (numero: string) => {
    setDeleting(numero);
    try {
      const response = await fetch(`/api/factures/${numero}`, { method: "DELETE" });
      if (response.ok) {
        mutate(factures.filter((facture: Facture) => facture.numero !== numero), false);
        toast.success("Facture supprimée");
        setPendingDeleteFacture(null);
      } else {
        toast.error("Erreur lors de la suppression de la facture");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(null);
    }
  };

  const formatCSVField = (field: string | number) => {
    const stringField = String(field || "");
    if (stringField.includes(";") || stringField.includes("\"") || stringField.includes("\n")) {
      return `"${stringField.replace(/"/g, "\"\"")}"`;
    }
    return stringField;
  };

  const formatNumberForExcel = (numStr: string | number) => {
    if (!numStr) return "0,00";
    return Number(numStr).toFixed(2).replace(".", ",");
  };

  const handleExportCSV = () => {
    const headers = ["Numéro", "Date", "Client", "Email", "Total HT", "TVA", "Total TTC", "Statut"];
    const rows = factures.map((facture: Facture) => [
      formatCSVField(facture.numero),
      formatCSVField(facture.date),
      formatCSVField(facture.nomClient),
      formatCSVField(facture.emailClient),
      formatNumberForExcel(facture.totalHT),
      formatNumberForExcel(facture.tva),
      formatNumberForExcel(facture.totalTTC),
      formatCSVField(facture.statut),
    ]);
    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "export_comptable_factures.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportURSSAF = () => {
    const headers = [
      "Date d'encaissement",
      "Référence de la pièce justificative",
      "Nom du client",
      "Nature de la prestation",
      "Montant encaissé",
      "Mode de règlement",
    ];
    const facturesEncaissees = factures.filter(
      (facture: Facture) =>
        facture.statut === "Payée" || facture.statut === "Émise" || parseFloat(facture.totalTTC) > 0,
    );

    const rows = facturesEncaissees.map((facture: Facture) => [
      formatCSVField(facture.date),
      formatCSVField(facture.numero),
      formatCSVField(facture.nomClient),
      "Vente / Prestation de service",
      formatNumberForExcel(facture.totalTTC),
      "Virement / Chèque / Espèces",
    ]);
    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "livre_des_recettes_urssaf.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true);
    let successCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const response = await fetch(`/api/factures/${id}`, { method: "DELETE" });
        if (response.ok) successCount += 1;
      } catch (err) {
        console.error(err);
      }
    }

    if (successCount > 0) {
      mutate(factures.filter((facture: Facture) => !selectedIds.has(facture.numero)), false);
      setSelectedIds(new Set());
      setConfirmBulkDeleteOpen(false);
      toast.success(`${successCount} facture${successCount > 1 ? "s" : ""} supprimée${successCount > 1 ? "s" : ""}`);
    } else {
      toast.error("Aucune facture n'a pu être supprimée");
    }

    setIsDeletingBulk(false);
  };

  const handleMarkAsPaid = async (numero: string) => {
    setMarkingPaid(numero);
    try {
      const response = await fetch(`/api/factures/${numero}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "Payée" }),
      });
      if (response.ok) {
        mutate(
          factures.map((facture: Facture) =>
            facture.numero === numero ? { ...facture, statut: "Payée" } : facture,
          ),
          false,
        );
        toast.success("Facture marquée comme payée !");
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleRelance = (facture: Facture) => {
    const subject = encodeURIComponent(`Relance de paiement : Facture ${facture.numero}`);
    const body = encodeURIComponent(
      `Bonjour ${facture.nomClient},\n\nSauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture ${facture.numero} émise le ${facture.date}, d'un montant de ${facture.totalTTC}€.\n\nVous trouverez les coordonnées bancaires sur la facture pour effectuer le virement.\n\nNous vous remercions de bien vouloir faire le nécessaire dans les meilleurs délais.\n\nCordialement.`,
    );
    window.location.href = `mailto:${facture.emailClient}?subject=${subject}&body=${body}`;
  };

  const handleReviewRequest = (facture: Facture) => {
    if (!googleReviewLink) {
      toast.error("Veuillez d'abord configurer votre lien Google My Business dans les Paramètres.");
      return;
    }
    const subject = encodeURIComponent("Votre avis compte pour nous !");
    const body = encodeURIComponent(
      `Bonjour ${facture.nomClient},\n\nNous vous remercions pour votre confiance et espérons que vous êtes satisfait de notre intervention.\n\nPourriez-vous prendre 1 minute pour nous laisser un avis sur Google ? Cela nous aide énormément : \n${googleReviewLink}\n\nMerci d'avance et à bientôt !\n\nCordialement.`,
    );
    window.location.href = `mailto:${facture.emailClient}?subject=${subject}&body=${body}`;
  };

  const getMobileInvoiceActions = (facture: Facture): ClientMobileAction[] => [
    ...(facture.statut === "Payée"
      ? []
      : [
          {
            icon: Clock,
            label: "Relancer le client",
            onClick: () => handleRelance(facture),
          },
        ]),
    {
      disabled: deleting === facture.numero,
      icon: Trash2,
      label: deleting === facture.numero ? "Suppression..." : "Supprimer",
      onClick: () => setPendingDeleteFacture(facture),
      tone: "danger",
    },
  ];

  return (
    <ClientSubpageShell
      title="Mes factures"
      description="Suivez votre facturation, vos encaissements et vos relances dans un cockpit plus lisible, plus dense et pensé pour une vraie consultation terrain."
      activeNav="factures"
      eyebrow="Suivi de trésorerie"
      mobilePrimaryAction={
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <Download size={16} />
          Export
        </button>
      }
      mobileSecondaryActions={[
        {
          icon: FileText,
          label: "Livre URSSAF",
          onClick: handleExportURSSAF,
        },
      ]}
      actions={
        <>
          <button
            type="button"
            onClick={handleExportURSSAF}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
          >
            <FileText size={16} />
            Livre URSSAF
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
          >
            <Download size={16} />
            Export comptable
          </button>
        </>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Facturé"
            value={`${totalFacture.toFixed(0)}€`}
            detail={`${factures.length} facture${factures.length > 1 ? "s" : ""} émises`}
            tone="emerald"
          />
          <ClientHeroStat
            label="Encaissé"
            value={`${totalPaid.toFixed(0)}€`}
            detail={`${paidInvoices} facture${paidInvoices > 1 ? "s" : ""} réglée${paidInvoices > 1 ? "s" : ""}`}
            tone="violet"
          />
          <ClientHeroStat
            label="En retard"
            value={String(lateInvoices)}
            detail="À relancer en priorité"
            tone="rose"
          />
          <ClientHeroStat
            label="Vue active"
            value={String(filtered.length)}
            detail="Factures actuellement affichées"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Suivi d’encaissement"
          description="Commencez par ce qui doit rentrer, puis ouvrez les cartes pour agir sans surcharger l’écran."
          badge={`${filtered.length} visibles`}
          items={[
            {
              label: "Facturé",
              value: `${totalFacture.toFixed(0)}€`,
              detail: `${factures.length} émises`,
              tone: "emerald",
            },
            {
              label: "Encaissé",
              value: `${totalPaid.toFixed(0)}€`,
              detail: `${paidInvoices} payée${paidInvoices > 1 ? "s" : ""}`,
              tone: "violet",
            },
            {
              label: "En retard",
              value: String(lateInvoices),
              detail: "À relancer",
              tone: "rose",
            },
            {
              label: "Actions",
              value: "2",
              detail: "Export + URSSAF",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par client ou n° facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4 sm:grid-cols-[auto_1fr] sm:items-center">
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((facture: Facture) => facture.numero)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout ({filtered.length})
          </label>

          {selectedIds.size > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-right">
                {selectedIds.size} facture{selectedIds.size > 1 ? "s" : ""} prête{selectedIds.size > 1 ? "s" : ""} à être supprimée{selectedIds.size > 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setConfirmBulkDeleteOpen(true)}
                disabled={isDeletingBulk}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200"
              >
                <Trash2 size={15} />
                {isDeletingBulk ? "Suppression..." : `Supprimer (${selectedIds.size})`}
              </button>
            </div>
          ) : (
            <div className="space-y-1 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Actions rapides
              </p>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Exportez vos données ou relancez vos règlements depuis cette vue.
              </span>
            </div>
          )}
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <div className="mb-2 h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-8 w-24 rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-8 w-20 rounded bg-slate-100 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400">
                <FileText size={48} strokeWidth={1} />
                <p className="text-sm">{search ? "Aucun résultat" : "Aucune facture générée"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      Liste active
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {filtered.length} facture{filtered.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-xs sm:text-right">
                    Ouvrez une carte pour encaisser, relancer ou nettoyer votre vue sans quitter le mobile.
                  </p>
                </div>

                {filtered.map((facture: Facture, index: number) => {
                  const late = isLate(facture);
                  const displayStatut =
                    facture.statut === "Payée" ? "Payée" : late ? "En retard" : facture.statut;
                  const config = statutConfig[displayStatut] || statutConfig["Émise"];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={facture.numero || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.15) }}
                      className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4"
                    >
                      <div className="md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                              {(facture.nomClient || "").charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                {facture.nomClient}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {facture.numero} · {facture.date}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`${config.bg} ${config.color} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold`}
                          >
                            <Icon size={12} />
                            {displayStatut}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/20">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              Réf devis
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {facture.devisRef || "-"}
                            </p>
                          </div>
                          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/20">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              Total TTC
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                              {facture.totalTTC}€
                            </p>
                          </div>
                          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/20 sm:col-span-2">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                  Total HT
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {facture.totalHT}€
                                </p>
                              </div>
                              {late && facture.statut !== "Payée" ? (
                                <span className="inline-flex self-start rounded-full bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-300/30 dark:text-rose-200 dark:ring-rose-400/20">
                                  À traiter vite
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                          {facture.statut === "Payée" ? (
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(facture)}
                              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 sm:flex-1"
                              title="Demander un avis Google"
                            >
                              <MessageSquareQuote size={15} />
                              Demander un avis
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(facture.numero)}
                              disabled={markingPaid === facture.numero}
                              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50 sm:flex-1"
                              title="Marquer comme payée"
                            >
                              <BadgeCheck size={15} />
                              {markingPaid === facture.numero ? "Mise à jour..." : "Marquer payée"}
                            </button>
                          )}

                          <ClientMobileActionsMenu
                            buttonLabel={`Actions ${facture.numero}`}
                            items={getMobileInvoiceActions(facture)}
                            stretch
                          />
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                              {(facture.nomClient || "").charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                {facture.nomClient}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {facture.numero} · {facture.date}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`${config.bg} ${config.color} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold`}
                          >
                            <Icon size={12} />
                            {displayStatut}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm dark:border-white/8 dark:bg-slate-950/20 md:grid-cols-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                              Réf devis
                            </p>
                            <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                              {facture.devisRef || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                              Total HT
                            </p>
                            <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                              {facture.totalHT}€
                            </p>
                          </div>
                          <div className="md:text-right">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                              Total TTC
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                              {facture.totalTTC}€
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {facture.statut === "Payée" ? (
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(facture)}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                              title="Demander un avis Google"
                            >
                              <MessageSquareQuote size={15} />
                              Demander un avis
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(facture.numero)}
                                disabled={markingPaid === facture.numero}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                                title="Marquer comme payée"
                              >
                                <BadgeCheck size={15} />
                                {markingPaid === facture.numero ? "..." : "Marquer payée"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRelance(facture)}
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                title="Relancer le client"
                              >
                                <Clock size={15} />
                                Relancer
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setPendingDeleteFacture(facture)}
                            disabled={deleting === facture.numero}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-400/20 dark:bg-transparent dark:text-rose-300"
                            title="Supprimer la facture"
                          >
                            <Trash2 size={15} />
                            {deleting === facture.numero ? "Suppression..." : "Supprimer"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ClientSectionCard>

      <MobileDialog
        open={Boolean(pendingDeleteFacture)}
        onClose={() => setPendingDeleteFacture(null)}
        title="Supprimer cette facture ?"
        description={
          pendingDeleteFacture
            ? `La facture ${pendingDeleteFacture.numero} de ${pendingDeleteFacture.nomClient} sera supprimée définitivement.`
            : undefined
        }
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingDeleteFacture(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => pendingDeleteFacture && void handleDelete(pendingDeleteFacture.numero)}
              disabled={Boolean(pendingDeleteFacture && deleting === pendingDeleteFacture.numero)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {pendingDeleteFacture && deleting === pendingDeleteFacture.numero ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          Retirez cette facture seulement si vous n&apos;en avez plus besoin dans votre suivi d&apos;encaissement.
        </div>
      </MobileDialog>

      <MobileDialog
        open={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        title="Supprimer la sélection ?"
        description={`Vous allez retirer ${selectedIds.size} facture${selectedIds.size > 1 ? "s" : ""} de votre suivi.`}
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setConfirmBulkDeleteOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={isDeletingBulk}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeletingBulk ? "Suppression..." : "Confirmer la suppression"}
            </button>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          Cette action permet de nettoyer rapidement la vue mobile, mais elle reste définitive.
        </div>
      </MobileDialog>
    </ClientSubpageShell>
  );
}
