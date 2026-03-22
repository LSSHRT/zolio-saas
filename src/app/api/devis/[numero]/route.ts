export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { createPublicDevisToken } from "@/lib/public-devis-token";

type DevisLine = {
  isOptional?: boolean;
  prixUnitaire?: number | string;
  quantite?: number | string;
  totalLigne?: number | string;
  tva?: number | string;
};

type UpdateDevisPayload = {
  acompte?: unknown;
  client?: unknown;
  clientId?: unknown;
  lignes?: unknown;
  photos?: unknown;
  remise?: unknown;
  statut?: unknown;
  tva?: unknown;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLignes(value: unknown): DevisLine[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((line): line is DevisLine => Boolean(line) && typeof line === "object");
}

function parsePhotos(value: unknown) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((photo): photo is string => typeof photo === "string");
}

function getLineTotal(line: DevisLine) {
  if (line.totalLigne !== undefined && line.totalLigne !== null) {
    return parseNumber(line.totalLigne);
  }

  return parseNumber(line.quantite) * parseNumber(line.prixUnitaire);
}

function computeTotals(lines: DevisLine[], defaultTva: number, remise: number) {
  const activeLines = lines.filter((line) => !line.isOptional);
  const totalHTBase = activeLines.reduce((sum, line) => sum + getLineTotal(line), 0);
  const totalHT = totalHTBase * (1 - remise / 100);
  const totalTTC =
    activeLines.reduce((sum, line) => {
      const lineTva = parseNumber(line.tva, defaultTva);
      return sum + getLineTotal(line) * (1 + lineTva / 100);
    }, 0) *
    (1 - remise / 100);

  return { totalHT, totalTTC };
}

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true },
    });

    if (!devis) {
      return jsonError("Devis introuvable", 404);
    }

    const parsedLignes = parseLignes(devis.lignes);
    const remiseGlobale = devis.remise || 0;
    const tvaGlobale = devis.tva || 0;
    const { totalHT, totalTTC } = computeTotals(parsedLignes, tvaGlobale, remiseGlobale);

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      nomClient: devis.client ? devis.client.nom : "",
      emailClient: devis.client ? devis.client.email : "",
      clientId: devis.clientId,
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      lignes: parsedLignes,
      remise: remiseGlobale,
      acompte: devis.acompte,
      tva: `${tvaGlobale}%`,
      totalHT: totalHT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      signature: devis.signature || "",
      signingToken: createPublicDevisToken(devis.numero, userId),
      photos: parsePhotos(devis.photos),
      dateDebut: devis.dateDebut ? devis.dateDebut.toISOString().split("T")[0] : "",
      dateFin: devis.dateFin ? devis.dateFin.toISOString().split("T")[0] : "",
    });
  } catch (error) {
    return internalServerError(
      "devis-detail-get",
      error,
      "Impossible de récupérer le devis",
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const body = (await request.json()) as UpdateDevisPayload;
    const lignes = parseLignes(body.lignes);
    const photos = parsePhotos(body.photos);
    const tvaNum = parseNumber(body.tva);
    const remiseNum = parseNumber(body.remise);
    const acompteNum = parseNumber(body.acompte);
    const statut = normalizeText(body.statut) || "En attente";
    const clientName = normalizeText(body.client);
    let finalClientId = normalizeText(body.clientId) || null;

    if (!finalClientId && clientName) {
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: clientName },
      });
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: clientName },
        });
        finalClientId = newClient.id;
      }
    }

    const { totalHT, totalTTC } = computeTotals(lignes, tvaNum, remiseNum);
    const updateData = {
      ...(finalClientId ? { clientId: finalClientId } : {}),
      lignes,
      remise: remiseNum,
      acompte: acompteNum,
      tva: tvaNum,
      statut,
      signature: "",
      photos,
    };
    const result = await prisma.devis.updateMany({
      where: { numero, userId },
      data: updateData,
    });

    if (result.count === 0) {
      return jsonError("Devis introuvable", 404);
    }

    return NextResponse.json({
      success: true,
      totalHT: totalHT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
    });
  } catch (error) {
    return internalServerError(
      "devis-detail-put",
      error,
      "Impossible de mettre à jour le devis",
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;

    const result = await prisma.devis.deleteMany({
      where: { numero, userId },
    });

    if (result.count === 0) {
      return jsonError("Devis introuvable", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError(
      "devis-detail-delete",
      error,
      "Impossible de supprimer le devis",
    );
  }
}
