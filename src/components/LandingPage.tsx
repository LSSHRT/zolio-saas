"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  Smartphone,
  Calculator,
  FileText,
  Star,
  ChevronDown,
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";

// --- CUSTOM HOOKS & UTILS ---

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const updateMousePosition = (e: any) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  
  return mousePosition;
}

// --- COMPONENTS ---

// 1. Custom Magnetic Cursor
const CustomCursor = () => {
  const { x, y } = useMousePosition();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseOver = (e: any) => {
      if (e.target.closest('button, a, [data-interactive="true"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mouseover", handleMouseOver);
    return () => window.removeEventListener("mouseover", handleMouseOver);
  }, []);

  // Hide on mobile
  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-violet-500 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        animate={{
          x: x - 8,
          y: y - 8,
          scale: isHovering ? 2.5 : 1,
          opacity: isHovering ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-32 h-32 border border-violet-500/30 rounded-full pointer-events-none z-[9998]"
        animate={{
          x: x - 64,
          y: y - 64,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.8,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 20, mass: 0.8 }}
      />
    </>
  );
};

// 2. Spotlight Card (Linear/Vercel style)
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: any) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

// 3. Scroll Reveal Text
const RevealText = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(" ");
  return (
    <span className="inline-block">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.1, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className={`inline-block mr-2 ${className || ""}`}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// --- MAIN COMPONENT ---

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  // FAQs
  const faqs = [
    { q: "L'application fonctionne-t-elle sans internet sur les chantiers ?", a: "Oui. Zolio utilise une technologie PWA qui vous permet de créer des devis et consulter vos clients même sans réseau. Les données se synchronisent automatiquement dès que vous retrouvez de la connexion." },
    { q: "Puis-je importer ma liste de clients ou mon catalogue actuel ?", a: "Absolument. Vous pouvez importer vos fichiers Excel ou CSV en un clic depuis les paramètres de votre compte." },
    { q: "Que se passe-t-il après mon devis d'essai ?", a: "Après avoir testé la plateforme avec votre premier devis, vous pouvez choisir de passer à l'abonnement Pro pour débloquer toutes les fonctionnalités en illimité. Sans engagement." },
    { q: "Est-ce que mes données sont sécurisées ?", a: "Vos données sont chiffrées de bout en bout et hébergées sur des serveurs sécurisés en Europe. Vous seul y avez accès." }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30 font-sans overflow-x-hidden">
      <CustomCursor />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <span className="text-white font-bold text-xl leading-none">Z</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Zolio</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Avis</a>
            <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in?redirect_url=/dashboard" className="text-sm font-medium text-white hover:text-violet-300 transition-colors">
              Connexion
            </Link>
            <Link 
              href="/sign-up?redirect_url=/dashboard" 
              data-interactive="true"
              className="relative group px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-fuchsia-200 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                Démarrer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 bg-black/95 backdrop-blur-3xl border-b border-white/10 p-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300">Fonctionnalités</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300">Tarifs</a>
              <Link href="/sign-in?redirect_url=/dashboard" className="text-lg font-medium text-white">Connexion</Link>
              <Link href="/sign-up?redirect_url=/dashboard" className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium text-center">
                Démarrer l'essai
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-32 pb-20">
        {/* HERO SECTION - SCROLL REVEAL */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-300">Génération 2026 : Le SaaS de l'Artisan</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 max-w-5xl leading-[1.1]">
            <RevealText text="Gérez vos chantiers." /> <br />
            <RevealText 
              text="Pas la paperasse." 
              className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400" 
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12 font-light"
          >
            L'outil ultra-rapide qui transforme votre téléphone en bureau. Devis sur le chantier, signature tactile, paiement instantané.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link 
              href="/sign-up?redirect_url=/dashboard"
              data-interactive="true"
              className="group relative px-8 py-4 rounded-full bg-white text-black font-bold text-lg overflow-hidden flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-200 to-fuchsia-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10">Essayer Zolio</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#demo"
              data-interactive="true"
              className="px-8 py-4 rounded-full border border-white/20 bg-black/50 text-white font-medium text-lg hover:bg-white/10 transition-colors backdrop-blur-md flex items-center justify-center"
            >
              Voir la démo
            </Link>
          </motion.div>
        </section>

        {/* 3D / GLASMORPHISM DASHBOARD PREVIEW */}
        <section id="demo" className="max-w-[1400px] mx-auto px-4 md:px-6 mb-40 perspective-[2000px]">
          <motion.div
            initial={{ rotateX: 20, y: 100, opacity: 0 }}
            whileInView={{ rotateX: 0, y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
            className="relative rounded-2xl md:rounded-[2.5rem] border border-white/10 bg-black/60 shadow-2xl overflow-hidden backdrop-blur-2xl ring-1 ring-white/5"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Dashboard Mockup UI */}
            <div className="flex h-[600px] md:h-[800px] flex-col">
              {/* Fake Browser Top */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="ml-4 px-3 py-1 text-xs text-gray-500 bg-black/50 rounded-md border border-white/5 flex-1 max-w-sm flex justify-center">
                  app.zolio.site
                </div>
              </div>
              
              {/* Fake Dashboard Body */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 p-4 hidden md:flex flex-col gap-2 bg-black/20">
                  <div className="h-8 w-24 bg-white/10 rounded-md mb-6"></div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-10 rounded-lg ${i===1 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5'} flex items-center px-3 gap-3`}>
                      <div className={`w-5 h-5 rounded-md ${i===1 ? 'bg-violet-400' : 'bg-white/20'}`}></div>
                      <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                    </div>
                  ))}
                </div>
                {/* Main Content */}
                <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 relative">
                   {/* Light reflection effect */}
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
                   
                   <div className="flex justify-between items-center mb-4">
                     <div>
                       <div className="h-6 w-48 bg-white/80 rounded-md mb-2"></div>
                       <div className="h-3 w-32 bg-white/30 rounded-full"></div>
                     </div>
                     <div className="h-10 w-32 bg-violet-600 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                   </div>

                   {/* Stats Cards */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col justify-between">
                         <div className="w-8 h-8 rounded-full bg-white/10"></div>
                         <div>
                           <div className="h-6 w-24 bg-white/80 rounded-md mb-2"></div>
                           <div className="h-3 w-16 bg-green-400/80 rounded-full"></div>
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Table & Chart area */}
                   <div className="flex-1 flex flex-col md:flex-row gap-6 mt-4">
                     <div className="flex-[2] rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col gap-4">
                        <div className="h-5 w-32 bg-white/50 rounded-md mb-4"></div>
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10"></div>
                              <div>
                                <div className="h-4 w-24 bg-white/80 rounded-md mb-1"></div>
                                <div className="h-3 w-16 bg-white/30 rounded-full"></div>
                              </div>
                            </div>
                            <div className="h-6 w-20 bg-white/10 rounded-full"></div>
                          </div>
                        ))}
                     </div>
                     <div className="flex-1 rounded-2xl bg-gradient-to-b from-violet-900/40 to-black border border-violet-500/20 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                       <div className="w-32 h-32 rounded-full border-[8px] border-violet-500/30 border-t-violet-400 border-r-violet-400 flex items-center justify-center relative z-10">
                         <span className="text-2xl font-bold">78%</span>
                       </div>
                       <div className="mt-6 h-4 w-24 bg-white/50 rounded-md relative z-10"></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* BENTO BOX FEATURES (Ultra Modern 2026) */}
        <section id="features" className="max-w-7xl mx-auto px-6 mb-40">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pensé pour le <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">terrain.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une architecture en composants fluides. Chaque outil est exactement où vous en avez besoin, quand vous en avez besoin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 - Large spanning 2 cols */}
            <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-end group">
              <div className="absolute top-0 right-0 p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                <Smartphone className="w-24 h-24 text-violet-400/20 group-hover:text-violet-400/40 transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6 border border-violet-500/30">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Mobile-First Ultime</h3>
                <p className="text-gray-400 max-w-md">L'interface s'adapte parfaitement à votre smartphone. Créez un devis complexe à une main, directement sur le chantier.</p>
              </div>
            </SpotlightCard>

            {/* Feature 2 */}
            <SpotlightCard className="p-8 flex flex-col justify-end group">
               <div className="absolute top-0 right-0 p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                <FileText className="w-24 h-24 text-fuchsia-400/20 group-hover:text-fuchsia-400/40 transition-colors" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">Signature Électronique</h3>
                <p className="text-gray-400">Faites signer vos clients directement sur l'écran de votre téléphone.</p>
              </div>
            </SpotlightCard>

            {/* Feature 3 */}
            <SpotlightCard className="p-8 flex flex-col justify-end group">
              <div className="absolute top-0 right-0 p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                <Calculator className="w-24 h-24 text-blue-400/20 group-hover:text-blue-400/40 transition-colors" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">Calcul de Marge</h3>
                <p className="text-gray-400">Rentabilité calculée en temps réel avant d'envoyer le devis.</p>
              </div>
            </SpotlightCard>

            {/* Feature 4 - Large spanning 2 cols */}
            <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-end group bg-gradient-to-br from-black to-violet-900/20">
              <div className="absolute top-0 right-0 p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                <Shield className="w-32 h-32 text-white/5 group-hover:text-white/10 transition-colors" />
              </div>
              <div className="relative z-10">
                <div className="flex gap-4 mb-6">
                  <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-medium">Factur-X</div>
                  <div className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium">Loi Anti-Fraude</div>
                </div>
                <h3 className="text-2xl font-bold mb-3">100% Conforme 2026</h3>
                <p className="text-gray-400 max-w-md">Vos devis et factures intègrent automatiquement les mentions légales obligatoires et les nouveaux formats dématérialisés.</p>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* COMPARISON (Avant/Après) */}
        <section className="max-w-7xl mx-auto px-6 mb-40">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2rem] border border-red-500/10 bg-red-950/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
              <h3 className="text-2xl font-bold mb-8 text-gray-300">Avant Zolio</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start text-gray-500">
                  <X className="w-6 h-6 shrink-0 text-red-500/50" />
                  <span>Soirées sacrifiées pour taper des devis sur Word/Excel.</span>
                </li>
                <li className="flex gap-4 items-start text-gray-500">
                  <X className="w-6 h-6 shrink-0 text-red-500/50" />
                  <span>Prix des matériaux non mis à jour, pertes sur la marge.</span>
                </li>
                <li className="flex gap-4 items-start text-gray-500">
                  <X className="w-6 h-6 shrink-0 text-red-500/50" />
                  <span>Factures impayées oubliées dans un classeur.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2rem] border border-violet-500/30 bg-violet-950/20 relative overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
              <h3 className="text-2xl font-bold mb-8 text-white">Avec Zolio</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start text-gray-200">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-violet-400" />
                  <span>Devis généré en 2 minutes depuis le chantier sur mobile.</span>
                </li>
                <li className="flex gap-4 items-start text-gray-200">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-violet-400" />
                  <span>Catalogue intégré avec calcul de marge en temps réel.</span>
                </li>
                <li className="flex gap-4 items-start text-gray-200">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-violet-400" />
                  <span>Tableau de bord intelligent qui suit vos paiements.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="max-w-4xl mx-auto px-6 mb-40">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Un tarif unique, transparent.</h2>
            <p className="text-xl text-gray-400">Rentabilisé dès le premier devis gagné.</p>
          </div>

          <SpotlightCard className="p-1 md:p-1 max-w-2xl mx-auto rounded-[2.5rem] bg-gradient-to-b from-white/10 to-white/5">
            <div className="bg-black/80 rounded-[2.4rem] p-10 md:p-12 backdrop-blur-3xl relative overflow-hidden">
               {/* Glow effect inside card */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

               <div className="flex flex-col items-center text-center relative z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm font-semibold mb-6 border border-violet-500/30">
                   <Star className="w-4 h-4" /> Zolio PRO
                 </div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-6xl font-black tracking-tighter">29€</span>
                   <span className="text-xl text-gray-400 font-medium">/mois</span>
                 </div>
                 <p className="text-gray-400 mb-8">Sans engagement. Annulez en 1 clic.</p>

                 <div className="w-full h-px bg-white/10 mb-8"></div>

                 <ul className="text-left space-y-4 w-full mb-10">
                   {['Devis et factures illimités', 'Catalogue produits personnalisé', 'Signature électronique certifiée', 'Tableau de bord & Statistiques', 'Support prioritaire'].map((item, i) => (
                     <li key={i} className="flex items-center gap-3">
                       <CheckCircle2 className="w-5 h-5 text-violet-400" />
                       <span className="text-gray-200">{item}</span>
                     </li>
                   ))}
                 </ul>

                 <Link 
                    href="/sign-up?redirect_url=/dashboard"
                    data-interactive="true"
                    className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors"
                  >
                    Démarrer l'essai
                  </Link>
                  <p className="text-sm text-gray-500 mt-4">1 devis inclus pour tester l'interface gratuitement.</p>
               </div>
            </div>
          </SpotlightCard>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="max-w-3xl mx-auto px-6 mb-40">
          <h2 className="text-3xl font-bold mb-10 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-white/10 bg-white/5 p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between text-lg font-medium text-white">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-gray-400 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl leading-none">Z</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Zolio</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                Conçu pour faire gagner du temps aux artisans du bâtiment. Simplifiez votre gestion quotidienne.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/sign-in?redirect_url=/dashboard" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Légal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGV</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Zolio. Tous droits réservés.</p>
            <p>Made with ❤️ in France</p>
          </div>
        </div>
      </footer>
      
      {/* FLOATING CTA MOBILE ONLY */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
         <Link 
            href="/sign-up?redirect_url=/dashboard"
            className="w-full py-4 rounded-full bg-white text-black font-bold text-center shadow-2xl block pointer-events-auto border border-white/20"
          >
            Démarrer l'essai
          </Link>
      </div>
    </div>
  );
}
