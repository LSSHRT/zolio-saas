"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Download,
  FileText,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
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

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateAjout: string;
}

interface HistoryDevis {
  numero: string;
  date: string;
  totalTTC: string;
  statut: string;
  nomClient: string;
  emailClient: string;
}

interface HistoryFacture {
  numero: string;
  date: string;
  totalTTC: string;
  nomClient: string;
  emailClient: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ClientsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, mutate } = useSWR("/api/clients", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const clients = useMemo<Client[]>(() => (Array.isArray(data) ? data : []), [data]);
  const loading = isLoading && !data;
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [pendingDeleteClient, setPendingDeleteClient] = useState<Client | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("created") !== "1") {
      return;
    }

    toast.success("Client créé.");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const filtered = useMemo(
    () =>
      clients.filter(
        (client: Client) =>
          (client.nom || "").toLowerCase().includes(search.toLowerCase()) ||
          (client.email || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [clients, search],
  );

  const clientsAvecEmail = useMemo(
    () => clients.filter((client: Client) => Boolean(client.email)).length,
    [clients],
  );
  const clientsAvecTelephone = useMemo(
    () => clients.filter((client: Client) => Boolean(client.telephone)).length,
    [clients],
  );
  const fichesCompletes = useMemo(
    () =>
      clients.filter(
        (client: Client) => Boolean(client.email) && Boolean(client.telephone) && Boolean(client.adresse),
      ).length,
    [clients],
  );

  const resetForm = () => {
    setForm({ nom: "", email: "", telephone: "", adresse: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const response = await fetch(`/api/clients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur serveur");
        }

        const updatedClient = await response.json();
        mutate(clients.map((client: Client) => (client.id === editingId ? updatedClient : client)), false);
        toast.success("Fiche client mise à jour.");
      } else {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur serveur");
        }

        const newClient = await response.json();
        mutate([...clients, newClient], false);
        toast.success("Client ajouté.");
      }

      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client: Client) => {
    setForm({
      nom: client.nom,
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const confirmDeleteClient = async () => {
    if (!pendingDeleteClient) return;

    const clientToDelete = pendingDeleteClient;
    setPendingDeleteClient(null);
    setDeletingId(clientToDelete.id);

    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, { method: "DELETE" });
      if (response.ok) {
        mutate(clients.filter((client: Client) => client.id !== clientToDelete.id), false);
        setSelectedIds((currentIds) => {
          if (!currentIds.has(clientToDelete.id)) {
            return currentIds;
          }
          const nextIds = new Set(currentIds);
          nextIds.delete(clientToDelete.id);
          return nextIds;
        });
        toast.success("Client supprimé.");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeletingBulk(true);
    let successCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
        if (response.ok) successCount++;
      } catch (err) {
        logError("clients-delete", err);
      }
    }

    if (successCount > 0) {
      mutate(clients.filter((client: Client) => !selectedIds.has(client.id)), false);
      setSelectedIds(new Set());
      toast.success(
        successCount === selectedIds.size
          ? `${successCount} client${successCount > 1 ? "s" : ""} supprimé${successCount > 1 ? "s" : ""}.`
          : `${successCount} suppression${successCount > 1 ? "s" : ""} réussie${successCount > 1 ? "s" : ""}.`,
      );
    } else {
      toast.error("Aucun client n'a pu être supprimé.");
    }

    setConfirmBulkDeleteOpen(false);
    setIsDeletingBulk(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de l'importation.");
        return;
      }

      const { imported = 0, errors = [] } = result;

      if (imported > 0) {
        mutate();
        toast.success(`${imported} client${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""} avec succès.`);
      }

      if (errors.length > 0) {
        const detail = errors.slice(0, 3).map((err: { row: number; message: string }) => `Ligne ${err.row}: ${err.message}`).join(", ");
        toast.error(`${errors.length} erreur${errors.length > 1 ? "s" : ""} : ${detail}`);
      }

      if (imported === 0 && errors.length === 0) {
        toast.error("Aucune donnée valide trouvée dans le fichier CSV.");
      }
    } catch (err) {
      logError("clients-import", err);
      toast.error("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast.error("Aucun client à exporter.");
      return;
    }
    const headers = ["Nom", "Email", "Téléphone", "Adresse"];
    const rows = clients.map((c: Client) => [
      `"${(c.nom || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.telephone || "").replace(/"/g, '""')}"`,
      `"${(c.adresse || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zolio-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${clients.length} client${clients.length > 1 ? "s" : ""} exporté${clients.length > 1 ? "s" : ""}.`);
  };

  const getPrimaryContact = (client: Client) => {
    if (client.email) {
      return {
        icon: Mail,
        label: client.email,
      };
    }

    if (client.telephone) {
      return {
        icon: Phone,
        label: client.telephone,
      };
    }

    return {
      icon: MapPin,
      label: client.adresse || "Coordonnées à compléter",
    };
  };

  const getMobileClientActions = (client: Client): ClientMobileAction[] => [
    {
      icon: History,
      label: "Voir l'historique",
      onClick: () => setHistoryClient(client),
    },
    {
      icon: Pencil,
      label: "Modifier la fiche",
      onClick: () => handleEdit(client),
      tone: "accent",
    },
    {
      disabled: deletingId === client.id,
      icon: Trash2,
      label: deletingId === client.id ? "Suppression..." : "Supprimer",
      onClick: () => setPendingDeleteClient(client),
      tone: "danger",
    },
  ];

  return (
    <>
      <ClientSubpageShell
        title="Mes clients"
        description="Gardez vos coordonnées, votre historique et vos fiches de chantier dans un CRM plus propre, plus rapide et bien plus agréable sur mobile."
        activeNav="clients"
        eyebrow="CRM terrain"
        mobilePrimaryAction={
          <Link
            href="/clients/nouveau"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            <Plus size={16} />
            Nouveau
          </Link>
        }
        mobileSecondaryActions={[
          {
            disabled: isImporting,
            icon: Upload,
            label: isImporting ? "Import en cours..." : "Importer un CSV",
            onClick: () => fileInputRef.current?.click(),
          },
        ]}
        actions={
          <>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:text-white"
            >
              <Upload size={16} />
              {isImporting ? "Import..." : "Importer CSV"}
            </button>
            <Link
              href="/clients/nouveau"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
            >
              <Plus size={16} />
              Nouveau client
            </Link>
          </>
        }
        summary={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ClientHeroStat
              label="Portefeuille"
              value={String(clients.length)}
              detail={`${filtered.length} fiche${filtered.length > 1 ? "s" : ""} visibles`}
              tone="violet"
            />
            <ClientHeroStat
              label="Joignables"
              value={String(clientsAvecEmail)}
              detail="Avec une adresse email enregistrée"
              tone="emerald"
            />
            <ClientHeroStat
              label="Téléphones"
              value={String(clientsAvecTelephone)}
              detail="Contacts rapides pour vos relances"
              tone="amber"
            />
            <ClientHeroStat
              label="Fiches complètes"
              value={String(fichesCompletes)}
              detail="Email, téléphone et adresse renseignés"
              tone="slate"
            />
          </div>
        }
        mobileSummary={
          <ClientMobileOverview
            title="CRM terrain"
            description="Commencez par les fiches utiles, puis ouvrez le détail seulement quand il sert."
            badge={`${filtered.length} visibles`}
            items={[
              {
                label: "Clients",
                value: String(clients.length),
                detail: "Portefeuille total",
                tone: "violet",
              },
              {
                label: "Joignables",
                value: String(clientsAvecEmail),
                detail: "Avec email",
                tone: "emerald",
              },
              {
                label: "Téléphones",
                value: String(clientsAvecTelephone),
                detail: "Relance rapide",
                tone: "amber",
              },
              {
                label: "Complets",
                value: String(fichesCompletes),
                detail: "Fiches bien renseignées",
                tone: "slate",
              },
            ]}
          />
        }
      >
        <ClientSectionCard className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <label className="flex min-h-[50px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-white/10 dark:bg-white/6">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />
          </label>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(filtered.map((client: Client) => client.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
                Sélectionner tout ({filtered.length})
              </label>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-white/6">{selectedIds.size} sélectionné(s)</span>
                <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-white/6">Portrait mobile</span>
              </div>
            </div>

            {selectedIds.size > 0 ? (
              <button
                type="button"
                onClick={() => setConfirmBulkDeleteOpen(true)}
                disabled={isDeletingBulk}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/8 dark:text-rose-200 sm:w-auto"
              >
                <Trash2 size={15} />
                {isDeletingBulk ? "Suppression..." : `Supprimer (${selectedIds.size})`}
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Importez un CSV ou enrichissez chaque fiche au fil des chantiers.
              </span>
            )}
          </div>
        </ClientSectionCard>

        <ClientSectionCard>
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-shimmer rounded-[1.75rem] border border-slate-200/70 bg-white/70 p-5 dark:border-white/8 dark:bg-white/4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200/60 dark:bg-white/10" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-40 rounded bg-slate-200/60 dark:bg-white/10" />
                      <div className="h-3 w-28 rounded bg-slate-100/60 dark:bg-white/8" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-44 rounded bg-slate-100/60 dark:bg-white/8" />
                    <div className="h-3 w-32 rounded bg-slate-100/60 dark:bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400">
                  <User size={48} strokeWidth={1} />
                  <p className="text-sm">{search ? "Aucun résultat" : "Aucun client pour l'instant"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {filtered.length} client{filtered.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Ouvrez la fiche seulement quand vous en avez besoin.
                    </p>
                  </div>

                  {filtered.map((client: Client, index: number) => {
                    const primaryContact = getPrimaryContact(client);
                    const PrimaryIcon = primaryContact.icon;

                    return (
                      <motion.div
                        key={client.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.15) }}
                        className="rounded-[1.75rem] border border-slate-100 bg-slate-50 dark:border-white/8 dark:bg-white/4"
                      >
                        <div className="p-4 md:hidden">
                          <div className="flex items-start gap-3">
                            <label className="mt-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
                                checked={selectedIds.has(client.id)}
                                onChange={(event) => {
                                  setSelectedIds((currentIds) => {
                                    const nextIds = new Set(currentIds);
                                    if (event.target.checked) {
                                      nextIds.add(client.id);
                                    } else {
                                      nextIds.delete(client.id);
                                    }
                                    return nextIds;
                                  });
                                }}
                                aria-label={`Sélectionner ${client.nom}`}
                              />
                            </label>

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 font-bold text-brand-violet dark:bg-violet-500/12 dark:text-violet-200">
                              {(client.nom || "").charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                    {client.nom}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Ajouté le {client.dateAjout}
                                  </p>
                                </div>
                                <ClientMobileActionsMenu items={getMobileClientActions(client)} />
                              </div>

                              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200/80 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                                <PrimaryIcon size={12} />
                                <span className="truncate">{primaryContact.label}</span>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setHistoryClient(client)}
                                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
                                >
                                  <History size={15} />
                                  Historique
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(client)}
                                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/14"
                                >
                                  <Pencil size={15} />
                                  Modifier
                                </button>
                              </div>

                              <details className="mt-3 rounded-[1.2rem] border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                                  Voir la fiche
                                </summary>
                                <div className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                  {client.email ? (
                                    <div className="flex items-start gap-2">
                                      <Mail size={12} className="mt-0.5 shrink-0" />
                                      <span className="min-w-0 break-all">{client.email}</span>
                                    </div>
                                  ) : null}
                                  {client.telephone ? (
                                    <div className="flex items-start gap-2">
                                      <Phone size={12} className="mt-0.5 shrink-0" />
                                      <span>{client.telephone}</span>
                                    </div>
                                  ) : null}
                                  {client.adresse ? (
                                    <div className="flex items-start gap-2">
                                      <MapPin size={12} className="mt-0.5 shrink-0" />
                                      <span>{client.adresse}</span>
                                    </div>
                                  ) : null}
                                  {!client.email && !client.telephone && !client.adresse ? (
                                    <p>Cette fiche peut encore être enrichie avec les coordonnées du client.</p>
                                  ) : null}
                                </div>
                              </details>
                            </div>
                          </div>
                        </div>

                        <div className="hidden p-5 md:block">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <label className="mt-3 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-brand-violet focus:ring-violet-500"
                                  checked={selectedIds.has(client.id)}
                                  onChange={(event) => {
                                    setSelectedIds((currentIds) => {
                                      const nextIds = new Set(currentIds);
                                      if (event.target.checked) {
                                        nextIds.add(client.id);
                                      } else {
                                        nextIds.delete(client.id);
                                      }
                                      return nextIds;
                                    });
                                  }}
                                  aria-label={`Sélectionner ${client.nom}`}
                                />
                              </label>

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 font-bold text-brand-violet dark:bg-violet-500/12 dark:text-violet-200">
                                {(client.nom || "").charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                  {client.nom}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  Ajouté le {client.dateAjout}
                                </p>

                                <div className="mt-3 space-y-2">
                                  {client.email ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <Mail size={12} />
                                      <span className="truncate">{client.email}</span>
                                    </div>
                                  ) : null}
                                  {client.telephone ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <Phone size={12} />
                                      <span>{client.telephone}</span>
                                    </div>
                                  ) : null}
                                  {client.adresse ? (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <MapPin size={12} />
                                      <span className="truncate">{client.adresse}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setHistoryClient(client)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/10"
                                title="Voir l'historique"
                              >
                                <History size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(client)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-violet-50 hover:text-brand-violet dark:hover:bg-violet-500/10"
                                title="Modifier"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteClient(client)}
                                disabled={deletingId === client.id}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
      </ClientSubpageShell>

      <MobileDialog
        open={showForm}
        onClose={resetForm}
        title={editingId ? "Mettre à jour la fiche client" : "Créer une nouvelle fiche client"}
        description="Gardez une fiche courte, propre et facile à compléter depuis le terrain."
        tone="accent"
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
              {editingId ? "Édition" : "Création"}
            </p>
          </div>

          <input
            required
            placeholder="Nom complet"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />
          <input
            required
            type="email"
            inputMode="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />
          <input
            required
            type="tel"
            inputMode="tel"
            placeholder="Téléphone"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />
          <input
            placeholder="Adresse"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              <X size={16} />
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer les modifications"
                  : "Ajouter le client"}
            </button>
          </div>
        </form>
      </MobileDialog>

      <MobileDialog
        open={Boolean(pendingDeleteClient)}
        onClose={() => setPendingDeleteClient(null)}
        title="Supprimer ce client ?"
        description={pendingDeleteClient ? `La fiche ${pendingDeleteClient.nom} sera supprimée définitivement.` : undefined}
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingDeleteClient(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmDeleteClient()}
              disabled={Boolean(pendingDeleteClient && deletingId === pendingDeleteClient.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {pendingDeleteClient && deletingId === pendingDeleteClient.id ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          Supprimez la fiche seulement si vous n&apos;en avez plus besoin dans votre suivi chantier.
        </div>
      </MobileDialog>

      <MobileDialog
        open={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        title="Supprimer la sélection ?"
        description={`Vous allez retirer ${selectedIds.size} client${selectedIds.size > 1 ? "s" : ""} du CRM.`}
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
          Cette action vous aide à nettoyer rapidement la vue mobile, mais elle est définitive.
        </div>
      </MobileDialog>

      <AnimatePresence>
        {historyClient && <HistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />}
      </AnimatePresence>
    </>
  );
}

function HistoryModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { data: devis } = useSWR<HistoryDevis[]>("/api/devis", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const { data: factures } = useSWR<HistoryFacture[]>("/api/factures", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const history = useMemo(() => {
    const items: Array<{ type: string; id: string; date: string; montant: string; statut: string }> = [];

    if (devis && Array.isArray(devis)) {
      devis
        .filter((devisItem) => devisItem.nomClient === client.nom || devisItem.emailClient === client.email)
        .forEach((devisItem) => {
          items.push({
            type: "devis",
            id: devisItem.numero,
            date: devisItem.date,
            montant: devisItem.totalTTC,
            statut: devisItem.statut,
          });
        });
    }

    if (factures && Array.isArray(factures)) {
      factures
        .filter((facture) => facture.nomClient === client.nom || facture.emailClient === client.email)
        .forEach((facture) => {
          items.push({
            type: "facture",
            id: facture.numero,
            date: facture.date,
            montant: facture.totalTTC,
            statut: "Payé",
          });
        });
    }

    return items.sort((a, b) => {
      const partsA = a.date.split("/");
      const partsB = b.date.split("/");
      if (partsA.length === 3 && partsB.length === 3) {
        const dateA = new Date(Number(partsA[2]), Number(partsA[1]) - 1, Number(partsA[0])).getTime();
        const dateB = new Date(Number(partsB[2]), Number(partsB[1]) - 1, Number(partsB[0])).getTime();
        return dateB - dateA;
      }
      return b.date.localeCompare(a.date);
    });
  }, [devis, factures, client]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 backdrop-blur-md sm:items-center sm:p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55"
        aria-label="Fermer l'historique client"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/8 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Historique client
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white sm:text-xl">{client.nom}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {history.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Aucune activité enregistrée pour ce client.
            </div>
          ) : (
            <div className="relative ml-3 space-y-6 border-l-2 border-slate-200 dark:border-white/10 sm:space-y-8">
              {history.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="relative pl-6">
                  <div
                    className={`absolute -left-[11px] rounded-full border-2 bg-white p-0.5 dark:bg-slate-900 ${
                      item.type === "facture" ? "border-emerald-500" : "border-violet-500"
                    }`}
                  >
                    {item.type === "facture" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-brand-fuchsia" />
                    )}
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.type === "facture" ? "Facture" : "Devis"} #{item.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                      </div>
                      <span
                        className={`inline-flex self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.statut === "Accepté" || item.type === "facture"
                            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                            : item.statut === "Refusé"
                              ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                              : "bg-amber-400/12 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {item.statut || "En attente"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                        Montant
                      </p>
                      <p className="text-base font-semibold text-slate-950 dark:text-white">{item.montant} €</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
