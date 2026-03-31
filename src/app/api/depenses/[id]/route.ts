import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deleted = await prisma.depense.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return jsonError("Dépense non trouvée ou non autorisée", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("depense-delete", error, "Impossible de supprimer la dépense");
  }
}
