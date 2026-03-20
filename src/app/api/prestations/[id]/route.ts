import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { buildPrestationCreateData, mapPrestationForClient } from "@/lib/prestations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const body = await request.json();
    const updatePayload = buildPrestationCreateData(userId, body);

    const prestation = await prisma.prestation.updateMany({
      where: { id, userId },
      data: {
        nom: updatePayload.nom,
        description: updatePayload.description,
        unite: updatePayload.unite,
        prix: updatePayload.prix,
        cout: updatePayload.cout,
        stock: updatePayload.stock,
      },
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

    await prisma.prestation.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("prestation-delete", error, "Impossible de supprimer la prestation");
  }
}
