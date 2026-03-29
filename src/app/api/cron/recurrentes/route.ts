import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { internalServerError, jsonError } from "@/lib/http";
import { processRecurrentInvoices } from "@/lib/recurrentes";

export const dynamic = "force-dynamic";

/**
 * Endpoint CRON pour générer les factures récurrentes échues.
 *
 * Sécurité : nécessite soit un header `Authorization: Bearer <CRON_SECRET>`,
 * soit un utilisateur admin connecté (pour les tests manuels).
 */
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

    const failed = results.filter((r) => r.error);
    const message =
      processed > 0
        ? `${processed} facture${processed > 1 ? "s" : ""} générée${processed > 1 ? "s" : ""} depuis les récurrentes.`
        : "Aucune facture récurrente à traiter.";

    return NextResponse.json({
      message,
      processed,
      total: results.length,
      failed: failed.length,
      results,
    });
  } catch (error) {
    return internalServerError(
      "cron-recurrentes",
      error,
      "Erreur lors du traitement des factures récurrentes",
    );
  }
}
