"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<FactureRecurrente | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
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

  const recurrentes = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(
    () =>
      recurrentes.filter(
        (r) =>
          r.nom.toLowerCase().includes(search.toLowerCase()) ||
          r.client.nom.toLowerCase().includes(search.toLowerCase()),
      ),
    [recurrentes, search],
  );

  const actives = useMemo(() => recurrentes.filter((r) => r.actif).length, [recurrentes]);
  const enPause = useMemo(() => recurrentes.filter((r) => !r.actif).length, [recurrentes]);
  const totalMensuel = useMemo(
    () =>
      recurrentes
        .filter((r) => r.actif)
        .reduce((sum, r) => sum + (r.frequence === "mensuel" ? r.montantTTC : r.frequence === "trimestriel" ? r.montantTTC / 3 : r.montantTTC / 12), 0),
    [recurrentes],
  );

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const cdata = await res.json();
      setClients(cdata);
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
    setDeleting(id);
    try {
      await fetch(`/api/recurrentes/${id}`, { method: "DELETE" });
      toast.success("Facture récurrente supprimée");
      setPendingDelete(null);
      mutate();
    } catch (err) {
      logError("recurrentes-delete", err);
      toast.error("Impossible de supprimer");
    } finally {
      setDeleting(null);
    }
  };

  const getMobileActions = (item: FactureRecurrente): ClientMobileAction[] => [
    {
      icon: item.actif ? Pause : Play,
      label: item.actif ? "Mettre en pause" : "Réactiver",
      onClick: () => toggleActif(item),
    },
    {
      icon: Trash2,
      label: deleting === item.id ? "Suppression..." : "Supprimer",
      onClick: () => setPendingDelete(item),
      tone: "danger",
      disabled: deleting === item.id,
    },
  ];

  return (
    <ClientSubpageShell
      title="Factures récurrentes"
      description="Automatisez votre facturation récurrente. Créez des contrats mensuels, trimestriels ou annuels et laissez Zolio générer les factures pour vous."
      activeNav="tools"
      eyebrow="Automatisation"
      mobilePrimaryAction={
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            loadClients();
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Nouvelle
        </button>
      }
      actions={
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            loadClients();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Nouvelle récurrence
        </button>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Actives"
            value={String(actives)}
            detail="Contrats en cours"
            tone="emerald"
          />
          <ClientHeroStat
            label="En pause"
            value={String(enPause)}
            detail="Contrats suspendus"
            tone="slate"
          />
          <ClientHeroStat
            label="CA mensuel estimé"
            value={`${totalMensuel.toFixed(0)}€`}
            detail="Revenu récurrent"
            tone="violet"
          />
          <ClientHeroStat
            label="Total"
            value={String(recurrentes.length)}
            detail="Contrats créés"
            tone="amber"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Vue d'ensemble"
          description="Suivez vos contrats récurrents et votre revenu prévisible en un coup d'œil."
          badge={`${recurrentes.length} contrats`}
          items={[
            { label: "Actives", value: String(actives), detail: "En cours", tone: "emerald" },
            { label: "En pause", value: String(enPause), detail: "Suspendus", tone: "slate" },
            { label: "CA mensuel", value: `${totalMensuel.toFixed(0)}€`, detail: "Estimé", tone: "violet" },
            { label: "Visible", value: String(filtered.length), detail: "Résultats", tone: "amber" },
          ]}
        />
      }
    >
      <ClientSectionCard>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un contrat ou un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
          />
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-shimmer rounded-2xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200/60 dark:bg-white/10" />
                    <div>
                      <div className="mb-2 h-4 w-32 rounded bg-slate-200/60 dark:bg-white/10" />
                      <div className="h-3 w-24 rounded bg-slate-100/60 dark:bg-white/8" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-200/60 dark:bg-white/10" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="h-8 w-24 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                  <div className="h-8 w-20 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-slate-400">
                <RefreshCw size={48} strokeWidth={1} />
                <p className="text-sm">
                  {search ? "Aucun résultat" : "Aucune facture récurrente. Créez-en une pour automatiser votre facturation."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/8 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      Contrats actifs
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {filtered.length} récurrence{filtered.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-xs sm:text-right">
                    Activez, mettez en pause ou supprimez vos contrats depuis cette vue.
                  </p>
                </div>

                {filtered.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.15) }}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4"
                  >
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold ${item.actif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
                            <RefreshCw size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                              {item.nom}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.client.nom} · {FREQUENCE_LABELS[item.frequence] || item.frequence}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.actif ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
                          {item.actif ? "Actif" : "Pause"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/20">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Montant TTC
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                            {item.montantTTC.toFixed(2)}€
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/8 dark:bg-slate-950/20">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            Prochaine facture
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {new Date(item.prochaineDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => toggleActif(item)}
                          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:flex-1 ${item.actif ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"}`}
                        >
                          {item.actif ? <Pause size={15} /> : <Play size={15} />}
                          {item.actif ? "Mettre en pause" : "Réactiver"}
                        </button>

                        <ClientMobileActionsMenu
                          buttonLabel={`Actions ${item.nom}`}
                          items={getMobileActions(item)}
                          stretch
                        />
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold ${item.actif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
                            <RefreshCw size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                              {item.nom}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.client.nom} · {FREQUENCE_LABELS[item.frequence] || item.frequence} · Jour {item.jourMois}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.actif ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
                          {item.actif ? "Actif" : "En pause"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm dark:border-white/8 dark:bg-slate-950/20 md:grid-cols-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            Montant HT
                          </p>
                          <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                            {item.montantHT.toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            TVA
                          </p>
                          <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                            {item.tva}%
                          </p>
                        </div>
                        <div className="md:text-right">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            Montant TTC
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                            {item.montantTTC.toFixed(2)}€
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActif(item)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${item.actif ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"}`}
                        >
                          {item.actif ? <Pause size={15} /> : <Play size={15} />}
                          {item.actif ? "Pause" : "Réactiver"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          disabled={deleting === item.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-400/20 dark:bg-transparent dark:text-rose-300"
                        >
                          <Trash2 size={15} />
                          {deleting === item.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </ClientSectionCard>

      {/* Create dialog */}
      <MobileDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nouvelle facture récurrente"
        description="Configurez un contrat récurrent pour automatiser votre facturation."
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Client *</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nom du contrat *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Entretien mensuel"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Montant HT *</label>
              <input
                type="number"
                step="0.01"
                value={form.montantHT}
                onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">TVA (%)</label>
              <input
                type="number"
                value={form.tva}
                onChange={(e) => setForm({ ...form, tva: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Fréquence</label>
              <select
                value={form.frequence}
                onChange={(e) => setForm({ ...form, frequence: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Jour du mois</label>
              <input
                type="number"
                min="1"
                max="28"
                value={form.jourMois}
                onChange={(e) => setForm({ ...form, jourMois: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
            />
          </div>
        </div>
      </MobileDialog>

      {/* Delete confirmation dialog */}
      <MobileDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Supprimer cette récurrence ?"
        description={
          pendingDelete
            ? `Le contrat « ${pendingDelete.nom} » avec ${pendingDelete.client.nom} sera supprimé définitivement.`
            : undefined
        }
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => pendingDelete && void handleDelete(pendingDelete.id)}
              disabled={Boolean(pendingDelete && deleting === pendingDelete.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {pendingDelete && deleting === pendingDelete.id ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          Les factures déjà générées par ce contrat ne seront pas supprimées.
        </div>
      </MobileDialog>
    </ClientSubpageShell>
  );
}
