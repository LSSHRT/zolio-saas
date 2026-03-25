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

    return NextResponse.json(summary, {
      headers: {
        // Cache côté CDN pendant 30 secondes, le client peut utiliser le cache 10s
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    return internalServerError("dashboard-summary-get", error, "Impossible de charger le cockpit client");
  }
}
