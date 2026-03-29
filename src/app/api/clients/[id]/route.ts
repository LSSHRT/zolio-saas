import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientUpdateSchema, zodErrorResponse } from "@/lib/validations";

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

    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, userId }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = clientUpdateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(parsed.data.nom !== undefined && { nom: parsed.data.nom }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.telephone !== undefined && { telephone: parsed.data.telephone }),
        ...(parsed.data.adresse !== undefined && { adresse: parsed.data.adresse }),
      }
    });

    return NextResponse.json(mapClient(updatedClient));
  } catch (error) {
    return internalServerError("client-put", error, "Impossible de modifier le client");
  }
}
