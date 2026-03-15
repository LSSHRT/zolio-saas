"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Zap, PenTool, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf5ff] dark:bg-[#0c0a1d] font-sans selection:bg-violet-500 selection:text-white">
      {/* Background ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-400/15 to-fuchsia-400/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-fuchsia-400/10 to-orange-400/8 blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0c0a1d]/70 backdrop-blur-xl border-b border-violet-100/50 dark:border-violet-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-sm">
              <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold text-gradient-zolio tracking-tight">Zolio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/sign-up" className="bg-gradient-zolio hover:opacity-90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 shadow-brand">
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6 border border-violet-200/50 dark:border-violet-500/20">
            <span className="flex h-2 w-2 rounded-full bg-gradient-zolio animate-pulse"></span>
            L'outil n°1 des artisans du bâtiment
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
            Ne perdez plus vos soirées <br className="hidden sm:block" />
            <span className="text-gradient-zolio">
              à faire des devis.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Créez des devis professionnels, faites-les signer sur place ou en ligne, et suivez vos chantiers. L'application pensée pour les artisans qui veulent gagner du temps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto bg-gradient-zolio hover:opacity-90 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-brand-lg">
              Commencer maintenant <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-0 sm:ml-4">
              Sans engagement • Sans carte bancaire
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50 dark:bg-white/[0.02] border-y border-violet-100/50 dark:border-violet-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-600 dark:text-slate-400">Des fonctionnalités pensées pour le terrain.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0 }}
              className="glass-card dark:bg-violet-900/5 p-8 rounded-2xl hover:shadow-brand transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-brand-violet dark:text-violet-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Rédaction par IA</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Décrivez votre chantier en quelques mots. Notre intelligence artificielle rédige les lignes de votre devis instantanément.
              </p>
            </motion.div>
            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card dark:bg-violet-900/5 p-8 rounded-2xl hover:shadow-brand transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Signature sur place</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Faites signer vos clients directement sur l'écran de votre smartphone à la fin du rendez-vous, ou envoyez un lien sécurisé.
              </p>
            </motion.div>
            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-card dark:bg-violet-900/5 p-8 rounded-2xl hover:shadow-brand transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-brand-orange dark:text-orange-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Gain de temps</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Catalogue de prestations, calcul automatique des marges, relances d'impayés, tout est automatisé pour vous libérer l'esprit.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Un tarif simple et transparent</h2>
          <p className="text-slate-600 dark:text-slate-400">Rentabilisé dès votre premier devis signé.</p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card dark:bg-violet-900/5 rounded-3xl shadow-brand overflow-hidden max-w-lg mx-auto"
        >
          <div className="p-8 sm:p-10 border-b border-violet-100/50 dark:border-violet-500/10 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 dark:from-violet-900/10 dark:to-fuchsia-900/5">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Zolio Pro</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-extrabold text-gradient-zolio">29€</span>
              <span className="text-slate-500 font-medium">/mois HT</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              L'outil complet pour les professionnels exigeants.
            </p>
            <Link href="/sign-up" className="mt-8 block w-full bg-gradient-zolio hover:opacity-90 text-white text-center py-3.5 rounded-xl font-semibold transition-all shadow-brand hover:scale-[1.02]">
              Démarrer l'essai gratuit
            </Link>
          </div>
          <div className="p-8 sm:p-10">
            <ul className="space-y-4">
              {[
                "Devis et factures illimités",
                "Signature électronique illimitée",
                "Assistant IA pour rédaction",
                "Catalogue de prestations & matériaux",
                "Calcul de marge en temps réel",
                "Export comptable automatisé",
                "Support prioritaire"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-brand-violet flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 dark:from-[#1a0d3a] dark:via-[#2d1052] dark:to-[#1a0d3a] text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-fuchsia-300/10 rounded-full blur-xl"></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Prêt à simplifier votre quotidien ?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto text-lg">
            Rejoignez les artisans qui font confiance à Zolio pour développer leur entreprise.
          </p>
          <Link href="/sign-up" className="inline-block bg-white text-violet-700 hover:bg-violet-50 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 shadow-brand-lg">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#0c0a1d] border-t border-violet-100/50 dark:border-violet-500/10">
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
          <Link href="/cgv" className="hover:text-violet-600 dark:hover:text-violet-400 transition">CGV</Link>
          <Link href="/cgu" className="hover:text-violet-600 dark:hover:text-violet-400 transition">CGU</Link>
          <Link href="/mentions-legales" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Mentions Légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Confidentialité</Link>
        </div>
        <p>© {new Date().getFullYear()} Zolio. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
