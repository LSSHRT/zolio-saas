export type AdminSectionId =
  | "pilotage"
  | "utilisateurs"
  | "revenus"
  | "acquisition"
  | "systeme";

export type AdminKpiTone = "brand" | "neutral" | "success" | "warning";
export type AdminSeverity = "critical" | "warning" | "info" | "success";
export type AdminSystemTone = "healthy" | "warning" | "critical" | "inactive";

export interface AdminKpi {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: AdminKpiTone;
}

export interface AdminUserMetadata {
  aiDevisCount: number;
  stripeSubscriptionId: string | null;
  isPro: boolean;
  isAdmin: boolean;
  parrainCode: string | null;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  imageUrl: string;
  banned: boolean;
  isPro: boolean;
  aiGenerations: number;
  publicMetadata: AdminUserMetadata;
}

export interface AdminMailItem {
  id: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
}

export interface AdminAlertItem {
  id: string;
  title: string;
  description: string;
  severity: AdminSeverity;
  section: AdminSectionId;
  ctaLabel: string;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  section: AdminSectionId;
  kind: "user" | "acquisition" | "system" | "billing";
}

export interface AdminSystemStatus {
  id: string;
  label: string;
  status: AdminSystemTone;
  detail: string;
  meta?: string;
}

export interface AdminRevenueSnapshot {
  totalUsers: number;
  proUsers: number;
  activeSubscriptions: number;
  stripeBackedProUsers: number;
  manualProUsers: number;
  mrr: number;
  estimatedArr: number;
  conversionRate: number;
  recentUsersCount: number;
  previousPeriodUsersCount: number;
  userGrowthDelta: number;
  totalAIGenerations: number;
  aiActiveUsers: number;
  aiAdoptionRate: number;
  averageAiGenerationsPerActiveUser: number;
  sourceLabel: string;
}

export interface AdminAcquisitionSnapshot {
  totalCount: number;
  sentCount: number;
  failedCount: number;
  manualCount: number;
  automatedCount: number;
  deliveryRate: number;
  isCronEnabled: boolean;
}

export interface AdminSettingsSnapshot {
  systemBanner: string;
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  currentGeminiKey: string;
  adminEmailConfigured: boolean;
  customGeminiEnabled: boolean;
}

export interface AdminEnvironmentSnapshot {
  hasStripe: boolean;
  hasSMTP: boolean;
  hasHunter: boolean;
  hasCronSecret: boolean;
  hasPublicLinkSecret: boolean;
  hasGemini: boolean;
  hasMaintenanceMode: boolean;
  hasCentralizedLogs: boolean;
  dbLatencyMs: number | null;
}

export interface AdminAuditLogItem {
  id: string;
  level: "info" | "success" | "warning" | "error";
  scope: "admin" | "system" | "security" | "billing" | "acquisition";
  action: string;
  message: string;
  actor: string;
  createdAt: string;
  meta?: string;
}

export interface AdminHeroStatus {
  label: string;
  description: string;
  tone: AdminSeverity;
}

export interface AdminDashboardData {
  currentAdmin: {
    name: string;
    email: string;
  };
  heroStatus: AdminHeroStatus;
  kpis: AdminKpi[];
  alerts: AdminAlertItem[];
  activity: AdminActivityItem[];
  systemStatuses: AdminSystemStatus[];
  users: AdminUserRow[];
  prospectMails: AdminMailItem[];
  revenue: AdminRevenueSnapshot;
  acquisition: AdminAcquisitionSnapshot;
  settings: AdminSettingsSnapshot;
  environment: AdminEnvironmentSnapshot;
  auditLogs: AdminAuditLogItem[];
}
