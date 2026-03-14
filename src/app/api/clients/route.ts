import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const mappedClients = clients.map((c: any) => ({
      id: c.id,
      nom: c.nom,
      email: c.email || "",
      telephone: c.telephone || "",
      adresse: c.adresse || "",
      dateAjout: c.createdAt.toLocaleDateString("fr-FR"),
    }));

    return NextResponse.json(mappedClients);
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json({ error: "Impossible de récupérer les clients", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();

    if (Array.isArray(body)) {
      const data = body.map(item => ({
        userId,
        nom: item.nom,
        email: item.email || "",
        telephone: item.telephone || "",
        adresse: item.adresse || "",
      }));
      await prisma.client.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const { nom, email, telephone, adresse } = body;
    const client = await prisma.client.create({
      data: { userId, nom, email, telephone, adresse }
    });

    return NextResponse.json({
      id: client.id,
      nom: client.nom,
      email: client.email || "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      dateAjout: client.createdAt.toLocaleDateString("fr-FR")
    });
  } catch (error: any) {
    console.error("Erreur POST client:", error);
    return NextResponse.json({ error: "Impossible d'ajouter le client", details: error.message || String(error) }, { status: 500 });
  }
}