import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { logError, logInfo } from "@/lib/logger";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { createClientPortalToken } from "@/lib/client-portal";
import { isAdminUser } from "@/lib/admin";

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
    accentGradient: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
    accentColor: "#0ea5e9",
    headerTitle: "Rappel amical",
    headerSubtitle: "Zolio · Rappel de paiement",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Rappel amical</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${client || ""}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Sauf erreur de notre part, la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> arrive à échéance ou est légèrement en retard.
          </p>
          <div style="background:#fff;border-radius:10px;padding:16px;margin:20px 0;border-left:3px solid #0ea5e9;">
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Détails</p>
            <p style="color:#1e293b;font-size:14px;margin:0;">Échéance : <strong>${echeance}</strong> · Retard : <strong>${retard} jour${retard > 1 ? "s" : ""}</strong></p>
          </div>
          ${portalLink ? `<div style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:white;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px -2px rgba(14,165,233,0.35);">Consulter mes documents →</a></div>` : ""}
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-top:20px;">Si le règlement a déjà été effectué, merci de ne pas tenir compte de ce message.</p>
          <p style="color:#475569;font-size:14px;margin-top:20px;">Bien cordialement,<br/><span style="color:#8b5cf6;font-weight:600;">L'équipe Zolio</span></p>
        </div>
      </div>
    `,
  },
  {
    level: 2,
    label: "ferme",
    delayDays: 7,
    subject: (numero: string) => `2e rappel – Facture ${numero} en retard`,
    tone: "firm",
    accentGradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    accentColor: "#f59e0b",
    headerTitle: "Deuxième rappel",
    headerSubtitle: "Zolio · Paiement en attente",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Deuxième rappel de paiement</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${client || ""}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Nous constatons que la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> reste impayée à ce jour.
          </p>
          <div style="background:#fff;border-radius:10px;padding:16px;margin:20px 0;border-left:3px solid #f59e0b;">
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Détails</p>
            <p style="color:#1e293b;font-size:14px;margin:0;">Échéance initiale : <strong>${echeance}</strong> · Retard : <strong>${retard} jours</strong></p>
          </div>
          ${portalLink ? `<div style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:linear-gradient(135deg,#f59e0b,#f97316);color:white;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px -2px rgba(245,158,11,0.35);">Consulter mes documents →</a></div>` : ""}
          <p style="color:#334155;font-size:14px;line-height:1.6;margin-top:20px;">
            Nous vous saurions gré de bien vouloir procéder au règlement <strong>dans les 48 heures</strong>.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.5;">En cas de difficulté, n'hésitez pas à nous contacter.</p>
          <p style="color:#475569;font-size:14px;margin-top:20px;">Cordialement,<br/><span style="color:#8b5cf6;font-weight:600;">L'équipe Zolio</span></p>
        </div>
      </div>
    `,
  },
  {
    level: 3,
    label: "mise en demeure",
    delayDays: 15,
    subject: (numero: string) => `Dernier avis avant contentieux – Facture ${numero}`,
    tone: "final",
    accentGradient: "linear-gradient(135deg,#dc2626,#991b1b)",
    accentColor: "#dc2626",
    headerTitle: "Dernier avis",
    headerSubtitle: "Zolio · Avant contentieux",
    template: (client: string, numero: string, date: string, montant: string, echeance: string, retard: number, portalLink?: string) => `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Dernier avis avant contentieux</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${client || ""}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Malgré nos relances précédentes, la facture <strong>${numero}</strong> du ${date} d'un montant de <strong>${montant} TTC</strong> demeure impayée.
          </p>
          <div style="background:#fef2f2;border-radius:10px;padding:16px;margin:20px 0;border-left:3px solid #dc2626;">
            <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Détails</p>
            <p style="color:#1e293b;font-size:14px;margin:0;">Échéance initiale : <strong>${echeance}</strong> · Retard : <strong>${retard} jours</strong></p>
          </div>
          ${portalLink ? `<div style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px -2px rgba(220,38,38,0.35);">Consulter mes documents →</a></div>` : ""}
          <p style="color:#dc2626;font-size:14px;line-height:1.6;margin-top:20px;">
            <strong>À défaut de règlement sous 8 jours</strong>, nous nous verrons dans l'obligation de transmettre votre dossier à notre service contentieux.
          </p>
          <p style="color:#dc2626;font-weight:bold;font-size:14px;margin-top:12px;">Ceci est notre dernier rappel avant procédure.</p>
          <p style="color:#475569;font-size:14px;margin-top:20px;">Cordialement,<br/><span style="color:#8b5cf6;font-weight:600;">L'équipe Zolio</span></p>
        </div>
      </div>
    `,
  },
];

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  const isCronTrigger = Boolean(
    cronSecret && authorization === `Bearer ${cronSecret}`,
  );

  let isAdminTrigger = false;
  if (!isCronTrigger) {
    const user = await currentUser();
    isAdminTrigger = isAdminUser(user);
  }

  if (!isCronTrigger && !isAdminTrigger) {
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
          if (overdueDays >= level.delayDays && level.level > (invoice.derniereRelanceNiveau ?? 0)) {
            return level;
          }
          return best;
        }, null as typeof REMINDER_LEVELS[number] | null);

        if (!applicableLevel) {
          skipped++;
          continue;
        }

        // Vérifier qu'on n'a pas déjà envoyé ce niveau (sécurité supplémentaire)
        const daysSinceLastReminder = invoice.derniereRelanceDate
          ? Math.floor((now.getTime() - invoice.derniereRelanceDate.getTime()) / 86400000)
          : 999;

        // Éviter les doublons : attendre au moins 1 jour depuis la dernière relance
        if (daysSinceLastReminder < 1) {
          skipped++;
          continue;
        }

        const montant = Number(invoice.totalTTC).toFixed(2).replace(".", ",");
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
          },
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
