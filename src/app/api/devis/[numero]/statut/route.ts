import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { parseLignes, type LignePayload } from "@/lib/devis-lignes";

function getLineName(line: LignePayload) {
  if (typeof line.nomPrestation === "string" && line.nomPrestation.trim().length > 0) {
    return line.nomPrestation;
  }

  return "";
}

function getLineQuantity(line: LignePayload) {
  const quantity = Number.parseInt(String(line.quantite ?? 1), 10);
  return Number.isNaN(quantity) || quantity <= 0 ? 1 : quantity;
}

export async function PATCH(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { statut } = await request.json();

    if (!statut) return new NextResponse("Statut manquant", { status: 400 });

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { lignesNorm: { orderBy: { position: "asc" } } },
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const previousStatut = devis.statut;
    const isNewSale =
      (statut === "Facturé" || statut === "Payé") && previousStatut !== "Facturé" && previousStatut !== "Payé";
    const isCancelSale =
      (previousStatut === "Facturé" || previousStatut === "Payé") &&
      statut !== "Facturé" &&
      statut !== "Payé";

    // Utilise lignesNorm si disponible, sinon fallback sur JSON
    const lignes: LignePayload[] = devis.lignesNorm.length > 0
      ? devis.lignesNorm.map((ligne) => ({
          isOptional: ligne.isOptional,
          nomPrestation: ligne.nomPrestation,
          prixUnitaire: ligne.prixUnitaire,
          quantite: ligne.quantite,
          totalLigne: ligne.totalLigne,
          tva: ligne.tva,
          unite: ligne.unite,
        }))
      : parseLignes(devis.lignes);

    if (isNewSale || isCancelSale) {
      for (const ligne of lignes) {
        const nomPrestation = getLineName(ligne);

        if (ligne.isOptional || !nomPrestation) {
          continue;
        }

        const prestation = await prisma.prestation.findFirst({
          where: { userId, nom: nomPrestation },
        });

        if (prestation?.stock === null || prestation?.stock === undefined) {
          continue;
        }

        const quantity = getLineQuantity(ligne);
        const nextStock = isNewSale ? prestation.stock - quantity : prestation.stock + quantity;

        await prisma.prestation.update({
          where: { id: prestation.id },
          data: { stock: nextStock },
        });
      }
    }

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: { statut },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("devis-statut", error, "Impossible de modifier le statut");
  }
}
