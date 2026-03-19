import { NextResponse } from "next/server";

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
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
