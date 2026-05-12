import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import {
  buildWeeklyDigestHtml,
  buildWeeklyDigestSubject,
  type WeeklyDigestData,
} from "@/lib/emails/weekly-digest";

/**
 * Weekly digest cron — runs every Monday at 08:00 (configured in vercel.json).
 *
 * For each user that opted-in (Clerk publicMetadata.weeklyDigestEnabled === true,
 * default true unless explicitly opted-out), aggregates the past 7 days of
 * activity and sends a recap email.
 *
 * Auth:
 * - Vercel cron via `Authorization: Bearer ${CRON_SECRET}`
 * - Or admin user manually triggering the endpoint
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  const isCronTrigger = Boolean(cronSecret && authorization === `Bearer ${cronSecret}`);

  let isAdminTrigger = false;
  if (!isCronTrigger) {
    const user = await currentUser();
    isAdminTrigger = isAdminUser(user);
  }

  if (!isCronTrigger && !isAdminTrigger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  try {
    // 1. Récupérer la liste de tous les userIds ayant de l'activité (devis ou facture sur 30j)
    //    pour éviter d'envoyer à des comptes morts.
    const lookbackForActivity = new Date(now);
    lookbackForActivity.setDate(lookbackForActivity.getDate() - 30);

    const activeUsersFromDevis = await prisma.devis.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: lookbackForActivity }, deletedAt: null },
    });
    const activeUsersFromFactures = await prisma.facture.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: lookbackForActivity }, deletedAt: null },
    });
    const activeUserIds = new Set<string>([
      ...activeUsersFromDevis.map((u) => u.userId),
      ...activeUsersFromFactures.map((u) => u.userId),
    ]);

    if (activeUserIds.size === 0) {
      return NextResponse.json({ ok: true, sent: 0, skipped: 0, scanned: 0, ranAt: now.toISOString() });
    }

    const clerk = await clerkClient();
    let sent = 0;
    let skipped = 0;
    const failures: Array<{ userId: string; error: string }> = [];

    for (const userId of activeUserIds) {
      try {
        // Récupérer le user Clerk + ses préférences
        const user = await clerk.users.getUser(userId);
        const publicMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;
        const unsafeMeta = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
        const optedOut =
          publicMeta.weeklyDigestEnabled === false || unsafeMeta.weeklyDigestEnabled === false;
        if (optedOut) {
          skipped++;
          continue;
        }

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
          skipped++;
          continue;
        }

        // Aggrégations sur 7 jours
        const [
          newDevis,
          acceptedDevis,
          newInvoices,
          paidInvoices,
          paidAggregate,
          pendingDevis,
          followUpAggregate,
        ] = await Promise.all([
          prisma.devis.count({
            where: { userId, createdAt: { gte: since, lte: now }, deletedAt: null },
          }),
          prisma.devis.count({
            where: { userId, statut: "Accepté", updatedAt: { gte: since, lte: now }, deletedAt: null },
          }),
          prisma.facture.count({
            where: { userId, createdAt: { gte: since, lte: now }, deletedAt: null },
          }),
          prisma.facture.count({
            where: { userId, statut: "Payée", updatedAt: { gte: since, lte: now }, deletedAt: null },
          }),
          prisma.facture.aggregate({
            where: { userId, statut: "Payée", updatedAt: { gte: since, lte: now }, deletedAt: null },
            _sum: { totalTTC: true },
          }),
          prisma.devis.aggregate({
            where: { userId, statut: "En attente", deletedAt: null },
            _sum: { totalHT: true },
            _count: true,
          }),
          // Follow-ups: devis en attente créés depuis plus de 7 jours
          prisma.devis.count({
            where: {
              userId,
              statut: "En attente",
              createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
              deletedAt: null,
            },
          }),
        ]);

        // Si aucune activité dans la semaine et aucune action en attente, on skip
        const hasAnyActivity =
          newDevis > 0 || acceptedDevis > 0 || newInvoices > 0 || paidInvoices > 0 || followUpAggregate > 0;
        if (!hasAnyActivity) {
          skipped++;
          continue;
        }

        const revenuePaidTTC = Number(paidAggregate._sum?.totalTTC ?? 0);
        const pipelineHT = Number(pendingDevis._sum?.totalHT ?? 0);
        const followUpsToDo = followUpAggregate;

        // Top action suggérée
        let topAction: WeeklyDigestData["topAction"] = null;
        if (followUpsToDo > 0) {
          topAction = { title: `Relancer ${followUpsToDo} devis`, href: "/devis" };
        } else if (newDevis === 0) {
          topAction = { title: "Créer un nouveau devis", href: "/nouveau-devis" };
        } else if (paidInvoices === 0 && newInvoices > 0) {
          topAction = { title: "Suivre les factures", href: "/factures" };
        }

        const data: WeeklyDigestData = {
          firstName: user.firstName ?? null,
          since,
          until: now,
          newDevis,
          acceptedDevis,
          newInvoices,
          paidInvoices,
          revenuePaidTTC,
          pipelineHT,
          followUpsToDo,
          topAction,
        };

        await sendEmail({
          to: email,
          subject: buildWeeklyDigestSubject(data),
          html: buildWeeklyDigestHtml(data),
        });

        sent++;
        logInfo("[cron] weekly-digest", `${email} (user ${userId}) — ${newDevis} devis, ${paidInvoices} payées`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        failures.push({ userId, error: message });
        logWarn("[cron] weekly-digest", `failed for ${userId}: ${message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: activeUserIds.size,
      sent,
      skipped,
      failures: failures.length,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    logError("[cron] weekly-digest failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
