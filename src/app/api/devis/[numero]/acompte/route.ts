import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { parseNumber } from "@/lib/devis-lignes";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { numero } = await params;
    const body = await request.json();
    const tauxAcompte = Number(body.tauxAcompte ?? 30);

    if (isNaN(tauxAcompte) || tauxAcompte <= 0 || tauxAcompte > 100) {
      return NextResponse.json({ error: "Taux invalide (1-100%)" }, { status: 400 });
    }

    const devis = await prisma.devis.findFirst({
      where: { userId, numero },
      include: {
        client: true,
        lignesNorm: true,
        factures: true,
      },
    });

    if (!devis) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    if (devis.statut !== "Accepté" && devis.statut !== "Signé") {
      return NextResponse.json(
        { error: "Le devis doit être accepté ou signé" },
        { status: 400 },
      );
    }

    if (devis.factures && devis.factures.length > 0) {
      return NextResponse.json(
        { error: "Une facture existe déjà pour ce devis" },
        { status: 409 },
      );
    }

    const taux = tauxAcompte / 100;
    const tvaPct = parseNumber(devis.tva);
    const totalHT = devis.lignesNorm?.reduce((s, l) => s + parseNumber(l.prixUnitaire) * parseNumber(l.quantite), 0) ?? 0;
    const totalTTC = +(totalHT * (1 + tvaPct / 100)).toFixed(2);

    const acompteHT = +(+totalHT * taux).toFixed(2);
    const acompteTTC = +(+totalTTC * taux).toFixed(2);
    const acompteTVA = +(acompteTTC - acompteHT).toFixed(2);

    const today = new Date();
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const facture = await prisma.facture.create({
      data: {
        numero: `AC-${Date.now()}`,
        userId,
        devisId: devis.id,
        nomClient: devis.client?.nom ?? "Client",
        emailClient: devis.client?.email ?? "",
        totalHT: acompteHT,
        tva: acompteTVA,
        totalTTC: acompteTTC,
        statut: "Émise",
        date: today,
        dateEcheance: dueDate,
      },
    });

    return NextResponse.json({
      success: true,
      facture: {
        numero: facture.numero,
        totalHT: facture.totalHT,
        totalTTC: facture.totalTTC,
        tauxAcompte,
      },
    });
  } catch (error) {
    console.error("acompte-create-error", error);
    return NextResponse.json(
      { error: "Erreur création facture d'acompte" },
      { status: 500 },
    );
  }
}
