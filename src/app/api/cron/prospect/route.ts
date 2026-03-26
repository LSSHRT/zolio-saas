import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sendProspectEmail } from "@/lib/sendEmail";
import { isAdminUser } from "@/lib/admin";
import {
  ADMIN_SETTING_KEYS,
  appendAdminAuditLog,
  getAdminSettingValue,
  setAdminSettingValue,
} from "@/lib/admin-settings";
import { internalServerError, jsonError } from "@/lib/http";
import {
  ProspectingConfigError,
  getProspectCooldownCutoff,
  getProspectDailyLimit,
  getProspectParisDayRange,
  getProspectParisTimeParts,
  getProspectWarmupStage,
  getProspectingRuntime,
  isPersonalMailbox,
  isProspectCollectionHour,
  isProspectSendingHour,
  isValidEmail,
  normalizeEmail,
} from "@/lib/prospecting";
import { prisma } from "@/lib/prisma";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";
const DOMAINS_PER_RUN = 5; // Nombre de domaines à traiter par exécution
const GENERIC_INBOX_PREFIXES = [
  "contact",
  "bonjour",
  "hello",
  "info",
  "devis",
  "commercial",
  "bureau",
  "direction",
  "admin",
];

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type HunterEmailRecord = {
  value?: string;
  confidence?: number;
  type?: string;
};

type ProspectCandidate = {
  email: string;
  source: string;
  tradeLabel: string;
  city: string;
  domain: string;
  companyName: string;
  score: number;
};

function scoreHunterEmail(item: unknown): { email: string; score: number } | null {
  const record: HunterEmailRecord | null =
    typeof item === "object" && item !== null ? (item as HunterEmailRecord) : null;
  const email = typeof record?.value === "string" ? normalizeEmail(record.value) : "";
  if (!email || !isValidEmail(email) || isPersonalMailbox(email)) {
    return null;
  }

  const localPart = email.split("@")[0] || "";
  if (localPart.includes("no-reply") || localPart.includes("noreply")) {
    return null;
  }

  let score = 0;
  if (
    GENERIC_INBOX_PREFIXES.some(
      (prefix) =>
        localPart === prefix ||
        localPart.startsWith(`${prefix}.`) ||
        localPart.startsWith(`${prefix}-`) ||
        localPart.startsWith(`${prefix}_`),
    )
  ) {
    score += 40;
  }

  if (typeof record?.confidence === "number") {
    score += Math.min(record.confidence, 100);
  }

  if (typeof record?.type === "string" && record.type.toLowerCase() === "generic") {
    score += 20;
  }

  return { email, score };
}

/**
 * Récupère des domaines non utilisés de la DB et cherche les emails via Hunter
 */
