import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, Decimal } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { depenseCreateSchema, zodErrorResponse } from "@/lib/validations";

type DepenseRecord = {
  id: string;
  description: string;
  montant: number | Decimal;
  date: Date;
  categorie?: string | null;
};




function mapDepense(depense: DepenseRecord) {
  const montant = depense.montant instanceof Decimal ? depense.montant.toNumber() : depense.montant;
  return {
    id: depense.id,
    description: depense.description,
    montant: montant,
    montantTTC: montant,
    tvaDeductible: 0,
    date: depense.date.toISOString().split("T")[0],
    categorie: depense.categorie || "",
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const [depenses, total] = await Promise.all([
      prisma.depense.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.depense.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      data: depenses.map(mapDepense),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
