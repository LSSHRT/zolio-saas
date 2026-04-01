"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function PaiementSuccesPage() {
  const searchParams = useSearchParams();
  const factureNumero = searchParams.get("facture");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle size={40} className="text-emerald-600" />
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Paiement réussi ! 🎉
        </h1>

        <p className="text-slate-500 mb-6">
          {factureNumero
            ? `La facture ${factureNumero} a été réglée avec succès.`
            : "Le paiement a été traité avec succès."}
        </p>

        <div className="flex flex-col gap-3">
          {factureNumero && (
            <Link
              href={`/factures/${factureNumero}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-6 py-3 text-sm font-semibold text-white shadow-brand"
            >
              <FileText size={16} />
              Voir la facture
            </Link>
          )}
          <Link
            href="/factures"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Mes factures
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
