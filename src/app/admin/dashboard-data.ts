import { clerkClient, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getAdminEmail } from "@/lib/admin";
import { getAdminAuditLogs, getAdminRuntimeState } from "@/lib/admin-settings";
import { getProspectingRuntime } from "@/lib/prospecting";
import { logError } from "@/lib/logger";
import type {
  AdminActivityItem,
  AdminAlertItem,
  AdminAuditLogItem,
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

function detectDatabaseProvider(databaseUrl: string | undefined) {
  const normalized = databaseUrl?.toLowerCase() || "";

  if (!normalized) return "Base distante";
  if (normalized.includes("xata")) return "Xata";
  if (
    normalized.startsWith("postgres://") ||
    normalized.startsWith("postgresql://") ||
    normalized.startsWith("prisma+postgres://")
  ) {
    return "Postgres";
  }
  if (normalized.startsWith("mysql://")) return "MySQL";
  if (normalized.startsWith("file:") || normalized.includes("sqlite")) return "SQLite";

  return "Base distante";
}

function getDatabaseThresholds(provider: string) {
  if (provider === "Xata") {
    return {
      healthyMs: 900,
      warningMs: 1800,
    };
  }

  if (provider === "SQLite") {
    return {
      healthyMs: 80,
      warningMs: 250,
    };
  }

  return {
    healthyMs: 350,
    warningMs: 1200,
  };
}

function getStatusCount(
  groups: Array<{ status: string; _count: { _all: number } }>,
  targetStatus: string,
) {
  return groups.find((group) => group.status === targetStatus)?._count._all || 0;
}

function getManualCount(groups: Array<{ source: string; _count: { _all: number } }>) {
  return groups.reduce((total, group) => {
    if (!group.source.startsWith("Manual")) {
      return total;
    }

    return total + group._count._all;
  }, 0);
}

function getDatabaseHealth(provider: string, latencyMs: number | null) {
  if (latencyMs === null) {
    return {
      status: "critical" as const,
      detail: "Sonde Prisma indisponible",
      meta: `${provider} • aucune mesure`,
    };
  }

  const thresholds = getDatabaseThresholds(provider);

  if (latencyMs <= thresholds.healthyMs) {
    return {
      status: "healthy" as const,
      detail: provider === "Xata" ? "Latence distante maîtrisée" : "Réponse base stable",
      meta: `${provider} • ${latencyMs} ms`,
    };
  }

  if (latencyMs <= thresholds.warningMs) {
    return {
      status: "warning" as const,
      detail: provider === "Xata" ? "Latence distante à surveiller" : "Latence à surveiller",
      meta: `${provider} • ${latencyMs} ms`,
    };
  }

  return {
    status: "critical" as const,
    detail: "Latence élevée ou connexion instable",
    meta: `${provider} • ${latencyMs} ms`,
  };
}

async function loadAdminUsers() {
  const client = await clerkClient();
  const [totalUsersCount, userList] = await Promise.all([
    client.users.getCount(),
    client.users.getUserList({ limit: 500, orderBy: "-created_at" }),
  ]);

  const users: AdminUserRow[] = userList.data.map((user) => {
    const metadata = user.publicMetadata || {};
    const stripeSubscriptionId = readNullableString(metadata.stripeSubscriptionId);
    const isPro = readBoolean(metadata.isPro);

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

  return { totalUsersCount, users };
}

async function measureDatabaseLatency() {
  const startedAt = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return Date.now() - startedAt;
}

async function loadAcquisitionSnapshot() {
  const [cronSetting, totalProspectMails, statusGroups, sourceGroups, rawMails] = await Promise.all([
    prisma.adminSetting.findUnique({ where: { key: "cron_prospect_enabled" } }),
    prisma.prospectMail.count(),
    prisma.prospectMail.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.prospectMail.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),
    prisma.prospectMail.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  return {
    isCronEnabled: cronSetting?.value !== "false",
    totalMailCount: totalProspectMails,
    sentCount: getStatusCount(statusGroups, "Sent"),
    failedCount: getStatusCount(statusGroups, "Failed"),
    queuedCount: getStatusCount(statusGroups, "Queued"),
    manualCount: getManualCount(sourceGroups),
    prospectMails: serializeProspectMails(rawMails),
  };
}

async function loadStripeSnapshot() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      activeSubscriptions: 0,
      mrr: 0,
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
  const subscriptions = await stripe.subscriptions.list({ status: "active", limit: 100 });
  const mrr = subscriptions.data.reduce((sum, subscription) => {
    const plan = subscription.items.data[0]?.plan;
    if (!plan?.amount) return sum;

    let amount = plan.amount / 100;
    if (plan.interval === "year") amount /= 12;
    return sum + amount;
  }, 0);

  return {
    activeSubscriptions: subscriptions.data.length,
    mrr,
  };
}

export async function getAdminDashboardData(adminUser: CurrentAdmin): Promise<AdminDashboardData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const previousThirtyDaysAgo = new Date(thirtyDaysAgo);
  previousThirtyDaysAgo.setDate(previousThirtyDaysAgo.getDate() - 30);

  const currentGeminiKey = readString(adminUser.publicMetadata?.customGeminiKey);
  const prospectingRuntime = getProspectingRuntime();
  const dbProvider = detectDatabaseProvider(process.env.DATABASE_URL);

  const [
    runtimeStateResult,
    usersResult,
    dbLatencyResult,
    acquisitionResult,
    stripeResult,
    auditLogsResult,
  ] = await Promise.allSettled([
    getAdminRuntimeState(),
    loadAdminUsers(),
    measureDatabaseLatency(),
    loadAcquisitionSnapshot(),
    loadStripeSnapshot(),
    getAdminAuditLogs(24),
  ]);

  const runtimeState =
    runtimeStateResult.status === "fulfilled"
      ? runtimeStateResult.value
      : { systemBanner: "", maintenanceEnabled: false, maintenanceMessage: "" };
  const currentSystemBanner =
    runtimeState.systemBanner || readString(adminUser.publicMetadata?.systemBanner);

  let totalUsersCount = 0;
  let users: AdminUserRow[] = [];
  if (usersResult.status === "fulfilled") {
    totalUsersCount = usersResult.value.totalUsersCount;
    users = usersResult.value.users;
  } else {
    logError("admin-dashboard-clerk", usersResult.reason, "unable to load Clerk users");
  }

  const proUsersCount = users.filter((user) => user.isPro).length;
  const stripeBackedProUsers = users.filter(
    (user) => user.isPro && Boolean(user.publicMetadata.stripeSubscriptionId),
  ).length;
  const manualProUsers = Math.max(proUsersCount - stripeBackedProUsers, 0);
  const recentUsersCount = users.filter((user) => {
    if (!user.createdAt) return false;
    return new Date(user.createdAt) >= thirtyDaysAgo;
  }).length;
  const previousPeriodUsersCount = users.filter((user) => {
    if (!user.createdAt) return false;
    const createdAt = new Date(user.createdAt);
    return createdAt >= previousThirtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;
  const bannedUsersCount = users.filter((user) => user.banned).length;
  const totalAiDevis = users.reduce((sum, user) => sum + user.aiGenerations, 0);
  const aiActiveUsers = users.filter((user) => user.aiGenerations > 0).length;

  let dbLatencyMs: number | null = null;
  let isCronEnabled = true;
  let prospectMails: AdminMailItem[] = [];
  let sentCount = 0;
  let failedCount = 0;
  let queuedCount = 0;
  let manualCount = 0;
  let automatedCount = 0;
  let totalMailCount = 0;
  if (dbLatencyResult.status === "fulfilled") {
    dbLatencyMs = dbLatencyResult.value;
  } else {
    logError("admin-dashboard-prisma-ping", dbLatencyResult.reason, "unable to ping Prisma");
  }

  if (acquisitionResult.status === "fulfilled") {
    isCronEnabled = acquisitionResult.value.isCronEnabled;
    totalMailCount = acquisitionResult.value.totalMailCount;
    sentCount = acquisitionResult.value.sentCount;
    failedCount = acquisitionResult.value.failedCount;
    queuedCount = acquisitionResult.value.queuedCount;
    manualCount = acquisitionResult.value.manualCount;
    automatedCount = Math.max(totalMailCount - manualCount, 0);
    prospectMails = acquisitionResult.value.prospectMails;
  } else {
    logError("admin-dashboard-prisma-data", acquisitionResult.reason, "unable to load Prisma data");
  }

  const attemptedCount = sentCount + failedCount;
  const deliveryRate = attemptedCount > 0 ? Math.round((sentCount / attemptedCount) * 100) : 0;
  const databaseHealth = getDatabaseHealth(dbProvider, dbLatencyMs);

  let activeSubscriptions = 0;
  let mrr = 0;
  if (stripeResult.status === "fulfilled") {
    activeSubscriptions = stripeResult.value.activeSubscriptions;
    mrr = stripeResult.value.mrr;
  } else {
    logError("admin-dashboard-stripe", stripeResult.reason, "unable to load Stripe data");
  }

  if (mrr === 0 && proUsersCount > 0) {
    mrr = proUsersCount * 29.99;
  }

  const estimatedArr = Math.round(mrr * 12);
  const conversionRate = totalUsersCount > 0 ? Math.round((proUsersCount / totalUsersCount) * 100) : 0;
  const aiAdoptionRate = totalUsersCount > 0 ? Math.round((aiActiveUsers / totalUsersCount) * 100) : 0;
  const averageAiGenerationsPerActiveUser =
    aiActiveUsers > 0 ? Math.round((totalAiDevis / aiActiveUsers) * 10) / 10 : 0;
  const userGrowthDelta =
    previousPeriodUsersCount === 0
      ? recentUsersCount > 0
        ? 100
        : 0
      : Math.round(((recentUsersCount - previousPeriodUsersCount) / previousPeriodUsersCount) * 100);

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

  if (queuedCount > 0) {
    alerts.push({
      id: "queued-leads",
      title: `${queuedCount} lead${queuedCount > 1 ? "s" : ""} en attente`,
      description: "Le robot a trouvé des contacts mais l'envoi automatique est volontairement bloqué ou différé.",
      severity: "info",
      section: "acquisition",
      ctaLabel: "Voir la file",
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

  if (runtimeState.maintenanceEnabled) {
    alerts.push({
      id: "maintenance-active",
      title: "Mode maintenance actif",
      description: "Les visiteurs non admin voient actuellement l'écran de maintenance global.",
      severity: "warning",
      section: "systeme",
      ctaLabel: "Voir le système",
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
      title:
        mail.status === "Sent"
          ? "Email de prospection envoyé"
          : mail.status === "Queued"
            ? "Lead mis en file d'attente"
            : mail.status === "Blocked"
              ? "Envoi de prospection bloqué"
              : "Email de prospection en échec",
      description: `${mail.email} • ${mail.source.startsWith("Manual") ? "manuel" : "robot"}`,
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

  const auditLogs: AdminAuditLogItem[] =
    auditLogsResult.status === "fulfilled" ? auditLogsResult.value : [];

  const systemStatuses: AdminSystemStatus[] = [
    {
      id: "database",
      label: "Base de données",
      status: databaseHealth.status,
      detail: databaseHealth.detail,
      meta: databaseHealth.meta,
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
      id: "prospecting-mailer",
      label: "Sender prospection",
      status: prospectingRuntime.canManualSend
        ? prospectingRuntime.canAutoSend
          ? "healthy"
          : "warning"
        : "critical",
      detail: prospectingRuntime.canManualSend
        ? prospectingRuntime.canAutoSend
          ? "Prospection manuelle et robot autorisés"
          : "Envoi manuel autorisé, robot en mode collecte"
        : prospectingRuntime.reason || "Sender prospect indisponible",
      meta: prospectingRuntime.fromEmail || undefined,
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
      id: "maintenance",
      label: "Mode maintenance",
      status: runtimeState.maintenanceEnabled ? "warning" : "healthy",
      detail: runtimeState.maintenanceEnabled
        ? "Protection globale active pour les visiteurs non admin"
        : "Aucune interruption publique en cours",
      meta: runtimeState.maintenanceMessage || undefined,
    },
    {
      id: "audit-log",
      label: "Journal admin",
      status: auditLogs.length > 0 ? "healthy" : "inactive",
      detail:
        auditLogs.length > 0
          ? "Journal d'audit persistant disponible dans le cockpit"
          : "Aucune entrée de journal enregistrée pour le moment",
      meta: `${auditLogs.length} entrée${auditLogs.length > 1 ? "s" : ""}`,
    },
    {
      id: "hunter",
      label: "Hunter sourcing",
      status: process.env.HUNTER_API_KEY ? "healthy" : "inactive",
      detail: process.env.HUNTER_API_KEY
        ? "Recherche email enrichie"
        : "Sourcing automatique indisponible: HUNTER_API_KEY manquant",
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
      stripeBackedProUsers,
      manualProUsers,
      mrr: Math.round(mrr),
      estimatedArr,
      conversionRate,
      recentUsersCount,
      previousPeriodUsersCount,
      userGrowthDelta,
      totalAIGenerations: totalAiDevis,
      aiActiveUsers,
      aiAdoptionRate,
      averageAiGenerationsPerActiveUser,
      sourceLabel: process.env.STRIPE_SECRET_KEY
        ? "Données live Stripe"
        : "Estimation basée sur les comptes PRO",
    },
    acquisition: {
      totalCount: totalMailCount,
      sentCount,
      failedCount,
      queuedCount,
      manualCount,
      automatedCount,
      deliveryRate,
      isCronEnabled,
    },
    settings: {
      systemBanner: currentSystemBanner,
      maintenanceEnabled: runtimeState.maintenanceEnabled,
      maintenanceMessage: runtimeState.maintenanceMessage,
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
      canManualProspectSend: prospectingRuntime.canManualSend,
      canAutoProspectSend: prospectingRuntime.canAutoSend,
      prospectMode: prospectingRuntime.mode,
      prospectReason: prospectingRuntime.reason,
      hasMaintenanceMode: true,
      hasCentralizedLogs: true,
      dbProvider,
      dbLatencyMs,
    },
    auditLogs,
  };
}
