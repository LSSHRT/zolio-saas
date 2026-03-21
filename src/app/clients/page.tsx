"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
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
import {
  ClientHeroStat,
  ClientMobileActionsMenu,
  ClientSectionCard,
  ClientSubpageShell,
  type ClientMobileAction,
} from "@/components/client-shell";

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
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
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
      }

      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      alert(message);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (response.ok) {
        mutate(clients.filter((client: Client) => client.id !== id), false);
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} élément(s) ?`)) return;

    setIsDeletingBulk(true);
    let successCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
        if (response.ok) successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    if (successCount > 0) {
      mutate(clients.filter((client: Client) => !selectedIds.has(client.id)), false);
      setSelectedIds(new Set());
    }

    setIsDeletingBulk(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim().length > 0);

      if (lines.length < 2) {
        alert("Le fichier est vide ou ne contient que les en-têtes.");
        return;
      }

      const headers = lines[0].toLowerCase().split(",").map((header) => header.trim());
      const parsedData = [];

      for (let index = 1; index < lines.length; index += 1) {
        const values = lines[index].split(",").map((value) => value.trim());
        const item: Record<string, string> = {};

        headers.forEach((header, headerIndex) => {
          if (header.includes("nom")) item.nom = values[headerIndex] || "";
          else if (header.includes("email")) item.email = values[headerIndex] || "";
          else if (header.includes("tel") || header.includes("tél")) item.telephone = values[headerIndex] || "";
          else if (header.includes("adresse")) item.adresse = values[headerIndex] || "";
        });

        if (item.nom) parsedData.push(item);
      }

      if (parsedData.length === 0) {
        alert("Aucune donnée valide trouvée. Vérifiez que la colonne 'nom' existe.");
        return;
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        mutate();
        alert(`${parsedData.length} client(s) importé(s) avec succès !`);
      } else {
        alert("Erreur lors de l'importation.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      icon: Trash2,
      label: "Supprimer",
      onClick: () => void handleDelete(client.id),
      tone: "danger",
    },
  ];

  return (
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
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
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

          {selectedIds.size > 0 ? (
            <button
              type="button"
              onClick={handleBulkDelete}
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

      {showForm && (
        <ClientSectionCard>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                {editingId ? "Édition" : "Création"}
              </p>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                {editingId ? "Mettre à jour la fiche client" : "Créer une nouvelle fiche client"}
              </h2>
            </div>

            <input
              required
              placeholder="Nom complet"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              required
              type="email"
              inputMode="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              required
              type="tel"
              inputMode="tel"
              placeholder="Téléphone"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
            <input
              placeholder="Adresse"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />

            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Ajouter le client"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        </ClientSectionCard>
      )}

      <ClientSectionCard>
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-700" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-44 rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700" />
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
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {filtered.length} client{filtered.length > 1 ? "s" : ""}
                </p>

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
                              <ClientMobileActionsMenu items={getMobileClientActions(client)} panelAlign="left" />
                            </div>

                            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200/80 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                              <PrimaryIcon size={12} />
                              <span className="truncate">{primaryContact.label}</span>
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
                              onClick={() => handleDelete(client.id)}
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
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

      <AnimatePresence>
        {historyClient && (
          <HistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />
        )}
      </AnimatePresence>
    </ClientSubpageShell>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="border-b border-slate-100 px-6 py-5 dark:border-white/8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
                Historique client
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{client.nom}</h2>
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

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {history.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Aucune activité enregistrée pour ce client.
            </div>
          ) : (
            <div className="relative ml-3 space-y-8 border-l-2 border-slate-200 dark:border-white/10">
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {item.type === "facture" ? "Facture" : "Devis"} #{item.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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

                    <div className="mt-4 flex items-center justify-between">
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
