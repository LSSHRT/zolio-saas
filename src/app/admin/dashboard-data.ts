import { clerkClient, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getAdminEmail } from "@/lib/admin";
import type {
  AdminActivityItem,
  AdminAlertItem,
  AdminDashboardData,
  AdminKpi,
  AdminMailItem,
  AdminSystemStatus,
  AdminUserRow,
} from "./types";

type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown) {
  return value === true;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function toIsoString(value: Date | number | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function serializeProspectMails(
  mails: Array<{ id: string; email: string; status: string; source: string; createdAt: Date }>,
): AdminMailItem[] {
  return mails.map((mail) => ({
    id: mail.id,
    email: mail.email,
    status: mail.status,
    source: mail.source,
    createdAt: mail.createdAt.toISOString(),
  }));
}

export async function getAdminDashboardData(adminUser: CurrentAdmin): Promise<AdminDashboardData> {
  const client = await clerkClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const currentGeminiKey = readString(adminUser.publicMetadata?.customGeminiKey);
  const currentSystemBanner = readString(adminUser.publicMetadata?.systemBanner);

  let totalUsersCount = 0;
  let users: AdminUserRow[] = [];

  try {
    totalUsersCount = await client.users.getCount();
    const res = await client.users.getUserList({ limit: 500, orderBy: "-created_at" });

    users = res.data.map((user) => {
      const metadata = user.publicMetadata || {};
      const stripeSubscriptionId = readNullableString(metadata.stripeSubscriptionId);
      const isPro = readBoolean(metadata.isPro) || Boolean(stripeSubscriptionId);

      return {
        id: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Sans nom",
        email: user.emailAddresses[0]?.emailAddress || "Aucun email",
        createdAt: toIsoString(user.createdAt),
        lastSignInAt: toIsoString(user.lastSignInAt),
        imageUrl: user.imageUrl,
        banned: user.banned,
        isPro,
        aiGenerations: readNumber(metadata.aiDevisCount),
        publicMetadata: {
          aiDevisCount: readNumber(metadata.aiDevisCount),
          stripeSubscriptionId,
          isPro: readBoolean(metadata.isPro),
          isAdmin: readBoolean(metadata.isAdmin),
          parrainCode: readNullableString(metadata.parrainCode),
        },
      };
    });
  } catch (error) {
    console.error("admin-dashboard: unable to load Clerk users", error);
  }

  const proUsersCount = users.filter((user) => user.isPro).length;
  const recentUsersCount = users.filter((user) => {
    if (!user.createdAt) return false;
    return new Date(user.createdAt) >= thirtyDaysAgo;
  }).length;
  const bannedUsersCount = users.filter((user) => user.banned).length;
  const totalAiDevis = users.reduce((sum, user) => sum + user.aiGenerations, 0);

  let dbLatencyMs: number | null = null;
  let isCronEnabled = true;
  let prospectMails: AdminMailItem[] = [];

  try {
    const dbStartedAt = Date.now();
    const [cronSetting, rawMails] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: "cron_prospect_enabled" } }),
      prisma.prospectMail.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    dbLatencyMs = Date.now() - dbStartedAt;
    isCronEnabled = cronSetting?.value !== "false";
    prospectMails = serializeProspectMails(rawMails);
  } catch (error) {
    console.error("admin-dashboard: unable to load Prisma data", error);
  }

  const sentCount = prospectMails.filter((mail) => mail.status === "Sent").length;
  const failedCount = prospectMails.filter((mail) => mail.status !== "Sent").length;
  const manualCount = prospectMails.filter((mail) => mail.source === "Manual").length;
  const automatedCount = prospectMails.filter((mail) => mail.source !== "Manual").length;
  const totalMailCount = prospectMails.length;
  const deliveryRate = totalMailCount > 0 ? Math.round((sentCount / totalMailCount) * 100) : 0;

  let activeSubscriptions = 0;
  let mrr = 0;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
      });
      const subscriptions = await stripe.subscriptions.list({ status: "active", limit: 100 });
      activeSubscriptions = subscriptions.data.length;
      mrr = subscriptions.data.reduce((sum, subscription) => {
        const plan = subscription.items.data[0]?.plan;
        if (!plan?.amount) return sum;

        let amount = plan.amount / 100;
        if (plan.interval === "year") amount /= 12;
        return sum + amount;
      }, 0);
    } catch (error) {
      console.error("admin-dashboard: unable to load Stripe data", error);
    }
  }

  if (mrr === 0 && proUsersCount > 0) {
    mrr = proUsersCount * 29.99;
  }

  const estimatedArr = Math.round(mrr * 12);
  const conversionRate = totalUsersCount > 0 ? Math.round((proUsersCount / totalUsersCount) * 100) : 0;

  const missingCriticalConfig = [
    !process.env.PUBLIC_DEVIS_LINK_SECRET && "PUBLIC_DEVIS_LINK_SECRET",
    !process.env.CRON_SECRET && "CRON_SECRET",
    !getAdminEmail() && "ADMIN_EMAIL",
    !process.env.STRIPE_SECRET_KEY && "STRIPE_SECRET_KEY",
    !(process.env.SMTP_USER && process.env.SMTP_PASS) && "SMTP",
  ].filter(Boolean) as string[];

  const alerts: AdminAlertItem[] = [];

  if (failedCount > 0) {
    alerts.push({
      id: "failed-mails",
      title: `${failedCount} envoi${failedCount > 1 ? "s" : ""} en échec`,
      description: "Des emails de prospection nécessitent une revue ou une relance ciblée.",
      severity: "critical",
      section: "acquisition",
      ctaLabel: "Ouvrir l'acquisition",
    });
  }

  if (!isCronEnabled) {
    alerts.push({
      id: "cron-disabled",
      title: "Robot de prospection désactivé",
      description: "Le cron est coupé. Les envois automatisés sont actuellement à l'arrêt.",
      severity: "warning",
      section: "acquisition",
      ctaLabel: "Réactiver le robot",
    });
  }

  if (missingCriticalConfig.length > 0) {
    alerts.push({
      id: "config-missing",
      title: "Configuration critique incomplète",
      description: `Variables manquantes: ${missingCriticalConfig.join(", ")}.`,
      severity: "warning",
      section: "systeme",
      ctaLabel: "Vérifier le système",
    });
  }

  if (bannedUsersCount > 0) {
    alerts.push({
      id: "banned-users",
      title: `${bannedUsersCount} compte${bannedUsersCount > 1 ? "s" : ""} banni${bannedUsersCount > 1 ? "s" : ""}`,
      description: "Pense à revoir régulièrement les comptes bannis et leur contexte.",
      severity: "info",
      section: "utilisateurs",
      ctaLabel: "Voir les utilisateurs",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      title: "Aucune alerte prioritaire",
      description: "Les signaux critiques sont au vert. Le cockpit est sous contrôle.",
      severity: "success",
      section: "pilotage",
      ctaLabel: "Rester sur le pilotage",
    });
  }

  const activity: AdminActivityItem[] = [
    ...users.slice(0, 6).map((user) => ({
      id: `user-${user.id}`,
      title: "Nouvelle inscription",
      description: `${user.name} • ${user.email}`,
      timestamp: user.createdAt || new Date(0).toISOString(),
      section: "utilisateurs" as const,
      kind: "user" as const,
    })),
    ...prospectMails.slice(0, 6).map((mail) => ({
      id: `mail-${mail.id}`,
      title: mail.status === "Sent" ? "Email de prospection envoyé" : "Email de prospection en échec",
      description: `${mail.email} • ${mail.source === "Manual" ? "manuel" : "automatique"}`,
      timestamp: mail.createdAt,
      section: "acquisition" as const,
      kind: "acquisition" as const,
    })),
  ]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 8);

  if (currentSystemBanner) {
    activity.unshift({
      id: "system-banner",
      title: "Bannière système active",
      description: currentSystemBanner,
      timestamp: new Date().toISOString(),
      section: "systeme",
      kind: "system",
    });
  }

  const systemStatuses: AdminSystemStatus[] = [
    {
      id: "database",
      label: "Base de données",
      status: dbLatencyMs === null ? "critical" : dbLatencyMs > 150 ? "warning" : "healthy",
      detail:
        dbLatencyMs === null
          ? "Connexion Prisma indisponible"
          : "Synchronisation opérationnelle",
      meta: dbLatencyMs === null ? "Aucune mesure" : `${dbLatencyMs} ms`,
    },
    {
      id: "stripe",
      label: "Billing Stripe",
      status: process.env.STRIPE_SECRET_KEY ? "healthy" : "warning",
      detail: process.env.STRIPE_SECRET_KEY
        ? "Paiements et abonnements connectés"
        : "Clé Stripe absente côté serveur",
      meta: `${activeSubscriptions} abonnement${activeSubscriptions > 1 ? "s" : ""} actif${activeSubscriptions > 1 ? "s" : ""}`,
    },
    {
      id: "smtp",
      label: "Email transactionnel",
      status: process.env.SMTP_USER && process.env.SMTP_PASS ? "healthy" : "warning",
      detail: process.env.SMTP_USER && process.env.SMTP_PASS
        ? "Transport SMTP prêt"
        : "Configuration SMTP incomplète",
    },
    {
      id: "cron",
      label: "Robot de prospection",
      status: !process.env.CRON_SECRET ? "critical" : isCronEnabled ? "healthy" : "warning",
      detail: !process.env.CRON_SECRET
        ? "CRON_SECRET manquant"
        : isCronEnabled
          ? "Automatisation autorisée"
          : "Robot désactivé par l'admin",
    },
    {
      id: "signature-links",
      label: "Liens publics signés",
      status: process.env.PUBLIC_DEVIS_LINK_SECRET ? "healthy" : "critical",
      detail: process.env.PUBLIC_DEVIS_LINK_SECRET
        ? "Signature HMAC active"
        : "Secret de signature manquant",
    },
    {
      id: "admin-identity",
      label: "Identité admin",
      status: getAdminEmail() ? "healthy" : "warning",
      detail: getAdminEmail()
        ? "ADMIN_EMAIL configuré"
        : "Aucune identité admin canonique configurée",
    },
    {
      id: "gemini",
      label: "IA Gemini",
      status: process.env.GEMINI_API_KEY || currentGeminiKey ? "healthy" : "warning",
      detail: process.env.GEMINI_API_KEY || currentGeminiKey
        ? "Accès IA disponible"
        : "Aucune clé Gemini active",
      meta: currentGeminiKey ? "Surcharge admin active" : "Configuration serveur",
    },
    {
      id: "hunter",
      label: "Hunter sourcing",
      status: process.env.HUNTER_API_KEY ? "healthy" : "inactive",
      detail: process.env.HUNTER_API_KEY
        ? "Recherche email enrichie"
        : "Mode optionnel non configuré",
    },
  ];

  const heroStatus =
    alerts.some((alert) => alert.severity === "critical")
      ? {
          label: "Attention requise",
          description: "Des signaux demandent une action prioritaire avant le prochain cycle d'exploitation.",
          tone: "critical" as const,
        }
      : alerts.some((alert) => alert.severity === "warning")
        ? {
            label: "Sous contrôle",
            description: "La plateforme tourne, mais quelques réglages méritent une revue rapide.",
            tone: "warning" as const,
          }
        : {
            label: "Opérationnel",
            description: "Les briques critiques sont alignées et le cockpit est au vert.",
            tone: "success" as const,
          };

  const kpis: AdminKpi[] = [
    {
      id: "users",
      label: "Utilisateurs",
      value: totalUsersCount.toString(),
      hint: `${recentUsersCount} nouveaux sur 30 jours`,
      tone: "brand",
    },
    {
      id: "pro",
      label: "Comptes PRO",
      value: proUsersCount.toString(),
      hint: `${conversionRate}% de conversion`,
      tone: "success",
    },
    {
      id: "mrr",
      label: "MRR estimé",
      value: `${Math.round(mrr)} €`,
      hint: `${activeSubscriptions} abonnement${activeSubscriptions > 1 ? "s" : ""} Stripe`,
      tone: "neutral",
    },
    {
      id: "recent",
      label: "Acquisition 30j",
      value: recentUsersCount.toString(),
      hint: "Inscriptions récentes",
      tone: "warning",
    },
    {
      id: "ai",
      label: "Devis IA",
      value: totalAiDevis.toString(),
      hint: "Générations cumulées",
      tone: "brand",
    },
  ];

  return {
    currentAdmin: {
      name: `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim() || "Super Admin",
      email: adminUser.emailAddresses[0]?.emailAddress || "admin@zolio.site",
    },
    heroStatus,
    kpis,
    alerts,
    activity,
    systemStatuses,
    users,
    prospectMails,
    revenue: {
      totalUsers: totalUsersCount,
      proUsers: proUsersCount,
      activeSubscriptions,
      mrr: Math.round(mrr),
      estimatedArr,
      conversionRate,
      recentUsersCount,
      totalAIGenerations: totalAiDevis,
      sourceLabel: process.env.STRIPE_SECRET_KEY
        ? "Données live Stripe"
        : "Estimation basée sur les comptes PRO",
    },
    acquisition: {
      totalCount: totalMailCount,
      sentCount,
      failedCount,
      manualCount,
      automatedCount,
      deliveryRate,
      isCronEnabled,
    },
    settings: {
      systemBanner: currentSystemBanner,
      currentGeminiKey,
      adminEmailConfigured: Boolean(getAdminEmail()),
      customGeminiEnabled: Boolean(currentGeminiKey),
    },
    environment: {
      hasStripe: Boolean(process.env.STRIPE_SECRET_KEY),
      hasSMTP: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      hasHunter: Boolean(process.env.HUNTER_API_KEY),
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasPublicLinkSecret: Boolean(process.env.PUBLIC_DEVIS_LINK_SECRET),
      hasGemini: Boolean(process.env.GEMINI_API_KEY || currentGeminiKey),
      hasMaintenanceMode: false,
      hasCentralizedLogs: false,
      dbLatencyMs,
    },
  };
}
