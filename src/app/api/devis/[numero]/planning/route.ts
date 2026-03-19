import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { dateDebut, dateFin } = await request.json();

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("devis-planning", error, "Impossible de sauvegarder le planning");
  }
}
