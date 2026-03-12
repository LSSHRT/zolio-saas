"use client";

import { motion } from "framer-motion";
import { CheckCircle, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function AbonnementSuccessPage() {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    // Le statut Pro sera mis à jour via Clerk Dashboard manuellement 
    // ou via un Webhook Stripe (à implémenter)

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] overflow-hidden items-center justify-center p-8 relative">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-blue-50 to-purple-50 blur-3xl opacity-60 rounded-full mix-blend-multiply pointer-events-none" />

      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
        className="w-24 h-24 bg-gradient-zolio rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 text-white relative z-10">
        <CheckCircle size={48} />
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center relative z-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Bienvenue sur<br />Zolio Pro ! 🎉</h1>
        
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mb-8 shadow-sm">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
            Votre paiement a été validé avec succès. Vous avez désormais accès à toutes les fonctionnalités illimitées.
          </p>
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles size={14} className="text-purple-500" /> Devis PDF illimités
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles size={14} className="text-purple-500" /> Envois emails automatiques
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles size={14} className="text-purple-500" /> Support prioritaire
            </div>
          </div>
        </div>

        <Link href="/">
          <motion.button whileTap={{ scale: 0.96 }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2">
            <Home size={18} /> Retour à l'accueil
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
