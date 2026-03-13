import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { Users, FileText, CreditCard, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  // Security check
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  if (!user || userEmail !== adminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Accès Refusé</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Vous n'avez pas les droits pour accéder à cette page.
          </p>
          {!adminEmail && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm text-left">
              <strong>Info Développeur :</strong> Pour activer l'accès, ajoutez la variable d'environnement <code>ADMIN_EMAIL=votre@email.com</code> dans Vercel et redéployez.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fetch Stats
  const client = await clerkClient();
  const totalUsers = await client.users.getCount();
  
  // Calculate total AI Devis
  let totalAiDevis = 0;
  try {
    const usersList = await client.users.getUserList({ limit: 500 });
    totalAiDevis = usersList.data.reduce((sum, u) => {
      const count = (u.publicMetadata?.aiDevisCount as number) || 0;
      return sum + count;
    }, 0);
  } catch (e) {
    console.error(e);
  }

  // Fetch Stripe Subscriptions
  let activeSubscriptions = 0;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
      const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
      activeSubscriptions = subs.data.length;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            👑 Tableau de Bord Administrateur
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Vue d'ensemble des performances de votre SaaS Zolio.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stat 1: Utilisateurs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Artisans Inscrits</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
            </div>
          </div>

          {/* Stat 2: IA */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Devis générés par IA</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAiDevis}</p>
            </div>
          </div>

          {/* Stat 3: Stripe */}
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

      </div>
    </div>
  );
}
