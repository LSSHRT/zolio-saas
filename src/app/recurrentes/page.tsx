"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { Plus, RefreshCw, Trash2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

interface Client {
  id: string;
  nom: string;
  email: string;
}

interface FactureRecurrente {
  id: string;
  nom: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  frequence: string;
  jourMois: number;
  prochaineDate: string;
  dateFin: string | null;
  actif: boolean;
  description: string | null;
  client: Client;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FREQUENCE_LABELS: Record<string, string> = {
  mensuel: "Mensuel",
  trimestriel: "Trimestriel",
  annuel: "Annuel",
};

export default function RecurrentesPage() {
  const { data, mutate, isLoading } = useSWR<FactureRecurrente[]>(
    "/api/recurrentes",
    fetcher,
  );

  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    nom: "",
    montantHT: "",
    tva: "20",
    frequence: "mensuel",
    jourMois: "1",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      logError("recurrentes-load-clients", err);
    }
  }, []);

  const handleCreate = async () => {
    if (!form.clientId || !form.nom || !form.montantHT) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recurrentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          nom: form.nom,
          montantHT: parseFloat(form.montantHT),
          tva: parseFloat(form.tva),
          frequence: form.frequence,
          jourMois: parseInt(form.jourMois, 10),
          description: form.description || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      toast.success("Facture récurrente créée");
      setShowForm(false);
      setForm({ clientId: "", nom: "", montantHT: "", tva: "20", frequence: "mensuel", jourMois: "1", description: "" });
      mutate();
    } catch (err) {
      logError("recurrentes-create", err);
      toast.error("Impossible de créer la facture récurrente");
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (item: FactureRecurrente) => {
    try {
      await fetch(`/api/recurrentes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !item.actif }),
      });
      toast.success(item.actif ? "Facture mise en pause" : "Facture réactivée");
      mutate();
    } catch (err) {
      logError("recurrentes-toggle", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette facture récurrente ?")) return;
    try {
      await fetch(`/api/recurrentes/${id}`, { method: "DELETE" });
      toast.success("Facture récurrente supprimée");
      mutate();
    } catch (err) {
      logError("recurrentes-delete", err);
      toast.error("Impossible de supprimer");
    }
  };

  const recurrentes = data ?? [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Factures récurrentes</h1>
        <button
          onClick={() => {
            setShowForm(true);
            loadClients();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle récurrence
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>Actives</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{recurrentes.filter((r) => r.actif).length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Pause className="h-4 w-4" />
            <span>En pause</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{recurrentes.filter((r) => !r.actif).length}</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      )}

      {!isLoading && recurrentes.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <RefreshCw className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucune facture récurrente. Créez-en une pour automatiser votre facturation.
          </p>
        </div>
      )}

      {!isLoading && recurrentes.length > 0 && (
        <div className="space-y-3">
          {recurrentes.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4"
            >
              <div className={`rounded-lg p-2 ${item.actif ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{item.nom}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${item.actif ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>
                    {item.actif ? "Actif" : "En pause"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.client.nom} — {item.montantTTC.toFixed(2)}€ {FREQUENCE_LABELS[item.frequence] || item.frequence}
                </p>
                <p className="text-xs text-muted-foreground">
                  Prochaine facture : {new Date(item.prochaineDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActif(item)}
                  className="rounded-lg p-2 transition hover:bg-muted"
                  title={item.actif ? "Mettre en pause" : "Réactiver"}
                >
                  {item.actif ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nouvelle facture récurrente</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Client *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-base font-medium">Nom du contrat *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Entretien mensuel"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Montant HT *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.montantHT}
                    onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">TVA (%)</label>
                  <input
                    type="number"
                    value={form.tva}
                    onChange={(e) => setForm({ ...form, tva: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Fréquence</label>
                  <select
                    value={form.frequence}
                    onChange={(e) => setForm({ ...form, frequence: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                  >
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-base font-medium">Jour du mois</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={form.jourMois}
                    onChange={(e) => setForm({ ...form, jourMois: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-base"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
