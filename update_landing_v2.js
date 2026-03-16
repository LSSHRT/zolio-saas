const fs = require('fs');

const newContent = `"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { 
  ArrowRight, CheckCircle2, Zap, PenTool, BrainCircuit, 
  FileText, TrendingUp, ShieldCheck, Clock, Users, Smartphone, 
  Star, Quote, ChevronDown, Check, X
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const faqs = [
    {
      q: "L'application fonctionne-t-elle sur téléphone sans internet ?",
      a: "Zolio est optimisé pour les mobiles. Vous avez besoin d'une connexion internet pour synchroniser vos données et générer les PDF finaux, mais vous pouvez préparer vos brouillons n'importe où."
    },
    {
      q: "Puis-je importer ma liste de clients existante ?",
      a: "Oui, tout à fait. Vous pouvez importer vos clients et votre catalogue de prix très facilement depuis les paramètres de votre tableau de bord."
    },
    {
      q: "Que se passe-t-il après mon devis d'essai ?",
      a: "Une fois votre devis d'essai utilisé, vous pourrez souscrire à l'abonnement Zolio PRO (sans engagement) pour débloquer les devis et factures en illimité."
    },
    {
      q: "Mes données sont-elles sécurisées ?",
      a: "Absolument. Vos données sont hébergées sur des serveurs sécurisés et sauvegardées quotidiennement. Vous seul y avez accès."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500/30 overflow-hidden relative pb-16 sm:pb-0">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/20 dark:bg-violet-600/10 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-fuchsia-600/20 dark:bg-fuchsia-600/10 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[150px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Zolio
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#fonctionnalites" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Fonctionnalités</a>
            <a href="#produit" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Le Produit</a>
            <a href="#temoignages" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Avis</a>
            <a href="#tarifs" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/dashboard" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 hidden sm:block">
              Démarrer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider mb-8 ring-1 ring-violet-500/20">
            <SparklesIcon className="w-4 h-4" /> La nouvelle ère du bâtiment
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Gérez votre entreprise <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500">
              sans aucun effort.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Zolio centralise vos devis, factures, clients et plannings dans un tableau de bord ultra-rapide et intelligent. Spécialement conçu pour les artisans exigeants.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-bold text-lg shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center justify-center gap-2 group">
              Essayer Zolio <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#produit" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200">
              Découvrir l'interface
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* Dashboard Showcase Section */}
      <section id="produit" className="py-12 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl overflow-hidden p-2 sm:p-4"
        >
          {/* Dashboard Header Mockup */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50 mb-4 bg-white/60 dark:bg-slate-950/60 rounded-xl">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
            </div>
            <div className="mx-auto flex items-center justify-center px-4 py-1 rounded-md bg-slate-100/50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 w-1/3 min-w-[150px]">
              <LockIcon className="w-3 h-3 mr-1 inline-block" /> zolio.site/dashboard
            </div>
          </div>

          {/* Actual Dashboard Visual (Mockup built with Tailwind) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {/* Sidebar Mockup */}
            <div className="hidden md:flex flex-col gap-2 col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4">
              <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mb-4 animate-pulse"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/50"></div>
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Main Content Mockup */}
            <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                 <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
                 <div className="h-8 w-24 bg-violet-600/20 rounded-md"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                    <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="flex-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-4 min-h-[250px] flex flex-col">
                 <div className="h-5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                 <div className="flex-1 border-b border-slate-100 dark:border-slate-800 flex items-end gap-2 pb-2">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-violet-500/80 rounded-t-sm" style={{ height: \`\${h}%\` }}></div>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-50/80 via-transparent to-transparent dark:from-slate-950/80 pointer-events-none rounded-2xl sm:rounded-3xl" />
        </motion.div>
      </section>

      {/* Avant / Après Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black mb-6">Fini la paperasse du soir.</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">Découvrez comment Zolio transforme votre quotidien d'artisan.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Avant */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-bold mb-6">
              <X className="w-4 h-4" /> Avant Zolio
            </div>
            <ul className="space-y-4">
              {["Devis faits le soir ou le week-end", "Oublis de relance des clients", "Calculs de marge compliqués et risqués", "Papiers perdus dans le camion"].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5"><X className="w-3.5 h-3.5" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Après */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-400/20 blur-3xl rounded-full"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold mb-6 relative z-10">
              <Check className="w-4 h-4" /> Avec Zolio
            </div>
            <ul className="space-y-4 relative z-10">
              {["Devis faits en 2 minutes sur le chantier", "Signature électronique instantanée", "Bénéfice calculé automatiquement", "Tout est sauvegardé et sécurisé"].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-800 dark:text-slate-200 font-medium">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3.5 h-3.5" /></span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-200/50 dark:divide-slate-800/50">
            {[
              { label: "Temps gagné / mois", value: "15h+" },
              { label: "Devis validés plus vite", value: "3x" },
              { label: "De marge d'erreur", value: "0%" },
              { label: "Support client", value: "24/7" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="fonctionnalites" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black mb-6">Tout ce dont vous avez besoin, <span className="text-violet-600 dark:text-violet-400">en un seul endroit.</span></h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Une suite d'outils puissants pensés pour éliminer la paperasse et vous laisser vous concentrer sur vos chantiers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            { icon: FileText, title: "Devis & Factures Ultra-Rapides", desc: "Créez des documents pros en 2 minutes avec votre logo et vos conditions. Transformation de devis en facture en un clic." },
            { icon: Smartphone, title: "100% Mobile & Sur Chantier", desc: "L'application est parfaitement adaptée à votre smartphone. Consultez ou créez vos devis directement depuis la camionnette." },
            { icon: BrainCircuit, title: "Catalogue Intelligent", desc: "Mémorisez vos prix de matériaux et main-d'œuvre. Autocomplétion magique lors de la saisie." },
            { icon: PenTool, title: "Signature Électronique", desc: "Faites signer vos devis directement sur l'écran du téléphone ou par email. Validations instantanées." },
            { icon: TrendingUp, title: "Suivi de Rentabilité (Marge)", desc: "Visualisez en temps réel vos bénéfices, vos dépenses et vos recettes grâce à des graphiques clairs." },
            { icon: ShieldCheck, title: "Conforme & Sécurisé", desc: "Mentions légales à jour, numérotation conforme, sauvegardes cloud automatiques. Dormez sur vos deux oreilles." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-violet-500/30 transition-colors shadow-sm hover:shadow-xl hover:shadow-violet-500/5 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-20 bg-slate-100/50 dark:bg-slate-900/20 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">Ils nous font confiance.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Découvrez pourquoi nos artisans ne reviendraient en arrière pour rien au monde.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Jean Dubois", job: "Électricien", text: "Avant Zolio, je passais mes dimanches soirs sur mes devis. Aujourd'hui, je les fais dans ma camionnette en 3 minutes chrono avant de quitter le chantier." },
              { name: "Marc Leroy", job: "Plombier Chauffagiste", text: "Le calcul de marge automatique est incroyable. Je sais exactement combien je gagne sur chaque chantier. C'est l'outil le plus rentable que j'ai acheté." },
              { name: "Sophie Martin", job: "Peintre en Bâtiment", text: "Faire signer mes devis sur l'écran du téléphone directement chez le client m'a fait doubler mon taux d'acceptation. Ultra pro !" }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative"
              >
                <Quote className="w-10 h-10 text-violet-500/20 absolute top-6 right-6" />
                <div className="flex text-amber-400 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6 relative z-10 font-medium">"{review.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{review.name}</h4>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{review.job}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - CTA */}
      <section id="tarifs" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] bg-slate-900 dark:bg-slate-900/50 border border-slate-800 overflow-hidden p-8 sm:p-12 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-50" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">Prêt à moderniser votre gestion ?</h2>
            <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">Rejoignez les artisans qui ont choisi de gagner du temps chaque jour. Sans engagement, testez Zolio en conditions réelles.</p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-xl mx-auto border border-white/10 mb-10 text-left">
              <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Zolio PRO</h3>
                  <p className="text-slate-400">Tout inclus, sans limite.</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">29€<span className="text-lg font-medium text-slate-400">/mois</span></div>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {["Devis et factures illimités", "Signature électronique", "Suivi des marges et CA", "Support prioritaire"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="block w-full py-4 text-center rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors text-lg shadow-lg">
                Démarrer l'essai
              </Link>
            </div>
            <p className="text-slate-400 text-sm">1 devis d'essai inclus. Pas de carte bancaire requise.</p>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-4">Questions Fréquentes</h2>
          <p className="text-slate-600 dark:text-slate-400">Tout ce que vous devez savoir avant de commencer.</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex justify-between items-center w-full p-6 text-left font-bold text-lg hover:text-violet-600 transition-colors"
              >
                {faq.q}
                <ChevronDown className={\`w-5 h-5 text-slate-400 transition-transform duration-300 \${openFaq === index ? 'rotate-180' : ''}\`} />
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="pt-16 pb-8 border-t border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">Z</span>
                </div>
                <span className="text-xl font-black">Zolio</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">L'outil de gestion conçu spécifiquement pour faire gagner du temps aux artisans du bâtiment.</p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-violet-600 transition-colors">in</a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-violet-600 transition-colors">fb</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Produit</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#fonctionnalites" className="hover:text-violet-600 transition">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-violet-600 transition">Tarifs</a></li>
                <li><a href="#temoignages" className="hover:text-violet-600 transition">Avis</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Ressources</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/dashboard" className="hover:text-violet-600 transition">Se connecter</Link></li>
                <li><a href="#" className="hover:text-violet-600 transition">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-violet-600 transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Légal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/cgv" className="hover:text-violet-600 transition">CGV</Link></li>
                <li><Link href="/cgu" className="hover:text-violet-600 transition">CGU</Link></li>
                <li><Link href="/mentions-legales" className="hover:text-violet-600 transition">Mentions Légales</Link></li>
                <li><Link href="/politique-confidentialite" className="hover:text-violet-600 transition">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            © {new Date().getFullYear()} Zolio. Créé en France pour les artisans.
          </div>
        </div>
      </footer>

      {/* Floating CTA Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-50">
        <Link href="/dashboard" className="flex items-center justify-center w-full py-3.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 active:scale-95 transition-transform">
          Démarrer mon essai
        </Link>
      </div>

    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function LockIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
`;

fs.writeFileSync('src/components/LandingPage.tsx', newContent);
console.log('LandingPage.tsx updated successfully.');
