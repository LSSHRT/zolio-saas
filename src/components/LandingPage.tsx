import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Calculator,
  ShieldCheck,
  Zap,
  Star,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  FileText,
  FileCheck2,
  Users,
  BookOpen,
  Bell,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle,
  MoreHorizontal,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";

// Typographie Cinétique
const KineticText = ({ text, className = "" }: { text: string; className?: string }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 50]);
  const stretch = useTransform(scrollY, [0, 300], [1, 1.2]);
  
  return (
    <motion.h1
      style={{ y, scaleX: stretch }}
      className={`font-extrabold tracking-tighter ${className}`}
    >
      {text}
    </motion.h1>
  );
};

// Spotlight Card Bento Box
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
      className={`relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 shadow-2xl transition-transform duration-500 hover:scale-[1.02] ${className}`}
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

// Section de Défilement Horizontal (Responsive & Native)
const HorizontalScrollCarousel = () => {
  return (
    <section className="relative py-24 bg-white/[0.02] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl sm:text-5xl font-bold text-white text-center">
          Comment ça marche ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 animate-gradient-x">En 3 étapes</span>
        </h2>
      </div>

      <div className="flex overflow-x-auto pb-12 px-4 sm:px-6 lg:px-8 gap-6 sm:gap-8 snap-x snap-mandatory hide-scrollbar justify-start md:justify-center items-stretch">
        {/* Card 1 */}
        <div className="group relative w-[85vw] sm:w-[400px] flex-shrink-0 snap-center rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-violet-900/40 to-[#05050A]"></div>
          
          <div className="relative z-10 p-8 sm:p-10 flex flex-col h-full">
            <div className="flex-1 w-full flex items-center justify-center mb-10 h-[300px]">
              {/* Mockup Devis Mobile */}
              <div className="w-[200px] h-[320px] bg-white/[0.02] rounded-[2rem] border-[6px] border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col">
                <div className="absolute top-0 w-full h-5 bg-neutral-900 flex justify-center z-10"><div className="w-16 h-4 bg-white/[0.02] rounded-b-xl"></div></div>
                <div className="bg-neutral-900 pt-8 pb-3 px-4 flex justify-between items-center border-b border-neutral-800">
                   <span className="text-xs font-bold text-white">Nouveau Devis</span>
                   <span className="text-[10px] text-neutral-400">#D-0142</span>
                </div>
                <div className="flex-1 p-3 space-y-3 flex flex-col bg-white/[0.02]">
                  <div className="bg-neutral-900 rounded-lg p-2">
                     <p className="text-[10px] text-neutral-400 mb-1">Client</p>
                     <p className="text-xs text-white font-medium">Jean Dupont</p>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-300">Peinture salon</span>
                        <span className="text-[10px] text-white">850 €</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-300">Main d'œuvre</span>
                        <span className="text-[10px] text-white">400 €</span>
                     </div>
                  </div>
                  <div className="mt-auto border-t border-neutral-800 pt-2 flex justify-between items-end">
                     <span className="text-[10px] text-neutral-400">Total TTC</span>
                     <span className="text-sm font-bold text-violet-400">1 250 €</span>
                  </div>
                  <div className="w-full bg-violet-600 text-white text-[10px] font-bold py-2 rounded-full text-center mt-2">
                     Envoyer
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">1. Devis sur chantier</h3>
              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">Rédigez vos devis directement depuis votre smartphone, sans attendre le soir.</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group relative w-[85vw] sm:w-[400px] flex-shrink-0 snap-center rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-fuchsia-900/40 to-[#05050A]"></div>
          
          <div className="relative z-10 p-8 sm:p-10 flex flex-col h-full">
            <div className="flex-1 w-full flex items-center justify-center mb-10 h-[300px]">
              {/* Mockup Signature */}
              <div className="w-[240px] bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl p-5 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                   <h4 className="text-white font-bold text-sm">Signature</h4>
                   <FileText className="w-4 h-4 text-fuchsia-500" />
                </div>
                <p className="text-[10px] text-neutral-400 mb-4">
                   J'accepte les conditions du devis #D-0142 (1 250 €).
                </p>
                <div className="h-24 border-2 border-dashed border-neutral-600 rounded-xl flex items-center justify-center relative bg-white/[0.02]">
                   <span className="absolute text-neutral-600 text-[10px] font-medium uppercase tracking-widest">Signer ici</span>
                   <svg viewBox="0 0 100 40" className="w-full h-full opacity-80 z-10 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                      <motion.path 
                         initial={{ pathLength: 0 }}
                         animate={{ pathLength: 1 }}
                         transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                         d="M 10 25 C 20 5, 30 35, 40 15 C 50 -5, 60 40, 70 20 C 80 0, 90 30, 95 25" 
                         fill="transparent" stroke="#d946ef" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                      />
                   </svg>
                </div>
                <div className="w-full bg-fuchsia-600 text-white text-[10px] font-bold py-2 rounded-lg text-center mt-4">
                   Valider
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">2. Signature digitale</h3>
              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">Faites signer vos clients directement sur l'écran pour un accord immédiat.</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group relative w-[85vw] sm:w-[400px] flex-shrink-0 snap-center rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-orange-900/40 to-[#05050A]"></div>
          
          <div className="relative z-10 p-8 sm:p-10 flex flex-col h-full">
            <div className="flex-1 w-full flex items-center justify-center mb-10 h-[300px]">
              {/* Mockup Facture */}
              <div className="w-[240px] bg-neutral-100 rounded-xl shadow-[0_0_40px_rgba(249,115,22,0.15)] p-5 flex flex-col relative">
                <div className="absolute top-8 right-2 border-4 border-green-500 text-green-500 font-black text-lg px-2 py-1 transform rotate-12 opacity-90 rounded z-10">
                   PAYÉ
                </div>
                <div className="flex justify-between items-start mb-5 border-b border-neutral-300 pb-3">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center text-white font-bold text-[10px]">Z</div>
                     <span className="text-neutral-800 font-bold text-xs">Facture</span>
                  </div>
                  <div className="text-right">
                     <p className="text-neutral-500 text-[8px]">#F-2026</p>
                     <p className="text-neutral-800 font-bold text-[10px]">1 250 €</p>
                  </div>
                </div>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-[9px] text-neutral-500 border-b border-neutral-200 pb-1">
                     <span>Description</span>
                     <span>Montant</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-800 font-medium">
                     <span>Peinture</span>
                     <span>850 €</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-800 font-medium">
                     <span>Main d'œuvre</span>
                     <span>400 €</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-neutral-200">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] text-neutral-500">Net à payer</span>
                     <span className="text-xs font-black text-neutral-900">0 €</span>
                  </div>
                  <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden mt-2">
                     <div className="h-full bg-green-500 w-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">3. Facturation en 1 clic</h3>
              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">Transformez vos devis acceptés en factures professionnelles instantanément.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Styles pour cacher la scrollbar mais garder le scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
};


// Testimonial Card Component
const TestimonialCard = ({ name, role, quote, stars = 5 }: any) => (
  <SpotlightCard className="p-8 transform transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1">
    <div className="flex gap-1 mb-4">
      {[...Array(stars)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
      ))}
    </div>
    <p className="text-neutral-300 mb-6 italic">"{quote}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center font-bold text-white">
        {name.charAt(0)}
      </div>
      <div>
        <h4 className="font-bold text-white">{name}</h4>
        <p className="text-sm text-neutral-400">{role}</p>
      </div>
    </div>
  </SpotlightCard>
);

