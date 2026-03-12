"use client";

import { Bell, Home, FileText, Users, Settings, Plus, User, Briefcase, FileCheck, FolderOpen, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { UserButton, useUser } from "@clerk/nextjs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ThemeToggle } from "@/components/theme-toggle";

interface Devis {
  numero: string;
  nomClient: string;
  date: string;
  totalHT: string;
  totalTTC: string;
  statut: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { data, error, isLoading } = useSWR('/api/devis', fetcher, { revalidateOnFocus: true, keepPreviousData: true });
  const devis = Array.isArray(data) ? data : [];
  const loading = isLoading && !data;

  const [showNotifications, setShowNotifications] = useState(false);

  // Calculs dynamiques
  const CA_HT = devis.reduce((sum, d) => sum + (parseFloat(d.totalHT) || 0), 0);
  const CA_TTC = devis.reduce((sum, d) => sum + (parseFloat(d.totalTTC) || 0), 0);
  const devisRecents = devis.slice(0, 3); // Les 3 derniers devis générés

  const devisARelancer = devis.filter(d => {
    if (d.statut === "Accepté" || d.statut === "Refusé") return false;
    let dateObj = new Date();
    if (d.date && d.date.includes('/')) {
       const parts = d.date.split('/');
       dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
    } else if (d.date) {
       dateObj = new Date(d.date);
    }
    const diffTime = Math.abs(Date.now() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  }).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 sm:shadow-xl sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative">
      
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-12 sm:pt-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-sm">
            <Image src="/logo.png" alt="Zolio Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Zolio</span>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <ThemeToggle />
          <Link href="/parametres" className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
            <Settings size={24} />
          </Link>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-400 hover:text-slate-600 dark:text-slate-300 transition"
          >
            <Bell size={24} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 z-50 origin-top-right">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">Tout marquer comme lu</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Exemple de notification */}
                <div className="flex gap-3 p-2 hover:bg-slate-50 dark:bg-slate-800 rounded-xl transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 text-xs font-bold">Z</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Bienvenue sur Zolio !</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Créez votre premier devis dès maintenant.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-2 hover:bg-slate-50 dark:bg-slate-800 rounded-xl transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-500 text-xs font-bold">✨</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Nouveauté</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Le design s'adapte maintenant à vos écrans.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400">
            {isLoaded ? <UserButton /> : <User size={20} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 flex flex-col gap-8">
        
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ''} 👋
            {user?.publicMetadata?.isPro === true && (
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-1">
                PRO
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez vos devis en quelques secondes.</p>
            {user?.publicMetadata?.isPro === true && (
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert(data.error || "Impossible d'ouvrir le portail d'abonnement.");
                    }
                  } catch (err) {
                    alert("Une erreur est survenue.");
                  }
                }}
                className="text-xs text-blue-600 font-medium hover:underline bg-blue-50 px-2 py-1 rounded-md"
              >
                Gérer l'abonnement
              </button>
            )}
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex gap-4">
          {/* Create CTA */}
          <Link href="/nouveau-devis" className="flex-1">
            <motion.div 
              whileTap={{ scale: 0.96 }}
              className="rounded-[1.5rem] p-5 cursor-pointer bg-gradient-zolio text-white shadow-lg shadow-purple-500/30 flex flex-col justify-between aspect-square"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-900/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                <Plus size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight mb-1">Nouveau<br/>Devis</h2>
                {user?.publicMetadata?.isPro === true ? (
                  <p className="text-white/70 text-xs">Création rapide ⚡️</p>
                ) : (
                  <p className="text-white/90 text-[10px] font-medium bg-white dark:bg-slate-900/20 inline-block px-2 py-0.5 rounded-full mt-1">
                    {loading || !isLoaded ? "Chargement..." : `Essai : ${Math.min(devis.length, 3)}/3 gratuits`}
                  </p>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Quick Stats Grid */}
          <div className="flex-1 flex flex-col gap-4">
            <Link href="/clients" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-1">
                  <Users size={16} className="text-blue-500" />
                  <span className="text-xs font-semibold">Clients</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Voir →</p>
              </motion.div>
            </Link>
            
            <Link href="/catalogue" className="flex-1">
              <motion.div whileTap={{ scale: 0.96 }} className="h-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-4 flex flex-col justify-center border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-1">
                  <Package size={16} className="text-purple-500" />
                  <span className="text-xs font-semibold">Catalogue</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">Voir →</p>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Liens Devis & Factures */}
        <div className="flex gap-4">
          <Link href="/devis" className="flex-1">
            <motion.div whileTap={{ scale: 0.97 }}
              className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition h-full">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
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
              className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition h-full">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Factures</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gérer les factures</p>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Dynamic Charts / Income Area */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-900 dark:text-white text-sm font-bold">Suivi du Chiffre d'Affaires</h3>
            <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
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
                let dateObj = new Date();
                if (d.date && d.date.includes('/')) {
                   const parts = d.date.split('/');
                   dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
                } else if (d.date) {
                   dateObj = new Date(d.date);
                }
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
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-700">CA Validé</span>
                      <span className="text-[10px] text-emerald-500 ml-auto">{nbValide} devis</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-700">
                      {loading ? "..." : `${CA_Valide_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                    <p className="text-[10px] text-emerald-500">
                      TTC : {loading ? "..." : `${CA_Valide_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-semibold text-amber-700">En Attente</span>
                      <span className="text-[10px] text-amber-500 ml-auto">{nbAttente} devis</span>
                    </div>
                    <p className="text-lg font-bold text-amber-700">
                      {loading ? "..." : `${CA_Attente_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                    <p className="text-[10px] text-amber-500">
                      TTC : {loading ? "..." : `${CA_Attente_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                </div>

                {/* Graphique de l'évolution du CA (6 derniers mois) */}
                <div className="mb-4 h-48 w-full">
                  {loading ? (
                     <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Chargement du graphique...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}€`} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) => [`${value}€`, 'CA HT']}
                        />
                        <Bar dataKey="CA" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Barre de progression (Répartition Validé / Attente) */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Répartition du CA HT (Global)</span>
                    <span>{CA_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ total</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
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
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-emerald-600 font-semibold">{pctValide.toFixed(0)}% validé</span>
                    <span className="text-amber-600 font-semibold">{pctAttente.toFixed(0)}% en attente</span>
                  </div>
                </div>

                {/* Total global */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400">CA Total HT</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {loading ? "..." : `${CA_HT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">CA Total TTC</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {loading ? "..." : `${CA_TTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€`}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

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
                  <div className="flex items-center gap-4 bg-rose-50 p-4 rounded-2xl border border-rose-100 hover:bg-rose-100 transition cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.nomClient}</p>
                      <p className="text-[10px] text-rose-600">En attente depuis plus de 7 jours</p>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 shrink-0 text-sm">
                      {d.totalTTC}€
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
            <div className="text-center py-4 text-slate-400 text-sm animate-pulse">Chargement de l'activité...</div>
          ) : devisRecents.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
              Aucun devis créé pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devisRecents.map((d, i) => (
                <Link href={`/devis/${d.numero}`} key={i}>
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl hover:bg-slate-100 dark:bg-slate-800 transition cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.nomClient}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{d.numero} • {d.date}</p>
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
      <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-10 sm:rounded-b-[3rem]">
        <Link href="/" className="flex flex-col items-center gap-1 text-blue-600">
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        
        <Link href="/devis" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
          <FileText size={24} />
          <span className="text-[10px] font-medium">Devis</span>
        </Link>
        
        <Link href="/clients" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
          <Users size={24} />
          <span className="text-[10px] font-medium">Clients</span>
        </Link>
        
        <Link href="/catalogue" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
          <Briefcase size={24} />
          <span className="text-[10px] font-medium">Catalogue</span>
        </Link>
        
        <Link href="/abonnement" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
          <Settings size={24} />
          <span className="text-[10px] font-medium">Pro</span>
        </Link>
      </nav>

    </div>
  );
}
