import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { mapPrestationForClient } from "@/lib/prestations";
import { prestationUpdateSchema, zodErrorResponse } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const json = await request.json();
    const parsed = prestationUpdateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.nom !== undefined) updateData.nom = data.nom.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.unite !== undefined) updateData.unite = data.unite?.trim() || null;
    if (data.prix !== undefined) updateData.prix = Number(data.prix);
    if (data.cout !== undefined) updateData.cout = Number(data.cout);
    if (data.stock !== undefined) updateData.stock = Number(data.stock);

    const prestation = await prisma.prestation.updateMany({
      where: { id, userId },
      data: updateData,
    });

    if (prestation.count === 0) {
      return new NextResponse("Prestation non trouvée", { status: 404 });
    }

    const updatedPrestation = await prisma.prestation.findFirst({
      where: { id, userId },
    });

    return NextResponse.json({
      success: true,
      data: updatedPrestation ? mapPrestationForClient(updatedPrestation) : null,
    });
  } catch (error) {
    return internalServerError("prestation-put", error, "Impossible de modifier la prestation");
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deleted = await prisma.prestation.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return jsonError("Prestation non trouvée ou non autorisée", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("prestation-delete", error, "Impossible de supprimer la prestation");
  }
}
