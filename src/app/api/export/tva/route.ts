import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { searchParams } = new URL(request.url);
    const anneeParam = searchParams.get("annee");
    const trimestreParam = searchParams.get("trimestre");

    if (!anneeParam) {
      return NextResponse.json({ error: "Le paramètre 'annee' est requis" }, { status: 400 });
    }

    const annee = Number.parseInt(anneeParam, 10);
    if (Number.isNaN(annee) || annee < 2000 || annee > 2100) {
      return NextResponse.json({ error: "Année invalide" }, { status: 400 });
    }

    let dateDebut: Date;
    let dateFin: Date;
    let periode: string;

    if (trimestreParam) {
      const trimestre = Number.parseInt(trimestreParam, 10);
      if (trimestre < 1 || trimestre > 4) {
        return NextResponse.json({ error: "Trimestre invalide (1-4)" }, { status: 400 });
      }

      const moisDebut = (trimestre - 1) * 3;
      dateDebut = new Date(annee, moisDebut, 1);
      dateFin = new Date(annee, moisDebut + 3, 0, 23, 59, 59, 999);
      periode = `T${trimestre} ${annee}`;
    } else {
      dateDebut = new Date(annee, 0, 1);
      dateFin = new Date(annee, 11, 31, 23, 59, 59, 999);
      periode = `Année ${annee}`;
    }

    // TVA collectée : somme de (totalTTC - totalHT) sur les factures payées dans la période
    const facturesPayees = await prisma.facture.findMany({
      where: {
        userId,
        statut: "Payée",
        date: { gte: dateDebut, lte: dateFin },
      },
      select: { totalHT: true, totalTTC: true },
    });

    const tvaCollectee = facturesPayees.reduce(
      (sum, f) => sum + (Number(f.totalTTC) - Number(f.totalHT)),
      0
    );

    // TVA sur dépenses : somme des dépenses dans la période (on estime 20% de TVA)
    const depenses = await prisma.depense.findMany({
      where: {
        userId,
        date: { gte: dateDebut, lte: dateFin },
      },
      select: { montant: true },
    });

    const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
    const tvaDepenses = totalDepenses * 0.2;

    const solde = Math.round((tvaCollectee - tvaDepenses) * 100) / 100;

    return NextResponse.json({
      periode,
      tvaCollectee: Math.round(tvaCollectee * 100) / 100,
      tvaDepenses: Math.round(tvaDepenses * 100) / 100,
      solde,
    });
  } catch (error) {
    return internalServerError("export-tva", error, "Impossible de calculer la TVA");
  }
}
