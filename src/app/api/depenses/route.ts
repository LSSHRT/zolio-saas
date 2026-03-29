import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { depenseCreateSchema, zodErrorResponse } from "@/lib/validations";

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

    const json = await request.json();
    // Backward compat: montantTTC → montant
    if (json.montantTTC !== undefined && json.montant === undefined) {
      json.montant = json.montantTTC;
    }
    const parsed = depenseCreateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { description, montant, categorie, date } = parsed.data;
    const parsedDate = date ? new Date(date) : new Date();

    const depense = await prisma.depense.create({
      data: {
        userId,
        description,
        montant,
        date: parsedDate,
        categorie: categorie || "",
      },
    });

    return NextResponse.json(mapDepense(depense));
  } catch (error) {
    return internalServerError("depenses-post", error, "Impossible d'ajouter la dépense");
  }
}
