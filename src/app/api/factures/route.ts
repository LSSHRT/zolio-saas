import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma, Decimal } from "@/lib/prisma";
import { generateFacturePDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, jsonError, logServerError } from "@/lib/http";
import { createNotification } from "@/lib/notifications";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import { factureCreateSchema, zodErrorResponse } from "@/lib/validations";

type FactureLine = {
  isOptional?: boolean;
  nomPrestation?: unknown;
  prixUnitaire?: unknown;
  quantite?: unknown;
  totalLigne?: unknown;
  tva?: unknown;
  unite?: unknown;
};

type FactureRecord = {
  createdAt: Date;
  date: Date;
  devisId: string | null;
  //  | null;
  emailClient: string | null;
  nomClient: string;
  numero: string;
  statut: string;
  totalHT: number | Decimal;
  totalTTC: number | Decimal;
  tva: number | Decimal;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown, fallback = 0): number {
  if (value instanceof Decimal) return value.toNumber();
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseLignes(value: unknown) {
  const parsed = Array.isArray(value) ? value : [];

  return parsed
    .filter((line): line is FactureLine => Boolean(line) && typeof line === "object")
    .map((line) => ({
      isOptional: Boolean(line.isOptional),
      nomPrestation: normalizeText(line.nomPrestation),
      prixUnitaire: parseNumber(line.prixUnitaire),
      quantite: parseNumber(line.quantite),
      totalLigne:
        line.totalLigne === undefined || line.totalLigne === null
          ? parseNumber(line.quantite) * parseNumber(line.prixUnitaire)
          : parseNumber(line.totalLigne),
      tva: normalizeText(line.tva),
      unite: normalizeText(line.unite),
    }))
    .filter((line) => line.nomPrestation && line.quantite > 0 && line.prixUnitaire >= 0);
}

function mapFacture(facture: FactureRecord) {
  return {
    numero: facture.numero,
    date: facture.date.toLocaleDateString("fr-FR"),
    nomClient: facture.nomClient,
    emailClient: facture.emailClient || "",
    totalHT: parseNumber(facture.totalHT),
    tva: parseNumber(facture.tva),
    totalTTC: parseNumber(facture.totalTTC),
    statut: facture.statut,
    // "": "" || "",
    devisId: facture.devisId || "",
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const entreprise = getCompanyProfile(user);
    const rawBody = await request.json();
    const parsed = factureCreateSchema.safeParse(rawBody);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const body = parsed.data;
    const client = {
      nom: body.client.nom,
      email: body.client.email || "",
      telephone: body.client.telephone || "",
      adresse: body.client.adresse || "",
    };
    const lignes = parseLignes(body.lignesNorm || body.lignes);
    const devisNumero = normalizeText(body.devisNumero);
    const totalHT = body.totalHT;
    const totalTTC = body.totalTTC;
    const tva = body.tva;

    if (!client.nom) {
      return jsonError("Le client est obligatoire", 400);
    }

    if (lignes.length === 0) {
      return jsonError("La facture doit contenir au moins une ligne valide", 400);
    }

    if (!Number.isFinite(totalHT) || totalHT < 0) {
      return jsonError("Le total HT est invalide", 400);
    }

    if (!Number.isFinite(totalTTC) || totalTTC <= 0) {
      return jsonError("Le total TTC est invalide", 400);
    }

    if (!Number.isFinite(tva) || tva < 0) {
      return jsonError("Le taux de TVA est invalide", 400);
    }

    const date = new Date();
    let numeroFacture = "";

    // Try to find the devis by numero to link via devisId
    let linkedDevisId: string | null = null;
    if (devisNumero) {
      const linkedDevis = await prisma.devis.findUnique({
        where: { userId_numero: { userId, numero: devisNumero } },
        select: { id: true },
      });
      linkedDevisId = linkedDevis?.id ?? null;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      numeroFacture = await generateSequentialDocumentNumber({
        prefix: "FAC",
        userId,
        findLatest: (basePrefix) =>
          prisma.facture.findFirst({
            where: { userId, numero: { startsWith: basePrefix } },
            orderBy: { numero: "desc" },
            select: { numero: true },
          }),
      });

      try {
        await prisma.facture.create({
          data: {
            userId,
            numero: numeroFacture,
            nomClient: client.nom,
            emailClient: client.email || null,
            totalHT,
            tva,
            totalTTC,
            statut: "Émise",
            devisId: linkedDevisId,
            // "": devisNumero || null,
            date,
          },
        });
        break;
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

        if (!isUniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    if (!numeroFacture) {
      throw new Error("Impossible de créer la facture");
    }

    const formattedDate = date.toLocaleDateString("fr-FR");
    const pdfBuffer = await generateFacturePDF({
      numeroDevis: numeroFacture,
      date: formattedDate,
      client,
      isPro: user?.publicMetadata?.isPro === true,
      entreprise: {
        nom: entreprise.nom,
        email: entreprise.email,
        telephone: entreprise.telephone,
        adresse: entreprise.adresse,
        siret: entreprise.siret,
        color: entreprise.color,
        logo: entreprise.logo,
        iban: entreprise.iban,
        bic: entreprise.bic,
        legal: entreprise.legal,
        statut: entreprise.statut,
        assurance: entreprise.assurance,
      },
      lignes,
      totalHT: totalHT.toFixed(2),
      tva: String(tva),
      totalTTC: totalTTC.toFixed(2),
    });

    let emailSent = false;
    let emailSkippedReason = "";

    if (!client.email) {
      emailSkippedReason = "missing_client_email";
    } else if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      emailSkippedReason = "smtp_not_configured";
    } else {
      try {
        await sendDevisEmail(
          client.email,
          client.nom,
          numeroFacture,
          totalTTC.toFixed(2),
          pdfBuffer,
        );
        emailSent = true;
      } catch (emailError) {
        emailSkippedReason = "send_failed";
        logServerError("factures-post-email", emailError);
      }
    }

    await createNotification({
      userId,
      type: "facture_created",
      title: `Facture ${numeroFacture} créée`,
      description: `Facture de ${totalTTC.toFixed(2)}€ TTC${client ? ` pour ${client}` : ""}.`,
      href: `/factures`,
      tone: "violet",
    });

    return NextResponse.json({
      numeroFacture,
      date: formattedDate,
      client,
      totalHT: totalHT.toFixed(2),
      tva: String(tva),
      totalTTC: totalTTC.toFixed(2),
      lignes,
      statut: "Émise",
      emailSent,
      emailSkippedReason,
    });
  } catch (error) {
    return internalServerError("factures-post", error, "Impossible de créer la facture");
  }
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

    const [facturesDb, total] = await Promise.all([
      prisma.facture.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.facture.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      data: facturesDb.map(mapFacture),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    return internalServerError(
      "factures-get",
      error,
      "Impossible de récupérer les factures",
    );
  }
}
