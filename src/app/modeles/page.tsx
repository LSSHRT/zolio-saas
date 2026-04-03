"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { FileText, LayoutTemplate, Plus, Search, Sparkles, Trash2, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import { getTradeBundlesForTrade, TRADE_OPTIONS, type TradeKey } from "@/lib/trades";

interface TemplateLigne {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
}

interface Template {
  id: string;
  nom: string;
  description: string;
  lignes: TemplateLigne[];
  createdAt: string;
}

interface Client {
  id: string;
  nom: string;
  email: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ModelesPage() {
  const { data, isLoading, mutate } = useSWR<Template[]>("/api/templates", fetcher, {
    revalidateOnFocus: false,
  });
  const templates = useMemo<Template[]>(() => (Array.isArray(data) ? data : []), [data]);
  const loading = isLoading && !data;

  const { data: clientsData } = useSWR<Client[]>("/api/clients", fetcher, {
    revalidateOnFocus: false,
  });
  const clients = useMemo<Client[]>(() => (Array.isArray(clientsData) ? clientsData : []), [clientsData]);

  // Templates par métier (bundles)
  const tradeBundles = useMemo(() => {
    return TRADE_OPTIONS.map((trade) => ({
      ...trade,
      bundles: getTradeBundlesForTrade(trade.key),
    }));
  }, []);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState<Template | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("");

  // Form state for new template
  const [newNom, setNewNom] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLignes, setNewLignes] = useState<{ description: string; quantite: number; prixUnitaire: number }[]>([
    { description: "", quantite: 1, prixUnitaire: 0 },
  ]);

