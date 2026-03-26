import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_FACTURE_STATUSES = new Set(["Émise", "Payée", "En retard"]);

type FactureStatusPayload = {
  statut?: string;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const p = await params;
    const numero = p.numero;
    const body = (await request.json()) as FactureStatusPayload;
    const statut = typeof body.statut === "string" ? body.statut.trim() : "";

    if (!statut) {
      return jsonError("Statut manquant", 400);
    }

    if (!ALLOWED_FACTURE_STATUSES.has(statut)) {
      return jsonError("Statut de facture invalide", 400);
    }

    const facture = await prisma.facture.findFirst({ where: { numero, userId } });
    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }

    const updated = await prisma.facture.update({
      where: { id: facture.id },
      data: { statut },
    });

    return NextResponse.json({ success: true, statut: updated.statut });
  } catch (error) {
    return internalServerError("facture-patch", error, "Impossible de mettre à jour la facture");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const p = await params;
    const numero = p.numero;

    const existingFacture = await prisma.facture.findFirst({
      where: { numero, userId },
    });

    if (!existingFacture) {
      return jsonError("Facture non trouvée ou non autorisée", 404);
    }

    await prisma.facture.delete({
      where: { id: existingFacture.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("facture-delete", error, "Impossible de supprimer la facture");
  }
}
