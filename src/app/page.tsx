"use client";

import { Bell, Home, FileText, Users, Settings, Plus, User, Briefcase, FileCheck, FolderOpen, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

interface Devis {
  numero: string;
  nomClient: string;
  date: string;
  totalHT: string;
  totalTTC: string;
  statut: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devis")
      .then((r) => r.json())
      .then((data) => {
        setDevis(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculs dynamiques
  const CA_HT = devis.reduce((sum, d) => sum + (parseFloat(d.totalHT) || 0), 0);
  const CA_TTC = devis.reduce((sum, d) => sum + (parseFloat(d.totalTTC) || 0), 0);
  const devisRecents = devis.slice(0, 3); // Les 3 derniers devis générés
  return (
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md mx-auto bg-white sm:shadow-xl sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative">
      
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-12 sm:pt-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-sm">
            <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Zolio</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative text-slate-400 hover:text-slate-600 transition">
            <Bell size={24} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-slate-500">
            {isLoaded ? <UserButton /> : <User size={20} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 flex flex-col gap-8">
        
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos devis en quelques secondes.</p>
        </div>

        {/* Action Widgets */}
        <div className="flex gap-4">
          {/* Create CTA */}
          <Link href="/nouveau-devis" className="flex-1">
            <motion.div 
              whileTap={{ scale: 0.96 }}
              className="rounded-[1.5rem] p-5 cursor-pointer bg-gradient-zolio text-white shadow-lg shadow-purple-500/30 flex flex-col justify-between aspect-square"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                <Plus size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight mb-1">Nouveau<br/>Devis</h2>
                <p className="text-white/70 text-xs">Création rapide ⚡️</p>
              </div>
            </motion.div>
          </Link>

          {/* Quick Stats Grid */}
          <div className="flex-1 flex flex-col gap-4">
            <Link href="/clients" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full bg-slate-50 rounded-[1.5rem] p-4 flex flex-col justify-center border border-slate-100 shadow-sm cursor-pointer">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Users size={16} className="text-blue-500" />
                  <span className="text-xs font-semibold">Clients</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">Voir →</p>
              </motion.div>
            </Link>
            
            <Link href="/catalogue" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full bg-slate-50 rounded-[1.5rem] p-4 flex flex-col justify-center border border-slate-100 shadow-sm cursor-pointer">
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Package size={16} className="text-purple-500" />
                  <span className="text-xs font-semibold">Catalogue</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">Voir →</p>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Lien Devis Émis */}
        <Link href="/devis">
          <motion.div whileTap={{ scale: 0.97 }}
            className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">Mes Devis Émis</p>
              <p className="text-xs text-slate-500">Consulter, modifier et renvoyer vos devis</p>
            </div>
            <span className="text-slate-400 text-lg">→</span>
          </motion.div>
        </Link>

        {/* Dynamic Charts / Income Area */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">Chiffre d'Affaires HT</h3>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "..." : `${CA_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                TTC : {loading ? "..." : `${CA_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <FileText size={12} /> {devis.length} Devis
            </div>
          </div>
          
          <div className="h-24 w-full relative flex items-end">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-blue-500/10 absolute bottom-0 left-0">
               <path d="M0 40 L0 30 Q 15 20 25 25 T 50 15 T 75 10 T 100 5 L100 40 Z" fill="currentColor" />
               <path d="M0 30 Q 15 20 25 25 T 50 15 T 75 10 T 100 5" fill="none" stroke="var(--color-primary-purple)" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>

        {/* Dynamic Recent Activity */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Activité Récente</h3>
          
          {loading ? (
            <div className="text-center py-4 text-slate-400 text-sm animate-pulse">Chargement de l'activité...</div>
          ) : devisRecents.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              Aucun devis créé pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devisRecents.map((d, i) => (
                <Link href={`/devis/${d.numero}`} key={i}>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl hover:bg-slate-100 transition cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{d.nomClient}</p>
                      <p className="text-[10px] text-slate-500">{d.numero} • {d.date}</p>
                    </div>
                    <div className="font-bold text-slate-800 shrink-0 text-sm">
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
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-10 sm:rounded-b-[3rem]">
        <Link href="/" className="flex flex-col items-center gap-1 text-blue-600">
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        
        <Link href="/devis" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
          <FileText size={24} />
          <span className="text-[10px] font-medium">Devis</span>
        </Link>
        
        <Link href="/clients" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
          <Users size={24} />
          <span className="text-[10px] font-medium">Clients</span>
        </Link>
        
        <Link href="/catalogue" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
          <Briefcase size={24} />
          <span className="text-[10px] font-medium">Catalogue</span>
        </Link>
        
        <Link href="/abonnement" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
          <Settings size={24} />
          <span className="text-[10px] font-medium">Pro</span>
        </Link>
      </nav>

    </div>
  );
}
