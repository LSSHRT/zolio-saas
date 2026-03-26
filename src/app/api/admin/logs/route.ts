import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getAdminAuditLogs } from "@/lib/admin-settings";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAdminUser();
    const logs = await getAdminAuditLogs(24);
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-logs-get", error, "Impossible de récupérer les logs");
  }
}
