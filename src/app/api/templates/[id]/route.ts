import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeLigneForOutput } from "@/lib/devis-lignes";
import { templateUpdateSchema, zodErrorResponse } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { id } = await params;

    const template = await prisma.devisTemplate.findFirst({
      where: { id, userId },
      include: { lignes: { orderBy: { position: "asc" } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

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
    });
  } catch (error) {
    return internalServerError("templates-get-one", error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-put:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { id } = await params;

    const existing = await prisma.devisTemplate.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = templateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const data = parsed.data;

    // Build update payload for template fields
    const updateData: Record<string, unknown> = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tva !== undefined) updateData.tva = data.tva;
    if (data.remise !== undefined) updateData.remise = data.remise;

    const template = await prisma.$transaction(async (tx) => {
      if (data.lignes) {
        await tx.ligneTemplate.deleteMany({ where: { templateId: id } });
        await tx.ligneTemplate.createMany({
          data: data.lignes.map((ligne, index) => ({
            templateId: id,
            nomPrestation: ligne.nomPrestation,
            unite: ligne.unite,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            tva: ligne.tva,
            isOptional: ligne.isOptional,
            position: index,
          })),
        });
      }

      return tx.devisTemplate.update({
        where: { id },
        data: updateData,
        include: { lignes: { orderBy: { position: "asc" } } },
      });
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
    });
  } catch (error) {
    return internalServerError("templates-put", error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`templates-delete:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { id } = await params;

    const existing = await prisma.devisTemplate.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    // LigneTemplate has cascade delete, so this handles everything
    await prisma.devisTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("templates-delete", error);
  }
}
