import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { generateSequentialDocumentNumber } from "@/lib/document-number";

const prisma = new PrismaClient();

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

    // Calculate totals
    let totalHT = 0;
    const lignes = devis.lignes as Array<{ quantite?: number; prixHT?: number; prixUnitaire?: number }>;
    if (Array.isArray(lignes)) {
      totalHT = lignes.reduce((acc, l) => {
        const q = l.quantite || 0;
        const p = l.prixUnitaire ?? l.prixHT ?? 0;
        return acc + (q * p);
      }, 0);
    }
    if (devis.remise) {
      totalHT = totalHT * (1 - devis.remise / 100);
    }
    const tvaAmount = totalHT * ((devis.tva || 0) / 100);
    const totalTTC = totalHT + tvaAmount;

    // Create Facture and update Devis in a transaction
    const [facture] = await prisma.$transaction([
      prisma.facture.create({
        data: {
          userId,
          numero: newNumero,
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
    console.error("Error converting devis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
