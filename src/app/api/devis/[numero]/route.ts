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

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      clientId: devis.clientId,
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes: typeof devis.lignes === 'string' ? JSON.parse(devis.lignes) : devis.lignes,
      remise: devis.remise,
      acompte: devis.acompte,
      tva: devis.tva,
      signature: devis.signature || "",
      photos: typeof devis.photos === 'string' ? JSON.parse(devis.photos) : (devis.photos || []),
      dateDebut: devis.dateDebut ? devis.dateDebut.toISOString().split('T')[0] : "",
      dateFin: devis.dateFin ? devis.dateFin.toISOString().split('T')[0] : ""
    });
  } catch (error) {
    console.error("Erreur GET devis detaillé:", error);
    return NextResponse.json({ error: "Impossible de récupérer le devis" }, { status: 500 });
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

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        clientId: finalClientId,
        lignes: typeof lignes === 'string' ? JSON.parse(lignes) : lignes,
        remise: parseFloat(remise || 0),
        acompte: parseFloat(acompte || 0),
        tva: parseFloat(tva || 0),
        statut: statut || "En attente",
        signature: "", // reset signature on edit
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || [])
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT devis:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le devis" }, { status: 500 });
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
    return NextResponse.json({ error: "Impossible de supprimer le devis" }, { status: 500 });
  }
}