import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProspectAnalytics } from "@/lib/prospect-analytics";
import { internalServerError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const analytics = await getProspectAnalytics(30);

    return NextResponse.json(analytics);
  } catch (error) {
    return internalServerError("prospect-analytics", error, "Erreur lors du chargement des analytics");
  }
}
