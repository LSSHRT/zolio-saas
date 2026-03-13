"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PlanningPage() {
  const { data: devis, error, isLoading } = useSWR('/api/devis', fetcher);
  
  const devisAccepte = Array.isArray(devis) ? devis.filter((d) => d.statut === "Accepté") : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-4 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Planning & Chantiers</h1>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full px-4 pt-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
          <CalendarIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Retrouvez ici la liste de vos chantiers validés (devis acceptés). Vous pourrez bientôt assigner des dates précises pour chacun d'entre eux !
          </p>
        </div>

        {isLoading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {devisAccepte.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Aucun chantier prévu pour le moment.</p>
                <p className="text-sm text-slate-400 mt-1">Acceptez des devis pour les voir apparaître ici.</p>
              </div>
            ) : (
              devisAccepte.map((d, i) => (
                <motion.div 
                  key={d.numero}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{d.nomClient}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {d.numero} — {d.totalTTC}€
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    À planifier
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
