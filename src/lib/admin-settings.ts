import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const ADMIN_SETTING_KEYS = {
  cronProspectEnabled: "cron_prospect_enabled",
  prospectWarmupStartedAt: "cron_prospect_warmup_started_at",
  systemBanner: "system_banner",
  maintenanceEnabled: "maintenance_mode_enabled",
  maintenanceMessage: "maintenance_mode_message",
  auditLog: "admin_audit_log",
} as const;

export type AdminAuditLogLevel = "info" | "success" | "warning" | "error";
export type AdminAuditLogScope =
  | "admin"
  | "system"
  | "security"
  | "billing"
  | "acquisition";

export interface AdminAuditLogEntry {
  id: string;
  level: AdminAuditLogLevel;
  scope: AdminAuditLogScope;
  action: string;
  message: string;
  actor: string;
  createdAt: string;
  meta?: string;
}

const MAX_AUDIT_LOGS = 40;

function coerceString(value: string | null | undefined) {
  return typeof value === "string" ? value : "";
}

function parseBooleanSetting(value: string | null | undefined) {
  return value === "true";
}

function isAuditLevel(value: unknown): value is AdminAuditLogLevel {
  return value === "info" || value === "success" || value === "warning" || value === "error";
}

function isAuditScope(value: unknown): value is AdminAuditLogScope {
  return (
    value === "admin" ||
    value === "system" ||
    value === "security" ||
    value === "billing" ||
    value === "acquisition"
  );
}

function normalizeAuditEntry(value: unknown): AdminAuditLogEntry | null {
  if (!value || typeof value !== "object") return null;

  const entry = value as Record<string, unknown>;
  if (
    typeof entry.id !== "string" ||
    !isAuditLevel(entry.level) ||
    !isAuditScope(entry.scope) ||
    typeof entry.action !== "string" ||
    typeof entry.message !== "string" ||
    typeof entry.actor !== "string" ||
    typeof entry.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: entry.id,
    level: entry.level,
    scope: entry.scope,
    action: entry.action,
    message: entry.message,
    actor: entry.actor,
    createdAt: entry.createdAt,
    meta: typeof entry.meta === "string" ? entry.meta : undefined,
  };
}

function parseAuditLogPayload(value: string | null | undefined): AdminAuditLogEntry[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeAuditEntry)
      .filter((entry): entry is AdminAuditLogEntry => entry !== null)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getAdminSettingValue(key: string) {
  const setting = await prisma.adminSetting.findUnique({
    where: { key },
  });

  return setting?.value ?? null;
}

export async function setAdminSettingValue(key: string, value: string) {
  return prisma.adminSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getAdminRuntimeState() {
  const [systemBanner, maintenanceEnabled, maintenanceMessage] = await Promise.all([
    getAdminSettingValue(ADMIN_SETTING_KEYS.systemBanner),
    getAdminSettingValue(ADMIN_SETTING_KEYS.maintenanceEnabled),
    getAdminSettingValue(ADMIN_SETTING_KEYS.maintenanceMessage),
  ]);

  return {
    systemBanner: coerceString(systemBanner),
    maintenanceEnabled: parseBooleanSetting(maintenanceEnabled),
    maintenanceMessage: coerceString(maintenanceMessage),
  };
}

export async function getAdminAuditLogs(limit = 20) {
  const rawLog = await getAdminSettingValue(ADMIN_SETTING_KEYS.auditLog);
  return parseAuditLogPayload(rawLog).slice(0, limit);
}

export async function appendAdminAuditLog(
  entry: Omit<AdminAuditLogEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
) {
  try {
    const currentLogs = await getAdminAuditLogs(MAX_AUDIT_LOGS);
    const nextEntry: AdminAuditLogEntry = {
      id: entry.id ?? randomUUID(),
      createdAt: entry.createdAt ?? new Date().toISOString(),
      ...entry,
    };

    const nextLogs = [nextEntry, ...currentLogs].slice(0, MAX_AUDIT_LOGS);

    await setAdminSettingValue(ADMIN_SETTING_KEYS.auditLog, JSON.stringify(nextLogs));
  } catch (error) {
    console.error("[admin-audit-log]", error);
  }
}
