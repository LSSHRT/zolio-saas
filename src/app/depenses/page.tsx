"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Receipt, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";

interface Depense {
  categorie: string;
  date: string;
  description: string;
  id: string;
  montant: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DepensesResponse {
  data: Depense[];
  pagination: PaginationInfo;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DepensesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const { data, error, mutate } = useSWR<DepensesResponse>(`/api/depenses?page=${page}&limit=20`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const depenses = useMemo<Depense[]>(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const pagination = data?.pagination ?? null;
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("created") !== "1") {
      return;
    }

    toast.success("Dépense enregistrée.");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const filteredDepenses = useMemo(
    () =>
      depenses.filter(
        (depense) =>
          (depense.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (depense.categorie || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [depenses, searchTerm],
  );

  const totalDepenses = useMemo(
    () => filteredDepenses.reduce((sum, depense) => sum + depense.montant, 0),
    [filteredDepenses],
  );
  const categoriesCount = useMemo(
    () => new Set(filteredDepenses.map((depense) => depense.categorie || "Autre")).size,
    [filteredDepenses],
  );
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return filteredDepenses.filter((depense) => {
      const depenseDate = new Date(depense.date);
      return depenseDate.getMonth() === now.getMonth() && depenseDate.getFullYear() === now.getFullYear();
    }).length;
  }, [filteredDepenses]);
  const latestExpenseLabel = filteredDepenses[0]?.date
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(filteredDepenses[0].date))
    : "Aucune";

  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/depenses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Erreur de suppression");
      }
      await mutate();
      toast.success("Dépense supprimée.");
    } catch (error) {
      logError("depenses-save", error);
      toast.error("Impossible de supprimer la dépense.");
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Erreur de chargement.</div>;
  }

  return (
    <ClientSubpageShell
      title="Dépenses & achats"
      description="Suivez vos achats, retrouvez vite une dépense terrain et gardez un résumé clair même sur un écran vertical compact."
      eyebrow="Pilotage dépenses"
      activeNav="tools"
      mobilePrimaryAction={
        <Link
          href="/depenses/nouveau"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand"
        >
          <Plus size={16} />
          Ajouter
        </Link>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Total"
            value={`${totalDepenses.toFixed(0)}€`}
            detail="Montant filtré TTC"
            tone="violet"
          />
          <ClientHeroStat
            label="Ce mois"
            value={String(thisMonthCount)}
            detail="Dépenses enregistrées"
            tone="emerald"
          />
          <ClientHeroStat
            label="Catégories"
            value={String(categoriesCount)}
            detail="Répartitions actives"
            tone="amber"
          />
          <ClientHeroStat
            label="Dernière"
            value={latestExpenseLabel}
            detail="Dernière date visible"
            tone="slate"
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Suivi terrain"
          description="Retrouvez vos dépenses récentes sans forcer l’horizontal: recherche, totaux et suppression restent accessibles au pouce."
          badge={`${filteredDepenses.length} lignes`}
          items={[
            {
              label: "Total",
              value: `${totalDepenses.toFixed(0)}€`,
              detail: "Vue filtrée",
              tone: "violet",
            },
            {
              label: "Ce mois",
              value: String(thisMonthCount),
              detail: "Dépenses", 
              tone: "emerald",
            },
            {
              label: "Catégories",
              value: String(categoriesCount),
              detail: "Actives",
              tone: "amber",
            },
            {
              label: "Dernière",
              value: latestExpenseLabel,
              detail: "Date visible",
              tone: "slate",
            },
          ]}
        />
      }
    >
      <ClientSectionCard>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une dépense..."
            className="w-full rounded-[1.1rem] border border-slate-200/80 bg-white/80 py-3 pl-10 pr-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/6 dark:text-white"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </ClientSectionCard>

      <ClientSectionCard>
        {!data ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-[1.5rem] bg-slate-100 dark:bg-white/6" />
            ))}
          </div>
        ) : filteredDepenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[1.85rem] border border-dashed border-slate-200 px-6 py-14 text-center dark:border-white/10">
            <Receipt className="text-slate-300 dark:text-slate-600" size={46} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune dépense trouvée</h2>
            <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Ajoutez vos achats au fil du terrain pour garder un suivi propre des matériaux, sous-traitants et frais divers.
            </p>
            <Link
              href="/depenses/nouveau"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            >
              <Plus size={16} />
              Ajouter une dépense
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDepenses.map((depense) => (
              <motion.article
                key={depense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
                        <Tag size={12} />
                        {depense.categorie || "Autre"}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(depense.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                      {depense.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {depense.montant.toFixed(2)} €
                    </p>
                    <button
                      onClick={() => void handleDelete(depense.id)}
                      disabled={deletingId === depense.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200/80 bg-rose-50/80 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                      aria-label={`Supprimer la dépense ${depense.description}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/8 dark:bg-white/4 sm:flex-row">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} dépense{pagination.total > 1 ? "s" : ""})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </ClientSectionCard>
    </ClientSubpageShell>
  );
}
