/**
 * Export Pennylane — Format JSON natif pour import dans Pennylane
 *
 * Pennylane attend un JSON avec :
 * - date (ISO)
 * - reference (numéro de facture)
 * - client_name
 * - client_email
 * - lines (lignes de prestation)
 * - total_ht
 * - total_tva
 * - total_ttc
 * - payment_status
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";
import { parseNumber } from "@/lib/devis-lignes";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { searchParams } = new URL(request.url);
    const annee = searchParams.get("annee");
    if (!annee) return jsonError("Le paramètre 'annee' est requis", 400);

    const year = Number.parseInt(annee, 10);
    if (Number.isNaN(year) || year < 2020 || year > 2030) {
      return jsonError("Année invalide", 400);
    }

    const dateDebut = new Date(year, 0, 1);
    const dateFin = new Date(year, 11, 31, 23, 59, 59, 999);

    const factures = await prisma.facture.findMany({
      where: {
        userId,
        createdAt: { gte: dateDebut, lte: dateFin },
        deletedAt: null,
      },
      include: {
        devis: {
          include: {
            lignesNorm: { orderBy: { position: "asc" } },
            client: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const entries = factures.map((f) => {
      const lignes = f.devis?.lignesNorm?.map((l) => ({
        description: l.nomPrestation,
        quantity: parseNumber(l.quantite, 1),
        unit: l.unite || "U",
        unit_price: parseNumber(l.prixUnitaire),
        total: parseNumber(l.totalLigne),
        tva_rate: Number(l.tva || "20"),
      })) || [];

      const totalHT = parseNumber(f.totalHT);
      const totalTTC = parseNumber(f.totalTTC);
      const tva = totalTTC - totalHT;

      return {
        date: f.createdAt.toISOString().split("T")[0],
        reference: f.numero,
        client_name: f.devis?.client?.nom || f.nomClient || "",
        client_email: f.devis?.client?.email || f.emailClient || "",
        lines: lignes,
        total_ht: totalHT,
        total_tva: tva,
        total_ttc: totalTTC,
        payment_status:
          f.statut === "Payée"
            ? "paid"
            : f.statut === "Annulée"
              ? "cancelled"
              : "pending",
        due_date: f.dateEcheance?.toISOString().split("T")[0] || null,
      };
    });

    return new NextResponse(JSON.stringify(entries, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="zolio-pennylane-${annee}.json"`,
      },
    });
  } catch (error) {
    return jsonError("Erreur lors de l'export", 500);
  }
}
