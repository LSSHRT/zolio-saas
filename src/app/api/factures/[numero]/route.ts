import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { sendPushNotification } from "@/lib/push-notifications";
import { factureUpdateSchema, zodErrorResponse } from "@/lib/validations";

export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const p = await params;
    const numero = p.numero;

    const facture = await prisma.facture.findFirst({
      where: { numero, userId },
      include: { devis: { select: { numero: true, statut: true } } },
    });
    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }

    return NextResponse.json({
      id: facture.id,
      numero: facture.numero,
      nomClient: facture.nomClient,
      emailClient: facture.emailClient || "",
      totalHT: facture.totalHT,
      tva: facture.tva,
      totalTTC: facture.totalTTC,
      statut: facture.statut,
      date: facture.date.toISOString(),
      dateEcheance: facture.dateEcheance?.toISOString() || null,
      devisRef: facture.devisRef || facture.devis?.numero || null,
      devisStatut: facture.devis?.statut || null,
      stripePaymentLink: facture.stripePaymentLink || null,
      stripeSessionId: facture.stripeSessionId || null,
      notes: facture.notes || "",
      derniereRelanceNiveau: (facture as any).derniereRelanceNiveau,
      derniereRelanceDate: (facture as any).derniereRelanceDate?.toISOString() || null,
      createdAt: facture.createdAt.toISOString(),
    });
  } catch (error) {
    return internalServerError("facture-get", error, "Impossible de récupérer la facture");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const p = await params;
    const numero = p.numero;
    const parsed = factureUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const statut = typeof parsed.data.statut === "string" ? parsed.data.statut.trim() : "";

    if (!statut) {
      return jsonError("Statut manquant", 400);
    }

    const facture = await prisma.facture.findFirst({ where: { numero, userId } });
    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }

    const updated = await prisma.facture.update({
      where: { id: facture.id },
      data: { statut },
    });

    // Notification si la facture est payée
    if (statut === "Payée" && facture.statut !== "Payée") {
      sendPushNotification(userId, {
        title: "💰 Facture payée !",
        body: `Facture ${numero} — ${facture.totalTTC.toFixed(2)}€ reçus`,
        url: `/factures`,
        tag: `facture-paid-${numero}`,
      }).catch(() => {});
    }

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