  const filtered = useMemo(
    () =>
      templates.filter(
        (tpl) =>
          (tpl.nom || "").toLowerCase().includes(search.toLowerCase()) ||
          (tpl.description || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [templates, search],
  );

  const totalTemplates = templates.length;
  const totalLignes = useMemo(
    () => templates.reduce((sum, tpl) => sum + (tpl.lignes?.length || 0), 0),
    [templates],
  );
  const estimatedTotal = useMemo(
    () =>
      templates.reduce(
        (sum, tpl) =>
          sum + (tpl.lignes || []).reduce((s, l) => s + l.quantite * l.prixUnitaire, 0),
        0,
      ),
    [templates],
  );

  const getTemplateTotal = (tpl: Template) =>
    (tpl.lignes || []).reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

  const handleUseBundle = (bundle: { nom: string; description: string; lignes: { nomPrestation: string; quantite: number; unite: string; prixUnitaire: number; totalLigne: number }[] }) => {
    setNewNom(bundle.nom);
    setNewDescription(bundle.description);
    setNewLignes(
      bundle.lignes.map((l) => ({
        description: `${l.nomPrestation} (${l.unite})`,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    );
    setCreateDialogOpen(true);
    toast.success(`Template « ${bundle.nom} » chargé — personnalisez et enregistrez.`);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Erreur de suppression");
      }
      await mutate();
      toast.success("Modèle supprimé.");
      setPendingDelete(null);
    } catch (error) {
      logError("modeles-delete", error);
      toast.error("Impossible de supprimer le modèle.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newNom.trim()) {
      toast.error("Le nom du modèle est requis.");
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: newNom.trim(),
          description: newDescription.trim(),
          lignes: newLignes.filter((l) => l.description.trim()),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Erreur de création");
      }
      await mutate();
      toast.success("Modèle créé !");
      setCreateDialogOpen(false);
      setNewNom("");
      setNewDescription("");
      setNewLignes([{ description: "", quantite: 1, prixUnitaire: 0 }]);
    } catch (error) {
      logError("modeles-create", error);
      toast.error("Impossible de créer le modèle.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUse = async () => {
    if (!useDialogOpen || !selectedClientId) {
      toast.error("Sélectionnez un client.");
      return;
    }
    setIsUsing(true);
    try {
      const response = await fetch(`/api/templates/${useDialogOpen.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Erreur");
      }
      toast.success("Devis créé à partir du modèle !");
      setUseDialogOpen(null);
      setSelectedClientId("");
    } catch (error) {
      logError("modeles-use", error);
      toast.error("Impossible de créer le devis.");
    } finally {
      setIsUsing(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Décrivez le chantier.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/templates/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim(), trade: selectedTrade || undefined }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Erreur IA");
      }
      const result = await response.json();
      // Pré-remplir le formulaire avec les lignes IA
      setNewNom(result.titre || "Devis IA");
      setNewDescription(aiPrompt.trim());
      setNewLignes(
        result.lignes.map((l: { nomPrestation: string; description?: string; quantite: number; unite: string; prixUnitaire: number }) => ({
          description: `${l.nomPrestation}${l.description ? ` — ${l.description}` : ""} (${l.unite})`,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        })),
      );
      setAiPrompt("");
      toast.success(`${result.lignes.length} lignes générées par l'IA !`);
    } catch (error) {
      logError("modeles-ai-generate", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération IA.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addLigne = () => {
    setNewLignes((prev) => [...prev, { description: "", quantite: 1, prixUnitaire: 0 }]);
  };

  const removeLigne = (index: number) => {
    setNewLignes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLigne = (index: number, field: string, value: string | number) => {
    setNewLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  };

  return (
    <ClientSubpageShell
      title="Modèles de devis"
      description="Créez et gérez vos modèles de devis pour gagner du temps sur les projets récurrents."
      eyebrow="Bibliothèque modèles"
      activeNav="devis"
      mobilePrimaryAction={
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Nouveau
        </button>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Modèles"
            value={String(totalTemplates)}
            detail="Modèles enregistrés"
            tone="violet"
          />
          <ClientHeroStat
            label="Lignes totales"
            value={String(totalLignes)}
            detail="Postes cumulés"
            tone="emerald"
          />
          <ClientHeroStat
            label="Estimation"
            value={`${estimatedTotal.toFixed(0)}€`}
            detail="Montant total estimé"
            tone="amber"
          />
          <ClientHeroStat
            label="Affichés"
            value={String(filtered.length)}
            detail="Résultat filtré"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Vue modèles"
          description="Retrouvez vos modèles de devis et créez-en un nouveau en un geste."
          badge={`${filtered.length} modèles`}
          items={[
            { label: "Modèles", value: String(totalTemplates), detail: "Enregistrés", tone: "violet" },
            { label: "Lignes", value: String(totalLignes), detail: "Postes", tone: "emerald" },
            { label: "Estimation", value: `${estimatedTotal.toFixed(0)}€`, detail: "Total", tone: "amber" },
            { label: "Affichés", value: String(filtered.length), detail: "Filtrés", tone: "slate" },
          ]}
        />
      }
    >
      <ClientSectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              className="w-full rounded-[1.1rem] border border-slate-200/80 bg-white/80 py-3 pl-10 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
          >
            <Plus size={16} />
            Nouveau modèle
          </button>
        </div>
      </ClientSectionCard>

      {/* Templates par métier */}
      <ClientSectionCard>
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Templates par métier</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Packs pré-construits par profession, prêts à personnaliser.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tradeBundles.map((trade) => (
            <div
              key={trade.key}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/8 dark:bg-white/4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Wrench size={18} className="text-violet-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{trade.label}</h3>
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  {trade.bundles.length} packs
                </span>
              </div>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{trade.summary}</p>
              <div className="space-y-2">
                {trade.bundles.map((bundle, bi) => {
                  const total = bundle.lignes.reduce((s, l) => s + l.totalLigne, 0);
                  return (
                    <div
                      key={bi}
                      className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2.5 dark:border-white/6 dark:bg-white/4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{bundle.nom}</p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{bundle.description}</p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{total.toFixed(0)}€</span>
                        <button
                          type="button"
                          onClick={() => handleUseBundle(bundle)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-zolio px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-brand transition hover:opacity-90"
                        >
                          <Plus size={12} />
                          Utiliser
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vos modèles personnalisés</h3>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 rounded-[1.5rem] bg-slate-100 dark:bg-white/6" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[1.85rem] border border-dashed border-slate-200 px-6 py-14 text-center dark:border-white/10">
            <LayoutTemplate className="text-slate-300 dark:text-slate-600" size={46} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun modèle</h2>
            <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Créez votre premier modèle pour gagner du temps.
            </p>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            >
              <Plus size={16} />
              Nouveau modèle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tpl, index) => (
              <motion.article
                key={tpl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.15) }}
                className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-violet-50/80 px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                        <LayoutTemplate size={12} />
                        Modèle
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {(tpl.lignes || []).length} ligne{(tpl.lignes || []).length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{tpl.nom}</p>
                    {tpl.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tpl.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {getTemplateTotal(tpl).toFixed(2)} €
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseDialogOpen(tpl);
                          setSelectedClientId("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                      >
                        <FileText size={12} />
                        Créer un devis
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(tpl)}
                        disabled={deletingId === tpl.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200/80 bg-rose-50/80 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                        aria-label={`Supprimer le modèle ${tpl.nom}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {(tpl.lignes || []).length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 dark:border-white/8 dark:bg-slate-950/20">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      <span>Description</span>
                      <span className="text-right">Qté</span>
                      <span className="text-right">P.U.</span>
                      <span className="text-right">Total</span>
                    </div>
                    {tpl.lignes.map((ligne) => (
                      <div
                        key={ligne.id}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-t border-slate-100 px-4 py-2.5 text-sm dark:border-white/6"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-200">{ligne.description}</span>
                        <span className="text-right text-slate-500 dark:text-slate-400">{ligne.quantite}</span>
                        <span className="text-right text-slate-500 dark:text-slate-400">{ligne.prixUnitaire.toFixed(2)}€</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-white">
                          {(ligne.quantite * ligne.prixUnitaire).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </ClientSectionCard>

      {/* Create dialog */}
      <MobileDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Nouveau modèle"
        description="Créez un modèle de devis réutilisable."
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition disabled:opacity-50"
            >
              {isCreating ? "Création..." : "Créer le modèle"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Génération IA */}
          <div className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 p-4 dark:border-violet-400/20 dark:from-violet-500/8 dark:to-fuchsia-500/5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-600 dark:text-violet-300" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-200">Générer avec l'IA</span>
            </div>
            <div className="space-y-2">
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full rounded-lg border border-violet-200/60 bg-white/80 px-3 py-2 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/6 dark:text-white"
              >
                <option value="">Métier (optionnel)</option>
                <option value="peintre">Peintre</option>
                <option value="plaquiste">Plaquiste</option>
                <option value="plombier">Plombier</option>
                <option value="electricien">Électricien</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Décrivez le chantier..."
                  className="flex-1 rounded-lg border border-violet-200/60 bg-white/80 px-3 py-2 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {isGeneratingAI ? "..." : "Go"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Nom du modèle
            </label>
            <input
              type="text"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              placeholder="Ex : Pose cuisine standard"
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Lignes
              </label>
              <button
                type="button"
                onClick={addLigne}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-3">
              {newLignes.map((ligne, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/8 dark:bg-white/4"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={ligne.description}
                      onChange={(e) => updateLigne(index, "description", e.target.value)}
                      placeholder="Description de la ligne"
                      className="flex-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-base outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/6 dark:text-white"
                    />
                    {newLignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-400">Qté</label>
                      <input
                        type="number"
                        min={0}
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, "quantite", Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-base outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/6 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        Prix unitaire €
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={ligne.prixUnitaire}
                        onChange={(e) => updateLigne(index, "prixUnitaire", Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-base outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/6 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MobileDialog>

      {/* Use template dialog */}
      <MobileDialog
        open={Boolean(useDialogOpen)}
        onClose={() => {
          setUseDialogOpen(null);
          setSelectedClientId("");
        }}
        title="Créer un devis"
        description={
          useDialogOpen ? `Utiliser le modèle « ${useDialogOpen.nom} » pour créer un devis.` : undefined
        }
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setUseDialogOpen(null);
                setSelectedClientId("");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUse}
              disabled={isUsing || !selectedClientId}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition disabled:opacity-50"
            >
              {isUsing ? "Création..." : "Créer le devis"}
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <Users size={14} className="mr-1 inline" />
            Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
          >
            <option value="">Sélectionner un client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
              </option>
            ))}
          </select>
        </div>
      </MobileDialog>

      {/* Delete confirmation dialog */}
      <MobileDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Supprimer ce modèle ?"
        description={
          pendingDelete
            ? `Le modèle « ${pendingDelete.nom} » sera supprimé définitivement.`
            : undefined
        }
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => pendingDelete && void handleDelete(pendingDelete.id)}
              disabled={Boolean(pendingDelete && deletingId === pendingDelete.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {pendingDelete && deletingId === pendingDelete.id ? "Suppression..." : "Supprimer"}
            </button>
          </>
        }
      >
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          Les devis déjà créés à partir de ce modèle ne seront pas affectés.
        </div>
      </MobileDialog>
    </ClientSubpageShell>
  );
}
