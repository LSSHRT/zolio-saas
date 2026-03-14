"use client";
import React, { useState } from 'react';
import { Users, CreditCard, Activity, Settings, Search, ShieldAlert, Trash2, Shield, Download, FileText, BarChart3, Map, Mail, Zap, BookOpen, Server, HelpCircle, MessageSquare, Power, Lock } from "lucide-react";

export default function AdminClient({ initialUsers = [], stats = {}, logs = [], systemBanner, currentGeminiKey }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPro, setFilterPro] = useState(false);

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPro = filterPro ? user.isPro : true;
    return matchesSearch && matchesPro;
  });

  const renderTabNav = () => (
    <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
      <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Activity className="w-4 h-4 inline-block mr-2" /> Vue d'ensemble
      </button>
      <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Users className="w-4 h-4 inline-block mr-2" /> Utilisateurs
      </button>
      <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <BarChart3 className="w-4 h-4 inline-block mr-2" /> Analytique
      </button>
      <button onClick={() => setActiveTab('behavior')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'behavior' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Map className="w-4 h-4 inline-block mr-2" /> Comportement
      </button>
      <button onClick={() => setActiveTab('marketing')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'marketing' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Mail className="w-4 h-4 inline-block mr-2" /> Marketing
      </button>
      <button onClick={() => setActiveTab('automations')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'automations' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Zap className="w-4 h-4 inline-block mr-2" /> Automatisations
      </button>
      <button onClick={() => setActiveTab('cms')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cms' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <BookOpen className="w-4 h-4 inline-block mr-2" /> CMS & Contenu
      </button>
      <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'support' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <HelpCircle className="w-4 h-4 inline-block mr-2" /> Support
      </button>
      <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Server className="w-4 h-4 inline-block mr-2" /> Système & Logs
      </button>
      <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        <Settings className="w-4 h-4 inline-block mr-2" /> Paramètres
      </button>
    </div>
  );

  const CardWrapper = ({ children, className = "" }: any) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>{children}</div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-600" />
            Super Admin Zolio
          </h1>
          <p className="text-slate-500 mt-2">Centre de contrôle global de la plateforme SaaS.</p>
        </div>
        <div className="flex gap-4">
           <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center">
             <Activity className="w-4 h-4 mr-2" /> Système Opérationnel
           </span>
        </div>
      </div>

      {renderTabNav()}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <CardWrapper className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Total Artisans</p>
                    <h3 className="text-4xl font-bold">{stats.totalUsers}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
                </div>
              </div>
            </CardWrapper>
            <CardWrapper>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Abonnements PRO</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.proUsers}</h3>
                    <p className="text-xs text-green-600 mt-1">Taux de conv: {Math.round((stats.proUsers/Math.max(stats.totalUsers,1))*100)}%</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><CreditCard className="w-6 h-6" /></div>
                </div>
              </div>
            </CardWrapper>
            <CardWrapper>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">MRR Estimé</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.mrr || (stats.proUsers * 29) || 0} €</h3>
                    <p className="text-xs text-slate-400 mt-1">Revenu Mensuel</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Activity className="w-6 h-6" /></div>
                </div>
              </div>
            </CardWrapper>
            <CardWrapper>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Devis IA Générés</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalAIGenerations}</h3>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><FileText className="w-6 h-6" /></div>
                </div>
              </div>
            </CardWrapper>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <CardWrapper>
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="font-bold text-lg">Dernières Inscriptions</h3>
               </div>
               <div className="p-6">
                 <div className="space-y-4">
                   {users.slice(0, 5).map((user: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                           {user.name?.[0] || 'U'}
                         </div>
                         <div>
                           <p className="font-medium text-slate-900 dark:text-white">{user.name || 'Utilisateur Anonyme'}</p>
                           <p className="text-xs text-slate-500">{user.email}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <span className={`text-xs px-2 py-1 rounded-full ${user.isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                           {user.isPro ? 'PRO' : 'Gratuit'}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </CardWrapper>

             <CardWrapper>
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="font-bold text-lg">Activité Système</h3>
               </div>
               <div className="p-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
                      <div>
                        <p className="text-sm font-medium">Lancement Super Admin</p>
                        <p className="text-xs text-slate-500">Mise à jour v3.0 déployée avec succès.</p>
                      </div>
                      <span className="text-xs text-slate-400">À l'instant</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
                      <div>
                        <p className="text-sm font-medium">Sauvegarde automatique</p>
                        <p className="text-xs text-slate-500">Base de données synchronisée.</p>
                      </div>
                      <span className="text-xs text-slate-400">Il y a 2h</span>
                    </div>
                 </div>
               </div>
             </CardWrapper>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Gestion des Utilisateurs</h3>
              <p className="text-sm text-slate-500">Recherchez, filtrez et gérez tous les artisans inscrits.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium flex items-center">
                <Download className="w-4 h-4 mr-2" /> Exporter CSV
              </button>
            </div>
          </div>
          <div className="p-6">
             <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom ou email..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setFilterPro(!filterPro)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${filterPro ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  Pro Uniquement
                </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500">
                     <th className="pb-3 font-medium">Utilisateur</th>
                     <th className="pb-3 font-medium">Inscription</th>
                     <th className="pb-3 font-medium">Statut</th>
                     <th className="pb-3 font-medium">Devis IA</th>
                     <th className="pb-3 font-medium text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {filteredUsers.map((user: any, idx: number) => (
                     <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="py-4">
                         <div className="font-medium text-slate-900 dark:text-white">{user.name || 'Sans nom'}</div>
                         <div className="text-slate-500 text-xs">{user.email}</div>
                       </td>
                       <td className="py-4 text-slate-600 dark:text-slate-400">
                         {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                       </td>
                       <td className="py-4">
                         <span className={`text-xs px-2 py-1 rounded-full ${user.isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                           {user.isPro ? 'PRO' : 'Gratuit'}
                         </span>
                       </td>
                       <td className="py-4 text-slate-600 dark:text-slate-400">
                         {user.aiGenerations || 0}
                       </td>
                       <td className="py-4 text-right">
                         <div className="flex justify-end gap-2">
                           <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Gérer l'abonnement PRO">
                             <CreditCard className="w-4 h-4" />
                           </button>
                           <button className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Voir les détails">
                             <Settings className="w-4 h-4" />
                           </button>
                           <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Bannir ou supprimer">
                             <ShieldAlert className="w-4 h-4" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {filteredUsers.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </CardWrapper>
      )}

      {/* NEW MOCK TABS FOR THE 40 FEATURES */}
      {activeTab === 'analytics' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Analytique Financière & SaaS</h3>
            <p className="text-sm text-slate-500">Cohortes, LTV, et prévisions financières.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500">LTV (Valeur Vie Client) Moyenne</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">290 €</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500">Taux de Rétention (Mois 3)</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">85%</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500">Paiements échoués (Dunning)</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-500">0</h3>
              </div>
            </div>
            <div className="h-64 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
              Graphique d'Analyse de Cohorte (Module en cours de collecte de données)
            </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'behavior' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Comportement & Engagement</h3>
            <p className="text-sm text-slate-500">Analysez comment vos artisans utilisent Zolio.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <Map className="w-8 h-8 text-blue-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900 dark:text-white">Carte Thermique d'Activité</h4>
                <p className="text-sm text-slate-500">La majorité des connexions s'effectuent depuis la France métropolitaine, avec un pic entre 18h et 20h.</p>
              </div>
              <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <Server className="w-8 h-8 text-purple-500 mb-4" />
                <h4 className="font-bold mb-2 text-slate-900 dark:text-white">Stockage Utilisé</h4>
                <p className="text-sm text-slate-500">Moyenne : 15 Mo / utilisateur (Photos de chantier et PDFs). Espace total largement disponible.</p>
              </div>
            </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'marketing' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Marketing & Ventes</h3>
            <p className="text-sm text-slate-500">Parrainage, codes promos et communication.</p>
          </div>
          <div className="p-6">
             <div className="space-y-4">
               <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                 <div>
                   <h4 className="font-bold text-slate-900 dark:text-white">Campagnes E-mailing (Newsletter)</h4>
                   <p className="text-sm text-slate-500">Envoyez des mises à jour à tous vos utilisateurs d'un clic.</p>
                 </div>
                 <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Créer une campagne</button>
               </div>
               <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                 <div>
                   <h4 className="font-bold text-slate-900 dark:text-white">Générateur de Codes Promo</h4>
                   <p className="text-sm text-slate-500">Codes Stripe actifs : LANCEMENT50 (50% de réduction).</p>
                 </div>
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm border border-slate-200 dark:border-slate-700">Gérer les codes</button>
               </div>
               <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                 <div>
                   <h4 className="font-bold text-slate-900 dark:text-white">Arbre de Parrainage</h4>
                   <p className="text-sm text-slate-500">Visualisez qui invite qui sur la plateforme.</p>
                 </div>
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm border border-slate-200 dark:border-slate-700">Voir l'arbre</button>
               </div>
             </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'automations' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Automatisations & Webhooks (No-Code)</h3>
            <p className="text-sm text-slate-500">Configurez des règles métiers intelligentes.</p>
          </div>
          <div className="p-6">
             <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
               <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
               <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Constructeur de Règles Zolio</h3>
               <p className="text-slate-500 mb-6 max-w-md mx-auto">Connectez Zolio à Zapier ou créez des déclencheurs internes (ex: "Envoyer un SMS quand un devis de +10 000€ est signé").</p>
               <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium">Ajouter un Webhook</button>
             </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'cms' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Gestion du Contenu (CMS)</h3>
            <p className="text-sm text-slate-500">Modifiez les textes et modèles de la plateforme.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                <BookOpen className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">Éditeur de Changelog</h4>
                <p className="text-sm text-slate-500 mt-1">Publier une notification "Nouveautés" sur le dashboard des artisans.</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                <FileText className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">Modèles PDF & Mentions</h4>
                <p className="text-sm text-slate-500 mt-1">Ajouter de nouveaux designs de factures pour les utilisateurs PRO.</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                <Lock className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">Mise à jour CGV/CGU</h4>
                <p className="text-sm text-slate-500 mt-1">Forcer l'acceptation des nouvelles conditions lors de la connexion.</p>
              </div>
            </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'support' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Support Client & Communauté</h3>
            <p className="text-sm text-slate-500">Gérez les tickets et les demandes de vos utilisateurs.</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg flex items-start">
                 <MessageSquare className="w-5 h-5 text-orange-600 mt-1 mr-3 flex-shrink-0" />
                 <div>
                   <h4 className="font-bold text-orange-900 dark:text-orange-300">Ticket #102 - Problème d'impression PDF</h4>
                   <p className="text-sm text-orange-700 dark:text-orange-400/80 mt-1">"Bonjour, quand j'ai 50 lignes de prestation, la dernière ligne est un peu coupée. Merci." - Jean B.</p>
                   <div className="mt-3 flex gap-2">
                     <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-md text-orange-800 dark:text-orange-300">Répondre</button>
                     <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-md text-orange-800 dark:text-orange-300">Connecter en tant que Jean</button>
                   </div>
                 </div>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                <h4 className="font-bold mb-2 flex items-center text-slate-900 dark:text-white"><Activity className="w-4 h-4 mr-2" /> Tableau des Votes (Idées)</h4>
                <p className="text-sm text-slate-500">1. Application iPad native (45 votes)<br/>2. Synchronisation Pennylane (32 votes)</p>
              </div>
            </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'system' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Santé du Système & Logs</h3>
            <p className="text-sm text-slate-500">Supervision technique de l'infrastructure.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-sm font-medium text-slate-500">Statut Base de données</p>
                <div className="flex items-center mt-2 text-green-600 font-bold"><Activity className="w-4 h-4 mr-2" /> En ligne (24ms)</div>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-sm font-medium text-slate-500">Quotas API Gemini</p>
                <div className="flex items-center mt-2 text-blue-600 font-bold"><Activity className="w-4 h-4 mr-2" /> Normal (2% utilisés)</div>
              </div>
              <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/50 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">Mode Maintenance</p>
                <button className="mt-2 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors flex justify-center items-center">
                  <Power className="w-3 h-3 mr-1" /> Activer (Couper l'accès)
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-lg overflow-hidden h-40">
              <p>[INFO] Serveur démarré sur port 3000</p>
              <p>[INFO] Connexion Google Sheets établie</p>
              <p>[WARN] Rate limit Stripe avertissement (ignoré)</p>
              <p>[INFO] CRON Job Backup exécuté avec succès</p>
              <p className="animate-pulse">_</p>
            </div>
          </div>
        </CardWrapper>
      )}

      {activeTab === 'settings' && (
        <CardWrapper>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg">Paramètres Globaux</h3>
            <p className="text-sm text-slate-500">Configuration technique de Zolio.</p>
          </div>
          <div className="p-6">
            <form className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Bannière d'Information Système (Vue par tous)</label>
                <textarea 
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  rows={3}
                  placeholder="Ex: Maintenance prévue ce soir à 23h..."
                  defaultValue={systemBanner}
                />
                <button type="button" className="mt-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium">Déployer la bannière</button>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Clé API IA Custom (Gemini)</label>
                <input 
                  type="password"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  placeholder="Laisser vide pour utiliser celle du serveur..."
                />
                <p className="text-xs text-slate-500 mt-1">Surcharge la clé globale uniquement pour les tests administrateur.</p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                 <h4 className="font-bold mb-3 text-slate-900 dark:text-white">Marque Blanche & Customisation</h4>
                 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                   <div>
                     <p className="font-medium text-slate-900 dark:text-white">Autoriser les domaines personnalisés</p>
                     <p className="text-xs text-slate-500">Fonctionnalité Entreprise (devis.client.com)</p>
                   </div>
                   <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                 </div>
              </div>
            </form>
          </div>
        </CardWrapper>
      )}
    </div>
  );
}
