import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import { createLignesForDevis } from "@/lib/devis-lignes";

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { lignesNorm: { orderBy: { position: "asc" } } },
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    // Récupérer les lignes source (normalisées en priorité)
    const lignesSource = devis.lignesNorm.length > 0
      ? devis.lignesNorm.map((ligne) => ({
          isOptional: ligne.isOptional,
          nomPrestation: ligne.nomPrestation,
          prixUnitaire: ligne.prixUnitaire,
          quantite: ligne.quantite,
          totalLigne: ligne.totalLigne,
          tva: ligne.tva,
          unite: ligne.unite,
        }))
      : [];

    let newDevis;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nextNumero = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId,
        findLatest: (basePrefix) =>
          prisma.devis.findFirst({
            where: { userId, numero: { startsWith: basePrefix } },
            orderBy: { numero: "desc" },
            select: { numero: true },
          }),
      });

      try {
        newDevis = await prisma.devis.create({
          data: {
            userId,
            numero: nextNumero,
            clientId: devis.clientId,
            remise: devis.remise,
            acompte: devis.acompte,
            tva: devis.tva,
            photos: devis.photos ? JSON.parse(JSON.stringify(devis.photos)) : [],
            statut: "En attente",
          },
        });

        // Dupliquer les lignes normalisées
        if (lignesSource.length > 0) {
          await createLignesForDevis(newDevis.id, lignesSource);
        }

        break;
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

        if (!isUniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    if (!newDevis) {
      throw new Error("Impossible de dupliquer le devis");
    }

    return NextResponse.json({ success: true, numero: newDevis.numero });
  } catch (error) {
    return internalServerError("devis-duplicate", error, "Impossible de dupliquer le devis");
  }
}
