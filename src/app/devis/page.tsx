"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  LayoutGrid,
  List,
  Mail,
  PenTool,
  Eye,
  CopyPlus,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import CompareOptions from "@/components/compare-options";

interface Devis {
  id: string;
  numero: string;
  date: string;
  nomClient: string;
  emailClient: string;
  totalHT: string;
  tva: string;
  totalTTC: string;
  statut: string;
  lienPdf: string;
  signingToken?: string;
  lu_le?: string;
  optionLabel?: string | null;
  devisParentId?: string | null;
}

type DeleteDialogState =
  | {
      kind: "single" | "bulk";
      numeros: string[];
    }
  | null;

const statutConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  "En attente": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "En attente (Modifié)": { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  "Accepté": { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Refusé": { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function buildSigningLink(numero: string, signingToken?: string) {
  if (!signingToken || typeof window === "undefined") {
    return null;
  }

  return `${window.location.origin}/signer/${numero}?token=${encodeURIComponent(signingToken)}`;
}

function buildFollowUpMailTo(devis: Devis) {
  const subject = encodeURIComponent(`Relance : Devis #${devis.numero}`);
  const signingLink = buildSigningLink(devis.numero, devis.signingToken);
  const body = encodeURIComponent(
    [
      `Bonjour ${devis.nomClient},`,
      "",
      `Sauf erreur de notre part, nous n'avons pas eu de retour concernant le devis #${devis.numero} d'un montant de ${devis.totalTTC}€.`,
      signingLink ? `Vous pouvez le consulter et le signer ici : ${signingLink}` : "",
      "",
      "Restant à votre disposition pour toute question.",
      "",
      "Cordialement,",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return `mailto:${devis.emailClient || ""}?subject=${subject}&body=${body}`;
}

export default function DevisPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR('/api/devis', fetcher, { revalidateOnFocus: false, keepPreviousData: true });
  const { data: quotaData } = useSWR('/api/quota', fetcher, { revalidateOnFocus: false, refreshInterval: 30000 });
  const quota = quotaData || { isPro: false, used: 0, limit: 3, remaining: 3 };
  const devis = useMemo<Devis[]>(() => {
    // Handle both old format (array) and new format ({ data, pagination })
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);
  const loading = isLoading && !data;
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatut, setUpdatingStatut] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  const handleConvertToFacture = async (numero: string) => {
    setConverting(numero);
    try {
      const res = await fetch(`/api/devis/${numero}/convert`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.facture) {
        toast.success("Devis converti en facture avec succès");
        router.push(`/factures/${data.facture.numero}`);
      } else {
        toast.error(data.error || "Erreur lors de la conversion");
        setConverting(null);
      }
    } catch {
      toast.error("Erreur réseau");
      setConverting(null);
    }
  };

  const handleDuplicate = async (numero: string) => {
    setDuplicating(numero);
    try {
      const res = await fetch(`/api/devis/${numero}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.numero) {
        router.push(`/devis/${data.numero}`);
      } else {
        toast.error(data.error || "Erreur lors de la duplication");
        setDuplicating(null);
      }
    } catch {
      toast.error("Erreur réseau");
      setDuplicating(null);
    }
  };

  const openDeleteDialog = (numeros: string[], kind: "single" | "bulk") => {
    if (numeros.length === 0) {
      return;
    }

    setDeleteDialog({ kind, numeros });
  };

  const handleDelete = async (numero: string) => {
    openDeleteDialog([numero], "single");
  };

  const confirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }

    const numerosToDelete = deleteDialog.numeros;
    const isBulk = deleteDialog.kind === "bulk";
    setDeleteDialog(null);

    if (isBulk) {
      setIsDeletingBulk(true);
    } else {
      setDeleting(numerosToDelete[0]);
    }

    try {
      let successCount = 0;

      for (const numero of numerosToDelete) {
        const res = await fetch(`/api/devis/${numero}`, { method: "DELETE" });
        if (res.ok) {
          successCount += 1;
        }
      }

      if (successCount > 0) {
        mutate(devis.filter((item: Devis) => !numerosToDelete.includes(item.numero)), false);
        setSelectedIds((current) => {
          const next = new Set(current);
          numerosToDelete.forEach((numero) => next.delete(numero));
          return next;
        });
        toast.success(
          successCount > 1 ? `${successCount} devis supprimés.` : `Le devis ${numerosToDelete[0]} a été supprimé.`,
        );
      } else {
        toast.error("Aucun devis n'a pu être supprimé.");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeletingBulk(false);
      setDeleting(null);
    }
  };

  const handleBulkStatut = async (statut: string) => {
    setIsBulkUpdating(true);
    let successCount = 0;
    for (const numero of Array.from(selectedIds)) {
      try {
        const res = await fetch(`/api/devis/${numero}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut, lignes: [] }),
        });
        if (res.ok) successCount++;
      } catch (err) {
        logError("devis-bulk-statut", err);
      }
    }
    setIsBulkUpdating(false);
    if (successCount > 0) {
      mutate();
      setSelectedIds(new Set());
      toast.success(`${successCount} devis marqué${successCount > 1 ? "s" : ""} comme ${statut}`);
    }
  };

  const handleBulkDelete = async () => {
    openDeleteDialog(Array.from(selectedIds), "bulk");
  };

  const handleCopySignLink = async (numero: string) => {
    const devisItem = devis.find((item: Devis) => item.numero === numero);
    if (!devisItem?.signingToken) {
      toast.error("Impossible de générer le lien de signature.");
      return;
    }

    const link = `${window.location.origin}/signer/${numero}?token=${encodeURIComponent(devisItem.signingToken)}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien de signature copié. Vous pouvez l’envoyer au client.");
    } catch {
      toast.error("Impossible de copier le lien de signature.");
    }
  };

  const handleUpdateStatut = async (numero: string, newStatut: string) => {
    setUpdatingStatut(numero);
    try {
      const res = await fetch(`/api/devis/${numero}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      const payload = await res.json().catch(() => null);
      if (res.ok) {
        mutate(devis.map((d: Devis) => d.numero === numero ? { ...d, statut: newStatut } : d), false);
        toast.success(`Devis ${numero} mis à jour : ${newStatut}.`);
        if (newStatut === "Accepté") {
          import('canvas-confetti').then((confetti) => {
            confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          });
        }
      } else {
        toast.error(payload?.error || "Erreur lors de la mise à jour du statut");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setUpdatingStatut(null);
  };

  const isEnAttente = (statut: string) =>
    statut === "En attente" || statut === "En attente (Modifié)";

  const filtered = useMemo(
    () =>
      devis.filter(
        (d) =>
          (d.nomClient || "").toLowerCase().includes(search.toLowerCase()) ||
          (d.numero || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [devis, search],
  );

  // Group multi-option devis by devisParentId
  const groupedDevis = useMemo(() => {
    const parentMap = new Map<string, Devis[]>();
    const standalone: Devis[] = [];

    for (const d of filtered) {
      if (d.devisParentId) {
        const group = parentMap.get(d.devisParentId) || [];
        group.push(d);
        parentMap.set(d.devisParentId, group);
      } else {
        standalone.push(d);
      }
    }

    return { parentMap, standalone };
  }, [filtered]);

  const optionColors: Record<string, string> = {
    basique: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    standard: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    premium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  const optionOrder = ["basique", "standard", "premium"];

  // Liste de rendu : chaque devis standalone + ses enfants (le cas échéant)
  const renderGroups = useMemo(() => {
    return groupedDevis.standalone.map((d) => ({
      parent: d,
      children: (groupedDevis.parentMap.get(d.id) || []).sort(
        (a, b) => optionOrder.indexOf(a.optionLabel || "") - optionOrder.indexOf(b.optionLabel || "")
      ),
    }));
  }, [groupedDevis]);

  const totalDisplayed = renderGroups.reduce((s, g) => s + 1 + g.children.length, 0);

  const totalMois = devis.reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalValide = devis.filter((d) => d.statut === "Accepté").reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalAttente = devis.filter((d) => isEnAttente(d.statut)).reduce((s, d) => s + (parseFloat(d.totalTTC) || 0), 0);
  const totalAcceptes = devis.filter((d) => d.statut === "Accepté").length;
  const totalEnAttente = devis.filter((d) => isEnAttente(d.statut)).length;

  const mobileViewActions: ClientMobileAction[] = [
    {
      disabled: viewMode === "list",
      icon: List,
      label: viewMode === "list" ? "Vue liste active" : "Passer en vue liste",
      onClick: () => setViewMode("list"),
      tone: viewMode === "list" ? "accent" : "default",
    },
    {
      disabled: viewMode === "kanban",
      icon: LayoutGrid,
      label: viewMode === "kanban" ? "Vue kanban active" : "Passer en vue kanban",
      onClick: () => setViewMode("kanban"),
      tone: viewMode === "kanban" ? "accent" : "default",
    },
  ];

  const mobileMultiOptionsAction: ClientMobileAction = {
    icon: Layers,
    label: "Devis multi-options",
    href: "/nouveau-devis/options",
    tone: "accent",
  };

  const getMobileQuoteActions = (quote: Devis): ClientMobileAction[] => {
    const pending = isEnAttente(quote.statut);
    const accepted = quote.statut === "Accepté" || quote.statut === "Signé";
    const isUpdating = updatingStatut === quote.numero;
    const isDuplicating = duplicating === quote.numero;
    const isDeleting = deleting === quote.numero;
    const isConverting = converting === quote.numero;

    const items: ClientMobileAction[] = [
      {
        href: `/devis/${quote.numero}`,
        icon: Pencil,
        label: "Modifier le devis",
      },
      {
        href: `/api/devis/${quote.numero}/pdf`,
        icon: Eye,
        label: "Prévisualiser le PDF",
      },
      {
        disabled: isDuplicating,
        icon: CopyPlus,
        label: isDuplicating ? "Duplication..." : "Dupliquer",
        onClick: () => void handleDuplicate(quote.numero),
      },
    ];

    if (accepted) {
      items.unshift({
        disabled: isConverting,
        icon: FileText,
        label: isConverting ? "Conversion..." : "Convertir en facture",
        onClick: () => void handleConvertToFacture(quote.numero),
        tone: "accent",
      });
    }

    if (pending) {
      items.unshift(
        {
          disabled: isUpdating,
          icon: Check,
          label: isUpdating ? "Validation..." : "Valider",
          onClick: () => void handleUpdateStatut(quote.numero, "Accepté"),
          tone: "accent",
        },
        {
          disabled: isUpdating,
          icon: X,
          label: isUpdating ? "Mise à jour..." : "Refuser",
          onClick: () => void handleUpdateStatut(quote.numero, "Refusé"),
          tone: "danger",
        },
      );

      items.push(
        {
          icon: Mail,
          label: "Relancer par email",
          onClick: () => {
            window.location.href = buildFollowUpMailTo(quote);
          },
        },
        {
          icon: PenTool,
          label: "Copier le lien de signature",
          onClick: () => handleCopySignLink(quote.numero),
          tone: "accent",
        },
      );
    }

    items.push({
      disabled: isDeleting,
      icon: Trash2,
      label: isDeleting ? "Suppression..." : "Supprimer",
      onClick: () => void handleDelete(quote.numero),
      tone: "danger",
    });

    return items;
  };

  return (
    <>
      <ClientSubpageShell
      title="Mes devis"
      description="Pilotez vos propositions, vos signatures et vos relances dans un espace plus clair, plus dense et plus mobile-friendly."
      activeNav="devis"
      eyebrow="Pipeline commercial"
      mobilePrimaryAction={
        quota.remaining <= 0 && !quota.isPro ? (
          <Link
            href="/abonnement"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <Sparkles size={16} />
            Passer Pro
          </Link>
        ) : (
          <Link
            href="/nouveau-devis"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <FileText size={16} />
            Nouveau
          </Link>
        )
      }
      mobileSecondaryActions={[...mobileViewActions, mobileMultiOptionsAction]}
      actions={
        <>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-brand-violet dark:text-white' : 'text-slate-400'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded-md ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow text-brand-violet dark:text-white' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
          {quota.remaining <= 0 && !quota.isPro ? (
            <Link href="/abonnement">
              <motion.button whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-brand">
                <Sparkles size={16} /> Passer Pro
              </motion.button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/nouveau-devis">
                <motion.button whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand">
                  <FileText size={16} /> Nouveau devis
                </motion.button>
              </Link>
              <Link href="/nouveau-devis/options">
                <motion.button whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-900/40">
                  <Layers size={16} /> Multi-options
                </motion.button>
              </Link>
            </div>
          )}
        </>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat label="CA validé" value={`${totalValide.toFixed(0)}€`} detail={`${totalAcceptes} devis acceptés`} tone="emerald" />
          <ClientHeroStat label="En attente" value={`${totalAttente.toFixed(0)}€`} detail={`${totalEnAttente} signature${totalEnAttente > 1 ? "s" : ""} à convertir`} tone="amber" />
          <ClientHeroStat label="Total TTC" value={`${totalMois.toFixed(0)}€`} detail="Vision globale du portefeuille devis" tone="violet" />
          <ClientHeroStat label="Quota" value={quota.isPro ? "∞" : `${quota.remaining}/${quota.limit}`} detail={quota.isPro ? "Plan Pro actif" : `Devis restants ce mois`} tone={quota.remaining <= 0 && !quota.isPro ? "rose" : "slate"} />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Priorités devis"
          description="Les chiffres utiles d’abord, puis vos cartes et actions sans surcharge."
          badge={`${filtered.length} visibles`}
          items={[
            {
              label: "À signer",
              value: String(totalEnAttente),
              detail: `${totalAttente.toFixed(0)}€ en jeu`,
              tone: "amber",
            },
            {
              label: "Acceptés",
              value: String(totalAcceptes),
              detail: `${totalValide.toFixed(0)}€ validés`,
              tone: "emerald",
            },
            {
              label: "Pipeline",
              value: `${totalMois.toFixed(0)}€`,
              detail: viewMode === "list" ? "Lecture liste" : "Lecture kanban",
              tone: "violet",
            },
            {
              label: "Vue",
              value: viewMode === "list" ? "Liste" : "Kanban",
              detail: "Basculez sans quitter la page",
              tone: "slate",
            },
            {
              label: "Quota",
              value: quota.isPro ? "∞" : `${quota.remaining}/${quota.limit}`,
              detail: quota.isPro ? "Plan Pro" : "Devis restants",
              tone: quota.remaining <= 0 && !quota.isPro ? "rose" : "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher par client ou n° devis..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filtered.map((item: Devis) => item.numero)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
            Sélectionner tout ({filtered.length})
          </label>
          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatut("Accepté")}
                disabled={isBulkUpdating}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-400/20 dark:bg-emerald-500/8 dark:text-emerald-200"
              >
                <CheckCircle size={13} />
                Accepter ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatut("Refusé")}
                disabled={isBulkUpdating}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200"
              >
                <XCircle size={13} />
                Refuser ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-400/20 dark:bg-slate-500/8 dark:text-slate-200"
              >
                <Trash2 size={13} />
                {isDeletingBulk ? "..." : `Supprimer (${selectedIds.size})`}
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {devis.length} devis suivis
            </span>
          )}
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/70 dark:border-white/8 animate-shimmer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200/60 dark:bg-white/10 shrink-0" />
                    <div>
                      <div className="h-4 bg-slate-200/60 dark:bg-white/10 rounded w-32 mb-1.5" />
                      <div className="h-3 bg-slate-100/60 dark:bg-white/8 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200/60 dark:bg-white/10 rounded-full w-20" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="h-8 bg-slate-100/60 dark:bg-white/8 rounded-xl w-16" />
                  <div className="h-8 bg-slate-100/60 dark:bg-white/8 rounded-xl w-12" />
                  <div className="h-8 bg-slate-100/60 dark:bg-white/8 rounded-xl w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste devis */}

        {/* Vue Kanban */}
        {viewMode === "kanban" && !loading && filtered.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {["En attente", "Accepté", "Refusé"].map(colStatus => {
              const colDevis = filtered.filter(d => 
                colStatus === "En attente" ? isEnAttente(d.statut) : d.statut === colStatus
              );
              
              const colConfig = statutConfig[colStatus === "En attente" ? "En attente" : colStatus];
              const ColIcon = colConfig.icon;

              return (
                <div key={colStatus} className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col gap-3 snap-start">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold ${colConfig.color} flex items-center gap-2`}>
                      <ColIcon size={16} /> {colStatus}
                    </h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 font-semibold">{colDevis.length}</span>
                  </div>
                  
                  {colDevis.map((d, i) => {
                    const pending = isEnAttente(d.statut);
                    const isUpdating = updatingStatut === d.numero;
                    return (
                      <motion.div
                        key={d.numero || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3"
                       whileHover={{ scale: 1.01, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{d.nomClient}</p>
                              {d.lu_le && <span title={`Vu le ${new Date(d.lu_le).toLocaleDateString()}`}><Eye className="w-3 h-3 text-blue-500" /></span>}
                            </div>
                            <p className="text-xs text-slate-400">{d.numero}</p>
                            {d.optionLabel && (
                              <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] font-bold capitalize ${optionColors[d.optionLabel] || "bg-violet-100 text-violet-700"}`}>
                                {d.optionLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{d.totalTTC}€</p>
                        </div>
                        
                        {pending && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateStatut(d.numero, "Accepté")} disabled={isUpdating} className="flex-1 min-h-[40px] py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"><Check size={14} className="inline mr-1"/>Valider</button>
                            <button onClick={() => handleUpdateStatut(d.numero, "Refusé")} disabled={isUpdating} className="flex-1 min-h-[40px] py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition"><X size={14} className="inline mr-1"/>Refuser</button>
                            <button onClick={(e) => {
                              e.preventDefault();
                              window.location.href = buildFollowUpMailTo(d);
                            }} className="min-h-[40px] py-2 px-2.5 bg-violet-50 dark:bg-violet-500/10 text-brand-violet text-xs font-semibold rounded-lg hover:bg-violet-100 dark:bg-violet-900/30 transition" title="Relancer par email">
                              <Mail size={14}/>
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Link href={`/devis/${d.numero}`} className="flex-1">
                            <button className="w-full min-h-[40px] py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                              Ouvrir
                            </button>
                          </Link>
                          <div className="hidden items-center gap-2 md:flex">
                            <button
                              onClick={() => handleDuplicate(d.numero)}
                              disabled={duplicating === d.numero}
                              className="py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
                              title="Dupliquer"
                            >
                              <CopyPlus size={14} />
                            </button>
                            {pending ? (
                              <button
                                onClick={() => handleCopySignLink(d.numero)}
                                className="flex-1 py-1.5 px-3 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-lg hover:bg-violet-200 dark:hover:bg-violet-800 transition flex items-center justify-center gap-1 border border-violet-200 dark:border-violet-700"
                              >
                                <PenTool size={12} />
                                Lien
                              </button>
                            ) : null}
                          </div>
                          <ClientMobileActionsMenu items={getMobileQuoteActions(d)} panelAlign="left" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Liste devis */}
        {!loading && (
          filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
              <FileText size={48} strokeWidth={1} />
              <p className="text-sm">{search ? "Aucun résultat" : "Aucun devis encore"}</p>
              <Link href="/nouveau-devis">
                <motion.button whileTap={{ scale: 0.96 }} className="mt-4 px-6 py-3 bg-gradient-zolio text-white font-semibold rounded-xl shadow-lg text-sm">
                  Créer mon premier devis
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{totalDisplayed} devis</p>
              {renderGroups.map(({ parent: d, children }, i) => {
                const config = statutConfig[d.statut] || statutConfig["En attente"];
                const Icon = config.icon;
                const pending = isEnAttente(d.statut);
                const isUpdating = updatingStatut === d.numero;
                const hasOptions = children.length > 0;

                return (
                  <div key={d.id || d.numero} className={hasOptions ? "rounded-2xl border border-violet-200/60 bg-violet-50/30 dark:border-violet-800/40 dark:bg-violet-950/20 p-2" : undefined}>
                  <motion.div
                    key={d.numero || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.15) }}
                    className={`bg-slate-50 dark:bg-slate-800 rounded-2xl border ${hasOptions ? "border-violet-300/50 dark:border-violet-700/50 shadow-sm" : "border-slate-100 dark:border-slate-800"}`}
                  >
                    <div className="p-4 md:hidden">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 text-brand-violet flex items-center justify-center font-bold text-sm shrink-0">
                          {(d.nomClient || "").charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 dark:text-white text-sm">{d.nomClient}</p>
                              <p className="mt-1 text-xs text-slate-400">{d.numero} · {d.date}</p>
                            </div>
                            <ClientMobileActionsMenu items={getMobileQuoteActions(d)} panelAlign="left" />
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`${config.bg} ${config.color} inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold`}>
                              <Icon size={12} /> {d.statut}
                            </span>
                            {d.optionLabel && (
                              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold capitalize ${optionColors[d.optionLabel] || "bg-violet-100 text-violet-700"}`}>
                                <Layers size={12} /> {d.optionLabel}
                              </span>
                            )}
                            {d.lu_le ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600"
                                title={`Vu le ${new Date(d.lu_le).toLocaleDateString()}`}
                              >
                                <Eye className="w-3 h-3" />
                                Vu
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/30">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total TTC</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{d.totalTTC}€</p>
                      </div>

                      <details className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                          Voir plus de détails
                        </summary>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total HT</p>
                            <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{d.totalHT}€</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">TVA</p>
                            <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{d.tva}</p>
                          </div>
                        </div>
                      </details>

                      <Link href={`/devis/${d.numero}`} className="mt-3 block">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          className="w-full min-h-[44px] py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-50 hover:border-violet-300 hover:text-brand-violet transition"
                        >
                          <Pencil size={14} /> Ouvrir
                        </motion.button>
                      </Link>
                    </div>

                    <div className="hidden p-4 md:block">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 text-brand-violet flex items-center justify-center font-bold text-sm shrink-0">
                            {(d.nomClient || "").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.nomClient}</p>
                              {d.lu_le ? (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-1" title={`Vu le ${new Date(d.lu_le).toLocaleDateString()}`}>
                                  <Eye className="w-3 h-3" />
                                  Vu
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-400">{d.numero} · {d.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`${config.bg} ${config.color} px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1`}>
                            <Icon size={12} /> {d.statut}
                          </div>
                          {d.optionLabel && (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize flex items-center gap-1 ${optionColors[d.optionLabel] || "bg-violet-100 text-violet-700"}`}>
                              <Layers size={12} /> {d.optionLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-400">Total HT</p>
                          <p className="text-sm font-semibold text-slate-700">{d.totalHT}€</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">TVA</p>
                          <p className="text-sm font-semibold text-slate-700">{d.tva}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Total TTC</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{d.totalTTC}€</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {pending ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                          >
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleUpdateStatut(d.numero, "Accepté")}
                              disabled={isUpdating}
                              className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-100 hover:border-emerald-400 transition disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            >
                              <Check size={16} /> {isUpdating ? "..." : "Valider"}
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleUpdateStatut(d.numero, "Refusé")}
                              disabled={isUpdating}
                              className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-red-100 hover:border-red-400 transition disabled:opacity-50"
                            >
                              <X size={16} /> {isUpdating ? "..." : "Refuser"}
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = buildFollowUpMailTo(d);
                              }}
                              className="flex-1 py-2.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 text-brand-violet font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-100 hover:border-violet-400 transition"
                            >
                              <Mail size={16} /> Relancer
                            </motion.button>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      <div className="flex gap-2 mt-3">
                        <Link href={`/devis/${d.numero}`} className="flex-1">
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-50 hover:border-violet-300 hover:text-brand-violet transition"
                          >
                            <Pencil size={14} /> Modifier
                          </motion.button>
                        </Link>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleDuplicate(d.numero)}
                          disabled={duplicating === d.numero}
                          className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-slate-100 transition disabled:opacity-50"
                        >
                          <CopyPlus size={14} /> {duplicating === d.numero ? "..." : "Dupliquer"}
                        </motion.button>
                        {pending ? (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleCopySignLink(d.numero)}
                            className="flex-1 py-2.5 bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-violet-200 dark:hover:bg-violet-800 transition"
                          >
                            <PenTool size={14} /> Lien signature
                          </motion.button>
                        ) : null}
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleDelete(d.numero)}
                          disabled={deleting === d.numero}
                          className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-red-200 text-red-500 font-semibold rounded-xl flex items-center justify-center gap-1 text-sm hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50"
                        >
                          <Trash2 size={14} /> {deleting === d.numero ? "..." : ""}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Options groupées sous le devis parent */}
                  {hasOptions && (
                    <div className="ml-3 mt-2 flex flex-col gap-1.5 pl-4 border-l-2 border-violet-300 dark:border-violet-700">
                      {children.map((child, ci) => {
                        const childConfig = statutConfig[child.statut] || statutConfig["En attente"];
                        const ChildIcon = childConfig.icon;
                        return (
                          <motion.div
                            key={child.id || child.numero}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min((i * 0.03 + ci * 0.02), 0.2) }}
                            className="bg-white/70 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/8 p-3 flex items-center justify-between gap-3"
                           whileHover={{ scale: 1.01, y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${optionColors[child.optionLabel || ""] || "bg-violet-100 text-violet-600"}`}>
                                <Layers size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{child.nomClient}</p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">{child.numero}</span>
                                  {child.optionLabel && (
                                    <span className={`inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-bold capitalize ${optionColors[child.optionLabel] || "bg-violet-100 text-violet-700"}`}>
                                      {child.optionLabel}
                                    </span>
                                  )}
                                  <span className={`${childConfig.bg} ${childConfig.color} inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-bold`}>
                                    <ChildIcon size={10} /> {child.statut}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{child.totalTTC}€</p>
                              <Link href={`/devis/${child.numero}`}>
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  className="py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-violet-50 hover:border-violet-300 hover:text-brand-violet transition"
                                >
                                  <Pencil size={12} />
                                </motion.button>
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                      {/* Bouton Comparer */}
                      <CompareOptions parentId={d.id} />
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </ClientSectionCard>
    </ClientSubpageShell>

      <MobileDialog
        open={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        title={deleteDialog?.kind === "bulk" ? "Supprimer plusieurs devis" : "Supprimer ce devis"}
        description={
          deleteDialog?.kind === "bulk"
            ? `Vous allez supprimer ${deleteDialog.numeros.length} devis. Cette action est définitive.`
            : deleteDialog
              ? `Le devis ${deleteDialog.numeros[0]} sera supprimé définitivement.`
              : undefined
        }
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setDeleteDialog(null)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Confirmer la suppression
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            {deleteDialog?.kind === "bulk"
              ? "Les devis sélectionnés disparaîtront de votre pipeline et de votre suivi client."
              : "Le devis supprimé ne sera plus accessible depuis le pipeline ni depuis son lien de signature."}
          </p>
          {deleteDialog && deleteDialog.numeros.length > 0 ? (
            <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 dark:border-rose-400/20 dark:bg-rose-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700 dark:text-rose-200">
                Devis concernés
              </p>
              <p className="mt-2 font-medium text-slate-900 dark:text-white">
                {deleteDialog.numeros.join(", ")}
              </p>
            </div>
          ) : null}
        </div>
      </MobileDialog>
    </>
  );
}
