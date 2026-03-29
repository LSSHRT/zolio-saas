import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import { getLineTotal } from "@/lib/devis-lignes";
import { templateUseSchema, zodErrorResponse } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-use:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { id } = await params;

    // Load template with lignes
    const template = await prisma.devisTemplate.findFirst({
      where: { id, userId },
      include: { lignes: { orderBy: { position: "asc" } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = templateUseSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { clientId } = parsed.data;

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Generate devis from template
    let devis: { id: string; numero: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const numero = await generateSequentialDocumentNumber({
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
        devis = await prisma.devis.create({
          data: {
            userId,
            numero,
            client: { connect: { id: clientId } },
            remise: template.remise,
            acompte: 0,
            tva: template.tva,
            statut: "En attente",
          },
        });

        // Create LigneDevis from LigneTemplate
        await prisma.ligneDevis.createMany({
          data: template.lignes.map((ligne, index) => ({
            devisId: devis!.id,
            nomPrestation: ligne.nomPrestation,
            unite: ligne.unite,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            totalLigne: getLineTotal({
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
            }),
            tva: ligne.tva,
            isOptional: ligne.isOptional,
            position: index,
          })),
        });

        break;
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

        if (!isUniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    if (!devis) {
      throw new Error("Impossible de créer le devis depuis le modèle");
    }

    return NextResponse.json({ numero: devis.numero }, { status: 201 });
  } catch (error) {
    return internalServerError("templates-use", error);
  }
}