async function findCandidatesFromDomains(poolSize: number): Promise<{
  domains: { domain: string; company: string | null; trade: string | null; city: string | null }[];
  candidates: ProspectCandidate[];
}> {
  // Récupérer des domaines non utilisés
  const domains = await prisma.prospectDomain.findMany({
    where: { used: false },
    orderBy: { createdAt: "asc" },
    take: DOMAINS_PER_RUN,
  });

  if (domains.length === 0) {
    // Réinitialiser si tous les domaines ont été utilisés
    await prisma.prospectDomain.updateMany({
      where: { used: true },
      data: { used: false, usedAt: null },
    });

    const resetDomains = await prisma.prospectDomain.findMany({
      where: { used: false },
      orderBy: { createdAt: "asc" },
      take: DOMAINS_PER_RUN,
    });

    if (resetDomains.length === 0) {
      return { domains: [], candidates: [] };
    }

    domains.push(...resetDomains);
  }

  const candidates: ProspectCandidate[] = [];
  const domainInfos = domains.map((d) => ({
    domain: d.domain,
    company: d.company,
    trade: d.trade,
    city: d.city,
  }));

  for (const domainRow of domains) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domainRow.domain}&api_key=${HUNTER_API_KEY}`;
      const hunterRes = await fetch(hunterUrl, { cache: "no-store" });
      if (!hunterRes.ok) continue;

      const payload = await hunterRes.json();
      const emails: unknown[] = Array.isArray(payload?.data?.emails) ? payload.data.emails : [];
      const scoredEmails = emails
        .map((item: unknown) => scoreHunterEmail(item))
        .filter((item): item is { email: string; score: number } => Boolean(item))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      for (const scored of scoredEmails) {
        candidates.push({
          email: scored.email,
          source: `Robot (Hunter • ${domainRow.domain})`,
          tradeLabel: domainRow.trade || "Artisan BTP",
          city: domainRow.city || "",
          domain: domainRow.domain,
          companyName: domainRow.company || domainRow.domain,
          score: scored.score,
        });
      }

      // Marquer le domaine comme utilisé
      await prisma.prospectDomain.update({
        where: { id: domainRow.id },
        data: { used: true, usedAt: new Date() },
      });
    } catch (error) {
      console.error("prospect-hunter", error);
    }
  }

  // Dédupliquer par email
  const uniqueByEmail = new Map<string, ProspectCandidate>();
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    if (!uniqueByEmail.has(candidate.email)) {
      uniqueByEmail.set(candidate.email, candidate);
    }
  }

  return {
    domains: domainInfos,
    candidates: Array.from(uniqueByEmail.values()).slice(0, poolSize),
  };
}

async function alreadyProcessedRecently(email: string) {
  const previous = await prisma.prospectMail.findFirst({
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

  return Boolean(previous);
}

async function getWarmupStartDate(now: Date, canAutoSend: boolean) {
  if (!canAutoSend) {
    return null;
  }

  const existing = await getAdminSettingValue(ADMIN_SETTING_KEYS.prospectWarmupStartedAt);
  if (existing) {
    const parsed = new Date(existing);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  await setAdminSettingValue(ADMIN_SETTING_KEYS.prospectWarmupStartedAt, now.toISOString());
  return now;
}

async function getTodayAttemptCount(now: Date) {
  const range = getProspectParisDayRange(now);
  return prisma.prospectMail.count({
    where: {
      createdAt: {
        gte: range.start,
        lt: range.end,
      },
      status: {
        in: ["Sent", "Failed", "Blocked"],
      },
    },
  });
}

function getScheduleReason(now: Date) {
  if (isProspectCollectionHour(now)) {
    return "Le robot est en collecte entre 17:00 et 07:59 Europe/Paris. Les envois reprennent a 09:00.";
  }

  if (!isProspectSendingHour(now)) {
    return "Le robot est en pause locale entre 08:00 et 08:59 Europe/Paris, entre la collecte de nuit et la prospection de jour.";
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const currentAdmin = await currentUser();
    const isAdminTrigger = isAdminUser(currentAdmin);
    const cronSecret = process.env.CRON_SECRET;
    const authorization = req.headers.get("authorization");
    const isCronTrigger = Boolean(cronSecret && authorization === `Bearer ${cronSecret}`);

    if (!isCronTrigger && !isAdminTrigger) {
      return jsonError("Non autorise", 403);
    }

    const cronSetting = await prisma.adminSetting.findUnique({
      where: { key: ADMIN_SETTING_KEYS.cronProspectEnabled },
    });

    if (cronSetting?.value === "false") {
      await appendAdminAuditLog({
        level: "warning",
        scope: "acquisition",
        action: "cron.skipped",
        actor: isAdminTrigger
          ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
          : "Cron Vercel",
        message: "Le robot de prospection a ete appele alors qu'il est desactive.",
      });
      return NextResponse.json({ message: "Le robot de prospection est desactive manuellement." });
    }

    if (!HUNTER_API_KEY) {
      await appendAdminAuditLog({
        level: "warning",
        scope: "acquisition",
        action: "cron.no_hunter",
        actor: isAdminTrigger
          ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
          : "Cron Vercel",
        message: "Le robot ne peut pas sourcer de nouveaux leads sans HUNTER_API_KEY.",
      });

      return NextResponse.json(
        { message: "Hunter n'est pas configure. Le robot ne peut pas decouvrir de leads fiables." },
        { status: 200 },
      );
    }

    // Vérifier qu'on a des domaines en base
    const domainCount = await prisma.prospectDomain.count();
    if (domainCount === 0) {
      await appendAdminAuditLog({
        level: "warning",
        scope: "acquisition",
        action: "cron.no_domains",
        actor: isAdminTrigger
          ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
          : "Cron Vercel",
        message: "Aucun domaine d'artisan en base. Lancez le seed ou ajoutez des domaines via l'API.",
      });

      return NextResponse.json(
        { message: "Aucun domaine d'artisan en base. Ajoutez des domaines pour démarrer la prospection." },
        { status: 200 },
      );
    }

    const runtime = getProspectingRuntime();
    const now = new Date();
    const paris = getProspectParisTimeParts(now);
    const scheduleReason = isCronTrigger ? null : getScheduleReason(now);
    const hardCap = getProspectDailyLimit();
    const warmupStart = await getWarmupStartDate(now, runtime.canAutoSend);
    const daysSinceWarmupStart = warmupStart
      ? Math.max(0, Math.floor((now.getTime() - warmupStart.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;
    const warmupStage = getProspectWarmupStage(daysSinceWarmupStart);
    const effectiveDailyLimit = runtime.canAutoSend
      ? Math.max(1, Math.min(hardCap, warmupStage.dailyLimit))
      : Math.min(hardCap, 3);
    const attemptedToday = runtime.canAutoSend ? await getTodayAttemptCount(now) : 0;
    const runtimeReason = runtime.canAutoSend ? null : runtime.reason;
    const canSendNow = runtime.canAutoSend && (isProspectSendingHour(now) || isCronTrigger);
    const sent: string[] = [];
    const queued: string[] = [];
    const failed: string[] = [];
    const recentProcessed = new Set<string>();

    // Phase 1 : Envoyer les emails en file d'attente
    if (canSendNow) {
      const remainingBeforeQueue = Math.max(0, effectiveDailyLimit - attemptedToday);
      if (remainingBeforeQueue > 0) {
        const queuedRows = await prisma.prospectMail.findMany({
          where: { status: "Queued" },
          orderBy: { createdAt: "asc" },
          take: remainingBeforeQueue,
        });

        for (const row of queuedRows) {
          try {
            await sendProspectEmail(row.email);
            await prisma.prospectMail.update({
              where: { id: row.id },
              data: { status: "Sent", createdAt: new Date() },
            });
            sent.push(row.email);
            recentProcessed.add(row.email);
          } catch (error) {
            const status = error instanceof ProspectingConfigError ? "Blocked" : "Failed";
            await prisma.prospectMail.update({
              where: { id: row.id },
              data: { status, createdAt: new Date() },
            });
            failed.push(row.email);
            recentProcessed.add(row.email);
          }

          if (attemptedToday + sent.length + failed.length >= effectiveDailyLimit) {
            break;
          }
        }
      }
    }

    // Phase 2 : Découvrir de nouveaux leads via Hunter + domaines en base
    const remainingForDiscovery = canSendNow
      ? Math.max(0, effectiveDailyLimit - (attemptedToday + sent.length + failed.length))
      : effectiveDailyLimit;
    let discoveredDomains: { domain: string; company: string | null; trade: string | null; city: string | null }[] = [];

    if (remainingForDiscovery > 0) {
      const poolSize = Math.max(remainingForDiscovery * 4, remainingForDiscovery);
      const discovery = await findCandidatesFromDomains(poolSize);
      discoveredDomains = discovery.domains;

      for (const candidate of discovery.candidates) {
        if ((canSendNow ? sent.length + queued.length + failed.length : queued.length) >= remainingForDiscovery) {
          break;
        }

        if (recentProcessed.has(candidate.email)) continue;
        recentProcessed.add(candidate.email);

        if (await alreadyProcessedRecently(candidate.email)) {
          continue;
        }

        if (canSendNow) {
          try {
            await sendProspectEmail(candidate.email, {
              companyName: candidate.companyName,
              tradeLabel: candidate.tradeLabel,
              city: candidate.city,
            });
            await prisma.prospectMail.create({
              data: {
                email: candidate.email,
                status: "Sent",
                source: candidate.source,
              },
            });
            sent.push(candidate.email);
          } catch (error) {
            const status = error instanceof ProspectingConfigError ? "Blocked" : "Failed";
            await prisma.prospectMail.create({
              data: {
                email: candidate.email,
                status,
                source: candidate.source,
              },
            });
            failed.push(candidate.email);
          }
        } else {
          await prisma.prospectMail.create({
            data: {
              email: candidate.email,
              status: "Queued",
              source: candidate.source,
            },
          });
          queued.push(candidate.email);
        }
      }
    }

    const actor = isAdminTrigger
      ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
      : "Cron Vercel";
    const domainSummary =
      discoveredDomains.length > 0
        ? discoveredDomains.map((d) => `${d.domain} (${d.trade || "?"} — ${d.city || "?"})`).join(" | ")
        : "aucun domaine traite";
    const messageParts = [
      sent.length > 0 ? `${sent.length} email(s) envoye(s)` : null,
      queued.length > 0 ? `${queued.length} lead(s) mis en file d'attente` : null,
      failed.length > 0 ? `${failed.length} echec(s)` : null,
    ].filter(Boolean);
    const message =
      messageParts.length > 0
        ? `Robot execute : ${messageParts.join(" • ")}. Limite du jour : ${effectiveDailyLimit}. Domaines traités : ${domainSummary}.`
        : runtimeReason
          ? `Robot bloque par sa configuration. ${runtimeReason}`
          : scheduleReason
            ? `Robot en veille. ${scheduleReason}`
            : `Aucun lead trouvé dans les domaines traités. Limite du jour : ${effectiveDailyLimit}. Domaines : ${domainSummary}.`;

    await appendAdminAuditLog({
      level: failed.length > 0 ? "warning" : "success",
      scope: "acquisition",
      action: isAdminTrigger ? "cron.test" : "cron.run",
      actor,
      message,
      meta: [
        runtimeReason ? `Config: ${runtimeReason}` : null,
        scheduleReason ? `Planning: ${scheduleReason}` : null,
        `Warmup: ${warmupStage.label}`,
        `Quota: ${effectiveDailyLimit}`,
        `Paris: ${paris.weekday} ${String(paris.hour).padStart(2, "0")}:${String(paris.minute).padStart(2, "0")}`,
      ]
        .filter(Boolean)
        .join(" | "),
    });

    return NextResponse.json({
      message,
      sent,
      queued,
      failed,
      mode: runtime.mode,
      sendingReason: runtimeReason || scheduleReason,
      domains: discoveredDomains.map((d) => ({
        domain: d.domain,
        trade: d.trade,
        city: d.city,
      })),
      dailyLimit: effectiveDailyLimit,
      attemptedToday,
      warmupStage: warmupStage.label,
    });
  } catch (error) {
    return internalServerError("cron-prospect", error, "Erreur lors de l'execution du robot");
  }
}
