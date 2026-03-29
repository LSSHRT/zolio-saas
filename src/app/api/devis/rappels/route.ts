import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkExpiringDevis } from "@/lib/rappels-devis";
import { jsonError } from "@/lib/http";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const results = await checkExpiringDevis();

    return NextResponse.json({
      success: true,
      message: `${results.length} rappel(s) envoyé(s)`,
      results,
    });
  } catch (error) {
    logError("rappels-error", error);
    return jsonError("Erreur lors des rappels", 500);
  }
}
