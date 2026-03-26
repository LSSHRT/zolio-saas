export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendDevisSignedEmail } from "@/lib/sendEmail";
import { generateDevisPDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, jsonError, logServerError } from "@/lib/http";
import { verifyPublicDevisToken } from "@/lib/public-devis-token";
import {
  parseLignes,
  normalizeLigneForOutput,
  computeTotals,
  type LignePayload,
} from "@/lib/devis-lignes";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPushNotification } from "@/lib/push-notifications";

function getValidatedToken(request: Request, numero: string) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    throw new Error("MISSING_TOKEN");
  }

  return verifyPublicDevisToken(token, numero);
}

export async function GET(request: Request, context: { params: Promise<{ numero: string }> }) {
  try {
    // Rate limit : 30 requêtes par minute par IP
    const ip = getClientIp(request);
    const rl = rateLimit(`public-devis-get:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return jsonError("Trop de requêtes. Réessayez dans une minute.", 429);
    }

    const resolvedParams = await context.params;
    const { numero } = resolvedParams;
    const { userId } = getValidatedToken(request, numero);

    const devis = await prisma.devis.findFirst({
      where: { numero, userId },
      include: { client: true, lignesNorm: { orderBy: { position: "asc" } } },
    });

    if (!devis) {
      return jsonError("Document introuvable", 404);
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const entreprise = getCompanyProfile(user);

    // Utilise lignesNorm si disponible, sinon fallback sur JSON
    const lignes: LignePayload[] = devis.lignesNorm.length > 0
      ? devis.lignesNorm.map((ligne) => ({
          isOptional: ligne.isOptional,
          nomPrestation: ligne.nomPrestation,
          prixUnitaire: ligne.prixUnitaire,
          quantite: ligne.quantite,
          totalLigne: ligne.totalLigne,
          tva: ligne.tva,
          unite: ligne.unite,
        }))
      : parseLignes(devis.lignes);

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
    // Rate limit : 10 requêtes par minute par IP (signature = action sensible)
    const ip = getClientIp(request);
    const rl = rateLimit(`public-devis-post:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return jsonError("Trop de requêtes. Réessayez dans une minute.", 429);
    }

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
      include: { client: true, lignesNorm: { orderBy: { position: "asc" } } },
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

    // Envoyer une notification push à l'artisan
    await sendPushNotification(userId, {
      title: "✅ Devis signé !",
      body: `${devis.client?.nom || "Le client"} a signé le devis ${numero}`,
      url: `/devis/${numero}`,
      tag: `devis-signed-${numero}`,
    }).catch(() => {}); // Ne pas bloquer si la notification échoue

    let emailSent = false;
    let emailSkippedReason: string | undefined;

    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const entreprise = getCompanyProfile(user);
      const emailClient = devis.client?.email?.trim();

      if (!emailClient) {
        emailSkippedReason = "missing_client_email";
      } else if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        emailSkippedReason = "smtp_not_configured";
      } else {
        // Utilise lignesNorm si disponible, sinon fallback sur JSON
        const lignes: LignePayload[] = devis.lignesNorm.length > 0
          ? devis.lignesNorm.map((ligne) => ({
              isOptional: ligne.isOptional,
              nomPrestation: ligne.nomPrestation,
              prixUnitaire: ligne.prixUnitaire,
              quantite: ligne.quantite,
              totalLigne: ligne.totalLigne,
              tva: ligne.tva,
              unite: ligne.unite,
            }))
          : parseLignes(devis.lignes);

        const lignesPdf = lignes.map(normalizeLigneForOutput);
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
          devis.client?.nom || entreprise.nom,
          devis.numero,
          totalTTC.toFixed(2),
          pdfBuffer,
        );

        emailSent = true;
      }
    } catch (emailError) {
      logServerError("public-devis-post-email", emailError);
      emailSkippedReason = "send_failed";
    }

    return NextResponse.json({ success: true, emailSent, emailSkippedReason });
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
