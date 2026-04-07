import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { recurrenteUpdateSchema, zodErrorResponse } from "@/lib/validations";
import { calculateNextDate } from "@/lib/recurrentes";

type RecurrenteRecord = {
  id: string;
  userId: string;
  nom: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
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
    clientId: r.id,
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`recurrentes-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const p = await params;
    const recurrente = await prisma.factureRecurrente.findFirst({
      where: { id: p.id, userId },
      include: { client: { select: { nom: true, email: true } } },
    });

    if (!recurrente) {
      return NextResponse.json({ error: "Facture récurrente non trouvée" }, { status: 404 });
    }

    return NextResponse.json(mapRecurrente(recurrente));
  } catch (error) {
    return internalServerError(
      "recurrente-get",
      error,
      "Impossible de récupérer la facture récurrente",
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`recurrentes-put:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const p = await params;
    const existing = await prisma.factureRecurrente.findFirst({
      where: { id: p.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Facture récurrente non trouvée" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = recurrenteUpdateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const data = parsed.data;

    // Vérifier le client si modifié
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, userId },
      });
      if (!client) {
        return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
      }
    }

    // Recalculer montantTTC si montantHT ou tva changent
    const montantHT = data.montantHT ?? existing.montantHT;
    const tva = data.tva ?? existing.tva;
    const montantTTC = Number((montantHT * (1 + tva / 100)).toFixed(2));

    // Recalculer prochaineDate si frequence ou jourMois changent
    const frequenceChanged = data.frequence && data.frequence !== existing.frequence;
    const jourMoisChanged = data.jourMois !== undefined && data.jourMois !== existing.jourMois;
    let prochaineDate = existing.prochaineDate;
    if (frequenceChanged || jourMoisChanged) {
      prochaineDate = calculateNextDate(
        new Date(),
        data.frequence ?? existing.frequence,
        data.jourMois ?? existing.jourMois,
      );
    }

    const updated = await prisma.factureRecurrente.update({
      where: { id: p.id },
      data: {
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.montantHT !== undefined && { montantHT: data.montantHT }),
        ...(data.tva !== undefined && { tva: data.tva }),
        montantTTC,
        ...(data.frequence !== undefined && { frequence: data.frequence }),
        ...(data.jourMois !== undefined && { jourMois: data.jourMois }),
        prochaineDate,
        ...(data.dateFin !== undefined && {
          dateFin: data.dateFin ? new Date(data.dateFin) : null,
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.actif !== undefined && { actif: data.actif }),
      },
      include: { client: { select: { nom: true, email: true } } },
    });

    return NextResponse.json(mapRecurrente(updated));
  } catch (error) {
    return internalServerError(
      "recurrente-put",
      error,
      "Impossible de modifier la facture récurrente",
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const rl = rateLimit(`recurrentes-delete:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const p = await params;
    const existing = await prisma.factureRecurrente.findFirst({
      where: { id: p.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Facture récurrente non trouvée" }, { status: 404 });
    }

    // Soft delete : on désactive au lieu de supprimer
    await prisma.factureRecurrente.update({
      where: { id: p.id },
      data: { actif: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError(
      "recurrente-delete",
      error,
      "Impossible de désactiver la facture récurrente",
    );
  }
}
