export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { createPublicDevisToken } from "@/lib/public-devis-token";

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true },
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const parsedLignes =
      typeof devis.lignes === "string" ? JSON.parse(devis.lignes) : (devis.lignes || []);
    const remiseGlobale = devis.remise || 0;
    const tvaGlobale = devis.tva || 0;

    const totalHTBase = parsedLignes
      .filter((line: any) => !line.isOptional)
      .reduce((sum: number, line: any) => {
        return sum + (line.totalLigne || line.quantite * line.prixUnitaire || 0);
      }, 0);
    const totalHT = totalHTBase * (1 - remiseGlobale / 100);

    const totalTTC = parsedLignes
      .filter((line: any) => !line.isOptional)
      .reduce((sum: number, line: any) => {
        const ligneTva = Number.parseFloat(line.tva || tvaGlobale.toString()) || 0;
        const ligneTotal = line.totalLigne || line.quantite * line.prixUnitaire || 0;
        return sum + ligneTotal * (1 + ligneTva / 100);
      }, 0) * (1 - remiseGlobale / 100);

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      nomClient: devis.client ? devis.client.nom : "",
      emailClient: devis.client ? devis.client.email : "",
      clientId: devis.clientId,
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes: parsedLignes,
      remise: remiseGlobale,
      acompte: devis.acompte,
      tva: `${tvaGlobale}%`,
      totalHT: totalHT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      signature: devis.signature || "",
      signingToken: createPublicDevisToken(devis.numero, userId),
      photos: typeof devis.photos === "string" ? JSON.parse(devis.photos) : (devis.photos || []),
      dateDebut: devis.dateDebut ? devis.dateDebut.toISOString().split("T")[0] : "",
      dateFin: devis.dateFin ? devis.dateFin.toISOString().split("T")[0] : "",
    });
  } catch (error) {
    return internalServerError(
      "devis-detail-get",
      error,
      "Impossible de récupérer le devis",
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, statut, photos } = body;

    let finalClientId = clientId;
    if (!finalClientId && client) {
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: client },
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: client },
        });
        finalClientId = newClient.id;
      }
    }

    const parsedLignesForTotals =
      typeof lignes === "string" ? JSON.parse(lignes) : (lignes || []);
    const tvaNum = Number.parseFloat(tva || 0);
    const remiseNum = Number.parseFloat(remise || 0);

    const totalHTBase = parsedLignesForTotals
      .filter((line: any) => !line.isOptional)
      .reduce((sum: number, line: any) => {
        return sum + (line.totalLigne || line.quantite * line.prixUnitaire || 0);
      }, 0);
    const totalHT = totalHTBase * (1 - remiseNum / 100);
    const totalTTC = parsedLignesForTotals
      .filter((line: any) => !line.isOptional)
      .reduce((sum: number, line: any) => {
        const ligneTva = Number.parseFloat(line.tva || tvaNum.toString()) || 0;
        const ligneTotal = line.totalLigne || line.quantite * line.prixUnitaire || 0;
        return sum + ligneTotal * (1 + ligneTva / 100);
      }, 0) * (1 - remiseNum / 100);

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        clientId: finalClientId,
        lignes: typeof lignes === "string" ? JSON.parse(lignes) : lignes,
        remise: remiseNum,
        acompte: Number.parseFloat(acompte || 0),
        tva: tvaNum,
        statut: statut || "En attente",
        signature: "",
        photos: typeof photos === "string" ? JSON.parse(photos) : (photos || []),
      },
    });

    return NextResponse.json({
      success: true,
      totalHT: totalHT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
    });
  } catch (error) {
    return internalServerError(
      "devis-detail-put",
      error,
      "Impossible de mettre à jour le devis",
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    await prisma.devis.deleteMany({
      where: { numero, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError(
      "devis-detail-delete",
      error,
      "Impossible de supprimer le devis",
    );
  }
}
