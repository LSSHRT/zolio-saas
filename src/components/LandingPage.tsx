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
  FileText
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

// Section de Défilement Horizontal
const HorizontalScrollCarousel = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-68%"]);

  return (
    <section ref={targetRef} className="relative h-[250vh] bg-neutral-950">
      <div className="sticky top-[10vh] flex h-[75vh] items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8 px-12">
          {/* Card 1 */}
          <div className="group relative h-[60vh] w-[80vw] sm:w-[50vw] overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 flex-shrink-0">
            <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-violet-900/40 to-black p-8 sm:p-12 flex flex-col">
              <div className="flex-1 w-full flex items-center justify-center mb-8 relative pointer-events-none">
                {/* Mockup Devis Mobile */}
                <div className="w-[200px] h-[350px] bg-neutral-950 rounded-[2rem] border-[6px] border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col transform scale-[0.45] sm:scale-50 origin-center">
                  {/* Encloche (Notch) */}
                  <div className="absolute top-0 w-full h-5 bg-neutral-900 flex justify-center z-10"><div className="w-16 h-4 bg-neutral-950 rounded-b-xl"></div></div>
                  {/* Header */}
                  <div className="bg-neutral-900 pt-8 pb-3 px-4 flex justify-between items-center border-b border-neutral-800">
                     <span className="text-xs font-bold text-white">Nouveau Devis</span>
                     <span className="text-[10px] text-neutral-400">#D-0142</span>
                  </div>
                  {/* Body */}
                  <div className="flex-1 p-3 space-y-3 flex flex-col bg-neutral-950">
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
                       Envoyer au client
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-auto z-10 pointer-events-none">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">1. Devis sur chantier</h3>
                <p className="text-lg sm:text-xl text-neutral-400">Rédigez vos devis directement depuis votre smartphone, sans attendre le soir.</p>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="group relative h-[60vh] w-[80vw] sm:w-[50vw] overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 flex-shrink-0">
            <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-fuchsia-900/40 to-black p-8 sm:p-12 flex flex-col">
              <div className="flex-1 w-full flex items-center justify-center mb-8 pointer-events-none">
                {/* Mockup Signature */}
                <div className="w-[280px] h-[200px] bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl p-5 flex flex-col relative overflow-hidden transform scale-[0.45] sm:scale-50 origin-center">
                  <div className="flex justify-between items-center mb-3">
                     <h4 className="text-white font-bold text-sm">Signature requise</h4>
                     <FileText className="w-4 h-4 text-fuchsia-500" />
                  </div>
                  <p className="text-[10px] text-neutral-400 mb-3">
                     Je soussigné, accepte les conditions du devis #D-0142 pour un montant de 1 250 €.
                  </p>
                  <div className="flex-1 border-2 border-dashed border-neutral-600 rounded-xl flex items-center justify-center relative bg-neutral-950 group">
                     <span className="absolute text-neutral-600 text-xs font-medium uppercase tracking-widest">Signer ici</span>
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
                  <div className="w-full bg-fuchsia-600 text-white text-[10px] font-bold py-2 rounded-lg text-center mt-3">
                     Valider la signature
                  </div>
                </div>
              </div>
              <div className="mt-auto z-10 pointer-events-none">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">2. Signature digitale</h3>
                <p className="text-lg sm:text-xl text-neutral-400">Faites signer vos clients directement sur l'écran pour un accord immédiat.</p>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="group relative h-[60vh] w-[80vw] sm:w-[50vw] overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 flex-shrink-0">
            <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105 bg-gradient-to-br from-orange-900/40 to-black p-8 sm:p-12 flex flex-col">
              <div className="flex-1 w-full flex items-center justify-center mb-8 pointer-events-none">
                {/* Mockup Facture */}
                <div className="w-[240px] h-[300px] bg-neutral-100 rounded-xl shadow-[0_0_50px_rgba(249,115,22,0.15)] p-5 flex flex-col relative transform scale-[0.45] sm:scale-50 origin-center">
                  {/* Tampon "PAYÉ" */}
                  <div className="absolute top-12 right-4 border-4 border-green-500 text-green-500 font-black text-xl px-2 py-1 transform rotate-12 opacity-80 rounded z-10">
                     PAYÉ
                  </div>
                  <div className="flex justify-between items-start mb-6 border-b border-neutral-300 pb-3">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center text-white font-bold text-[10px]">Z</div>
                       <span className="text-neutral-800 font-bold text-xs">Facture</span>
                    </div>
                    <div className="text-right">
                       <p className="text-neutral-500 text-[8px]">#F-2026-042</p>
                       <p className="text-neutral-800 font-bold text-[10px]">1 250 €</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex justify-between text-[9px] text-neutral-500 border-b border-neutral-200 pb-1">
                       <span>Description</span>
                       <span>Montant</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-800 font-medium">
                       <span>Peinture salon</span>
                       <span>850 €</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-800 font-medium">
                       <span>Main d'œuvre</span>
                       <span>400 €</span>
                    </div>
                  </div>
                  <div className="mt-auto p-3 bg-white rounded-lg border border-neutral-200 shadow-sm">
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
              <div className="mt-auto z-10 pointer-events-none">
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">3. Facturation en 1 clic</h3>
                <p className="text-lg sm:text-xl text-neutral-400">Transformez vos devis acceptés en factures professionnelles instantanément.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};


