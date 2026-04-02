import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { logError, logInfo } from "@/lib/logger";

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMontant(ht: number, tva: number, ttc: number): string {
  const parts = [
    `HT : ${ht.toFixed(2).replace(".", ",")} €`,
    `TVA : ${tva.toFixed(2).replace(".", ",")} €`,
    `TTC : ${ttc.toFixed(2).replace(".", ",")} €`,
  ];
  return parts.join("\n");
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Factures envoyées + en retard de 3 jours minimum + pas encore rappelées
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: "Émise",
        dateEcheance: { lt: now },
        emailClient: { not: null },
      },
    });

    let sent = 0;

    for (const invoice of overdueInvoices) {
      try {
        const overdueDays = Math.floor(
          (now.getTime() - (invoice.dateEcheance?.getTime() ?? now.getTime())) / 86400000
        );
        if (overdueDays < 3) continue; // On attend 3 jours après l'échéance

        await sendEmail({
          to: invoice.emailClient!,
          subject: `Rappel – Facture ${invoice.numero}`,
          html: `
            <h2>Rappel de paiement</h2>
            <p>Bonjour,</p>
            <p>La facture <strong>${invoice.numero}</strong> en date du 
              <strong>${formatDateFR(invoice.date)}</strong> 
              d'un montant de <strong>${invoice.totalTTC.toFixed(2).replace(".", ",")} € TTC</strong> 
              n'a pas encore été réglée.</p>
            <p>Échéance initiale : ${invoice.dateEcheance ? formatDateFR(invoice.dateEcheance) : "non définie"}<br>
            Jours de retard : ${overdueDays}</p>
            <p>Merci de procéder au règlement dans les plus brefs délais.</p>
          `,
        });

        sent++;
        logInfo("[cron] invoice-reminders", `Overdue reminder sent → ${invoice.numero} (${invoice.emailClient})`);
      } catch (err) {
        logError(`[cron] Failed to send reminder for invoice ${invoice.numero}`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      checked: overdueInvoices.length,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    logError("[cron] invoice-reminders failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
