import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateFacturePDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, jsonError, logServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { generateSequentialDocumentNumber } from "@/lib/document-number";

type FactureLine = {
  isOptional?: boolean;
  nomPrestation?: unknown;
  prixUnitaire?: unknown;
  quantite?: unknown;
  totalLigne?: unknown;
  tva?: unknown;
  unite?: unknown;
};

type FactureClientPayload = {
  adresse?: unknown;
  email?: unknown;
  nom?: unknown;
  telephone?: unknown;
};

type CreateFacturePayload = {
  client?: unknown;
  devisNumero?: unknown;
  lignes?: unknown;
  totalHT?: unknown;
  totalTTC?: unknown;
  tva?: unknown;
};

type FactureRecord = {
  createdAt: Date;
  date: Date;
  devisId: string | null;
  devisRef: string | null;
  emailClient: string | null;
  nomClient: string;
  numero: string;
  statut: string;
  totalHT: number;
  totalTTC: number;
  tva: number;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseClient(value: unknown) {
  const client = value && typeof value === "object" ? (value as FactureClientPayload) : {};

  return {
    adresse: normalizeText(client.adresse),
    email: normalizeText(client.email),
    nom: normalizeText(client.nom),
    telephone: normalizeText(client.telephone),
  };
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
    totalHT: facture.totalHT,
    tva: facture.tva,
    totalTTC: facture.totalTTC,
    statut: facture.statut,
    devisRef: facture.devisRef || "",
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
    const body = (await request.json()) as CreateFacturePayload;
    const client = parseClient(body.client);
    const lignes = parseLignes(body.lignes);
    const devisNumero = normalizeText(body.devisNumero);
    const totalHT = parseNumber(body.totalHT);
    const totalTTC = parseNumber(body.totalTTC);
    const tva = parseNumber(body.tva);

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
            devisRef: devisNumero || null,
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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const facturesDb = await prisma.facture.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(facturesDb.map(mapFacture));
  } catch (error) {
    return internalServerError(
      "factures-get",
      error,
      "Impossible de récupérer les factures",
    );
  }
}
