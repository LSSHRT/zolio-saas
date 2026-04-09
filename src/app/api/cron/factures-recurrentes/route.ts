import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { internalServerError, jsonError } from "@/lib/http";
import { processRecurrentInvoices } from "@/lib/recurrentes";

export const dynamic = "force-dynamic";
// Autoriser une exécution un peu plus longue si beaucoup de factures
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");
    const isCronTrigger = Boolean(
      cronSecret && authorization === `Bearer ${cronSecret}`,
    );

    let isAdminTrigger = false;
    if (!isCronTrigger) {
      const user = await currentUser();
      isAdminTrigger = isAdminUser(user);
    }

    if (!isCronTrigger && !isAdminTrigger) {
      return jsonError("Non autorisé", 403);
    }

    const { processed, results } = await processRecurrentInvoices();
    const failed = results.filter((result) => result.error);

    return NextResponse.json({
      message:
        processed > 0
          ? `${processed} facture${processed > 1 ? "s" : ""} générée${processed > 1 ? "s" : ""}.`
          : "Aucune facture récurrente à traiter aujourd'hui.",
      processed,
      total: results.length,
      failed: failed.length,
      results,
    });
  } catch (error) {
    return internalServerError(
      "cron-factures-recurrentes",
      error,
      "Erreur lors du traitement des factures récurrentes",
    );
  }
}
