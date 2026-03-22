import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

type DevisLine = {
  isOptional?: boolean;
  nom?: string;
  nomPrestation?: string;
  optionnel?: boolean;
  quantite?: number | string;
};

function parseLignes(value: unknown): DevisLine[] {
  if (typeof value === "string") {
    return JSON.parse(value) as DevisLine[];
  }

  if (Array.isArray(value)) {
    return value as DevisLine[];
  }

  return [];
}

function getLineName(line: DevisLine) {
  if (typeof line.nomPrestation === "string" && line.nomPrestation.trim().length > 0) {
    return line.nomPrestation;
  }

  if (typeof line.nom === "string" && line.nom.trim().length > 0) {
    return line.nom;
  }

  return "";
}

function getLineQuantity(line: DevisLine) {
  const quantity = Number.parseInt(String(line.quantite ?? 1), 10);
  return Number.isNaN(quantity) || quantity <= 0 ? 1 : quantity;
}

function isOptionalLine(line: DevisLine) {
  return Boolean(line.isOptional ?? line.optionnel);
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
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const previousStatut = devis.statut;
    const isNewSale =
      (statut === "Facturé" || statut === "Payé") && previousStatut !== "Facturé" && previousStatut !== "Payé";
    const isCancelSale =
      (previousStatut === "Facturé" || previousStatut === "Payé") &&
      statut !== "Facturé" &&
      statut !== "Payé";

    const lignes = parseLignes(devis.lignes);

    if (isNewSale || isCancelSale) {
      for (const ligne of lignes) {
        const nomPrestation = getLineName(ligne);

        if (isOptionalLine(ligne) || !nomPrestation) {
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
