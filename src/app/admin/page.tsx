import { currentUser, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { ShieldAlert } from "lucide-react";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  // Security check
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdminRole = user?.publicMetadata?.isAdmin === true;
  
  if (!user || (userEmail !== adminEmail && !isAdminRole)) {
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
    firstName: u.firstName,
    lastName: u.lastName,
    emailAddresses: [{ emailAddress: u.emailAddresses[0]?.emailAddress }],
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
    imageUrl: u.imageUrl,
    banned: u.banned,
    publicMetadata: {
      aiDevisCount: u.publicMetadata?.aiDevisCount,
      stripeSubscriptionId: u.publicMetadata?.stripeSubscriptionId,
      isPro: u.publicMetadata?.isPro,
      isAdmin: u.publicMetadata?.isAdmin,
      parrainCode: u.publicMetadata?.parrainCode,
    }
  }));

  return (
    <AdminClient 
      initialUsers={serializedUsers}
      stats={{
        totalUsers: totalUsersCount,
        totalAiDevis: totalAiDevis,
        activeSubscriptions: activeSubscriptions,
        proUsersCount: proUsersCount,
        recentUsersCount: recentUsersCount,
        mrr: Math.round(mrr)
      }}
      systemBanner={currentSystemBanner}
      currentGeminiKey={currentGeminiKey}
    />
  );
}
