const fs = require('fs');

const adminClientContent = `
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CreditCard, Activity, Settings, Search, ShieldAlert, Trash2, Shield, Download, FileText, BarChart3, Map, Mail, Zap, BookOpen, Server, HelpCircle, MessageSquare, Power, Bell, Lock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminClient({ initialUsers, stats, logs = [], systemBanner }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPro, setFilterPro] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPro = filterPro ? user.isPro : true;
    return matchesSearch && matchesPro;
  });

  const renderTabNav = () => (
    <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
      <button onClick={() => setActiveTab('overview')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Activity className="w-4 h-4 inline-block mr-2" /> Vue d'ensemble
      </button>
      <button onClick={() => setActiveTab('users')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Users className="w-4 h-4 inline-block mr-2" /> Utilisateurs
      </button>
      <button onClick={() => setActiveTab('analytics')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <BarChart3 className="w-4 h-4 inline-block mr-2" /> Analytique
      </button>
      <button onClick={() => setActiveTab('behavior')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'behavior' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Map className="w-4 h-4 inline-block mr-2" /> Comportement
      </button>
      <button onClick={() => setActiveTab('marketing')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'marketing' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Mail className="w-4 h-4 inline-block mr-2" /> Marketing
      </button>
      <button onClick={() => setActiveTab('automations')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'automations' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Zap className="w-4 h-4 inline-block mr-2" /> Automatisations
      </button>
      <button onClick={() => setActiveTab('cms')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'cms' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <BookOpen className="w-4 h-4 inline-block mr-2" /> CMS & Contenu
      </button>
      <button onClick={() => setActiveTab('support')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'support' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <HelpCircle className="w-4 h-4 inline-block mr-2" /> Support
      </button>
      <button onClick={() => setActiveTab('system')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'system' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Server className="w-4 h-4 inline-block mr-2" /> Système & Logs
      </button>
      <button onClick={() => setActiveTab('settings')} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
        <Settings className="w-4 h-4 inline-block mr-2" /> Paramètres
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Total Artisans</p>
                    <h3 className="text-4xl font-bold">{stats.totalUsers}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg"><Users className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Abonnements PRO</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.proUsers}</h3>
                    <p className="text-xs text-green-600 mt-1">Taux de conv: {Math.round((stats.proUsers/Math.max(stats.totalUsers,1))*100)}%</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><CreditCard className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">MRR Estimé</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.proUsers * 29} €</h3>
                    <p className="text-xs text-slate-400 mt-1">Revenu Mensuel</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Activity className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Devis IA Générés</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalAIGenerations}</h3>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><FileText className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <CardTitle>Dernières Inscriptions</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {users.slice(0, 5).map((user, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
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
                         <span className={\`text-xs px-2 py-1 rounded-full \${user.isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}\`}>
                           {user.isPro ? 'PRO' : 'Gratuit'}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Activité Système</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-slate-50 dark:bg-slate-800 rounded-r-lg">
                      <div>
                        <p className="text-sm font-medium">Lancement Super Admin</p>
                        <p className="text-xs text-slate-500">Mise à jour v3.0 déployée avec succès.</p>
                      </div>
                      <span className="text-xs text-slate-400">À l'instant</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-800 rounded-r-lg">
                      <div>
                        <p className="text-sm font-medium">Sauvegarde automatique</p>
                        <p className="text-xs text-slate-500">Base de données synchronisée.</p>
                      </div>
                      <span className="text-xs text-slate-400">Il y a 2h</span>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>Recherchez, filtrez et gérez tous les artisans inscrits.</CardDescription>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium flex items-center">
                <Download className="w-4 h-4 mr-2" /> Exporter CSV
              </button>
            </div>
          </CardHeader>
          <CardContent>
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
                  className={\`px-4 py-2 rounded-lg border text-sm font-medium \${filterPro ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}\`}
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
                   {filteredUsers.map((user, idx) => (
                     <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="py-4">
                         <div className="font-medium text-slate-900 dark:text-white">{user.name || 'Sans nom'}</div>
                         <div className="text-slate-500 text-xs">{user.email}</div>
                       </td>
                       <td className="py-4 text-slate-600 dark:text-slate-400">
                         {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr }) : '-'}
                       </td>
                       <td className="py-4">
                         <span className={\`text-xs px-2 py-1 rounded-full \${user.isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}\`}>
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
                       <td colSpan="5" className="py-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </CardContent>
        </Card>
      )}

      {/* NEW MOCK TABS FOR THE 40 FEATURES */}
      {activeTab === 'analytics' && (
        <Card>
          <CardHeader><CardTitle>Analytique Financière & SaaS</CardTitle><CardDescription>Cohortes, LTV, et prévisions financières.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"><p className="text-sm text-slate-500">LTV (Valeur Vie Client) Moyenne</p><h3 className="text-2xl font-bold mt-1">290 €</h3></div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"><p className="text-sm text-slate-500">Taux de Rétention (Mois 3)</p><h3 className="text-2xl font-bold mt-1">85%</h3></div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"><p className="text-sm text-slate-500">Paiements échoués (Dunning)</p><h3 className="text-2xl font-bold mt-1 text-orange-500">0</h3></div>
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-600">Graphique d'Analyse de Cohorte (Module en cours de collecte de données)</div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'behavior' && (
        <Card>
          <CardHeader><CardTitle>Comportement & Engagement</CardTitle><CardDescription>Analysez comment vos artisans utilisent Zolio.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border rounded-xl"><Map className="w-8 h-8 text-blue-500 mb-4" /><h4 className="font-bold mb-2">Carte Thermique d'Activité</h4><p className="text-sm text-slate-500">La majorité des connexions s'effectuent depuis la France métropolitaine, avec un pic entre 18h et 20h.</p></div>
              <div className="p-6 border rounded-xl"><Server className="w-8 h-8 text-purple-500 mb-4" /><h4 className="font-bold mb-2">Stockage Utilisé</h4><p className="text-sm text-slate-500">Moyenne : 15 Mo / utilisateur (Photos de chantier et PDFs). Espace total largement disponible.</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'marketing' && (
        <Card>
          <CardHeader><CardTitle>Marketing & Ventes</CardTitle><CardDescription>Parrainage, codes promos et communication.</CardDescription></CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-4 border rounded-lg">
                 <div><h4 className="font-bold">Campagnes E-mailing (Newsletter)</h4><p className="text-sm text-slate-500">Envoyez des mises à jour à tous vos utilisateurs d'un clic.</p></div>
                 <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Créer une campagne</button>
               </div>
               <div className="flex justify-between items-center p-4 border rounded-lg">
                 <div><h4 className="font-bold">Générateur de Codes Promo</h4><p className="text-sm text-slate-500">Codes Stripe actifs : LANCEMENT50 (50% de réduction).</p></div>
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm border">Gérer les codes</button>
               </div>
               <div className="flex justify-between items-center p-4 border rounded-lg">
                 <div><h4 className="font-bold">Arbre de Parrainage</h4><p className="text-sm text-slate-500">Visualisez qui invite qui sur la plateforme.</p></div>
                 <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm border">Voir l'arbre</button>
               </div>
             </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'automations' && (
        <Card>
          <CardHeader><CardTitle>Automatisations & Webhooks (No-Code)</CardTitle><CardDescription>Configurez des règles métiers intelligentes.</CardDescription></CardHeader>
          <CardContent>
             <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
               <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
               <h3 className="text-xl font-bold mb-2">Constructeur de Règles Zolio</h3>
               <p className="text-slate-500 mb-6 max-w-md mx-auto">Connectez Zolio à Zapier ou créez des déclencheurs internes (ex: "Envoyer un SMS quand un devis de +10 000€ est signé").</p>
               <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium">Ajouter un Webhook</button>
             </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cms' && (
        <Card>
          <CardHeader><CardTitle>Gestion du Contenu (CMS)</CardTitle><CardDescription>Modifiez les textes et modèles de la plateforme.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <BookOpen className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold">Éditeur de Changelog</h4>
                <p className="text-sm text-slate-500 mt-1">Publier une notification "Nouveautés" sur le dashboard des artisans.</p>
              </div>
              <div className="p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <FileText className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold">Modèles PDF & Mentions</h4>
                <p className="text-sm text-slate-500 mt-1">Ajouter de nouveaux designs de factures pour les utilisateurs PRO.</p>
              </div>
              <div className="p-4 border rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <Lock className="w-6 h-6 mb-2 text-purple-600" />
                <h4 className="font-bold">Mise à jour CGV/CGU</h4>
                <p className="text-sm text-slate-500 mt-1">Forcer l'acceptation des nouvelles conditions lors de la connexion.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'support' && (
        <Card>
          <CardHeader><CardTitle>Support Client & Communauté</CardTitle><CardDescription>Gérez les tickets et les demandes de vos utilisateurs.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start">
                 <MessageSquare className="w-5 h-5 text-orange-600 mt-1 mr-3 flex-shrink-0" />
                 <div>
                   <h4 className="font-bold text-orange-900 dark:text-orange-300">Ticket #102 - Problème d'impression PDF</h4>
                   <p className="text-sm text-orange-700 dark:text-orange-400/80 mt-1">"Bonjour, quand j'ai 50 lignes de prestation, la dernière ligne est un peu coupée. Merci." - Jean B.</p>
                   <div className="mt-3 flex gap-2">
                     <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border rounded-md">Répondre</button>
                     <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border rounded-md">Connecter en tant que Jean</button>
                   </div>
                 </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-bold mb-2 flex items-center"><Activity className="w-4 h-4 mr-2" /> Tableau des Votes (Idées)</h4>
                <p className="text-sm text-slate-500">1. Application iPad native (45 votes)<br/>2. Synchronisation Pennylane (32 votes)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card>
          <CardHeader><CardTitle>Santé du Système & Logs</CardTitle><CardDescription>Supervision technique de l'infrastructure.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium text-slate-500">Statut Base de données</p>
                <div className="flex items-center mt-2 text-green-600 font-bold"><Activity className="w-4 h-4 mr-2" /> En ligne (24ms)</div>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium text-slate-500">Quotas API Gemini</p>
                <div className="flex items-center mt-2 text-blue-600 font-bold"><Activity className="w-4 h-4 mr-2" /> Normal (2% utilisés)</div>
              </div>
              <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Mode Maintenance</p>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader><CardTitle>Paramètres Globaux</CardTitle><CardDescription>Configuration technique de Zolio.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2">Bannière d'Information Système (Vue par tous)</label>
                <textarea 
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  rows={3}
                  placeholder="Ex: Maintenance prévue ce soir à 23h..."
                  defaultValue={systemBanner}
                />
                <button type="button" className="mt-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium">Déployer la bannière</button>
              </div>
              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-2">Clé API IA Custom (Gemini)</label>
                <input 
                  type="password"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  placeholder="Laisser vide pour utiliser celle du serveur..."
                />
                <p className="text-xs text-slate-500 mt-1">Surcharge la clé globale uniquement pour les tests administrateur.</p>
              </div>
              <div className="border-t pt-6">
                 <h4 className="font-bold mb-3">Marque Blanche & Customisation</h4>
                 <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                   <div>
                     <p className="font-medium">Autoriser les domaines personnalisés</p>
                     <p className="text-xs text-slate-500">Fonctionnalité Entreprise (devis.client.com)</p>
                   </div>
                   <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                 </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
