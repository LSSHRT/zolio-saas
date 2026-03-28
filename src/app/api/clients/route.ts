import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type ClientRecord = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: Date;
};

type ClientPayload = {
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapClient(client: ClientRecord) {
  return {
    id: client.id,
    nom: client.nom,
    email: client.email || "",
    telephone: client.telephone || "",
    adresse: client.adresse || "",
    dateAjout: client.createdAt.toLocaleDateString("fr-FR"),
  };
}

function toCreateInput(userId: string, payload: ClientPayload) {
  const nom = normalizeText(payload.nom);

  if (!nom) {
    return null;
  }

  return {
    userId,
    nom,
    email: normalizeText(payload.email),
    telephone: normalizeText(payload.telephone),
    adresse: normalizeText(payload.adresse),
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`clients-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients.map(mapClient));
  } catch (error) {
    return internalServerError("clients-get", error, "Impossible de récupérer les clients");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`clients-post:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = (await request.json()) as ClientPayload | ClientPayload[];

    if (Array.isArray(body)) {
      const data = body
        .map((item) => toCreateInput(userId, item))
        .filter((item): item is NonNullable<ReturnType<typeof toCreateInput>> => item !== null);

      if (data.length === 0) {
        return NextResponse.json({ error: "Aucun client valide à importer" }, { status: 400 });
      }

      await prisma.client.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const createInput = toCreateInput(userId, body);

    if (!createInput) {
      return NextResponse.json({ error: "Nom du client requis" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: createInput,
    });

    return NextResponse.json(mapClient(client));
  } catch (error) {
    return internalServerError("clients-post", error, "Impossible d'ajouter le client");
  }
}