// Testimonial Card Component
const TestimonialCard = ({ name, role, quote, stars = 5 }: any) => (
  <SpotlightCard className="p-8">
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
    <div className="min-h-screen bg-black text-neutral-100 selection:bg-violet-500/30 overflow-x-hidden">
      {/* Aurora Background Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-violet-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-fuchsia-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vh] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[90px] animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-black/50 backdrop-blur-xl border-b border-white/10">
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
                className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
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
          <div className="mt-20 relative w-full max-w-5xl mx-auto opacity-90 hover:opacity-100 transition-opacity duration-700 z-20">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 sm:p-6 bg-black/40 rounded-xl border border-white/5">
                <div className="hidden md:flex flex-col gap-2 col-span-1 border-r border-white/10 pr-4">
                  <div className="h-8 w-3/4 bg-white/10 rounded-md mb-4 animate-pulse"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-5 h-5 rounded bg-violet-500/20"></div>
                      <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <div className="h-8 w-1/3 bg-white/10 rounded-md animate-pulse"></div>
                     <div className="h-8 w-24 bg-violet-600/40 rounded-md"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 shadow-sm">
                        <div className="h-4 w-1/2 bg-white/10 rounded mb-4"></div>
                        <div className="h-8 w-3/4 bg-white/20 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/5 shadow-sm p-4 min-h-[250px] flex flex-col">
                     <div className="h-5 w-1/4 bg-white/10 rounded mb-6"></div>
                     <div className="flex-1 border-b border-white/10 flex items-end gap-2 pb-2">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                          <div key={i} className="flex-1 bg-violet-500/60 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Horizontal Scroll Section */}
        <HorizontalScrollCarousel />

        
        {/* Metrics Banner Section */}
        <section className="py-16 bg-neutral-950 border-y border-white/5 relative overflow-hidden -mt-8 z-20">
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

        {/* Bento Box Features Section */}
        <section id="features" className="py-32 bg-black relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                Pensé pour l'artisanat moderne
              </h2>
              <p className="text-xl text-neutral-400">Tout ce dont vous avez besoin, sans la complexité.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SpotlightCard className="md:col-span-2 md:row-span-2 p-10 flex flex-col justify-between group">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20">
                    <Smartphone className="w-7 h-7 text-violet-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Mobile-First Absolu</h3>
                  <p className="text-neutral-400 text-lg leading-relaxed">
                    Créez un devis, faites-le signer et envoyez la facture directement depuis votre camion ou le chantier.
                    L'interface s'adapte parfaitement à votre téléphone.
                  </p>
                </div>
                <div className="mt-8 h-48 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-900 border border-neutral-700 overflow-hidden relative">
                   <div className="absolute right-0 top-4 w-4/5 h-full bg-black/50 border-t border-l border-neutral-700 rounded-tl-xl p-4 transform group-hover:-translate-x-4 transition-transform duration-500">
                     <div className="w-full h-4 bg-neutral-800 rounded mb-3"></div>
                     <div className="w-3/4 h-4 bg-neutral-800 rounded mb-3"></div>
                     <div className="w-1/2 h-4 bg-violet-600/50 rounded mb-3"></div>
                   </div>
                </div>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-6 border border-fuchsia-500/20">
                  <Calculator className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Calcul de marge</h3>
                <p className="text-neutral-400">Visualisez votre rentabilité en temps réel pendant la rédaction de votre devis.</p>
              </SpotlightCard>

              <SpotlightCard>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Conforme 2026</h3>
                <p className="text-neutral-400">Facturation électronique et mentions légales gérées automatiquement.</p>
              </SpotlightCard>

              <SpotlightCard className="md:col-span-3 h-64 flex flex-col justify-center items-center text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <Zap className="w-12 h-12 text-yellow-400 mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4 z-10">Vitesse foudroyante</h3>
                <p className="text-neutral-400 text-lg max-w-2xl z-10">
                  Chaque action dans Zolio est instantanée. Pas de temps de chargement, pas d'attente. 
                  Gagnez en moyenne 4h de travail administratif par semaine.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        
        {/* Testimonials Section */}
        <section className="py-32 bg-black relative">
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

        {/* Avant/Après Section */}
        <section className="py-32 bg-neutral-950 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Transformez votre manière de travailler</h2>
              <p className="text-xl text-neutral-400">Passez à la vitesse supérieure avec Zolio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
              <SpotlightCard className="border-red-900/30 bg-red-950/10">
                <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <X className="mr-3" /> Avant Zolio
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Soirées passées à rédiger des devis</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Papiers perdus et relances oubliées</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Calcul de marge approximatif</li>
                  <li className="flex items-start text-neutral-400"><X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" /> Logiciels compliqués des années 2000</li>
                </ul>
              </SpotlightCard>
              <SpotlightCard className="border-violet-500/30 bg-violet-900/10">
                <h3 className="text-2xl font-bold text-violet-400 mb-6 flex items-center">
                  <CheckCircle className="mr-3" /> Avec Zolio
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Devis réalisés sur le chantier en 3 min</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Signature immédiate sur le smartphone</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Rentabilité connue en temps réel</li>
                  <li className="flex items-start text-neutral-300"><CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0 mt-0.5" /> Interface ultra-rapide et intuitive</li>
                </ul>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-black relative">
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

        {/* Pricing Section */}
        <section id="pricing" className="py-32 bg-black relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Un tarif clair et unique</h2>
              <p className="text-xl text-neutral-400">Pour développer votre entreprise sans limites.</p>
            </div>

            <div className="max-w-lg mx-auto">
              <SpotlightCard className="p-10 border-violet-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="flex justify-between items-baseline mb-8">
                  <h3 className="text-3xl font-bold text-white">Zolio Pro</h3>
                  <div className="text-right">
                    <span className="text-5xl font-extrabold text-white">29€</span>
                    <span className="text-neutral-400"> /mois</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10">
                  {['Devis et factures illimités', 'Catalogue de prix intégré', 'Signature électronique', 'Support prioritaire 7j/7'].map((feature, idx) => (
                    <li key={idx} className="flex items-center text-neutral-300">
                      <CheckCircle className="w-5 h-5 text-violet-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a 
                  href="/sign-up?redirect_url=/dashboard"
                  className="block w-full py-4 rounded-xl bg-white text-black font-semibold text-center hover:bg-neutral-200 transition-colors"
                >
                  Démarrer l'essai (1 devis)
                </a>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black pt-20 pb-10">
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
      </div>
    </div>
  );
}
