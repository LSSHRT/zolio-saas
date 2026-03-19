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

export function internalServerError(
  scope: string,
  error: unknown,
  message = "Erreur serveur",
) {
  logServerError(scope, error);
  return jsonError(message, 500);
}
