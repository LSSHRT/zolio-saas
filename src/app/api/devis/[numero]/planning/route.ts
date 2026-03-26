import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

function parseOptionalDate(value: unknown) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { dateDebut, dateFin } = await request.json();

    const parsedDateDebut = parseOptionalDate(dateDebut);
    const parsedDateFin = parseOptionalDate(dateFin);

    if ((dateDebut && !parsedDateDebut) || (dateFin && !parsedDateFin)) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    if (parsedDateDebut && parsedDateFin && parsedDateFin < parsedDateDebut) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      select: { id: true },
    });

    if (!devis) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    await prisma.devis.update({
      where: { id: devis.id },
      data: {
        dateDebut: parsedDateDebut,
        dateFin: parsedDateFin,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("devis-planning", error, "Impossible de sauvegarder le planning");
  }
}
