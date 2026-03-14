import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const devis = await prisma.devis.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = devis.map((d: any) => ({
      numero: d.numero,
      client: d.client ? d.client.nom : "Inconnu",
      clientId: d.clientId,
      date: d.date.toLocaleDateString("fr-FR"),
      statut: d.statut,
      lignes: typeof d.lignes === 'string' ? JSON.parse(d.lignes) : d.lignes,
      remise: d.remise || 0,
      acompte: d.acompte || 0,
      tva: d.tva || 0,
      signature: d.signature || "",
      photos: typeof d.photos === 'string' ? JSON.parse(d.photos) : (d.photos || []),
      dateDebut: d.dateDebut ? d.dateDebut.toISOString().split('T')[0] : "",
      dateFin: d.dateFin ? d.dateFin.toISOString().split('T')[0] : ""
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET devis:", error);
    return NextResponse.json({ error: "Impossible de récupérer les devis" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { client, clientId, lignes, remise, acompte, tva, photos } = body;

    let finalClientId = clientId;
    if (!finalClientId && client) {
      // Find or create client
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

    const currentYear = new Date().getFullYear();
    
    // Calculate new devis number
    const count = await prisma.devis.count({
       where: { userId, numero: { startsWith: `DEV-${currentYear}-` } }
    });
    const nextNum = count + 1;
    const numero = `DEV-${currentYear}-${String(nextNum).padStart(3, "0")}`;

    const devis = await prisma.devis.create({
      data: {
        userId,
        numero,
        clientId: finalClientId,
        lignes: typeof lignes === 'string' ? JSON.parse(lignes) : lignes,
        remise: parseFloat(remise || 0),
        acompte: parseFloat(acompte || 0),
        tva: parseFloat(tva || 0),
        photos: typeof photos === 'string' ? JSON.parse(photos) : (photos || []),
        statut: "En attente"
      },
      include: { client: true }
    });

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut
    });
  } catch (error) {
    console.error("Erreur POST devis:", error);
    return NextResponse.json({ error: "Impossible de créer le devis" }, { status: 500 });
  }
}