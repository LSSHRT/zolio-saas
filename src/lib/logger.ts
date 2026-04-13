/**
 * Logger centralisé — remplace tous les console.* éparpillés.
 *
 * - Serveur : console + audit admin log (via fetch API route)
 * - Client : console seulement (Sentry capture les erreurs automatiquement)
 */

type LogLevel = "error" | "warn" | "info" | "log";

const isServer = typeof window === "undefined";

function formatPrefix(level: LogLevel, scope: string): string {
  const tag = level.toUpperCase().padEnd(5);
  return `[${tag}] [${scope}]`;
}

async function tryAuditLog(level: LogLevel, scope: string, message: string, meta?: string) {
  if (!isServer || (level !== "error" && level !== "warn")) return;

  try {
    // Appel API route au lieu d'import direct (évite le bundling Prisma côté client)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const secret = process.env.CRON_SECRET || "";
    await fetch(`${baseUrl}/api/admin/audit-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        level: level === "warn" ? "warning" : "error",
        scope: "system",
        action: scope,
        actor: "Serveur",
        message,
        meta,
      }),
    }).catch(() => {});
  } catch {
    // On ne boucle pas si l'audit log échoue
  }
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

  const meta = error instanceof Error ? error.name : undefined;
  void tryAuditLog(level, scope, message, meta);
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

/** Compat : remplace l'ancien logServerError de http.ts */
export { logError as logServerError };
