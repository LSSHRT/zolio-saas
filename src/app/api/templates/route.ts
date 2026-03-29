import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getLineTotal, normalizeLigneForOutput } from "@/lib/devis-lignes";
import { templateCreateSchema, zodErrorResponse } from "@/lib/validations";

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const templates = await prisma.devisTemplate.findMany({
      where: { userId },
      include: { lignes: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    const result = templates.map((tpl) => {
      const lignesNorm = tpl.lignes.map((ligne) => normalizeLigneForOutput({
        nomPrestation: ligne.nomPrestation,
        unite: ligne.unite,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tva: ligne.tva,
        isOptional: ligne.isOptional,
      }));
      const totalHT = lignesNorm
        .filter((l) => !l.isOptional)
        .reduce((sum, l) => sum + l.totalLigne, 0);
      return {
        id: tpl.id,
        nom: tpl.nom,
        description: tpl.description,
        tva: tpl.tva,
        remise: tpl.remise,
        lignes: lignesNorm,
        totalHT,
        createdAt: tpl.createdAt.toISOString(),
        updatedAt: tpl.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return internalServerError("templates-get", error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-post:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = templateCreateSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { nom, description, tva, remise, lignes } = parsed.data;

    const template = await prisma.devisTemplate.create({
      data: {
        userId,
        nom,
        description,
        tva,
        remise,
        lignes: {
          create: lignes.map((ligne, index) => ({
            nomPrestation: ligne.nomPrestation,
            unite: ligne.unite,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            tva: ligne.tva,
            isOptional: ligne.isOptional,
            position: index,
          })),
        },
      },
      include: { lignes: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({
      id: template.id,
      nom: template.nom,
      description: template.description,
      tva: template.tva,
      remise: template.remise,
      lignes: template.lignes.map((ligne) => normalizeLigneForOutput({
        nomPrestation: ligne.nomPrestation,
        unite: ligne.unite,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        tva: ligne.tva,
        isOptional: ligne.isOptional,
      })),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    return internalServerError("templates-post", error);
  }
}
