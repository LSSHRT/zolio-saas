"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Receipt, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Depense {
  categorie: string;
  date: string;
  description: string;
  id: string;
  montant: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DepensesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, mutate } = useSWR<Depense[]>("/api/depenses", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const depenses = useMemo<Depense[]>(() => (Array.isArray(data) ? data : []), [data]);
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
      console.error(error);
      toast.error("Impossible de supprimer la dépense.");
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Erreur de chargement.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm p-4 md:p-8 space-y-6">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="text-brand-fuchsia" /> Dépenses & Achats
          </h1>
        </div>

        <Link
          href="/depenses/nouveau"
          className="bg-gradient-zolio hover:opacity-90 text-white p-2 md:px-4 md:py-2 rounded-full md:rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          <span className="hidden md:block">Nouvelle dépense</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total TTC</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{totalDepenses.toFixed(2)} €</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Ce mois-ci</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{thisMonthCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Catégories</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{categoriesCount}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {!data ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : filteredDepenses.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Receipt className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={48} />
          <p className="text-slate-500 dark:text-slate-400">Aucune dépense trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDepenses.map((depense) => (
            <motion.div
              key={depense.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-shadow group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Tag size={12} />
                    {depense.categorie || "Autre"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(depense.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="font-medium text-slate-800 dark:text-white">{depense.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{depense.montant.toFixed(2)} €</p>
                </div>
                <button
                  onClick={() => void handleDelete(depense.id)}
                  disabled={deletingId === depense.id}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
