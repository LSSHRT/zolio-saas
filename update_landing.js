const fs = require('fs');

const content = `"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Zap, PenTool, BrainCircuit, FileText, TrendingUp, ShieldCheck, Clock, Users, Smartphone, Star } from "lucide-react";
import { useRef } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  return (
    <div className="min-h-screen bg-[#faf5ff] dark:bg-[#0c0a1d] font-sans selection:bg-violet-500 selection:text-white overflow-hidden">
      {/* Background ambient blobs with parallax */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-fuchsia-500/10 to-orange-500/10 blur-[100px]"
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0c0a1d]/70 backdrop-blur-xl border-b border-violet-100/50 dark:border-violet-500/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 relative rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
            </div>
            <span className="text-2xl font-black text-gradient-zolio tracking-tight">Zolio</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <Link href="/sign-in?redirect_url=/dashboard" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors hidden sm:block">
              Espace Client
            </Link>
            <Link href="/sign-up?redirect_url=/dashboard" className="group relative bg-gradient-zolio hover:opacity-90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 shadow-brand overflow-hidden flex items-center gap-2">
              <span className="relative z-10">Démarrer l'essai</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto relative z-10"
        >
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-100/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-8 border border-violet-200/50 dark:border-violet-500/20 backdrop-blur-md shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-zolio animate-pulse"></span>
            La nouvelle référence des artisans du bâtiment
          </motion.div>
          
          <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
            Transformez vos devis en <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 animate-gradient-x">
              chantiers gagnés.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeIn} className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Le premier logiciel de facturation intelligent qui divise par 3 le temps passé dans l'administratif. Rédigez, signez, encaissez.
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/sign-up?redirect_url=/dashboard" className="group relative w-full sm:w-auto bg-gradient-zolio text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 flex items-center justify-center gap-3 shadow-brand-lg overflow-hidden">
              <span className="relative z-10">Créer mon premier devis</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </Link>
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1 text-amber-500">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Noté 4.9/5 par plus de 2000 artisans
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/40 dark:bg-white/[0.01] border-y border-violet-100/50 dark:border-violet-500/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Temps gagné / sem", value: "8h+" },
              { label: "Taux de conversion", value: "+32%" },
              { label: "Artisans actifs", value: "2000+" },
              { label: "Support client", value: "7j/7" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-2"
              >
                <span className="text-4xl lg:text-5xl font-black text-gradient-zolio">{stat.value}</span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section ref={targetRef} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          style={{ opacity, scale }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-violet-200/50 dark:border-violet-500/20 bg-white dark:bg-[#0c0a1d] aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-fuchsia-500/5"></div>
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-gradient-zolio rounded-full flex items-center justify-center mx-auto mb-6 shadow-brand-lg group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">Interface ultra-rapide</h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">Pensée pour être utilisée d'une seule main sur le chantier, ou sur grand écran au bureau.</p>
          </div>
        </motion.div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-24 bg-white/60 dark:bg-white/[0.02] border-t border-violet-100/50 dark:border-violet-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-bold tracking-wide uppercase"
            >
              Fonctionnalités premium
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">L'écosystème complet pour votre entreprise</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Zolio remplace vos fichiers Excel, votre logiciel de facturation complexe et vos carnets de notes.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BrainCircuit className="w-8 h-8" />,
                title: "Assistant IA",
                desc: "Générez vos lignes de devis automatiquement. Décrivez le besoin, l'IA s'occupe de la formulation professionnelle et des calculs.",
                color: "from-violet-500 to-fuchsia-500",
                bg: "bg-violet-100 dark:bg-violet-900/20",
                text: "text-violet-600 dark:text-violet-400"
              },
              {
                icon: <PenTool className="w-8 h-8" />,
                title: "Signature Électronique",
                desc: "Faites signer vos devis directement sur l'écran de votre téléphone chez le client. Légalement contraignant et sécurisé.",
                color: "from-emerald-400 to-teal-500",
                bg: "bg-emerald-100 dark:bg-emerald-900/20",
                text: "text-emerald-600 dark:text-emerald-400"
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "100% Mobile",
                desc: "Conçu 'Mobile First'. Toute la puissance de Zolio tient dans votre poche, accessible sur iOS et Android via votre navigateur.",
                color: "from-blue-500 to-cyan-500",
                bg: "bg-blue-100 dark:bg-blue-900/20",
                text: "text-blue-600 dark:text-blue-400"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Calcul de Marge",
                desc: "Visualisez instantanément votre marge nette par devis. Ne vendez plus jamais à perte par erreur de calcul.",
                color: "from-orange-400 to-amber-500",
                bg: "bg-orange-100 dark:bg-orange-900/20",
                text: "text-orange-600 dark:text-orange-400"
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: "Catalogue Intégré",
                desc: "Enregistrez vos prestations, vos matériaux et vos prix horaires. Rappelez-les en un clic dans vos devis.",
                color: "from-pink-500 to-rose-500",
                bg: "bg-pink-100 dark:bg-pink-900/20",
                text: "text-pink-600 dark:text-pink-400"
              },
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: "Conforme 100%",
                desc: "Mentions légales, TVA, facturation électronique (factur-x). Zolio est à jour avec les dernières normes fiscales.",
                color: "from-slate-600 to-slate-800",
                bg: "bg-slate-200 dark:bg-slate-800",
                text: "text-slate-700 dark:text-slate-300"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card dark:bg-white/[0.02] p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border border-violet-100/50 dark:border-white/5 relative overflow-hidden"
              >
                <div className={\`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br \${feature.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-full\`}></div>
                <div className={\`w-16 h-16 \${feature.bg} \${feature.text} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm\`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_50%)]"></div>
        <div className="text-center mb-20 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6">Investissez dans votre sérénité</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">Un tarif simple. Rentabilisé dès la première heure gagnée.</p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card dark:bg-[#13112a] rounded-[2.5rem] shadow-2xl border border-violet-200 dark:border-violet-500/30 overflow-hidden max-w-2xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-10 sm:p-14 border-b border-violet-100/50 dark:border-white/5 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 dark:from-violet-900/20 dark:to-fuchsia-900/10 text-center relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-violet-600 text-white text-sm font-bold tracking-wide uppercase mb-6 shadow-md">
              L'Offre Zolio Pro
            </div>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">29€</span>
              <span className="text-xl font-bold text-slate-500">/mois HT</span>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              Sans engagement. Annulable en 1 clic.
            </p>
          </div>
          <div className="p-10 sm:p-14 bg-white/50 dark:bg-transparent relative z-10">
            <ul className="space-y-6">
              {[
                { text: "Devis et factures illimités", icon: <CheckCircle2 className="w-6 h-6 text-violet-500" /> },
                { text: "Signature électronique sécurisée (illimitée)", icon: <CheckCircle2 className="w-6 h-6 text-violet-500" /> },
                { text: "Génération de devis assistée par IA", icon: <BrainCircuit className="w-6 h-6 text-fuchsia-500" /> },
                { text: "Calcul des marges et suivi de rentabilité", icon: <TrendingUp className="w-6 h-6 text-orange-500" /> },
                { text: "Export comptable en 1 clic", icon: <CheckCircle2 className="w-6 h-6 text-violet-500" /> },
                { text: "Support client prioritaire 7j/7", icon: <Users className="w-6 h-6 text-blue-500" /> }
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-800 dark:text-slate-200 text-lg font-medium">
                  <div className="flex-shrink-0 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
                    {feature.icon}
                  </div>
                  {feature.text}
                </li>
              ))}
            </ul>
            <Link href="/sign-up?redirect_url=/dashboard" className="mt-12 block w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-center py-5 rounded-2xl text-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Démarrer l'essai
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 bg-slate-900 dark:bg-black text-center px-4 relative overflow-hidden mt-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-violet-600/20 to-transparent blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-8 tracking-tight">Prêt à passer au niveau supérieur ?</h2>
          <p className="text-slate-300 mb-12 text-2xl font-medium">
            Rejoignez les artisans qui dorment sur leurs deux oreilles.
          </p>
          <Link href="/sign-up?redirect_url=/dashboard" className="inline-flex items-center gap-3 bg-gradient-zolio text-white px-10 py-5 rounded-full text-xl font-bold transition-all hover:scale-105 shadow-[0_0_40px_rgba(139,92,246,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.7)]">
            Créer mon compte
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-8 text-slate-500 font-medium">14 jours d'essai • Sans carte bancaire requise</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0c0a1d] border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 relative rounded-md overflow-hidden grayscale opacity-50">
            <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight grayscale opacity-50">Zolio</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm font-medium">
          <Link href="/cgv" className="hover:text-violet-600 dark:hover:text-violet-400 transition">CGV</Link>
          <Link href="/cgu" className="hover:text-violet-600 dark:hover:text-violet-400 transition">CGU</Link>
          <Link href="/mentions-legales" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Mentions Légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-violet-600 dark:hover:text-violet-400 transition">Confidentialité</Link>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Zolio. Créé pour les artisans.</p>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync('src/components/LandingPage.tsx', content);
console.log('LandingPage.tsx updated successfully');
