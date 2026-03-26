import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type ClientUpdatePayload = {
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapClient(client: {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: Date;
}) {
  return {
    id: client.id,
    nom: client.nom,
    email: client.email || "",
    telephone: client.telephone || "",
    adresse: client.adresse || "",
    dateAjout: client.createdAt.toLocaleDateString("fr-FR"),
  };
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;

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
    return internalServerError("client-delete", error, "Impossible de supprimer le client");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;
    const body = (await request.json()) as ClientUpdatePayload;

    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, userId }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
    }

    const nextNom = normalizeText(body.nom);

    if (!nextNom) {
      return jsonError("Nom du client requis", 400);
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        nom: nextNom,
        email: normalizeText(body.email),
        telephone: normalizeText(body.telephone),
        adresse: normalizeText(body.adresse),
      }
    });

    return NextResponse.json(mapClient(updatedClient));
  } catch (error) {
    return internalServerError("client-put", error, "Impossible de modifier le client");
  }
}
