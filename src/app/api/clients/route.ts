import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientCreateSchema, clientBulkSchema, zodErrorResponse } from "@/lib/validations";

type ClientRecord = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: Date;
};

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

    const json = await request.json();

    if (Array.isArray(json)) {
      const parsed = clientBulkSchema.safeParse(json);
      if (!parsed.success) return zodErrorResponse(parsed.error);

      const data = parsed.data.map((item) => ({
        userId,
        nom: item.nom,
        email: item.email || "",
        telephone: item.telephone || "",
        adresse: item.adresse || "",
      }));

      await prisma.client.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const parsed = clientCreateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const client = await prisma.client.create({
      data: {
        userId,
        nom: parsed.data.nom,
        email: parsed.data.email || "",
        telephone: parsed.data.telephone || "",
        adresse: parsed.data.adresse || "",
      },
    });

    return NextResponse.json(mapClient(client));
  } catch (error) {
    return internalServerError("clients-post", error, "Impossible d'ajouter le client");
  }
}
