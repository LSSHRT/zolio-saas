import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const depenses = await prisma.depense.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const mapped = depenses.map((d: any) => ({
      id: d.id,
      description: d.description,
      montant: d.montant,
      date: d.date.toISOString().split('T')[0],
      categorie: d.categorie || ""
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return internalServerError("depenses-get", error, "Impossible de récupérer les dépenses");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { description, montant, date, categorie } = body;

    const depense = await prisma.depense.create({
      data: {
        userId,
        description,
        montant: parseFloat(montant),
        date: new Date(date || new Date()),
        categorie: categorie || ""
      }
    });

    return NextResponse.json({
      id: depense.id,
      description: depense.description,
      montant: depense.montant,
      date: depense.date.toISOString().split('T')[0],
      categorie: depense.categorie || ""
    });
  } catch (error) {
    return internalServerError("depenses-post", error, "Impossible d'ajouter la dépense");
  }
}
