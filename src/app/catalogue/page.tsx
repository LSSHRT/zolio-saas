"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { MobileDialog } from "@/components/mobile-dialog";
import {
  DEFAULT_TRADE,
  STARTER_CATEGORIES,
  TRADE_OPTIONS,
  getStarterCatalogForTrade,
  getTradeDefinition,
  type TradeKey,
} from "@/lib/trades";

interface Prestation {
  categorie: string;
  cout: number;
  id: string;
  nom: string;
  prix: number;
  stock?: number;
  unite: string;
}

type CatalogueForm = {
  categorie: string;
  cout: string;
  nom: string;
  prix: string;
  stock: string;
  unite: string;
};

type ImportedPrestation = {
  categorie: string;
  cout: number;
  nom: string;
  prix: number;
  stock?: number;
  unite: string;
};

const EMPTY_FORM: CatalogueForm = {
  categorie: STARTER_CATEGORIES[0] ?? "Autre",
  nom: "",
  unite: "m²",
  prix: "",
  cout: "",
  stock: "",
};

function formatPrice(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}€`;
}

function parseCsvRows(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Le fichier CSV est vide ou ne contient pas de données valides.");
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const rows: ImportedPrestation[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const columns = lines[index].split(separator).map((column) => column.trim().replace(/^"|"$/g, ""));
    if (!columns.some(Boolean)) {
      continue;
    }

    let categorie = "Autre";
    let nom = "Prestation sans nom";
    let unite = "forfait";
    let prix = 0;
    let cout = 0;
    let stock: number | undefined;

    if (columns.length >= 4) {
      categorie = columns[0] || "Autre";
      nom = columns[1] || "Prestation sans nom";
      unite = columns[2] || "forfait";
      prix = Number.parseFloat((columns[3] || "0").replace(",", ".")) || 0;
      cout = Number.parseFloat((columns[4] || "0").replace(",", ".")) || 0;
      const parsedStock = Number.parseFloat((columns[5] || "").replace(",", "."));
      stock = Number.isFinite(parsedStock) ? parsedStock : undefined;
    } else if (columns.length >= 2) {
      nom = columns[0] || "Prestation sans nom";
      prix = Number.parseFloat((columns[1] || "0").replace(",", ".")) || 0;
    }

    rows.push({ categorie, nom, unite, prix, cout, stock });
  }

  if (rows.length === 0) {
    throw new Error("Aucune prestation exploitable n'a été trouvée dans le fichier.");
  }

  return rows;
}

export default function CataloguePage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CatalogueForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeKey>(DEFAULT_TRADE);
  const [isImportingStarter, setIsImportingStarter] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Prestation | null>(null);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; rows: ImportedPrestation[] } | null>(null);

  const companyTrade = getTradeDefinition(user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade);
  const activeTrade = companyTrade?.key ?? selectedTrade;
  const activeTradeDefinition = getTradeDefinition(activeTrade) ?? getTradeDefinition(DEFAULT_TRADE);
  const starterCount = getStarterCatalogForTrade(activeTrade).length;

  const filteredPrestations = useMemo(
    () =>
      [...prestations]
        .filter(
          (prestation) =>
            (prestation.nom || "").toLowerCase().includes(search.toLowerCase()) ||
            (prestation.categorie || "").toLowerCase().includes(search.toLowerCase()),
        )
        .sort((first, second) => first.nom.localeCompare(second.nom, "fr-FR")),
    [prestations, search],
  );

  const categoriesCount = useMemo(
    () => new Set(filteredPrestations.map((prestation) => prestation.categorie || "Autre")).size,
    [filteredPrestations],
  );
  const stockedCount = useMemo(
    () => filteredPrestations.filter((prestation) => Number(prestation.stock ?? 0) > 0).length,
    [filteredPrestations],
  );
  const averagePrice = useMemo(() => {
    if (filteredPrestations.length === 0) {
      return 0;
    }

    const total = filteredPrestations.reduce((sum, prestation) => sum + prestation.prix, 0);
    return Math.round(total / filteredPrestations.length);
  }, [filteredPrestations]);

  useEffect(() => {
    fetch("/api/prestations")
      .then((response) => response.json())
      .then((data) => {
        setPrestations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!companyTrade) {
      return;
    }

    setSelectedTrade(companyTrade.key);
    setForm((current) => ({ ...current, categorie: current.categorie || EMPTY_FORM.categorie }));
  }, [companyTrade]);

  useEffect(() => {
    if (searchParams.get("created") !== "1") {
      return;
    }

    toast.success("Prestation ajoutée au catalogue.");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const reloadPrestations = async () => {
    const response = await fetch("/api/prestations");
    const data = await response.json();
    setPrestations(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const url = editingId ? `/api/prestations/${editingId}` : "/api/prestations";
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prix: Number.parseFloat(form.prix),
          cout: Number.parseFloat(form.cout) || 0,
          stock: Number.parseFloat(form.stock) || 0,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Erreur lors de l'enregistrement de la prestation.");
      }

      if (editingId) {
        const updatedItem = payload?.data ?? payload;
        setPrestations((current) =>
          current.map((prestation) =>
            prestation.id === editingId ? { ...prestation, ...updatedItem, id: editingId } : prestation,
          ),
        );
        toast.success("Prestation mise à jour.");
      } else {
        const createdItem = payload?.data ?? payload;
        setPrestations((current) => [...current, createdItem]);
        toast.success("Prestation ajoutée au catalogue.");
      }

      closeForm();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la prestation.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportStarterCatalog = async () => {
    if (!user || !activeTradeDefinition) {
      return;
    }

    setIsImportingStarter(true);
    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: activeTradeDefinition.key }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'importer le starter métier.");
      }

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyTrade: activeTradeDefinition.key,
          onboardingCompleted: true,
          starterCatalogImported: true,
        },
      });

      await reloadPrestations();
      toast.success(
        payload.imported > 0
          ? `${payload.imported} prestation(s) importée(s) pour ${activeTradeDefinition.label.toLowerCase()}`
          : `Starter ${activeTradeDefinition.label.toLowerCase()} déjà présent`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'importer le starter métier.";
      toast.error(message);
    } finally {
      setIsImportingStarter(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/prestations/${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la prestation.");
      }

      setPrestations((current) => current.filter((prestation) => prestation.id !== pendingDelete.id));
      toast.success("Prestation supprimée.");
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression de la prestation.");
    }
  };

  const handleEdit = (prestation: Prestation) => {
    setForm({
      categorie: prestation.categorie,
      nom: prestation.nom,
      unite: prestation.unite,
      prix: prestation.prix.toString(),
      cout: prestation.cout ? prestation.cout.toString() : "",
      stock: prestation.stock !== undefined ? prestation.stock.toString() : "",
    });
    setEditingId(prestation.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDuplicate = (prestation: Prestation) => {
    setForm({
      categorie: prestation.categorie,
      nom: `${prestation.nom} (Copie)`,
      unite: prestation.unite,
      prix: prestation.prix.toString(),
      cout: prestation.cout ? prestation.cout.toString() : "",
      stock: prestation.stock !== undefined ? prestation.stock.toString() : "",
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      setPendingImport({ fileName: file.name, rows });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la lecture du fichier CSV.");
    }
  };

  const confirmCsvImport = async () => {
    if (!pendingImport) {
      return;
    }

    setIsImportingCsv(true);
    try {
      const response = await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingImport.rows),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'importation du fichier CSV.");
      }

      await reloadPrestations();
      toast.success(`${pendingImport.rows.length} prestation(s) importée(s) depuis ${pendingImport.fileName}.`);
      setPendingImport(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'importation du fichier CSV.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />

      <ClientSubpageShell
        title="Catalogue prestations"
        description="Gardez votre bibliothèque métier claire sur mobile vertical : recherche rapide, import starter et actions de ligne restent lisibles sans écraser l'écran."
        eyebrow="Base métier"
        activeNav="tools"
        actions={
          <>
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
            >
              <Upload size={16} />
              Import CSV
            </button>
            <button
              type="button"
              onClick={showForm ? closeForm : openCreateForm}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Fermer" : "Ajouter"}
            </button>
          </>
        }
        mobilePrimaryAction={
          <button
            type="button"
            onClick={showForm ? closeForm : openCreateForm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Fermer" : "Ajouter"}
          </button>
        }
        mobileSecondaryActions={[
          {
            icon: Upload,
            label: "Importer CSV",
            onClick: openFilePicker,
          },
          {
            disabled: isImportingStarter,
            icon: Download,
            label: isImportingStarter ? "Import starter..." : "Starter métier",
            onClick: () => void handleImportStarterCatalog(),
            tone: "accent",
          },
        ]}
        summary={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ClientHeroStat
              label="Catalogue"
              value={String(prestations.length)}
              detail="Prestations enregistrées"
              tone="violet"
            />
            <ClientHeroStat
              label="Visibles"
              value={String(filteredPrestations.length)}
              detail="Après filtre de recherche"
              tone="slate"
            />
            <ClientHeroStat
              label="Catégories"
              value={String(categoriesCount)}
              detail="Dans la vue actuelle"
              tone="emerald"
            />
            <ClientHeroStat
              label="Prix moyen"
              value={`${averagePrice}€`}
              detail="Base HT par ligne"
              tone="amber"
            />
          </div>
        }
        mobileSummary={
          <ClientMobileOverview
            title="Catalogue terrain"
            description="Filtrez, importez et modifiez vos lignes sans interface serrée : chaque action reste utilisable au pouce sur écran vertical."
            badge={`${filteredPrestations.length} visibles`}
            items={[
              {
                label: "Catalogue",
                value: String(prestations.length),
                detail: "Prestations",
                tone: "violet",
              },
              {
                label: "Catégories",
                value: String(categoriesCount),
                detail: "Actives",
                tone: "emerald",
              },
              {
                label: "Prix moyen",
                value: `${averagePrice}€`,
                detail: "HT / ligne",
                tone: "amber",
              },
              {
                label: "Avec stock",
                value: String(stockedCount),
                detail: "Lignes suivies",
                tone: "slate",
              },
            ]}
          />
        }
      >
        <ClientSectionCard>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <section className="rounded-[1.8rem] border border-violet-200/70 bg-violet-50/80 p-5 dark:border-violet-500/20 dark:bg-violet-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 dark:text-violet-200">
                Starter métier
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                Base {activeTradeDefinition?.label.toLowerCase()} prête à l&apos;emploi
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choisissez votre métier, injectez vos lignes starter puis complétez votre catalogue au fil des chantiers.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {TRADE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedTrade(option.key)}
                    className={`rounded-[1rem] px-3 py-3 text-sm font-semibold transition ${
                      activeTrade === option.key
                        ? "bg-violet-600 text-white shadow-brand"
                        : "bg-white/90 text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10 dark:hover:ring-violet-400/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/8 dark:bg-white/4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Import starter
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{starterCount} lignes prêtes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Idéal pour démarrer vite avec le métier {activeTradeDefinition?.shortLabel?.toLowerCase() || "sélectionné"}.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-slate-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Déjà en base
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    {prestations.length} prestation{prestations.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Votre catalogue reste modifiable ligne par ligne, sans vue horizontale complexe.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleImportStarterCatalog()}
                  disabled={isImportingStarter}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {isImportingStarter ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isImportingStarter ? "Import en cours..." : `Importer ${starterCount} lignes starter`}
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white sm:flex-1"
                >
                  <Upload size={16} />
                  Importer un CSV
                </button>
              </div>
            </section>
          </div>
        </ClientSectionCard>

        <ClientSectionCard>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une prestation ou une catégorie..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-[1.25rem] border border-slate-200/80 bg-white/90 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-2 font-medium dark:border-white/10 dark:bg-white/4">
                {filteredPrestations.length} visible{filteredPrestations.length > 1 ? "s" : ""}
              </span>
              <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-2 font-medium dark:border-white/10 dark:bg-white/4">
                {stockedCount} avec stock
              </span>
            </div>
          </div>
        </ClientSectionCard>

        {showForm ? (
          <ClientSectionCard>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                    Édition rapide
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                    {editingId ? "Modifier la prestation" : "Ajouter une prestation"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Le formulaire reste empilé pour une saisie confortable sur mobile vertical.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
                >
                  <X size={16} />
                  Fermer
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Catégorie
                  <select
                    value={form.categorie}
                    onChange={(event) => setForm((current) => ({ ...current, categorie: event.target.value }))}
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  >
                    {STARTER_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nom de la prestation
                  <input
                    required
                    value={form.nom}
                    onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                    placeholder="Ex: Peinture mate blanche"
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Unité
                  <select
                    value={form.unite}
                    onChange={(event) => setForm((current) => ({ ...current, unite: event.target.value }))}
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  >
                    <option value="m²">m²</option>
                    <option value="ml">ml</option>
                    <option value="heure">Heure</option>
                    <option value="forfait">Forfait</option>
                    <option value="unité">Unité</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Prix HT
                  <input
                    required
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.prix}
                    onChange={(event) => setForm((current) => ({ ...current, prix: event.target.value }))}
                    placeholder="0,00"
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Coût matière estimé
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.cout}
                    onChange={(event) => setForm((current) => ({ ...current, cout: event.target.value }))}
                    placeholder="Optionnel"
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Stock initial
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                    placeholder="Optionnel"
                    className="rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving
                    ? "Enregistrement..."
                    : editingId
                      ? "Enregistrer les modifications"
                      : "Ajouter au catalogue"}
                </button>
              </div>
            </form>
          </ClientSectionCard>
        ) : null}

        <ClientSectionCard>
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={28} className="animate-spin text-violet-500" />
            </div>
          ) : filteredPrestations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[1.85rem] border border-dashed border-slate-200 px-6 py-14 text-center dark:border-white/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-400 dark:bg-white/6 dark:text-slate-500">
                <Package size={26} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  {search ? "Aucune prestation trouvée" : "Catalogue vide"}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {search
                    ? "Essayez un autre mot-clé ou réinitialisez la recherche pour retrouver vos lignes métier."
                    : "Importez votre starter métier, chargez un CSV ou ajoutez une première prestation manuellement."}
                </p>
              </div>
              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleImportStarterCatalog()}
                  disabled={isImportingStarter}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white sm:flex-1"
                >
                  {isImportingStarter ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Starter {activeTradeDefinition?.shortLabel || "métier"}
                </button>
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand sm:flex-1"
                >
                  <Plus size={16} />
                  Ajouter une ligne
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrestations.map((prestation, index) => (
                <motion.article
                  key={prestation.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-[1.7rem] border border-slate-200/70 bg-slate-50/85 p-4 dark:border-white/8 dark:bg-white/4 sm:p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                            {prestation.categorie || "Autre"}
                          </span>
                          {Number(prestation.stock ?? 0) > 0 ? (
                            <span className="inline-flex rounded-full border border-violet-300/40 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-200">
                              Stock {prestation.stock}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{prestation.nom}</h3>
                      </div>

                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-left shadow-sm dark:border-white/10 dark:bg-slate-950/20 sm:min-w-[140px] sm:text-right">
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">{formatPrice(prestation.prix)}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">HT / {prestation.unite}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Unité
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{prestation.unite}</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Coût matière
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{formatPrice(prestation.cout || 0)}</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Stock
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                          {Number(prestation.stock ?? 0) > 0 ? prestation.stock : "Non suivi"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(prestation)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-emerald-400/20 dark:hover:text-white"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(prestation)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
                      >
                        <Copy size={16} />
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(prestation)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </ClientSectionCard>
      </ClientSubpageShell>

      <MobileDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Supprimer cette prestation ?"
        description={pendingDelete ? `La ligne « ${pendingDelete.nom} » sera retirée du catalogue.` : undefined}
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="inline-flex min-h-11 items-center justify-center rounded-[1rem] bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Supprimer
            </button>
          </>
        }
      />

      <MobileDialog
        open={Boolean(pendingImport)}
        onClose={() => (isImportingCsv ? undefined : setPendingImport(null))}
        title="Importer ce fichier CSV ?"
        description={
          pendingImport
            ? `${pendingImport.rows.length} prestation(s) ont été détectée(s) dans ${pendingImport.fileName}.`
            : undefined
        }
        tone="accent"
        actions={
          <>
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              disabled={isImportingCsv}
              className="inline-flex min-h-11 items-center justify-center rounded-[1rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmCsvImport()}
              disabled={isImportingCsv}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-gradient-zolio px-4 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingCsv ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isImportingCsv ? "Import en cours..." : "Confirmer l'import"}
            </button>
          </>
        }
      >
        <div className="rounded-[1.25rem] border border-violet-200/70 bg-violet-50/80 p-4 text-sm leading-6 text-violet-900 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-100">
          Les lignes seront ajoutées à votre catalogue existant. Vérifiez le séparateur et les colonnes avant de confirmer.
        </div>
      </MobileDialog>
    </>
  );
}
