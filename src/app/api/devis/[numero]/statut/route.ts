import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { statut } = await request.json();

    if (!statut) return new NextResponse("Statut manquant", { status: 400 });

    const devis = await prisma.devis.findFirst({
      where: { numero, userId }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    // Handle stock updates if moving to Facturé/Payé from another status
    const previousStatut = devis.statut;
    const isNewSale = (statut === "Facturé" || statut === "Payé") && previousStatut !== "Facturé" && previousStatut !== "Payé";
    const isCancelSale = (previousStatut === "Facturé" || previousStatut === "Payé") && (statut !== "Facturé" && statut !== "Payé");

    const lignes = typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : (devis.lignes || []);

    if (isNewSale) {
      for (const ligne of lignes) {
        if (!ligne.optionnel && ligne.nom) {
          const prestation = await prisma.prestation.findFirst({
            where: { userId, nom: ligne.nom }
          });
          if (prestation && prestation.stock !== null && prestation.stock !== undefined) {
             await prisma.prestation.update({
               where: { id: prestation.id },
               data: { stock: prestation.stock - parseInt(ligne.quantite || "1") }
             });
          }
        }
      }
    } else if (isCancelSale) {
      for (const ligne of lignes) {
        if (!ligne.optionnel && ligne.nom) {
          const prestation = await prisma.prestation.findFirst({
            where: { userId, nom: ligne.nom }
          });
          if (prestation && prestation.stock !== null && prestation.stock !== undefined) {
             await prisma.prestation.update({
               where: { id: prestation.id },
               data: { stock: prestation.stock + parseInt(ligne.quantite || "1") }
             });
          }
        }
      }
    }

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: { statut }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT statut devis:", error);
    return NextResponse.json({ error: "Impossible de modifier le statut" }, { status: 500 });
  }
}