export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, jsonError, logServerError } from "@/lib/http";
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
  resendEmail?: unknown;
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

  return { totalHT, totalHTBase, totalTTC };
}

function normalizePdfLignes(lines: DevisLine[], defaultTva: number) {
  return lines.map((line) => ({
    isOptional: Boolean(line.isOptional),
    nomPrestation:
      typeof (line as { nomPrestation?: unknown }).nomPrestation === "string" &&
      (line as { nomPrestation?: string }).nomPrestation?.trim()
        ? (line as { nomPrestation: string }).nomPrestation.trim()
        : "Prestation",
    prixUnitaire: parseNumber(line.prixUnitaire),
    quantite: parseNumber(line.quantite, 1),
    totalLigne: getLineTotal(line),
    tva: String(parseNumber(line.tva, defaultTva)),
    unite:
      typeof (line as { unite?: unknown }).unite === "string" && (line as { unite?: string }).unite?.trim()
        ? (line as { unite: string }).unite.trim()
        : "U",
  }));
}

function getEmailSkipReason(configured: { host?: string; user?: string; pass?: string }) {
  return configured.host && configured.user && configured.pass ? undefined : "smtp_not_configured";
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
    const resendEmail = body.resendEmail === true;
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

    const { totalHT, totalHTBase, totalTTC } = computeTotals(lignes, tvaNum, remiseNum);
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

    const updatedDevis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true },
    });

    if (!updatedDevis) {
      return jsonError("Devis introuvable", 404);
    }

    let emailSent = false;
    let emailSkippedReason: string | undefined = resendEmail ? undefined : "creation_only";

    if (resendEmail) {
      try {
        const user = await currentUser();

        if (!user) {
          emailSkippedReason = "user_unavailable";
        } else if (!updatedDevis.client?.email) {
          emailSkippedReason = "missing_client_email";
        } else {
          const smtpConfig = {
            host: process.env.SMTP_HOST,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          };
          const smtpSkipReason = getEmailSkipReason(smtpConfig);

          if (smtpSkipReason) {
            emailSkippedReason = smtpSkipReason;
          } else {
            const client = await clerkClient();
            const freshUser = await client.users.getUser(user.id);
            const entreprise = getCompanyProfile(freshUser);
            const pdfBuffer = await generateDevisPDF({
              numeroDevis: updatedDevis.numero,
              date: updatedDevis.date.toLocaleDateString("fr-FR"),
              client: {
                nom: updatedDevis.client?.nom || "",
                email: updatedDevis.client?.email || "",
                telephone: updatedDevis.client?.telephone || "",
                adresse: updatedDevis.client?.adresse || "",
              },
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
                cgv: entreprise.cgv,
              },
              lignes: normalizePdfLignes(lignes, tvaNum),
              totalHT: totalHT.toFixed(2),
              tva: String(tvaNum),
              totalTTC: totalTTC.toFixed(2),
              acompte: acompteNum.toString(),
              remise: remiseNum.toString(),
              statut,
              signatureBase64: "",
              photos,
            });

            await sendDevisEmail(
              updatedDevis.client.email,
              updatedDevis.client.nom,
              updatedDevis.numero,
              totalTTC.toFixed(2),
              pdfBuffer,
            );

            emailSent = true;
          }
        }
      } catch (error) {
        logServerError("devis-detail-put-email", error);
        emailSkippedReason = "send_failed";
      }
    }

    return NextResponse.json({
      success: true,
      totalHT: totalHT.toFixed(2),
      totalHTBase: totalHTBase.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      emailSent,
      emailSkippedReason,
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
