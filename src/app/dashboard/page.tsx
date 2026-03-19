"use client";

import { Bell, Home, FileText, Users, Settings, Plus, User, Briefcase, FileCheck, Package, Clock, Sun, Moon, CloudSun, StickyNote, Receipt, Pencil, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { CallBackProps, STATUS, Step } from "react-joyride";
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
const DashboardChart = dynamic(() => import("@/components/DashboardChart"), { ssr: false });
import useSWR from "swr";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function parseDevisDate(dateStr?: string): Date {
  if (dateStr && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
  } else if (dateStr) {
    return new Date(dateStr);
  }
  return new Date();
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { data, isLoading } = useSWR('/api/devis', fetcher, { revalidateOnFocus: false, keepPreviousData: true });
  const { data: adminViewerData } = useSWR(isLoaded ? "/api/admin/me" : null, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  const devis = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const loading = isLoading && !data;
  const canAccessAdminDashboard =
    user?.publicMetadata?.isAdmin === true || adminViewerData?.isAdmin === true;

  const objectifMensuel = Number(user?.unsafeMetadata?.objectifMensuel);
  const objectifInitial = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : 5000;
  const [objectif, setObjectif] = useState(objectifInitial);
  const objectifActif = Number.isFinite(objectifMensuel) && objectifMensuel > 0 ? objectifMensuel : objectif;

  const handleUpdateObjectif = async () => {
    const newVal = prompt("Entrez votre nouvel objectif mensuel (en €) :", objectifActif.toString());
    const parsed = Number(newVal);
    if (newVal && !isNaN(parsed) && parsed > 0) {
      setObjectif(parsed);
      try {
        if (user) {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              objectifMensuel: parsed
            }
          });
        }
      } catch {
        alert("Erreur lors de la sauvegarde de l'objectif.");
      }
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [runTour, setRunTour] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("zolio_has_seen_tour");
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      localStorage.setItem('zolio_has_seen_tour', 'true');
      setRunTour(false);
    }
  };

  const steps: Step[] = [
    {
      target: '.tour-dashboard',
      title: 'Bienvenue sur Zolio ! 👋',
      content: 'Voici votre tableau de bord. Il vous permet de suivre votre chiffre d\'affaires et vos derniers devis d\'un seul coup d\'œil.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-parametres',
      title: 'Personnalisez vos documents ⚙️',
      content: 'N\'oubliez pas de remplir les informations de votre entreprise (logo, SIRET, couleurs) pour que vos devis soient à votre image.',
      placement: 'left',
    },
    {
      target: '.tour-nouveau-devis',
      title: 'Votre premier devis 📝',
      content: 'C\'est ici que la magie opère ! Cliquez ici pour créer un devis professionnel en quelques secondes.',
      placement: 'bottom',
    },
    {
      target: '.tour-clients',
      title: 'Gérez vos clients 👥',
      content: 'Retrouvez tout l\'historique de vos clients et ajoutez-en de nouveaux pour aller plus vite la prochaine fois.',
      placement: 'top',
    },
    {
      target: '.tour-catalogue',
      title: 'Votre catalogue 📚',
      content: 'Enregistrez vos prestations et matériaux habituels ici. Vous n\'aurez plus qu\'à les sélectionner lors de la création d\'un devis !',
      placement: 'top',
    }
  ];


  // Calculs dynamiques
  const CA_HT = useMemo(() => devis.reduce((sum, d) => sum + (parseFloat(d.totalHT) || 0), 0), [devis]);
  const CA_TTC = useMemo(() => devis.reduce((sum, d) => sum + (parseFloat(d.totalTTC) || 0), 0), [devis]);
  const devisRecents = useMemo(() => devis.slice(0, 3), [devis]);


  
  // Dynamic greeting
  const [currentHour] = useState(() => new Date().getHours());

  let greetingText: string;
  let WeatherIcon;
  if (currentHour >= 18) {
    greetingText = "Bonsoir";
    WeatherIcon = Moon;
  } else if (currentHour >= 12) {
    greetingText = "Bon après-midi";
    WeatherIcon = Sun;
  } else {
    greetingText = "Bonjour";
    WeatherIcon = CloudSun;
  }

  const [todayMs] = useState(() => Date.now());

  const devisARelancer = useMemo(() => devis.filter(d => {
    if (d.statut === "Accepté" || d.statut === "Refusé") return false;
    const dateObj = parseDevisDate(d.date);
    const diffTime = Math.abs(todayMs - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  }).slice(0, 3), [devis, todayMs]);

  return (
    <div className="tour-dashboard flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-violet-400/12 to-fuchsia-400/8 dark:from-violet-500/20 dark:to-fuchsia-600/10 blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-fuchsia-400/8 to-orange-400/6 dark:from-fuchsia-600/15 dark:to-orange-500/5 blur-[100px] -z-10 pointer-events-none"></div>
      
      
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#7c3aed',
            zIndex: 1000,
          },
        }}
        locale={{
          back: 'Précédent',
          close: 'Fermer',
          last: 'Terminer',
          next: 'Suivant',
          skip: 'Passer',
        }}
      />
      {/* Header */}

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0c0a1d]/80 border-b border-violet-100/50 dark:border-violet-500/10 flex items-center justify-between p-6 pt-12 sm:pt-10 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-sm">
            <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gradient-zolio">Zolio</span>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <ThemeToggle />
          {canAccessAdminDashboard && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/90 px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100 dark:hover:bg-violet-500/15"
              aria-label="Accéder au dashboard administrateur"
            >
              <ShieldCheck size={18} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <Link href="/parametres" className="tour-parametres text-slate-400 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition" aria-label="Paramètres">
            <Settings size={24} />
          </Link>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-400 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition"
            aria-label="Notifications"
          >
            <Bell size={24} />
            {devisARelancer.length > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-gradient-to-r from-fuchsia-500 to-orange-400 border-2 border-white dark:border-[#0c0a1d] rounded-full animate-pulse" />
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 glass dark:bg-[#0c0a1d]/90 shadow-brand-lg rounded-2xl p-4 z-50 origin-top-right">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <span className="text-xs text-brand-violet font-medium cursor-pointer hover:underline">Tout marquer comme lu</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Exemple de notification */}
                <div className="flex gap-3 p-2 hover:bg-slate-50 dark:bg-slate-800 rounded-xl transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-violet text-xs font-bold">Z</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Bienvenue sur Zolio !</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Créez votre premier devis dès maintenant.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-2 hover:bg-slate-50 dark:bg-slate-800 rounded-xl transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-fuchsia text-xs font-bold">✨</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Nouveauté</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Le design s&apos;adapte maintenant à vos écrans.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/30 overflow-hidden border-2 border-violet-200/50 dark:border-violet-500/20 shadow-sm flex items-center justify-center text-violet-500 dark:text-violet-400">
            {isLoaded ? <UserButton /> : <User size={20} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 flex flex-col gap-8">
        
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <WeatherIcon size={22} className="text-brand-fuchsia" />
                {greetingText}{user?.firstName ? `, ${user.firstName}` : ''} 👋
                {user?.publicMetadata?.isPro === true && (
                  <span className="bg-gradient-zolio text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-brand ml-1">
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Voici un résumé de votre activité.</p>
            </div>
            {user?.publicMetadata?.isPro === true && (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch { }
                }}
                className="text-xs text-brand-violet font-medium hover:underline bg-violet-50 dark:bg-violet-500/10 px-3 py-2 rounded-xl transition"
              >
                Gérer l&apos;abonnement
              </button>
            )}
          </div>

        </motion.div>

        {/* Action Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex gap-4"
        >
          {/* Create CTA */}
          <Link href="/nouveau-devis" className="tour-nouveau-devis flex-1 block">
            <motion.div 
              whileTap={{ scale: 0.96 }}
              className="rounded-[1.5rem] p-5 cursor-pointer bg-gradient-zolio text-white shadow-brand-lg flex flex-col justify-between aspect-square"
            >
              <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30">
                <Plus size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight mb-1">Nouveau<br/>Devis</h2>
                {user?.publicMetadata?.isPro === true ? (
                  <p className="text-white/70 text-xs">Création rapide ⚡️</p>
                ) : (
                  <p className="text-white/90 text-[10px] font-medium bg-white dark:bg-slate-900/20 inline-block px-2 py-0.5 rounded-full mt-1">
                    {loading || !isLoaded ? "Chargement..." : `Essai : ${Math.min(devis.length, 1)}/1`}
                  </p>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Quick Stats Grid */}
          <div className="flex-1 flex flex-col gap-4">
            <Link href="/clients" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full glass-card dark:bg-violet-900/10 rounded-[1.5rem] p-4 flex flex-col justify-center shadow-sm cursor-pointer hover:shadow-brand transition-all duration-300">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-1">
                  <Users size={16} className="text-brand-violet" />
                  <span className="text-xs font-semibold">Clients</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Voir →</p>
              </motion.div>
            </Link>
            
            <Link href="/catalogue" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full glass-card dark:bg-violet-900/10 rounded-[1.5rem] p-4 flex flex-col justify-center shadow-sm cursor-pointer hover:shadow-brand transition-all duration-300">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-1">
                  <Package size={16} className="text-brand-fuchsia" />
                  <span className="text-xs font-semibold">Catalogue</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Voir →</p>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Liens Rapides */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <Link href="/devis" className="flex-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="glass-card dark:bg-violet-900/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-white dark:hover:bg-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand h-full">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-brand-violet flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Devis</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Voir les devis émis</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/factures" className="flex-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="glass-card dark:bg-violet-900/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-white dark:hover:bg-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand h-full">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Factures</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gérer les factures</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/calepin" className="col-span-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="glass-card dark:bg-violet-900/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-white dark:hover:bg-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand h-full">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-brand-orange flex items-center justify-center">
                <StickyNote size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Calepin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notes chantier</p>
              </div>
            </motion.div>
          </Link>
          
          <Link href="/depenses" className="col-span-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="glass-card dark:bg-violet-900/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-white dark:hover:bg-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand h-full">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-brand-rose flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Dépenses</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Achats & Frais</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/planning" className="col-span-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="glass-card dark:bg-violet-900/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-white dark:hover:bg-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand h-full">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Planning</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chantiers prévus</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Banner Stats Rapides */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 dark:from-[#1a0d3a] dark:via-[#2d1052] dark:to-[#1a0d3a] rounded-[1.5rem] p-6 text-white shadow-brand-lg relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute right-12 -bottom-10 w-24 h-24 bg-fuchsia-300/20 rounded-full blur-xl"></div>
          <div className="absolute left-[-5%] top-[40%] w-20 h-20 bg-orange-400/15 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <p className="text-violet-100 text-sm font-medium mb-1">Chiffre d&apos;Affaires Global</p>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(CA_TTC)}
            </h2>
            
            {/* Gamification Objectif */}
            <div className="mb-5 bg-white/90 rounded-xl p-3 backdrop-blur-sm border border-white/20 dark:bg-white/5 dark:border-white/10 dark:text-white">
              <div className="flex justify-between items-center text-xs font-medium mb-2">
                <span>Objectif ({objectifActif.toLocaleString("fr-FR")}€) <button onClick={handleUpdateObjectif} className="ml-2 hover:text-white transition" aria-label="Modifier l'objectif"><Pencil size={12} /></button></span>
                <span>{Math.min((CA_TTC / objectifActif) * 100, 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-white to-white/80 rounded-full h-2.5 transition-all duration-1000 shadow-[0_0_12px_rgba(255,255,255,0.6)] dark:from-fuchsia-400 dark:to-orange-400 dark:shadow-[0_0_12px_rgba(217,70,239,0.6)]" style={{ width: `${Math.min((CA_TTC / objectifActif) * 100, 100)}%` }}></div>
              </div>
              <p className="text-[10px] text-violet-200 mt-1.5 text-right">
                {CA_TTC >= objectifActif ? '🎉 Objectif atteint !' : `Encore ${(objectifActif - CA_TTC).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€ pour l'atteindre`}
              </p>
            </div>
            
            <div className="flex gap-6 border-t border-white/20 pt-4">
              <div>
                <p className="text-violet-100 text-xs mb-0.5">Devis total</p>
                <p className="font-semibold">{devis.length}</p>
              </div>
              <div>
                <p className="text-violet-100 text-xs mb-0.5">Devis acceptés</p>
                <p className="font-semibold">{devis.filter(d => d.statut === 'Accepté').length}</p>
              </div>
              <div>
                <p className="text-violet-100 text-xs mb-0.5">En attente</p>
                <p className="font-semibold">{devis.filter(d => d.statut === 'En attente' || d.statut === 'En attente (Modifié)').length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Charts / Income Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass-card dark:bg-[#0c0a1d]/80 rounded-[1.5rem] shadow-sm p-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-900 dark:text-white text-sm font-bold">Suivi du Chiffre d&apos;Affaires</h3>
            <div className="bg-violet-50 dark:bg-violet-500/10 text-brand-violet dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <FileText size={12} /> {devis.length} Devis
            </div>
          </div>

          {/* Montants par statut */}
          {(() => {
            const isEnAttente = (s: string) => s === "En attente" || s === "En attente (Modifié)";
            const CA_Valide_HT = devis.filter(d => d.statut === "Accepté").reduce((sum, d) => sum + (parseFloat(d.totalHT) || 0), 0);
            const CA_Attente_HT = devis.filter(d => isEnAttente(d.statut)).reduce((sum, d) => sum + (parseFloat(d.totalHT) || 0), 0);
            const CA_Valide_TTC = devis.filter(d => d.statut === "Accepté").reduce((sum, d) => sum + (parseFloat(d.totalTTC) || 0), 0);
            const CA_Attente_TTC = devis.filter(d => isEnAttente(d.statut)).reduce((sum, d) => sum + (parseFloat(d.totalTTC) || 0), 0);
            const total = CA_Valide_HT + CA_Attente_HT;
            const pctValide = total > 0 ? (CA_Valide_HT / total) * 100 : 0;
            const pctAttente = total > 0 ? (CA_Attente_HT / total) * 100 : 0;
            const nbValide = devis.filter(d => d.statut === "Accepté").length;
            const nbAttente = devis.filter(d => isEnAttente(d.statut)).length;

            // Préparation des données pour le graphique mensuel
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
            const monthlyData = Array.from({ length: 6 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - (5 - i));
              return { 
                name: monthNames[d.getMonth()], 
                month: d.getMonth(),
                year: d.getFullYear(),
                CA: 0,
              };
            });

            devis.forEach(d => {
              if (d.statut === "Accepté") {
                const dateObj = parseDevisDate(d.date);
                const m = dateObj.getMonth();
                const y = dateObj.getFullYear();
                const targetMonth = monthlyData.find(md => md.month === m && md.year === y);
                if (targetMonth) {
                  targetMonth.CA += (parseFloat(d.totalHT) || 0);
                }
              }
            });

            return (
              <>
                {/* Deux cartes côte à côte */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/15 dark:text-white">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">CA Validé</span>
                      <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-auto">{nbValide} devis</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {loading ? "..." : `${CA_Valide_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                    <p className="text-xs text-emerald-500 dark:text-emerald-400">
                      TTC : {loading ? "..." : `${CA_Valide_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-500/15 dark:text-white">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">En Attente</span>
                      <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">{nbAttente} devis</span>
                    </div>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {loading ? "..." : `${CA_Attente_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-400">
                      TTC : {loading ? "..." : `${CA_Attente_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                </div>

                {/* Graphique de l'évolution du CA (6 derniers mois) */}
                <div className="mb-4 h-48 w-full">
                  {loading ? (
                     <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Chargement du graphique...</div>
                  ) : (
                    <DashboardChart monthlyData={monthlyData} />
                  )}
                </div>

                {/* Barre de progression (Répartition Validé / Attente) */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Répartition du CA HT (Global)</span>
                    <span>{CA_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ total</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-violet-900/20 rounded-full overflow-hidden flex">
                    {pctValide > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctValide}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full"
                      />
                    )}
                    {pctAttente > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctAttente}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-amber-300 to-amber-400"
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{pctValide.toFixed(0)}% validé</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{pctAttente.toFixed(0)}% en attente</span>
                  </div>
                </div>

                {/* Total global */}
                <div className="bg-slate-50/80 dark:bg-violet-900/10 rounded-xl p-3 border border-slate-100 dark:border-violet-500/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">CA Total HT</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {loading ? "..." : `${CA_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">CA Total TTC</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {loading ? "..." : `${CA_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Relances Clients */}
        {devisARelancer.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              À relancer
            </h3>
            <div className="flex flex-col gap-3">
              {devisARelancer.map((d, i) => (
                <Link href={`/devis/${d.numero}`} key={i}>
                  <div className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 hover:bg-rose-100 transition cursor-pointer dark:bg-rose-900/10 dark:border-rose-500/15 dark:text-white">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.nomClient}</p>
                      <p className="text-xs text-rose-600">En attente depuis plus de 7 jours</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 shrink-0 text-sm">
                        {d.totalTTC}€
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const subject = encodeURIComponent(`Relance : Devis #${d.numero}`);
                          const body = encodeURIComponent(`Bonjour ${d.nomClient},\n\nSauf erreur de notre part, nous n'avons pas eu de retour concernant le devis #${d.numero} d'un montant de ${d.totalTTC}€.\n\nRestant à votre disposition pour toute question.\n\nCordialement,`);
                          window.location.href = `mailto:${d.emailClient || ''}?subject=${subject}&body=${body}`;
                        }}
                        className="bg-rose-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-rose-700 transition"
                      >
                        Relancer
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Recent Activity */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Activité Récente</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-4 rounded-2xl border border-violet-100/50 dark:border-violet-500/10 bg-white/60 dark:bg-violet-900/10 shadow-sm animate-shimmer">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-800/30 flex-shrink-0"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-violet-100 dark:bg-violet-800/30 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-violet-50 dark:bg-violet-800/20 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : devisRecents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-violet-50/50 dark:bg-violet-900/10 rounded-3xl border border-dashed border-violet-200 dark:border-violet-500/20">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Votre tableau de bord est bien calme...</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-[250px]">Et si on créait votre premier devis pour impressionner votre client ?</p>
              <Link href="/nouveau-devis">
                <button className="bg-gradient-zolio hover:opacity-90 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-brand transition-all hover:scale-105">
                  Créer mon premier devis
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devisRecents.map((d, i) => (
                <Link href={`/devis/${d.numero}`} key={i}>
                  <div className="flex items-center gap-4 bg-slate-50/80 dark:bg-violet-900/10 p-4 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-brand-violet flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.nomClient}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{d.numero} • {d.date}</p>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 shrink-0 text-sm">
                      {d.totalTTC}€
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0c0a1d]/90 backdrop-blur-xl border-t border-violet-100/50 dark:border-violet-500/10 px-6 py-4 flex justify-between items-center z-10 sm:rounded-b-[3rem]">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-brand-violet relative">
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">Accueil</span>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-zolio rounded-full"></span>
        </Link>
        
        <Link href="/devis" className="flex flex-col items-center gap-1 text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400 transition">
          <FileText size={24} />
          <span className="text-[10px] font-medium">Devis</span>
        </Link>
        
        <Link href="/clients" className="tour-clients flex flex-col items-center gap-1 text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400 transition">
          <Users size={24} />
          <span className="text-[10px] font-medium">Clients</span>
        </Link>
        
        <Link href="/catalogue" className="tour-catalogue flex flex-col items-center gap-1 text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400 transition">
          <Briefcase size={24} />
          <span className="text-[10px] font-medium">Catalogue</span>
        </Link>
        
        <Link href="/abonnement" className="flex flex-col items-center gap-1 text-slate-400 hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400 transition">
          <Settings size={24} />
          <span className="text-[10px] font-medium">Pro</span>
        </Link>
      </nav>

    </div>
  );
}
