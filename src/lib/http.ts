import { NextResponse } from "next/server";
import { appendAdminAuditLog } from "@/lib/admin-settings";

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  void appendAdminAuditLog({
    level: "error",
    scope: "system",
    action: scope,
    actor: "Serveur",
    message: error instanceof Error ? error.message : "Erreur serveur inconnue",
    meta: error instanceof Error ? error.name : undefined,
  });
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new NextResponse("Trop de requêtes", {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}

export function internalServerError(
  scope: string,
  error: unknown,
  message = "Erreur serveur",
) {
  logServerError(scope, error);
  return jsonError(message, 500);
}

export function safeJsonParse<T = unknown>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
