import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sendProspectEmail } from "@/lib/sendEmail";
import { isAdminUser } from "@/lib/admin";
import { ADMIN_SETTING_KEYS, appendAdminAuditLog } from "@/lib/admin-settings";
import { internalServerError, jsonError } from "@/lib/http";
import {
  ProspectingConfigError,
  getProspectCooldownCutoff,
  getProspectingRuntime,
  isPersonalMailbox,
  isValidEmail,
  normalizeEmail,
} from "@/lib/prospecting";
import { prisma } from "@/lib/prisma";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ProspectCandidate = {
  email: string;
  source: string;
};

async function discoverFrenchBusinessDomains() {
  const trades = [
    "plombier",
    "electricien",
    "menuisier",
    "peintre batiment",
    "macon",
    "chauffagiste",
  ];
  const cities = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille"];

  const trade = trades[Math.floor(Math.random() * trades.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const query = `${trade} ${city} artisan site:.fr -pagesjaunes -facebook -instagram`;

  try {
    const response = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const html = await response.text();
    const domainRegex = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.(?:fr|com|net))/g;
    const domains = new Set<string>();

    for (const match of html.matchAll(domainRegex)) {
      const domain = match[1]?.toLowerCase();
      if (!domain) continue;
      if (
        domain.includes("bing.") ||
        domain.includes("pagesjaunes") ||
        domain.includes("travaux") ||
        domain.includes("yelp")
      ) {
        continue;
      }
      domains.add(domain);
    }

    return Array.from(domains).slice(0, 5);
  } catch (error) {
    console.error("prospect-domain-discovery", error);
    return [];
  }
}

async function findEmailsViaHunter(): Promise<ProspectCandidate[]> {
  if (!HUNTER_API_KEY) return [];

  const domains = await discoverFrenchBusinessDomains();
  const results: ProspectCandidate[] = [];

  for (const domain of domains) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
      const hunterRes = await fetch(hunterUrl, { cache: "no-store" });
      if (!hunterRes.ok) continue;

      const payload = await hunterRes.json();
      const emails = Array.isArray(payload?.data?.emails) ? payload.data.emails : [];

      for (const item of emails) {
        const email = typeof item?.value === "string" ? normalizeEmail(item.value) : "";
        if (!email || !isValidEmail(email) || isPersonalMailbox(email)) {
          continue;
        }

        results.push({
          email,
          source: `Robot (Hunter:${domain})`,
        });
      }
    } catch (error) {
      console.error("prospect-hunter", error);
    }
  }

  const uniqueByEmail = new Map<string, ProspectCandidate>();
  for (const item of results) {
    if (!uniqueByEmail.has(item.email)) {
      uniqueByEmail.set(item.email, item);
    }
  }

  return Array.from(uniqueByEmail.values()).slice(0, 5);
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

export async function GET(req: Request) {
  try {
    const currentAdmin = await currentUser();
    const isAdminTrigger = isAdminUser(currentAdmin);
    const cronSecret = process.env.CRON_SECRET;
    const authorization = req.headers.get("authorization");
    const isCronTrigger = Boolean(cronSecret && authorization === `Bearer ${cronSecret}`);

    if (!isCronTrigger && !isAdminTrigger) {
      return jsonError("Non autorisé", 403);
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
        message: "Le robot de prospection a été appelé alors qu'il est désactivé.",
      });
      return NextResponse.json({ message: "Le robot de prospection est désactivé manuellement." });
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
        { message: "Hunter n'est pas configuré. Le robot ne peut pas découvrir de leads fiables." },
        { status: 200 },
      );
    }

    const runtime = getProspectingRuntime();
    const candidates = await findEmailsViaHunter();
    const recentProcessed = new Set<string>();
    const queued: string[] = [];
    const sent: string[] = [];
    const failed: string[] = [];

    for (const candidate of candidates) {
      if (recentProcessed.has(candidate.email)) continue;
      recentProcessed.add(candidate.email);

      if (await alreadyProcessedRecently(candidate.email)) {
        continue;
      }

      if (!runtime.canAutoSend) {
        await prisma.prospectMail.create({
          data: {
            email: candidate.email,
            status: "Queued",
            source: candidate.source,
          },
        });
        queued.push(candidate.email);
        continue;
      }

      try {
        await sendProspectEmail(candidate.email);
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
    }

    const actor = isAdminTrigger
      ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
      : "Cron Vercel";

    const messageParts = [
      sent.length > 0 ? `${sent.length} email(s) envoyé(s)` : null,
      queued.length > 0 ? `${queued.length} lead(s) mis en file d'attente` : null,
      failed.length > 0 ? `${failed.length} échec(s)` : null,
    ].filter(Boolean);

    const message =
      messageParts.length > 0
        ? `Robot exécuté : ${messageParts.join(" • ")}.`
        : runtime.canAutoSend
          ? "Aucun nouveau lead exploitable trouvé sur ce tour."
          : "Aucun nouveau lead exploitable trouvé. Le robot reste en mode collecte.";

    await appendAdminAuditLog({
      level: failed.length > 0 ? "warning" : "success",
      scope: "acquisition",
      action: isAdminTrigger ? "cron.test" : "cron.run",
      actor,
      message,
      meta: runtime.canAutoSend
        ? sent.join(", ") || undefined
        : queued.join(", ") || runtime.reason || undefined,
    });

    return NextResponse.json({
      message,
      sent,
      queued,
      failed,
      mode: runtime.mode,
      sendingReason: runtime.reason,
    });
  } catch (error) {
    return internalServerError("cron-prospect", error, "Erreur lors de l'exécution du robot");
  }
}
