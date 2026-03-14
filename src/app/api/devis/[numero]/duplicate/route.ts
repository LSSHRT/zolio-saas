import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const currentYear = new Date().getFullYear();
    const count = await prisma.devis.count({
       where: { userId, numero: { startsWith: `DEV-${currentYear}-` } }
    });
    const nextNum = count + 1;
    const nextNumero = `DEV-${currentYear}-${String(nextNum).padStart(3, "0")}`;

    const newDevis = await prisma.devis.create({
      data: {
        userId,
        numero: nextNumero,
        clientId: devis.clientId,
        lignes: devis.lignes ? JSON.parse(JSON.stringify(devis.lignes)) : [],
        remise: devis.remise,
        acompte: devis.acompte,
        tva: devis.tva,
        photos: devis.photos ? JSON.parse(JSON.stringify(devis.photos)) : [],
        statut: "En attente"
      }
    });

    return NextResponse.json({ success: true, numero: newDevis.numero });
  } catch (error) {
    console.error("Erreur POST duplicate devis:", error);
    return NextResponse.json({ error: "Impossible de dupliquer le devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}