// FAQ Item Component
const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none"
      >
        <span className="text-lg font-medium text-white">{question}</span>
        <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-neutral-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0514] text-neutral-100 selection:bg-violet-500/30 overflow-x-hidden relative">
      {/* Advanced Premium 2026 Background Layer */}
      {/* 1. Base Dark Midnight Color with Radial Glow */}
      <div className="fixed inset-0 z-[-4] bg-[#0A0514] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.35),rgba(0,0,0,0))]"></div>
      
      {/* 2. Interactive/Moving 2026 Grid Pattern */}
      <div className="fixed inset-0 z-[-3] pointer-events-none bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_80%,transparent_100%)]"></div>

      {/* 3. Deep Space Noise / Grain Texture for High-End feel */}
      <div className="fixed inset-0 z-[-2] opacity-[0.06] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* 4. Enhanced Aurora / Nebula Glows (Smooth CSS animations) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-80 mix-blend-screen overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-violet-600/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[60vh] bg-fuchsia-600/30 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[40vh] bg-orange-500/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-[#05050A]/50 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Image src="/logo.png" alt="Zolio Logo" width={40} height={40} className="mr-3" />
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Zolio</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">Fonctionnalités</a>
                <a href="#pricing" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">Tarifs</a>
                <a href="#faq" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">FAQ</a>
                <a href="/sign-in?redirect_url=/dashboard" className="text-sm font-medium text-white hover:text-violet-400 transition-colors">Se connecter</a>
                <a 
                  href="/sign-up?redirect_url=/dashboard"
                  className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-transform hover:scale-105"
                >
                  Essayer Zolio
                </a>
              </div>

              <div className="md:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-neutral-300 hover:text-white">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-[#05050A]/95 backdrop-blur-xl border-b border-white/10"
              >
                <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
                  <a href="#features" className="block text-base font-medium text-neutral-300 hover:text-white">Fonctionnalités</a>
                  <a href="#pricing" className="block text-base font-medium text-neutral-300 hover:text-white">Tarifs</a>
                  <a href="/sign-in?redirect_url=/dashboard" className="block text-base font-medium text-neutral-300 hover:text-white">Se connecter</a>
                  <a href="/sign-up?redirect_url=/dashboard" className="inline-block px-5 py-3 rounded-xl bg-white text-black text-base font-semibold text-center w-full mt-4">
                    Essayer Zolio
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
                <span className="flex h-2 w-2 rounded-full bg-violet-500 mr-2 animate-pulse"></span>
                Zolio 2026 - L'avenir du bâtiment
              </div>
              
              <KineticText 
                text="Gérez vos chantiers. Pas la paperasse." 
                className="text-6xl md:text-8xl mb-8 bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent"
              />
              
              <p className="mt-6 text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                Le logiciel de devis et factures conçu spécifiquement pour les artisans du bâtiment. 
                Une interface fluide, moderne et accessible partout, même sur le chantier.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a 
                  href="/sign-up?redirect_url=/dashboard"
                  className="px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center group"
                >
                  Démarrer l'essai
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="#demo"
                  className="px-8 py-4 rounded-full bg-neutral-900 border border-neutral-700 text-white font-semibold text-lg hover:bg-neutral-800 transition-all flex items-center justify-center"
                >
                  Voir la démo
                </a>
              </div>
            </motion.div>
          </div>
          
          {/* Dashboard Showcase Mockup (replaces Spline) */}
          <div id="demo" className="mt-20 relative w-full max-w-5xl mx-auto opacity-90 hover:opacity-100 transition-opacity duration-700 z-20 scroll-mt-32 group">
            
            {/* Demo Floating Badges */}
            <div className="absolute -left-4 sm:-left-12 top-1/4 z-30 hidden md:block opacity-90 hover:opacity-100 transition-all duration-500 hover:-translate-y-2">
              <div className="bg-[#05050A]/80 backdrop-blur-xl border border-violet-500/30 p-3 rounded-xl shadow-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center text-violet-300 font-bold animate-pulse">1</div>
                <p className="text-sm text-white font-medium">Navigation simplifiée<br/><span className="text-neutral-400 text-xs">Tout à portée de main</span></p>
              </div>
            </div>

            <div className="absolute right-10 sm:-right-8 top-1/3 z-30 hidden md:block opacity-90 hover:opacity-100 transition-all duration-500 hover:-translate-y-2">
              <div className="bg-[#05050A]/80 backdrop-blur-xl border border-orange-500/30 p-3 rounded-xl shadow-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center text-orange-300 font-bold animate-pulse">2</div>
                <p className="text-sm text-white font-medium">Statistiques directes<br/><span className="text-neutral-400 text-xs">Suivi en temps réel</span></p>
              </div>
            </div>

            <div className="absolute left-1/3 -bottom-6 z-30 hidden md:block opacity-90 hover:opacity-100 transition-all duration-500 hover:-translate-y-2">
              <div className="bg-[#05050A]/80 backdrop-blur-xl border border-fuchsia-500/30 p-3 rounded-xl shadow-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 font-bold animate-pulse">3</div>
                <p className="text-sm text-white font-medium">Création en 1 clic<br/><span className="text-neutral-400 text-xs">Devis ou Facture</span></p>
              </div>
            </div>

            <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_0_100px_rgba(139,92,246,0.15)] overflow-hidden p-2 sm:p-4">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 mb-4 bg-white/5 rounded-xl">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto flex items-center justify-center px-4 py-1 rounded-md bg-white/5 text-xs font-medium text-neutral-400 w-1/3 min-w-[150px]">
                  <Lock className="w-3 h-3 mr-1 inline-block" /> zolio.site/dashboard
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-2 sm:p-4 bg-[#05050A]/60 rounded-xl border border-white/5 shadow-2xl">
                {/* Sidebar */}
                <div className="hidden md:flex flex-col gap-2 col-span-1 border-r border-white/10 pr-4 py-2">
                  <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20">Z</div>
                    <span className="text-white font-bold tracking-wide">Zolio</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-violet-500/20 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all cursor-default">
                    <LayoutDashboard className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-200 text-sm font-medium">Tableau de bord</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 border border-transparent transition-all cursor-default">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400 text-sm font-medium">Devis</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 border border-transparent transition-all cursor-default">
                    <FileCheck2 className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400 text-sm font-medium">Factures</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 border border-transparent transition-all cursor-default">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400 text-sm font-medium">Clients</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 border border-transparent transition-all cursor-default">
                    <BookOpen className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-400 text-sm font-medium">Catalogue</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 flex items-center justify-center text-white font-bold text-xs">A</div>
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-medium">Artisan Pro</span>
                        <span className="text-neutral-500 text-[10px]">Plan Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="col-span-1 md:col-span-4 flex flex-col gap-6 py-2">
                  {/* Header */}
                  <div className="flex justify-between items-center px-2">
                     <div>
                       <h2 className="text-xl font-bold text-white mb-1">Bonjour, Artisan 👋</h2>
                       <p className="text-xs text-neutral-400 hidden sm:block">Voici le résumé de votre activité aujourd'hui.</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                         <Bell className="w-4 h-4 text-neutral-300" />
                       </div>
                       <div className="h-9 px-4 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 cursor-default">
                         <Plus className="w-4 h-4 text-white" />
                         <span className="text-white text-sm font-medium">Nouveau Devis</span>
                       </div>
                     </div>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-sm relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-neutral-400 text-sm font-medium">Chiffre d'affaires</span>
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                          <TrendingUp className="w-4 h-4 text-violet-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2 relative z-10">12 450,00 €</div>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">+12%</div>
                        <span className="text-neutral-500 text-xs">vs mois dernier</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-neutral-400 text-sm font-medium">Devis en cours</span>
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/20">
                          <Clock className="w-4 h-4 text-orange-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2 relative z-10">8</div>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">En attente</div>
                        <span className="text-neutral-500 text-xs">de signature</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-sm relative overflow-hidden group hover:border-fuchsia-500/30 transition-colors hidden sm:block">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-neutral-400 text-sm font-medium">Factures impayées</span>
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/20">
                          <AlertCircle className="w-4 h-4 text-fuchsia-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2 relative z-10">3 200,00 €</div>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/20">À relancer</div>
                        <span className="text-neutral-500 text-xs">2 clients</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Charts & Lists Area */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 px-2">
                    {/* Main Chart */}
                    <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 shadow-sm p-5 flex flex-col min-h-[220px]">
                       <div className="flex justify-between items-center mb-6">
                         <span className="text-white font-medium">Revenus de l'année</span>
                         <div className="flex gap-2">
                           <div className="px-3 py-1 bg-white/10 rounded-md text-xs text-white font-medium">2026</div>
                         </div>
                       </div>
                       <div className="flex-1 border-b border-white/10 flex items-end gap-2 sm:gap-4 pb-0 mt-auto px-2">
                          {[
                            { h: 40, m: 'Jan', v: '4,2k' }, 
                            { h: 70, m: 'Fév', v: '7,1k' }, 
                            { h: 45, m: 'Mar', v: '4,8k' }, 
                            { h: 90, m: 'Avr', v: '9,5k' }, 
                            { h: 65, m: 'Mai', v: '6,2k' }, 
                            { h: 80, m: 'Jui', v: '8,4k' }, 
                            { h: 100, m: 'Jul', v: '11,2k' }, 
                            { h: 50, m: 'Aoû', v: '5,1k' }, 
                            { h: 85, m: 'Sep', v: '8,9k' }, 
                            { h: 60, m: 'Oct', v: '6,5k' }, 
                            { h: 95, m: 'Nov', v: '10,1k' }, 
                            { h: 75, m: 'Déc', v: '7,8k' }
                          ].map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full bg-gradient-to-t from-violet-600/60 to-violet-400/80 rounded-t-md relative group hover:from-violet-500 hover:to-fuchsia-400 transition-colors" style={{ height: `${item.h}px` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl pointer-events-none z-20">
                                  {item.v} €
                                </div>
                              </div>
                              <span className="text-[9px] text-neutral-500">{item.m}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="col-span-1 rounded-xl bg-white/5 border border-white/10 shadow-sm p-4 flex flex-col hidden sm:flex">
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-white font-medium">Activité récente</span>
                        <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between group cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-medium group-hover:text-violet-300 transition-colors">Devis accepté</span>
                              <span className="text-neutral-500 text-[10px]">M. Dupont - Rénovation</span>
                            </div>
                          </div>
                          <span className="text-neutral-400 text-[10px]">Il y a 2h</span>
                        </div>
                        
                        <div className="flex items-center justify-between group cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-violet-500/10 border-violet-500/20">
                              <FileText className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-medium group-hover:text-violet-300 transition-colors">Facture envoyée</span>
                              <span className="text-neutral-500 text-[10px]">Mme. Martin - Plomberie</span>
                            </div>
                          </div>
                          <span className="text-neutral-400 text-[10px]">Hier</span>
                        </div>

                        <div className="flex items-center justify-between group cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-orange-500/10 border-orange-500/20">
                              <Clock className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-medium group-hover:text-violet-300 transition-colors">Relance auto</span>
                              <span className="text-neutral-500 text-[10px]">SARL Bâtiment - Fact. 45</span>
                            </div>
                          </div>
                          <span className="text-neutral-400 text-[10px]">Hier</span>
                        </div>
                        
                        <div className="flex items-center justify-between group cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-white/5 border-white/10">
                              <Plus className="w-3.5 h-3.5 text-neutral-300" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-medium group-hover:text-violet-300 transition-colors">Nouveau client</span>
                              <span className="text-neutral-500 text-[10px]">Ajouté depuis l'application</span>
                            </div>
                          </div>
                          <span className="text-neutral-400 text-[10px]">Lun.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Avant/Après Section */}
        <section className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20 relative"
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
                <span className="text-sm font-medium text-neutral-300">L'évolution est en marche</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                Transformez votre manière de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500">travailler</span>
              </h2>
              <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Passez à la vitesse supérieure avec Zolio. Dites adieu à la paperasse et bonjour à la rentabilité en temps réel.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
              {/* Ligne de connexion au centre (visible uniquement sur desktop) */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 z-20 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <ArrowRight className="text-violet-400" />
              </div>

              {/* Avant Zolio */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="group relative"
              >
                <div className="absolute -inset-px bg-gradient-to-br from-red-500/20 to-neutral-800 rounded-3xl opacity-50 blur-sm transition-opacity group-hover:opacity-100"></div>
                <div className="relative h-full bg-[#0a0a0c] border border-red-900/30 rounded-3xl p-8 sm:p-10 overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <X className="w-32 h-32 text-red-500" />
                  </div>
                  
                  <div className="flex items-center mb-8 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mr-4">
                      <X className="text-red-500 w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-300">Sans Zolio</h3>
                  </div>
                  
                  <ul className="space-y-6 relative z-10">
                    {[
                      { title: "Soirées sacrifiées", desc: "Des heures passées à rédiger des devis après le chantier." },
                      { title: "Papiers perdus", desc: "Des relances oubliées et des factures en retard." },
                      { title: "Marge incertaine", desc: "Un calcul de rentabilité approximatif à la fin du mois." },
                      { title: "Outils obsolètes", desc: "Des logiciels compliqués des années 2000." }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="mt-1 mr-4 flex-shrink-0 w-8 h-8 rounded-full bg-red-950/50 flex items-center justify-center border border-red-900/50">
                          <X className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-neutral-300 mb-1">{item.title}</h4>
                          <p className="text-neutral-500">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Avec Zolio */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="group relative"
              >
                <div className="absolute -inset-px bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl opacity-30 blur-md transition-opacity duration-500 group-hover:opacity-70 group-hover:animate-pulse"></div>
                <div className="relative h-full bg-[#0a0a0c] border border-violet-500/30 rounded-3xl p-8 sm:p-10 overflow-hidden shadow-[inset_0_0_80px_rgba(139,92,246,0.1)]">
                  {/* Effet Spotlight interne */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px]"></div>
                  
                  <div className="flex items-center mb-8 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-400/30 mr-4 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                      <CheckCircle className="text-violet-400 w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">Avec Zolio</h3>
                  </div>
                  
                  <ul className="space-y-6 relative z-10">
                    {[
                      { title: "Devis instantanés", desc: "Réalisés sur le chantier en 3 min depuis votre téléphone." },
                      { title: "Signature digitale", desc: "Accord client immédiat et sans impression papier." },
                      { title: "Rentabilité en temps réel", desc: "Visualisez votre marge nette avant même l'envoi." },
                      { title: "Écosystème 2026", desc: "Une interface fluide, ultra-rapide et intuitive." }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="mt-1 mr-4 flex-shrink-0 w-8 h-8 rounded-full bg-violet-900/40 flex items-center justify-center border border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                          <CheckCircle className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                          <p className="text-violet-200/70">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Horizontal Scroll Section */}
        <HorizontalScrollCarousel />

        
        {/* Metrics Banner Section */}
        <section className="py-16 bg-white/[0.02] border-y border-white/5 relative overflow-hidden -mt-8 z-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/10 via-black to-orange-900/10 opacity-60"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
              <div className="p-4 sm:p-8">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-2 tracking-tighter">3x</div>
                <div className="text-violet-400 font-semibold mb-2 tracking-wide uppercase text-sm">Plus rapide</div>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Pour créer, envoyer et faire signer un devis professionnel</p>
              </div>
              <div className="p-4 sm:p-8">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-2 tracking-tighter">100%</div>
                <div className="text-fuchsia-400 font-semibold mb-2 tracking-wide uppercase text-sm">Sur Chantier</div>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Conçu spécifiquement pour une utilisation mobile et tablette</p>
              </div>
              <div className="p-4 sm:p-8">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-2 tracking-tighter">0</div>
                <div className="text-orange-400 font-semibold mb-2 tracking-wide uppercase text-sm">Oubli</div>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Fini la paperasse le soir, tout est centralisé et sécurisé</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent"></div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 bg-transparent relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ils nous font confiance</h2>
              <p className="text-xl text-neutral-400">Rejoignez les artisans qui ont transformé leur quotidien.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard 
                name="Jean Dupont" 
                role="Électricien" 
                quote="Avant Zolio, je passais mes soirées sur mes devis. Aujourd'hui tout est fait sur le chantier. Un vrai gain de temps !" 
              />
              <TestimonialCard 
                name="Marc Leroy" 
                role="Plombier" 
                quote="Le design est incroyable, mes clients sont impressionnés quand je leur fais signer le devis sur ma tablette." 
              />
              <TestimonialCard 
                name="Sophie Martin" 
                role="Peintre" 
                quote="La facturation en 1 clic a changé ma vie. Je suis payée beaucoup plus rapidement et je n'oublie plus aucune facture." 
              />
            </div>
          </div>
        </section>

        {/* Bento Box Features Section */}
        <section id="features" className="py-32 bg-transparent relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-center mb-20 flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                <span className="text-sm font-medium text-neutral-300">L'écosystème parfait</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
                Pensé pour l'artisanat <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400">moderne</span>
              </h2>
              <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-light">
                Tout ce dont vous avez besoin pour gérer vos chantiers, <span className="text-neutral-200 font-medium">sans la complexité.</span>
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mobile-First Absolu */}
              <SpotlightCard className="md:col-span-2 md:row-span-2 p-10 flex flex-col justify-between group overflow-hidden relative bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-500/30 transition-colors duration-700"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-6 border border-violet-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                    <Smartphone className="w-7 h-7 text-violet-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Mobile-First Absolu</h3>
                  <p className="text-neutral-400 text-lg leading-relaxed max-w-md">
                    Créez un devis, faites-le signer et envoyez la facture directement depuis votre camion ou le chantier.
                    L'interface s'adapte parfaitement à votre téléphone.
                  </p>
                </div>
                
                {/* 3D Mockup Effect */}
                <div className="mt-12 h-64 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/10 overflow-hidden relative shadow-2xl backdrop-blur-sm group-hover:border-violet-500/30 transition-colors duration-500">
                   <div className="absolute right-[-10%] top-8 w-4/5 h-[120%] bg-[#05050A] border border-white/10 rounded-tl-3xl p-6 transform group-hover:-translate-x-6 group-hover:-translate-y-2 transition-all duration-700 shadow-[-20px_20px_40px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                     {/* Fake Mobile Header */}
                     <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="w-1/3 h-4 bg-white/10 rounded-full"></div>
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-violet-400"></div>
                        </div>
                     </div>
                     {/* Fake Content */}
                     <div className="space-y-3 mt-2">
                       <div className="w-full h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4">
                          <div className="w-6 h-6 rounded bg-violet-500/30 mr-3"></div>
                          <div className="w-1/2 h-3 bg-white/20 rounded-full"></div>
                       </div>
                       <div className="w-full h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4">
                          <div className="w-6 h-6 rounded bg-fuchsia-500/30 mr-3"></div>
                          <div className="w-2/3 h-3 bg-white/20 rounded-full"></div>
                       </div>
                     </div>
                     {/* Fake Action Button */}
                     <div className="mt-auto w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <div className="w-1/3 h-3 bg-white/80 rounded-full"></div>
                     </div>
                   </div>
                </div>
              </SpotlightCard>

              {/* Calcul de marge */}
              <SpotlightCard className="group relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 flex items-center justify-center mb-6 border border-fuchsia-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                    <Calculator className="w-6 h-6 text-fuchsia-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Calcul de marge</h3>
                  <p className="text-neutral-400 flex-grow">Visualisez votre rentabilité en temps réel pendant la rédaction de votre devis.</p>
                  
                  {/* Mini Chart Mockup */}
                  <div className="mt-6 flex items-end gap-2 h-16 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-1/4 bg-white/10 rounded-t-md h-1/3"></div>
                    <div className="w-1/4 bg-white/10 rounded-t-md h-1/2"></div>
                    <div className="w-1/4 bg-fuchsia-500/30 rounded-t-md h-3/4 relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-fuchsia-400">+42%</div>
                    </div>
                    <div className="w-1/4 bg-gradient-to-t from-fuchsia-600 to-violet-600 rounded-t-md h-full shadow-[0_0_15px_rgba(217,70,239,0.4)]"></div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Conforme 2026 */}
              <SpotlightCard className="group relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6 border border-blue-500/20 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <ShieldCheck className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Conforme 2026</h3>
                  <p className="text-neutral-400 flex-grow">Facturation électronique et mentions légales gérées automatiquement.</p>
                  
                  {/* Badge & Verify Animation */}
                  <div className="mt-6 flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-blue-200">Factur-X Ready</span>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </SpotlightCard>

              {/* Vitesse foudroyante */}
              <SpotlightCard className="md:col-span-3 h-auto py-12 flex flex-col md:flex-row justify-between items-center text-left overflow-hidden relative group bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                {/* Background Speed Lines */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                  <div className="absolute top-1/4 -left-20 w-[120%] h-px bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 translate-x-full group-hover:-translate-x-full transition-transform duration-[2s] ease-in-out"></div>
                  <div className="absolute top-2/4 -left-20 w-[120%] h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent transform -rotate-12 translate-x-full group-hover:-translate-x-full transition-transform duration-[1.5s] ease-in-out delay-100"></div>
                  <div className="absolute top-3/4 -left-20 w-[120%] h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent transform -rotate-12 translate-x-full group-hover:-translate-x-full transition-transform duration-[2.5s] ease-in-out delay-200"></div>
                </div>

                <div className="relative z-10 flex-1 md:pr-12 text-center md:text-left mb-8 md:mb-0 flex flex-col items-center md:items-start">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center mb-6 border border-yellow-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Vitesse foudroyante</h3>
                  <p className="text-neutral-400 text-lg md:text-xl max-w-2xl font-light">
                    Chaque action dans Zolio est instantanée. Pas de temps de chargement, pas d'attente. 
                    <span className="text-white font-medium"> Gagnez en moyenne 4h de travail administratif par semaine.</span>
                  </p>
                </div>

                <div className="relative z-10 w-full md:w-auto flex flex-col items-center">
                  {/* Speedometer visual */}
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" strokeDasharray="188 251" strokeLinecap="round" />
                      {/* Active Track */}
                      <circle cx="50" cy="50" r="40" stroke="url(#speedGradient)" strokeWidth="8" fill="none" strokeDasharray="0 251" strokeLinecap="round" className="group-hover:[stroke-dasharray:188_251] transition-all duration-1000 ease-out" />
                      <defs>
                        <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-orange-400 transition-colors duration-500">0ms</span>
                      <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Latence</span>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>

        
        {/* Pricing Section - 2026 Design */}
        <section id="pricing" className="py-32 bg-transparent relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white/80 tracking-wide uppercase">SANS ENGAGEMENT</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
              >
                Un tarif <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 animate-gradient bg-300%">clair et unique</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-xl text-neutral-400 max-w-2xl mx-auto"
              >
                Pour développer votre entreprise sans limites.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="max-w-lg mx-auto relative group perspective"
            >
              {/* Magic Glowing Border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              
              <SpotlightCard className="p-10 relative overflow-hidden rounded-3xl bg-neutral-950/80 backdrop-blur-2xl border border-white/10 transform transition-transform duration-500 hover:scale-[1.02] preserve-3d">
                {/* Aurora inside the card */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl -ml-32 -mb-32 transition-transform duration-700 group-hover:scale-150"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-baseline mb-8">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">Zolio Pro</h3>
                      <p className="text-violet-300 text-sm font-medium">Tout inclus</p>
                    </div>
                    <div className="text-right">
                      <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">29€</span>
                      <span className="text-neutral-400 block mt-1">/mois</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>
                  
                  <ul className="space-y-5 mb-10">
                    {['Devis et factures illimités', 'Catalogue de prix intégré', 'Signature électronique', 'Support prioritaire 7j/7'].map((feature, idx) => (
                      <motion.li 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + (idx * 0.1) }}
                        className="flex items-center text-neutral-200 group/item"
                      >
                        <div className="relative mr-4 flex-shrink-0">
                          <div className="absolute inset-0 bg-violet-500 rounded-full blur opacity-0 group-hover/item:opacity-50 transition-opacity"></div>
                          <CheckCircle className="w-6 h-6 text-violet-400 relative z-10" />
                        </div>
                        <span className="text-lg">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  <a 
                    href="/sign-up?redirect_url=/dashboard"
                    className="group/btn relative block w-full py-4 rounded-xl font-bold text-center transition-all duration-300 transform hover:scale-[1.02] active:scale-95 overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 opacity-90 group-hover/btn:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover/btn:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                    <span className="relative z-10 text-white flex items-center justify-center gap-2">
                      Démarrer l'essai (1 devis)
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                  </a>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-transparent relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Questions fréquentes</h2>
              <p className="text-xl text-neutral-400">Tout ce que vous devez savoir avant de vous lancer.</p>
            </div>
            <div className="space-y-2">
              <FAQItem 
                question="L'application fonctionne-t-elle sur téléphone sans internet ?" 
                answer="Zolio est optimisé pour les mobiles. Si vous perdez la connexion sur un chantier, vous pouvez continuer à préparer votre devis, il se synchronisera automatiquement dès que vous retrouverez du réseau." 
              />
              <FAQItem 
                question="Puis-je importer ma liste de clients existante ?" 
                answer="Oui ! Vous pouvez très prochainement importer vos clients et votre catalogue de prix au format Excel/CSV en quelques clics." 
              />
              <FAQItem 
                question="Que se passe-t-il après mon devis d'essai ?" 
                answer="Une fois votre devis d'essai utilisé, vous pourrez passer à la version Pro pour débloquer les devis et factures illimités, sans aucun engagement de durée." 
              />
              <FAQItem 
                question="Mes données sont-elles sécurisées ?" 
                answer="Absolument. Vos données sont hébergées sur des serveurs sécurisés en Europe et sauvegardées quotidiennement. Vous êtes le seul propriétaire de vos informations." 
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-transparent pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-6">
                  <Image src="/logo.png" alt="Zolio Logo" width={32} height={32} className="mr-3" />
                  <span className="text-xl font-bold text-white">Zolio</span>
                </div>
                <p className="text-neutral-400 max-w-sm">
                  Le partenaire chantier nouvelle génération pour les artisans du bâtiment. 
                  Gérez tout depuis votre poche.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-6">Produit</h4>
                <ul className="space-y-4">
                  <li><a href="#features" className="text-neutral-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                  <li><a href="#pricing" className="text-neutral-400 hover:text-white transition-colors">Tarifs</a></li>
                  <li><a href="/sign-in?redirect_url=/dashboard" className="text-neutral-400 hover:text-white transition-colors">Connexion</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-6">Légal</h4>
                <ul className="space-y-4">
                  <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Mentions légales</a></li>
                  <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Politique de confidentialité</a></li>
                  <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">CGV</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-neutral-500 text-sm">© 2026 Zolio. Tous droits réservés.</p>
              <div className="mt-4 md:mt-0">
                {/* Social icons could go here */}
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile Floating CTA */}
        <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
          <a 
            href="/sign-up?redirect_url=/dashboard"
            className="block w-full py-4 rounded-full bg-white text-black font-semibold text-center text-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
          >
            Créer mon compte
          </a>
        </div>

        {/* PLG Badge (Product Led Growth) */}
        <a
          href="/"
          className="fixed bottom-6 left-6 z-50 hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-[#05050A]/80 border border-white/10 backdrop-blur-md hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-2xl group"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center p-[2px]">
            <Image src="/logo.png" alt="Zolio Logo" width={16} height={16} className="rounded-full" />
          </div>
          <span className="text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">
            Propulsé par <span className="text-white font-semibold">Zolio</span>
          </span>
        </a>
      </div>
    </div>
  );
}
