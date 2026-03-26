import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { buildPrestationCreateData, mapPrestationForClient } from "@/lib/prestations";

type PrestationPayload = {
  categorie?: string | null;
  cout?: number | string | null;
  description?: string | null;
  nom?: string;
  prix?: number | string;
  stock?: number | string | null;
  unite?: string | null;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const body = (await request.json()) as PrestationPayload;

    if (typeof body.nom !== "string" || !body.nom.trim()) {
      return jsonError("Nom de la prestation requis", 400);
    }

    if (body.prix === undefined || body.prix === null || Number.isNaN(Number(body.prix))) {
      return jsonError("Prix invalide", 400);
    }

    const updatePayload = buildPrestationCreateData(userId, {
      nom: body.nom,
      prix: body.prix,
      categorie: body.categorie,
      cout: body.cout,
      description: body.description,
      stock: body.stock,
      unite: body.unite,
    });

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
