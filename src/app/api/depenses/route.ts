import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

type DepenseRecord = {
  id: string;
  description: string;
  montant: number;
  date: Date;
  categorie?: string | null;
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const depenses = await prisma.depense.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const mapped = depenses.map((d: DepenseRecord) => ({
      id: d.id,
      description: d.description,
      montant: d.montant,
      montantTTC: d.montant,
      tvaDeductible: 0,
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
    const { description, montant, montantTTC, date, categorie } = body;
    const finalMontant = parseFloat(String(montant ?? montantTTC ?? 0));

    const depense = await prisma.depense.create({
      data: {
        userId,
        description,
        montant: finalMontant,
        date: new Date(date || new Date()),
        categorie: categorie || ""
      }
    });

    return NextResponse.json({
      id: depense.id,
      description: depense.description,
      montant: depense.montant,
      montantTTC: depense.montant,
      tvaDeductible: 0,
      date: depense.date.toISOString().split('T')[0],
      categorie: depense.categorie || ""
    });
  } catch (error) {
    return internalServerError("depenses-post", error, "Impossible d'ajouter la dépense");
  }
}
