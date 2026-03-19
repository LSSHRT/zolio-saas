import { currentUser, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { ShieldAlert } from "lucide-react";
import AdminClient from "./AdminClient";
import { getAdminEmail, isAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await currentUser();
  
  // Security check
  const adminEmail = getAdminEmail();
  
  if (!isAdminUser(user)) {
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
  const totalUsersCount = await client.users.getCount();
  let usersList: any[] = [];
  
  // Calculate total AI Devis
  let totalAiDevis = 0;
  let proUsersCount = 0;
  let recentUsersCount = 0;

  try {
    const res = await client.users.getUserList({ limit: 500, orderBy: "-created_at" });
    usersList = res.data;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    totalAiDevis = res.data.reduce((sum, u) => {
      if (u.publicMetadata?.isPro || u.publicMetadata?.stripeSubscriptionId) {
        proUsersCount++;
      }
      if (new Date(u.createdAt) > thirtyDaysAgo) {
        recentUsersCount++;
      }
      const count = (u.publicMetadata?.aiDevisCount as number) || 0;
      return sum + count;
    }, 0);
  } catch (e) {
    console.error(e);
  }

  // Fetch Stripe Subscriptions
  let activeSubscriptions = 0;
  let mrr = 0;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
      const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
      activeSubscriptions = subs.data.length;
      
      // Calculate MRR estimate
      subs.data.forEach(sub => {
        if (sub.items.data[0].plan.amount) {
           let amount = sub.items.data[0].plan.amount / 100;
           if (sub.items.data[0].plan.interval === 'year') amount = amount / 12;
           mrr += amount;
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback MRR if no stripe key but manual pro users
  if (mrr === 0 && proUsersCount > 0) {
    mrr = proUsersCount * 29.99; // estimation
  }

  // Obtenir la clé Gemini personnalisée et bannière
  const currentGeminiKey = (user.publicMetadata?.customGeminiKey as string) || "";
  const currentSystemBanner = (user.publicMetadata?.systemBanner as string) || "";

  // Ne passer que les données nécessaires au Client Component
  const serializedUsers = usersList.map(u => ({
    id: u.id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Sans nom',
    email: u.emailAddresses[0]?.emailAddress || 'Aucun email',
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
    imageUrl: u.imageUrl,
    banned: u.banned,
    isPro: u.publicMetadata?.isPro || u.publicMetadata?.stripeSubscriptionId ? true : false,
    aiGenerations: u.publicMetadata?.aiDevisCount || 0,
    publicMetadata: {
      aiDevisCount: u.publicMetadata?.aiDevisCount,
      stripeSubscriptionId: u.publicMetadata?.stripeSubscriptionId,
      isPro: u.publicMetadata?.isPro,
      isAdmin: u.publicMetadata?.isAdmin,
      parrainCode: u.publicMetadata?.parrainCode,
    }
  }));

  return (
    <div className="flex flex-col min-h-screen pb-24 font-sans max-w-md md:max-w-3xl lg:max-w-5xl mx-auto w-full bg-white/80 dark:bg-[#0c0a1d]/95 sm:shadow-brand-lg sm:my-4 sm:rounded-[3rem] sm:min-h-[850px] overflow-hidden relative backdrop-blur-sm selection:bg-purple-200 dark:selection:bg-purple-900">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/6 to-orange-400/4 dark:from-violet-600/15 dark:via-fuchsia-500/10 dark:to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="pt-8">
        <AdminClient 
          initialUsers={serializedUsers}
          stats={{
            totalUsers: totalUsersCount,
            totalAIGenerations: totalAiDevis,
            activeSubscriptions: activeSubscriptions,
            proUsers: proUsersCount,
            recentUsersCount: recentUsersCount,
            mrr: Math.round(mrr)
          }}
          systemBanner={currentSystemBanner}
          currentGeminiKey={currentGeminiKey}
        />
      </div>
    </div>
  );
}
