import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { logError, logInfo } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";
import { createClientPortalToken } from "@/lib/client-portal";

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zolio.site";

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Niveaux de relance
const REMINDER_LEVELS = [
  {
    level: 1,
    label: "doux",
    delayDays: 3,
    subject: (numero: string) => `Rappel amical – Facture ${numero}`,
    tone: "friendly",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <h2>Rappel amical</h2>
      <p>Bonjour${client ? ` ${client}` : ""},</p>
      <p>Sauf erreur de notre part, la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> arrive à échéance ou est légèrement en retard.</p>
      <p>Échéance : ${echeance} · Retard : ${retard} jour${retard > 1 ? "s" : ""}</p>
      ${portalLink ? `<p style="text-align:center;margin:20px 0;"><a href="${portalLink}" style="background:#0ea5e9;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes documents →</a></p>` : ""}
      <p>Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.</p>
      <p>Bien cordialement,</p>
    `,
  },
  {
    level: 2,
    label: "ferme",
    delayDays: 7,
    subject: (numero: string) => `2e rappel – Facture ${numero} en retard`,
    tone: "firm",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <h2>Deuxième rappel de paiement</h2>
      <p>Bonjour${client ? ` ${client}` : ""},</p>
      <p>Nous constatons que la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> reste impayée à ce jour.</p>
      <p>Échéance initiale : ${echeance} · Retard : ${retard} jours</p>
      ${portalLink ? `<p style="text-align:center;margin:20px 0;"><a href="${portalLink}" style="background:#f59e0b;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes documents →</a></p>` : ""}
      <p>Nous vous saurions gré de bien vouloir procéder au règlement <strong>dans les 48 heures</strong>.</p>
      <p>En cas de difficulté, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,</p>
    `,
  },
  {
    level: 3,
    label: "mise en demeure",
    delayDays: 15,
    subject: (numero: string) => `Dernier avis avant contentieux – Facture ${numero}`,
    tone: "final",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <h2 style="color: #dc2626;">Dernier avis avant contentieux</h2>
      <p>Bonjour${client ? ` ${client}` : ""},</p>
      <p>Malgré nos relances précédentes, la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> demeure impayée.</p>
      <p>Échéance initiale : ${echeance} · Retard : ${retard} jours</p>
      ${portalLink ? `<p style="text-align:center;margin:20px 0;"><a href="${portalLink}" style="background:#dc2626;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Consulter mes documents →</a></p>` : ""}
      <p><strong>À défaut de règlement sous 8 jours</strong>, nous nous verrons dans l'obligation de transmettre votre dossier à notre service contentieux.</p>
      <p style="color: #dc2626; font-weight: bold;">Ceci est notre dernier rappel avant procédure.</p>
      <p>Cordialement,</p>
    `,
  },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Toutes les factures émises en retard avec email client
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: "Émise",
        dateEcheance: { lt: now },
        emailClient: { not: null },
      },
    });

    let sent = 0;
    let skipped = 0;
    const results: Record<string, unknown>[] = [];

    // Récupérer les préférences de relance par utilisateur
    const userPreferences = new Map<string, boolean>();
    const uniqueUserIds = [...new Set(overdueInvoices.map((inv) => inv.userId))];
    const clerk = await clerkClient();
    for (const userId of uniqueUserIds) {
      try {
        const user = await clerk.users.getUser(userId);
        const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
        userPreferences.set(userId, meta?.reminderEnabled !== false);
      } catch {
        userPreferences.set(userId, true);
      }
    }

    for (const invoice of overdueInvoices) {
      if (userPreferences.get(invoice.userId) === false) {
        skipped++;
        continue;
      }

      try {
        const overdueDays = Math.floor(
          (now.getTime() - (invoice.dateEcheance?.getTime() ?? now.getTime())) / 86400000
        );

        // Déterminer le niveau de relance approprié
        const applicableLevel = REMINDER_LEVELS.reduce((best, level) => {
          if (overdueDays >= level.delayDays && level.level > ((invoice as any).derniereRelanceNiveau ?? 0)) {
            return level;
          }
          return best;
        }, null as typeof REMINDER_LEVELS[number] | null);

        if (!applicableLevel) {
          skipped++;
          continue;
        }

        // Vérifier qu'on n'a pas déjà envoyé ce niveau (sécurité supplémentaire)
        const daysSinceLastReminder = (invoice as any).derniereRelanceDate
          ? Math.floor((now.getTime() - (invoice as any).derniereRelanceDate.getTime()) / 86400000)
          : 999;

        // Éviter les doublons : attendre au moins 1 jour depuis la dernière relance
        if (daysSinceLastReminder < 1) {
          skipped++;
          continue;
        }

        const montant = invoice.totalTTC.toFixed(2).replace(".", ",");
        const echeance = invoice.dateEcheance ? formatDateFR(invoice.dateEcheance) : "non définie";

        // Générer le lien espace client si possible
        let portalLink: string | undefined;
        try {
          const token = createClientPortalToken(invoice.emailClient!, invoice.userId);
          if (token) {
            portalLink = `${PUBLIC_URL}/espace-client/${token}`;
          }
        } catch {
          // Secret non configuré — pas de lien portail
        }

        await sendEmail({
          to: invoice.emailClient!,
          subject: applicableLevel.subject(invoice.numero),
          html: applicableLevel.template(
            invoice.nomClient,
            invoice.numero,
            formatDateFR(invoice.date),
            montant,
            echeance,
            overdueDays,
            portalLink,
          ),
        });

        // Mettre à jour le niveau de relance
        await prisma.facture.update({
          where: { id: invoice.id },
          data: {
            derniereRelanceNiveau: applicableLevel.level,
            derniereRelanceDate: now,
          } as any,
        });

        sent++;
        results.push({
          invoice: invoice.numero,
          email: invoice.emailClient,
          level: applicableLevel.label,
          overdueDays,
        });
        logInfo("[cron] invoice-reminders", `${applicableLevel.label} → ${invoice.numero} (${invoice.emailClient}) J+${overdueDays}`);
      } catch (err) {
        logError(`[cron] Failed to send reminder for invoice ${invoice.numero}`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      checked: overdueInvoices.length,
      results,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    logError("[cron] invoice-reminders failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
