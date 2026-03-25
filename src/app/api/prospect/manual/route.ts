import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/sendEmail";
import { internalServerError, jsonError } from "@/lib/http";
import {
  ProspectingConfigError,
  getProspectCooldownCutoff,
  isValidEmail,
  normalizeEmail,
} from "@/lib/prospecting";

type ManualProspectBody = {
  emails?: unknown;
};

/**
 * POST /api/prospect/manual
 *
 * Permet d'envoyer des emails de prospection manuellement.
 * Body: { emails: ["email1@example.com", "email2@example.com"] }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    let body: ManualProspectBody;
    try {
      body = (await request.json()) as ManualProspectBody;
    } catch {
      return jsonError("Payload invalide", 400);
    }

    const rawEmails = Array.isArray(body.emails) ? body.emails : [];
    const emails = rawEmails
      .filter((e): e is string => typeof e === "string")
      .map((e) => normalizeEmail(e))
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      return jsonError("Aucun email valide fourni", 400);
    }

    if (emails.length > 50) {
      return jsonError("Maximum 50 emails par envoi", 400);
    }

    const sent: string[] = [];
    const skipped: Array<{ email: string; reason: string }> = [];
    const failed: Array<{ email: string; reason: string }> = [];

    const cooldownCutoff = getProspectCooldownCutoff();

    for (const email of emails) {
      // Validation du format
      if (!isValidEmail(email)) {
        skipped.push({ email, reason: "Format invalide" });
        continue;
      }

      // Vérification du cooldown (pas de double envoi)
      const recent = await prisma.prospectMail.findFirst({
        where: {
          email,
          createdAt: { gt: cooldownCutoff },
          status: { in: ["Sent", "Queued"] },
        },
      });

      if (recent) {
        skipped.push({ email, reason: "Déjà contacté récemment" });
        continue;
      }

      // Envoi
      try {
        await sendProspectEmail(email);
        await prisma.prospectMail.create({
          data: {
            email,
            status: "Sent",
            source: "Manual",
          },
        });
        sent.push(email);
      } catch (error) {
        const status = error instanceof ProspectingConfigError ? "Blocked" : "Failed";
        await prisma.prospectMail.create({
          data: {
            email,
            status,
            source: "Manual",
          },
        });
        failed.push({
          email,
          reason: status === "Blocked" ? "Configuration SMTP manquante" : "Erreur d'envoi",
        });
      }
    }

    return NextResponse.json({
      sent,
      skipped,
      failed,
      summary: `${sent.length} envoyé(s), ${skipped.length} ignoré(s), ${failed.length} échec(s)`,
    });
  } catch (error) {
    return internalServerError("prospect-manual", error, "Erreur lors de l'envoi");
  }
}
