import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendProspectEmail } from "@/lib/sendEmail";
import { requireAdminUser } from "@/lib/admin";
import { internalServerError, jsonError } from "@/lib/http";
import {
  ProspectingConfigError,
  getProspectCooldownCutoff,
  getProspectingRuntime,
  isValidEmail,
  normalizeEmail,
} from "@/lib/prospecting";

export async function GET() {
  try {
    await requireAdminUser();

    const mails = await prisma.prospectMail.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(mails);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-mail-get", error, "Impossible de récupérer les emails");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email) {
      return jsonError("L'adresse email est requise", 400);
    }

    if (!isValidEmail(email)) {
      return jsonError("L'adresse email est invalide", 400);
    }

    const runtime = getProspectingRuntime();
    if (!runtime.canManualSend) {
      return jsonError(runtime.reason || "Prospection manuelle indisponible", 409);
    }

    const lastAttempt = await prisma.prospectMail.findFirst({
      where: {
        email,
        createdAt: {
          gt: getProspectCooldownCutoff(),
        },
        status: {
          in: ["Sent", "Queued", "Blocked"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastAttempt) {
      return jsonError(
        "Cette adresse a déjà été prospectée récemment. Attends la fin du délai de refroidissement avant de relancer.",
        409,
      );
    }

    try {
      await sendProspectEmail(email);
      
      const saved = await prisma.prospectMail.create({
        data: {
          email,
          status: "Sent",
          source: "Manual"
        }
      });
      
      return NextResponse.json(saved);
    } catch (emailErr) {
      if (emailErr instanceof ProspectingConfigError) {
        return jsonError(emailErr.message, 409);
      }

      console.error("Erreur lors de l'envoi de l'email:", emailErr);
      
      const failed = await prisma.prospectMail.create({
        data: {
          email,
          status: "Failed",
          source: "Manual"
        }
      });
      
      return NextResponse.json(failed, { status: 500, statusText: "Erreur d'envoi" });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-mail-post", error);
  }
}
