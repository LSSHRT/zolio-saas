"use client";

import { useState, useTransition } from "react";
import { Users, FileText, CreditCard, ShieldAlert, Settings, Download, Save, Loader2, Info, Star, StarOff, Search, Ban, Trash2, Mail, ExternalLink, Activity, AlertTriangle, KeyRound, MessageSquare } from "lucide-react";
import { updateAdminSettings, toggleUserProStatus, banUser, deleteUserAccount, setSystemBanner, grantAdminRole } from "./actions";

export default function AdminClient({ 
  totalUsers, 
  totalAiDevis, 
  activeSubscriptions,
  proUsersCount,
  recentUsersCount,
  mrr,
  usersList,
  currentGeminiKey,
  currentSystemBanner
}: any) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPro, setFilterPro] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [bannerText, setBannerText] = useState(currentSystemBanner);

  const handleTogglePro = (userId: string, currentStatus: boolean) => {
    if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'révoquer' : 'donner'} le statut PRO à cet utilisateur ?`)) return;
    startTransition(async () => {
      try {
        await toggleUserProStatus(userId, !currentStatus);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleBanUser = (userId: string, currentStatus: boolean) => {
    if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'débannir' : 'bannir'} cet utilisateur ?`)) return;
    startTransition(async () => {
      try {
        await banUser(userId, !currentStatus);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm(`ATTENTION ! Voulez-vous vraiment SUPPRIMER définitivement ce compte ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      try {
        await deleteUserAccount(userId);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleToggleAdmin = (userId: string, currentStatus: boolean) => {
    if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'retirer' : 'donner'} les droits d'administrateur à cet utilisateur ?`)) return;
    startTransition(async () => {
      try {
        await grantAdminRole(userId, !currentStatus);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      const formData = new FormData(e.currentTarget);
      await updateAdminSettings(formData);
      await setSystemBanner(bannerText);
      setSaveMessage("Paramètres enregistrés avec succès !");
    } catch (err) {
      setSaveMessage("Erreur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Nom", "Email", "Date d'inscription", "Dernière Connexion", "Devis IA", "Statut PRO", "Banni", "Admin"];
    const rows = usersList.map((u: any) => {
      const email = u.emailAddresses[0]?.emailAddress || "Aucun email";
      const date = new Date(u.createdAt).toLocaleDateString("fr-FR");
      const lastLogin = u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString("fr-FR") : "Jamais";
      const aiCount = u.publicMetadata?.aiDevisCount || 0;
      const isPro = (u.publicMetadata?.stripeSubscriptionId || u.publicMetadata?.isPro) ? "OUI" : "NON";
      const isBanned = u.banned ? "OUI" : "NON";
      const isAdmin = u.publicMetadata?.isAdmin ? "OUI" : "NON";
      return `"${u.id}","${u.firstName} ${u.lastName}","${email}","${date}","${lastLogin}","${aiCount}","${isPro}","${isBanned}","${isAdmin}"`;
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `zolio_super_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = usersList.filter((u: any) => {
    const searchString = `${u.firstName} ${u.lastName} ${u.emailAddresses[0]?.emailAddress}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const isPro = u.publicMetadata?.stripeSubscriptionId || u.publicMetadata?.isPro;
    const matchesPro = filterPro ? isPro : true;
    return matchesSearch && matchesPro;
  });

  const conversionRate = totalUsers > 0 ? ((proUsersCount / totalUsers) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              👑 Super Admin Zolio
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Centre de contrôle absolu de la plateforme.
            </p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm self-start">
            <Download size={18} /> Export Sauvegarde (ZIP/CSV)
          </button>
        </header>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Statistiques & Croissance", icon: Activity },
            { id: "users", label: "Gestion Utilisateurs", icon: Users },
            { id: "security", label: "Sécurité & Logs", icon: ShieldAlert },
            { id: "settings", label: "Paramètres Globaux", icon: Settings },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Utilisateurs</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
                <p className="text-xs text-green-600 mt-2">+{recentUsersCount} ce mois-ci</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center"><Star size={20} /></div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Abonnés PRO</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{proUsersCount}</p>
                <p className="text-xs text-purple-600 mt-2">{conversionRate}% de conversion</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><CreditCard size={20} /></div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenus MRR</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{mrr} €<span className="text-lg text-slate-400 font-normal">/mois</span></p>
                <p className="text-xs text-emerald-600 mt-2">~ {mrr * 12} € ARR</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center"><FileText size={20} /></div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Devis générés (IA)</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAiDevis}</p>
                <p className="text-xs text-amber-600 mt-2">Sur toute la plateforme</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[300px] flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>Graphique d'évolution des inscriptions en cours de collecte...</p>
                <p className="text-sm mt-2">Les données historiques seront affichées ici prochainement.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Users */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher un utilisateur (nom, email)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input 
                  type="checkbox" 
                  checked={filterPro}
                  onChange={(e) => setFilterPro(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                />
                Afficher uniquement les PRO
              </label>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 font-semibold">Utilisateur</th>
                      <th className="p-4 font-semibold">Inscription</th>
                      <th className="p-4 font-semibold text-center">Devis IA</th>
                      <th className="p-4 font-semibold text-center">Statut</th>
                      <th className="p-4 font-semibold text-right">Actions rapides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u: any) => {
                        const isPro = u.publicMetadata?.stripeSubscriptionId || u.publicMetadata?.isPro;
                        const isAdmin = u.publicMetadata?.isAdmin;
                        return (
                          <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${u.banned ? 'opacity-50' : ''}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(u)}>
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                                  {u.imageUrl ? <img src={u.imageUrl} alt="Avatar" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 m-2.5 text-slate-400" />}
                                  {u.banned && <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center"><Ban size={16} className="text-white" /></div>}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    {u.firstName} {u.lastName}
                                    {isAdmin && <span title="Admin"><ShieldAlert size={14} className="text-blue-500" /></span>}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">{u.emailAddresses[0]?.emailAddress}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                              {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium text-sm">
                                {u.publicMetadata?.aiDevisCount || 0}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {isPro ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                                  <Star size={12} fill="currentColor" /> PRO
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                  Gratuit
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedUser(u)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Fiche détaillée"
                                >
                                  <Info size={18} />
                                </button>
                                <button 
                                  onClick={() => handleTogglePro(u.id, !!u.publicMetadata?.isPro)}
                                  disabled={isPending}
                                  className={`p-2 rounded-lg transition-colors ${u.publicMetadata?.isPro ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                                  title={u.publicMetadata?.isPro ? "Révoquer le PRO manuel" : "Donner le PRO manuel"}
                                >
                                  {u.publicMetadata?.isPro ? <StarOff size={18} /> : <Star size={18} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> Historique d'activité & Logs d'audit
              </h2>
              <div className="space-y-3">
                {[
                  { time: "Aujourd'hui, 10:42", msg: "Export de sauvegarde effectué par l'Admin." },
                  { time: "Aujourd'hui, 09:15", msg: "Abonnement Stripe souscrit par jean.dupont@email.com" },
                  { time: "Hier, 16:30", msg: "Clé API Gemini mise à jour." }
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 text-sm">
                    <span className="text-slate-400 whitespace-nowrap">{log.time}</span>
                    <span className="text-slate-700 dark:text-slate-300">{log.msg}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Le système d'historique complet est en cours d'indexation.</p>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl">
            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 md:p-8 space-y-8">
                
                {/* Configuration IA */}
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="text-amber-500" size={24} /> Configuration Intelligence Artificielle
                  </h2>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-5">
                    <p className="text-sm text-amber-800 dark:text-amber-400">
                      L'application utilise actuellement la clé définie dans Vercel (GEMINI_API_KEY). 
                      Vous pouvez la surcharger ici sans avoir à redéployer le site.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Clé API Gemini (Google AI Studio)
                    </label>
                    <input 
                      type="password"
                      name="geminiKey"
                      defaultValue={currentGeminiKey}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Quota IA mensuel (Par défaut: Illimité)
                    </label>
                    <input 
                      type="number"
                      placeholder="Ex: 100"
                      className="w-full md:w-1/3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white opacity-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </section>

                <hr className="border-slate-200 dark:border-slate-800" />

                {/* Communication */}
                <section>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="text-blue-500" size={24} /> Communication Globale
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bannière d'information système
                    </label>
                    <textarea 
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Ex: Maintenance prévue ce soir à 23h..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
                    />
                    <p className="text-xs text-slate-500 mt-2">Ce texte s'affichera en haut du tableau de bord de tous les artisans connectés.</p>
                  </div>
                </section>

              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className={`text-sm font-medium ${saveMessage.includes('Erreur') ? 'text-red-500' : 'text-emerald-600'}`}>
                  {saveMessage}
                </p>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <img src={selectedUser.imageUrl || ""} alt="" className="w-16 h-16 rounded-2xl bg-slate-100 object-cover" />
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-slate-500">{selectedUser.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 text-slate-500">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-1">ID Unique</p>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{selectedUser.id}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-1">Dernière Connexion</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedUser.lastSignInAt ? new Date(selectedUser.lastSignInAt).toLocaleString("fr-FR") : "Inconnue"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-1">Code de Parrainage</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedUser.publicMetadata?.parrainCode || "Aucun parrain"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-1">Abonnement</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedUser.publicMetadata?.stripeSubscriptionId ? "Stripe Actif" : (selectedUser.publicMetadata?.isPro ? "Manuel PRO" : "Gratuit")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => alert("La connexion 'En tant que' nécessite une configuration Clerk spécifique (Impersonation). Cette fonction est en mode démo.")}
                  className="flex-1 flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 py-3 rounded-xl font-medium transition-colors"
                >
                  <ExternalLink size={18} /> Se connecter en tant que...
                </button>
                <button 
                  onClick={() => alert("Un email de réinitialisation sera envoyé. (Démo)")}
                  className="flex-1 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 py-3 rounded-xl font-medium transition-colors"
                >
                  <KeyRound size={18} /> Reset Mot de Passe
                </button>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">Actions Critiques (Danger)</h4>
                
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">Droits Administrateur</p>
                    <p className="text-xs text-slate-500">Donne accès à ce tableau de bord.</p>
                  </div>
                  <button 
                    disabled={isPending}
                    onClick={() => handleToggleAdmin(selectedUser.id, !!selectedUser.publicMetadata?.isAdmin)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedUser.publicMetadata?.isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {selectedUser.publicMetadata?.isAdmin ? "Retirer" : "Donner l'accès"}
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Ban size={16} /> Bannissement</p>
                    <p className="text-xs text-slate-500">Empêche l'utilisateur de se connecter.</p>
                  </div>
                  <button 
                    disabled={isPending}
                    onClick={() => handleBanUser(selectedUser.id, !!selectedUser.banned)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedUser.banned ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}
                  >
                    {selectedUser.banned ? "Débannir" : "Bannir"}
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2"><Trash2 size={16} /> Suppression</p>
                    <p className="text-xs text-red-500">Supprime le compte définitivement.</p>
                  </div>
                  <button 
                    disabled={isPending}
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
