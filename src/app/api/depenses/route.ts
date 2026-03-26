import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type DepenseRecord = {
  id: string;
  description: string;
  montant: number;
  date: Date;
  categorie?: string | null;
};

type DepensePayload = {
  categorie?: unknown;
  date?: unknown;
  description?: unknown;
  montant?: unknown;
  montantTTC?: unknown;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: unknown, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDate(value: unknown) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapDepense(depense: DepenseRecord) {
  return {
    id: depense.id,
    description: depense.description,
    montant: depense.montant,
    montantTTC: depense.montant,
    tvaDeductible: 0,
    date: depense.date.toISOString().split("T")[0],
    categorie: depense.categorie || "",
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const depenses = await prisma.depense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(depenses.map(mapDepense));
  } catch (error) {
    return internalServerError("depenses-get", error, "Impossible de récupérer les dépenses");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const body = (await request.json()) as DepensePayload;
    const description = normalizeText(body.description);
    const categorie = normalizeText(body.categorie);
    const montant = parseAmount(body.montant ?? body.montantTTC);
    const date = parseDate(body.date);

    if (!description) {
      return jsonError("La description est obligatoire", 400);
    }

    if (!Number.isFinite(montant) || montant <= 0) {
      return jsonError("Le montant doit être supérieur à 0", 400);
    }

    if (!date) {
      return jsonError("La date de dépense est invalide", 400);
    }

    const depense = await prisma.depense.create({
      data: {
        userId,
        description,
        montant,
        date,
        categorie,
      },
    });

    return NextResponse.json(mapDepense(depense));
  } catch (error) {
    return internalServerError("depenses-post", error, "Impossible d'ajouter la dépense");
  }
}
