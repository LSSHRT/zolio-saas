import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Decimal } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { recurrenteCreateSchema, zodErrorResponse } from "@/lib/validations";
import { calculateNextDate } from "@/lib/recurrentes";

type RecurrenteRecord = {
  id: string;
  nom: string;
  montantHT: any;
  tva: any;
  montantTTC: any;
  frequence: string;
  jourMois: number;
  prochaineDate: Date;
  dateFin: Date | null;
  actif: boolean;
  description: string | null;
  createdAt: Date;
  client: { nom: string; email: string | null };
};

function mapRecurrente(r: RecurrenteRecord) {
  return {
    id: r.id,
    nom: r.nom,
    client: r.client.nom,
    clientId: r.id, // not exposed directly but available if needed
    montantHT: Number(r.montantHT),
    tva: Number(r.tva),
    montantTTC: Number(r.montantTTC),
    frequence: r.frequence,
    jourMois: r.jourMois,
    prochaineDate: r.prochaineDate.toISOString(),
    dateFin: r.dateFin ? r.dateFin.toISOString() : null,
    actif: r.actif,
    description: r.description,
    createdAt: r.createdAt.toLocaleDateString("fr-FR"),
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`recurrentes-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const recurrentes = await prisma.factureRecurrente.findMany({
      where: { userId },
      include: { client: { select: { nom: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurrentes.map(mapRecurrente));
  } catch (error) {
    return internalServerError(
      "recurrentes-get",
      error,
      "Impossible de récupérer les factures récurrentes",
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`recurrentes-post:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const json = await request.json();
    const parsed = recurrenteCreateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const data = parsed.data;

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const montantTTC = Number(
      (data.montantHT * (1 + (data.tva ?? 20) / 100)).toFixed(2),
    );
    const prochaineDate = calculateNextDate(
      new Date(),
      data.frequence,
      data.jourMois ?? 1,
    );

    const recurrente = await prisma.factureRecurrente.create({
      data: {
        userId,
        clientId: data.clientId,
        nom: data.nom,
        montantHT: data.montantHT,
        tva: data.tva ?? 20,
        montantTTC,
        frequence: data.frequence,
        jourMois: data.jourMois ?? 1,
        prochaineDate,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        description: data.description ?? null,
      },
      include: { client: { select: { nom: true, email: true } } },
    });

    return NextResponse.json(mapRecurrente(recurrente), { status: 201 });
  } catch (error) {
    return internalServerError(
      "recurrentes-post",
      error,
      "Impossible de créer la facture récurrente",
    );
  }
}
