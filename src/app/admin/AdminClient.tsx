"use client";

import { useState, useTransition } from "react";
import { Users, FileText, CreditCard, ShieldAlert, Settings, Download, Save, Loader2, Info, Star, StarOff } from "lucide-react";
import { updateAdminSettings, toggleUserProStatus } from "./actions";

export default function AdminClient({ 
  totalUsers, 
  totalAiDevis, 
  activeSubscriptions, 
  usersList,
  currentGeminiKey
}: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleTogglePro = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserProStatus(userId, !currentStatus);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const exportCSV = () => {
    const headers = ["Nom", "Email", "Date d'inscription", "Devis IA", "Statut"];
    const rows = usersList.map((u: any) => {
      const email = u.emailAddresses[0]?.emailAddress || "Aucun email";
      const date = new Date(u.createdAt).toLocaleDateString("fr-FR");
      const aiCount = u.publicMetadata?.aiDevisCount || 0;
      const isPro = (u.publicMetadata?.stripeSubscriptionId || u.publicMetadata?.isPro) ? "PRO" : "Gratuit";
      return `"${u.firstName} ${u.lastName}","${email}","${date}","${aiCount}","${isPro}"`;
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `zolio_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      const formData = new FormData(e.currentTarget);
      await updateAdminSettings(formData);
      setSaveMessage("Paramètres enregistrés avec succès !");
    } catch (err) {
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            👑 Tableau de Bord Administrateur
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gérez votre plateforme SaaS Zolio en toute simplicité.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === "overview" ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === "users" ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Utilisateurs
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === "settings" ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            Paramètres
          </button>
        </div>

        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Artisans Inscrits</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Devis générés par IA</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAiDevis}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                <CreditCard size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Abonnements Pro</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeSubscriptions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                Liste des Utilisateurs
              </h2>
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} /> Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <th className="p-4">Artisan / Email</th>
                    <th className="p-4">Inscription</th>
                    <th className="p-4 text-center">Devis IA</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {usersList.map((u: any) => {
                    const email = u.emailAddresses[0]?.emailAddress || "Aucun email";
                    const date = new Date(u.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' });
                    const aiCount = (u.publicMetadata?.aiDevisCount as number) || 0;
                    const isPro = (u.publicMetadata?.stripeSubscriptionId || u.publicMetadata?.isPro) ? true : false;
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{email}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{date}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold text-sm">
                            {aiCount}
                          </span>
                        </td>
                        <td className="p-4">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <CreditCard size={14} /> PRO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Gratuit
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleTogglePro(u.id, isPro)}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isPro 
                                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40" 
                                : "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40"
                            } disabled:opacity-50`}
                          >
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : (isPro ? <StarOff size={14} /> : <Star size={14} />)}
                            {isPro ? "Révoquer PRO" : "Donner PRO"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Aucun artisan inscrit pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Settings size={20} className="text-slate-500" />
              Paramètres Globaux
            </h2>
            
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Clé d'API Gemini (Intelligence Artificielle)
                </label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="password" 
                    name="geminiKey"
                    defaultValue={currentGeminiKey || ""}
                    placeholder="Laissez vide pour utiliser la clé par défaut de Vercel"
                    className="flex-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>Cette clé remplacera la variable d'environnement GEMINI_API_KEY. Utile si vous souhaitez changer de compte Google sans avoir à redéployer le site sur Vercel.</span>
                </p>
              </div>

              {saveMessage && (
                <div className={`p-4 rounded-xl text-sm font-medium ${saveMessage.includes("Erreur") ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                  {saveMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer les paramètres
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
