import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { internalServerError, jsonError } from "@/lib/http";
import { createClientPortalToken } from "@/lib/client-portal";
import { logError, logInfo } from "@/lib/logger";

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zolio.site";

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * POST /api/factures/[numero]/relances
 * Envoie un email de relance manuel pour une facture.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const p = await params;
    const numero = p.numero;

    const facture = await prisma.facture.findFirst({
      where: { numero, userId },
    });
    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }
    if (!facture.emailClient) {
      return jsonError("Aucun email client sur cette facture", 400);
    }
    if (facture.statut === "Payée") {
      return jsonError("Cette facture est déjà payée", 400);
    }

    // Calcul du retard
    const now = new Date();
    const overdueDays = facture.dateEcheance
      ? Math.floor((now.getTime() - facture.dateEcheance.getTime()) / 86400000)
      : 0;

    // Déterminer le niveau
    const lastLevel = (facture as any).derniereRelanceNiveau ?? 0;
    const nextLevel = Math.min(lastLevel + 1, 3);

    // Générer le lien espace client
    let portalLink: string | undefined;
    try {
      const token = createClientPortalToken(facture.emailClient, userId);
      if (token) {
        portalLink = `${PUBLIC_URL}/espace-client/${token}`;
      }
    } catch {
      // Secret non configuré
    }

    const montant = facture.totalTTC.toFixed(2).replace(".", ",");
    const echeance = facture.dateEcheance ? formatDateFR(facture.dateEcheance) : "non définie";

    const subject = `Rappel – Facture ${facture.numero}`;
    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Rappel de paiement</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${facture.nomClient}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Sauf erreur de notre part, la facture <strong>${facture.numero}</strong> d'un montant de <strong>${montant} TTC</strong> est en attente de règlement.
          </p>
          <div style="background:#fff;border-radius:10px;padding:16px;margin:20px 0;border-left:3px solid #0ea5e9;">
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Détails</p>
            <p style="color:#1e293b;font-size:14px;margin:0;">Échéance : <strong>${echeance}</strong> ${overdueDays > 0 ? `· Retard : <strong>${overdueDays} jour${overdueDays > 1 ? "s" : ""}</strong>` : ""}</p>
          </div>
          ${portalLink ? `<div style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:white;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px -2px rgba(14,165,233,0.35);">Consulter mes documents →</a></div>` : ""}
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-top:20px;">Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.</p>
          <p style="color:#475569;font-size:14px;margin-top:20px;">Bien cordialement,<br/><span style="color:#8b5cf6;font-weight:600;">L'équipe Zolio</span></p>
        </div>
      </div>
    `;

    await sendEmail({
      to: facture.emailClient,
      subject,
      html,
    });

    // Mettre à jour le tracking
    await prisma.facture.update({
      where: { id: facture.id },
      data: {
        derniereRelanceNiveau: nextLevel,
        derniereRelanceDate: now,
      } as any,
    });

    logInfo("[relance] manuel", `${numero} → ${facture.emailClient} (niveau ${nextLevel})`);

    return NextResponse.json({
      ok: true,
      level: nextLevel,
      sentTo: facture.emailClient,
    });
  } catch (error) {
    logError("[relance] manuel", error);
    return internalServerError("relance-post", error, "Impossible d'envoyer la relance");
  }
}
