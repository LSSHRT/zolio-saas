import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;

    // Verify ownership
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, userId }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: clientId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE client:", error);
    return NextResponse.json({ error: "Impossible de supprimer le client" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;
    const body = await request.json();

    // Verify ownership
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, userId }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        nom: body.nom || existingClient.nom,
        email: body.email || existingClient.email,
        telephone: body.telephone || existingClient.telephone,
        adresse: body.adresse || existingClient.adresse,
      }
    });

    return NextResponse.json({
      id: updatedClient.id,
      nom: updatedClient.nom,
      email: updatedClient.email,
      telephone: updatedClient.telephone,
      adresse: updatedClient.adresse,
      dateAjout: updatedClient.createdAt.toLocaleDateString("fr-FR")
    });
  } catch (error) {
    console.error("Erreur PUT client:", error);
    return NextResponse.json({ error: "Impossible de modifier le client" }, { status: 500 });
  }
}
