import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClientDashboardSummary } from "@/lib/client-dashboard";
import { internalServerError, jsonError } from "@/lib/http";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const summary = await getClientDashboardSummary(userId);
    return NextResponse.json(summary);
  } catch (error) {
    return internalServerError("dashboard-summary-get", error, "Impossible de charger le cockpit client");
  }
}
