"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Zap, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AbonnementPage() {
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  const price = isAnnual ? 19 : 29;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Bientôt : appel à l'API Stripe /api/stripe/checkout
      const res = await fetch("/api/stripe/checkout", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnnual })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else alert("Erreur lors de l'initialisation du paiement Stripe.");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-8 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-slate-900 rounded-b-[3rem] overflow-hidden z-0">
        <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-violet-500/30 via-fuchsia-600/30 to-violet-900/40 blur-3xl opacity-60 rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-20 right-10 w-32 h-32 bg-violet-50 dark:bg-violet-500/100/40 blur-2xl rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 p-6 pt-12 sm:pt-10">
        <Link href="/dashboard">
          <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-white dark:bg-slate-900/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 px-6 flex flex-col mt-4">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-bold tracking-wider uppercase mb-4">
            <Sparkles size={12} /> Zolio Pro
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-bold text-white mb-3">
            Gagnez 5h par<br />semaine.
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm px-4">
            Passez à la vitesse supérieure. Devis illimités, PDF pros, et facturation simplifiée.
          </motion.p>
        </div>

        {/* Pricing Card */}
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-brand-lg border border-slate-100 dark:border-slate-800 relative">
          
          {/* Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6 relative">
            <div className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-all duration-300 ${isAnnual ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
            <button onClick={() => setIsAnnual(false)} className={`flex-1 py-2 text-xs font-semibold z-10 transition-colors ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Mensuel</button>
            <button onClick={() => setIsAnnual(true)} className={`flex-1 py-2 text-xs font-semibold z-10 transition-colors flex items-center justify-center gap-1 ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annuel <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">-30%</span>
            </button>
          </div>

          <div className="flex items-end gap-1 mb-6">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{price}€</span>
            <span className="text-sm font-medium text-slate-400 mb-1">/mois {isAnnual && 'facturé annuellement'}</span>
          </div>

          <motion.button 
            whileTap={{ scale: 0.97 }} 
            onClick={handleSubscribe} 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-xl shadow-slate-900/20 dark:shadow-slate-100/20 flex items-center justify-center gap-2 mb-6"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>S'abonner à Zolio Pro <Zap size={16} className="text-yellow-400" /></>}
          </motion.button>

          <div className="flex flex-col gap-3">
            {[
              "Devis & Factures avec acomptes et options",
              "Signature électronique (en ligne & sur place)",
              "Assistant IA pour rédiger vos devis",
              "Planning chantiers & Suivi des dépenses",
              "Tracking de lecture, Relances & Avis Google",
              "Personnalisation (Logo) & Export comptable",
              "Catalogue de prestations avec gestion de stocks",
              "Support client prioritaire"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security / Trust */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pb-4">
          <Shield size={14} /> Paiement 100% sécurisé via Stripe
        </motion.div>
      </main>
    </div>
  );
}
