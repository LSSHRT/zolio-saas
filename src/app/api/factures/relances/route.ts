import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkOverdueFactures } from "@/lib/relances";
import { internalServerError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST — Vérifier et envoyer les relances de factures impayées
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const results = await checkOverdueFactures(userId);

    return NextResponse.json({
      success: true,
      message: `${results.length} action(s) effectuée(s)`,
      results,
    });
  } catch (error) {
    return internalServerError("relances-factures", error, "Erreur lors de la vérification des relances");
  }
}
