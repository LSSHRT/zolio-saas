/**
 * Logger centralisé — remplace tous les console.* éparpillés.
 *
 * - Serveur : console + audit admin log
 * - Client : console seulement (Sentry capture les erreurs automatiquement)
 */
import { appendAdminAuditLog } from "@/lib/admin-settings";

type LogLevel = "error" | "warn" | "info" | "log";

const isServer = typeof window === "undefined";

function formatPrefix(level: LogLevel, scope: string): string {
  const tag = level.toUpperCase().padEnd(5);
  return `[${tag}] [${scope}]`;
}

function shouldAuditLog(level: LogLevel): boolean {
  return isServer && (level === "error" || level === "warn");
}

function log(
  level: LogLevel,
  scope: string,
  error: unknown,
  extraMessage?: string,
) {
  const prefix = formatPrefix(level, scope);
  const message = extraMessage ?? (error instanceof Error ? error.message : String(error));

  switch (level) {
    case "error":
      console.error(prefix, error);
      break;
    case "warn":
      console.warn(prefix, error);
      break;
    case "info":
      console.info(prefix, error);
      break;
    default:
      console.log(prefix, error);
  }

  if (shouldAuditLog(level)) {
    void appendAdminAuditLog({
      level: level === "warn" ? "warning" : "error",
      scope: "system",
      action: scope,
      actor: "Serveur",
      message,
      meta: error instanceof Error ? error.name : undefined,
    }).catch(() => {
      // On ne boucle pas si l'audit log échoue
    });
  }
}

export function logError(scope: string, error: unknown, message?: string) {
  log("error", scope, error, message);
}

export function logWarn(scope: string, error: unknown, message?: string) {
  log("warn", scope, error, message);
}

export function logInfo(scope: string, message: string) {
  log("info", scope, message);
}

export function logDebug(scope: string, message: string) {
  if (process.env.NODE_ENV !== "production") {
    log("log", scope, message);
  }
}

/**
 * Compat : remplace l'ancien logServerError de http.ts
 */
export { logError as logServerError };
