import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import { parseLignes, computeTotals } from "@/lib/devis-lignes";
import { logError } from "@/lib/logger";

export async function POST(
  request: Request,
  context: { params: Promise<{ numero: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devis = await prisma.devis.findUnique({
      where: {
        userId_numero: {
          userId,
          numero: params.numero,
        },
      },
      include: {
        client: true,
        lignesNorm: { orderBy: { position: "asc" } },
      },
    });

    if (!devis) {
      return NextResponse.json({ error: "Devis not found" }, { status: 404 });
    }

    if (devis.statut === "Facturé") {
      return NextResponse.json({ error: "Devis already invoiced" }, { status: 400 });
    }

    const newNumero = await generateSequentialDocumentNumber({
      prefix: "FAC",
      userId,
      findLatest: async (basePrefix) => {
        return prisma.facture.findFirst({
          where: {
            userId,
            numero: { startsWith: basePrefix },
          },
          orderBy: { numero: "desc" },
          select: { numero: true },
        });
      },
    });

    // Récupérer les lignes (normalisées en priorité, sinon JSON)
    const lignes = devis.lignesNorm.length > 0
      ? devis.lignesNorm
      : parseLignes(devis.lignes);

    const { totalHT, totalTTC } = computeTotals(
      lignes,
      devis.tva || 0,
      devis.remise || 0,
    );

    // Create Facture and update Devis in a transaction
    const [facture] = await prisma.$transaction([
      prisma.facture.create({
        data: {
          userId,
          numero: newNumero,
          devisId: devis.id,
          devisRef: devis.numero,
          nomClient: devis.client.nom,
          emailClient: devis.client.email,
          totalHT,
          tva: devis.tva || 0,
          totalTTC,
          statut: "Émise",
        },
      }),
      prisma.devis.update({
        where: { id: devis.id },
        data: { statut: "Facturé" },
      }),
    ]);

    return NextResponse.json({ facture }, { status: 201 });
  } catch (error) {
    logError("devis-convert", error, "Error converting devis:");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
