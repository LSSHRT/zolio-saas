export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true }
    });

    if (!devis) return new NextResponse("Devis introuvable", { status: 404 });

    const parsedLignes = typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : (devis.lignes || []);
    const remiseGlobale = devis.remise || 0;
    const tvaGlobale = devis.tva || 0;
    
    const totalHTBase = parsedLignes.filter((l: any) => !l.isOptional).reduce((s: number, l: any) => {
      return s + (l.totalLigne || (l.quantite * l.prixUnitaire) || 0);
    }, 0);
    const totalHT = totalHTBase * (1 - remiseGlobale / 100);

    const totalTTC = parsedLignes.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => {
      const ligneTva = parseFloat(l.tva || tvaGlobale.toString()) || 0;
      const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire) || 0;
      return sum + (ligneTotal * (1 + ligneTva / 100));
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
      photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
      dateDebut: devis.dateDebut ? devis.dateDebut.toISOString().split('T')[0] : "",
      dateFin: devis.dateFin ? devis.dateFin.toISOString().split('T')[0] : ""
    });
  } catch (error) {
    console.error("Erreur GET devis detaillé:", error);
    return NextResponse.json({ error: "Impossible de récupérer le devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
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
        where: { userId, nom: client }
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: client }
        });
        finalClientId = newClient.id;
      }
    }

    const parsedLignesForTotals = typeof lignes === 'string' ? JSON.parse(lignes) : (lignes || []);
    const tvaNum = parseFloat(tva || 0);
    const remiseNum = parseFloat(remise || 0);

    const totalHTBase = parsedLignesForTotals.filter((l: any) => !l.isOptional).reduce((s: number, l: any) => {
      return s + (l.totalLigne || (l.quantite * l.prixUnitaire) || 0);
    }, 0);
    const totalHT = totalHTBase * (1 - remiseNum / 100);
    const totalTTC = parsedLignesForTotals.filter((l: any) => !l.isOptional).reduce((sum: number, l: any) => {
      const ligneTva = parseFloat(l.tva || tvaNum.toString()) || 0;
      const ligneTotal = l.totalLigne || (l.quantite * l.prixUnitaire) || 0;
      return sum + (ligneTotal * (1 + ligneTva / 100));
    }, 0) * (1 - remiseNum / 100);

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        clientId: finalClientId,
        lignes: typeof lignes === 'string' ? JSON.parse(lignes) : lignes,
        remise: remiseNum,
        acompte: parseFloat(acompte || 0),
        tva: tvaNum,
        statut: statut || "En attente",
        signature: "", // reset signature on edit
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || [])
      }
    });

    return NextResponse.json({ success: true, totalHT: totalHT.toFixed(2), totalTTC: totalTTC.toFixed(2) });
  } catch (error) {
    console.error("Erreur PUT devis:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    await prisma.devis.deleteMany({
      where: { numero, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE devis:", error);
    return NextResponse.json({ error: "Impossible de supprimer le devis", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}