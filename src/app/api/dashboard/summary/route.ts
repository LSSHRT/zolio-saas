import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClientDashboardSummary } from "@/lib/client-dashboard";
import { internalServerError } from "@/lib/http";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const summary = await getClientDashboardSummary(userId);
    return NextResponse.json(summary);
  } catch (error) {
    return internalServerError("dashboard-summary-get", error, "Impossible de charger le cockpit client");
  }
}
