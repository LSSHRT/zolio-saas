export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendDevisSignedEmail } from "@/lib/sendEmail";
import { generateDevisPDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, jsonError } from "@/lib/http";
import { verifyPublicDevisToken } from "@/lib/public-devis-token";

type PublicDevisLine = {
  isOptional?: boolean;
  nomPrestation?: string;
  prixUnitaire?: number | string;
  quantite?: number | string;
  totalLigne?: number | string;
  tva?: number | string;
  unite?: string;
};

function getValidatedToken(request: Request, numero: string) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    throw new Error("MISSING_TOKEN");
  }

  return verifyPublicDevisToken(token, numero);
}

function parseLignes(value: unknown): PublicDevisLine[] {
  if (typeof value === "string") {
    return JSON.parse(value) as PublicDevisLine[];
  }

  if (Array.isArray(value)) {
    return value as PublicDevisLine[];
  }

  return [];
}

function getLineTotal(line: PublicDevisLine) {
  if (line.totalLigne !== undefined && line.totalLigne !== null) {
    return Number(line.totalLigne);
  }

  return Number(line.quantite ?? 0) * Number(line.prixUnitaire ?? 0);
}

function normalizeLignes(lines: PublicDevisLine[]) {
  return lines.map((line) => ({
    nomPrestation: typeof line.nomPrestation === "string" && line.nomPrestation.trim().length > 0
      ? line.nomPrestation
      : "Prestation",
    quantite: Number(line.quantite ?? 0),
    unite: typeof line.unite === "string" && line.unite.trim().length > 0 ? line.unite : "U",
    prixUnitaire: Number(line.prixUnitaire ?? 0),
    totalLigne: getLineTotal(line),
    tva: line.tva !== undefined && line.tva !== null ? String(line.tva) : undefined,
    isOptional: Boolean(line.isOptional),
  }));
}

function computeTotals(lines: PublicDevisLine[], defaultTva: number, remiseGlobale: number) {
  const activeLines = lines.filter((line) => !line.isOptional);
  const totalHTBase = activeLines.reduce((sum, line) => sum + getLineTotal(line), 0);
  const totalHT = totalHTBase * (1 - remiseGlobale / 100);
  const totalTTC =
    activeLines.reduce((sum, line) => {
      const ligneTva = Number.parseFloat(String(line.tva ?? defaultTva)) || 0;
      return sum + getLineTotal(line) * (1 + ligneTva / 100);
    }, 0) * (1 - remiseGlobale / 100);

  return { totalHT, totalTTC };
}

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { userId } = getValidatedToken(request, numero);

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true },
    });

    if (!devis) {
      return jsonError("Document introuvable", 404);
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const entreprise = getCompanyProfile(user);
    const lignes = parseLignes(devis.lignes);
    const remiseGlobale = devis.remise || 0;
    const tvaGlobale = devis.tva || 0;
    const { totalTTC } = computeTotals(lignes, tvaGlobale, remiseGlobale);

    return NextResponse.json({
      numero: devis.numero,
      nomClient: devis.client?.nom || "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      totalTTC: totalTTC.toFixed(2),
      signature: devis.signature || "",
      entreprise: {
        nom: entreprise.nom,
        color: entreprise.color,
        logo: entreprise.logo,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MISSING_TOKEN" || error.message === "Token expired") {
        return jsonError("Lien invalide ou expiré", 403);
      }

      if (
        error.message === "Invalid token format" ||
        error.message === "Invalid token signature" ||
        error.message === "Token numero mismatch" ||
        error.message === "Invalid token payload"
      ) {
        return jsonError("Lien invalide ou expiré", 403);
      }
    }

    return internalServerError("public-devis-get", error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { userId } = getValidatedToken(request, numero);
    const body = await request.json();
    const signature = body.signatureBase64 || body.signature;

    if (typeof signature !== "string" || !signature.startsWith("data:image/")) {
      return jsonError("Signature invalide", 400);
    }

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true },
    });

    if (!devis) {
      return jsonError("Document introuvable", 404);
    }

    if (devis.statut === "Accepté" || devis.signature) {
      return jsonError("Ce devis a déjà été signé", 409);
    }

    await prisma.devis.updateMany({
      where: { numero, userId },
      data: {
        statut: "Accepté",
        signature,
      },
    });

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const entreprise = getCompanyProfile(user);
      const emailClient = devis.client?.email;

      if (emailClient) {
        const lignes = parseLignes(devis.lignes);
        const lignesPdf = normalizeLignes(lignes);
        const tvaGlobale = devis.tva || 0;
        const remiseGlobale = devis.remise || 0;
        const { totalHT, totalTTC } = computeTotals(lignes, tvaGlobale, remiseGlobale);

        const pdfBuffer = await generateDevisPDF({
          numeroDevis: devis.numero,
          date: devis.date.toLocaleDateString("fr-FR"),
          client: {
            nom: devis.client?.nom || "",
            email: emailClient,
            telephone: devis.client?.telephone || "",
            adresse: devis.client?.adresse || "",
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
          lignes: lignesPdf,
          totalHT: totalHT.toFixed(2),
          tva: tvaGlobale.toString(),
          totalTTC: totalTTC.toFixed(2),
          acompte: devis.acompte?.toString() || "",
          remise: remiseGlobale.toString(),
          statut: "Accepté",
          signatureBase64: signature,
          photos: typeof devis.photos === "string" ? JSON.parse(devis.photos) : (devis.photos || []),
        });

        await sendDevisSignedEmail(
          emailClient,
          entreprise.nom,
          devis.numero,
          totalTTC.toFixed(2),
          pdfBuffer,
        );
      }
    } catch (emailError) {
      console.error("Erreur envoi email PDF:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MISSING_TOKEN" || error.message === "Token expired") {
        return jsonError("Lien invalide ou expiré", 403);
      }

      if (
        error.message === "Invalid token format" ||
        error.message === "Invalid token signature" ||
        error.message === "Token numero mismatch" ||
        error.message === "Invalid token payload"
      ) {
        return jsonError("Lien invalide ou expiré", 403);
      }
    }

    return internalServerError("public-devis-post", error, "Erreur lors de la signature");
  }
}
