export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ numero: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const body = await request.json().catch(() => ({}));
    const notes = typeof body.notes === "string" ? body.notes : "";

    const facture = await prisma.facture.findFirst({
      where: { numero, userId },
      select: { id: true },
    });

    if (!facture) return jsonError("Facture introuvable", 404);

    await prisma.facture.update({
      where: { id: facture.id },
      data: { notes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("facture-notes-patch", error, "Impossible de mettre à jour les notes");
  }
}
