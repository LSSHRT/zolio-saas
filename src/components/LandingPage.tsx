"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, PenTool, BrainCircuit, Smartphone, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Zolio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-purple-600"></span>
            L'outil n°1 des artisans du bâtiment
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
            Ne perdez plus vos soirées <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              à faire des devis.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Créez des devis professionnels, faites-les signer sur place ou en ligne, et suivez vos chantiers. L'application pensée pour les artisans qui veulent gagner du temps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25">
              Commencer maintenant <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-0 sm:ml-4">
              Sans engagement • Sans carte bancaire
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-600 dark:text-slate-400">Des fonctionnalités pensées pour le terrain.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Rédaction par IA</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Décrivez votre chantier en quelques mots. Notre intelligence artificielle rédige les lignes de votre devis instantanément.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Signature sur place</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Faites signer vos clients directement sur l'écran de votre smartphone à la fin du rendez-vous, ou envoyez un lien sécurisé.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Gain de temps</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Catalogue de prestations, calcul automatique des marges, relances d'impayés, tout est automatisé pour vous libérer l'esprit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Un tarif simple et transparent</h2>
          <p className="text-slate-600 dark:text-slate-400">Rentabilisé dès votre premier devis signé.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-lg mx-auto">
          <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Zolio Pro</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-white">29€</span>
              <span className="text-slate-500 font-medium">/mois HT</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              L'outil complet pour les professionnels exigeants.
            </p>
            <Link href="/sign-up" className="mt-8 block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-xl font-semibold transition-colors">
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
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-purple-600 dark:bg-purple-900 text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Prêt à simplifier votre quotidien ?</h2>
        <p className="text-purple-100 mb-8 max-w-2xl mx-auto text-lg">
          Rejoignez les artisans qui font confiance à Zolio pour développer leur entreprise.
        </p>
        <Link href="/sign-up" className="inline-block bg-white text-purple-600 hover:bg-slate-50 px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 shadow-xl">
          Créer mon compte gratuitement
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
          <Link href="/cgv" className="hover:text-purple-600">CGV</Link>
          <Link href="/cgu" className="hover:text-purple-600">CGU</Link>
          <Link href="/mentions-legales" className="hover:text-purple-600">Mentions Légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-purple-600">Confidentialité</Link>
        </div>
        <p>© {new Date().getFullYear()} Zolio. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
