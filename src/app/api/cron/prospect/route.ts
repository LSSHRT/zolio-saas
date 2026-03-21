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
const SEARCH_TARGETS_PER_RUN = 3;
const DOMAINS_PER_TARGET = 3;
const CANDIDATE_POOL_MULTIPLIER = 4;
const MANUAL_QUEUE_CAP = 3;
const SEARCH_RESULT_BLOCKLIST = [
  "bing.",
  "pagesjaunes",
  "travaux",
  "yelp",
  "facebook",
  "instagram",
  "linkedin",
  "societe.com",
  "youtube",
];
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
const BUILDING_TRADES = [
  { key: "peintre", label: "peintres en batiment", searchTerms: ["peintre batiment", "entreprise peinture"] },
  { key: "plaquiste", label: "plaquistes", searchTerms: ["plaquiste", "placo isolation"] },
  { key: "plombier", label: "plombiers", searchTerms: ["plombier", "depannage plomberie"] },
  { key: "electricien", label: "electriciens", searchTerms: ["electricien", "installation electrique"] },
  { key: "chauffagiste", label: "chauffagistes", searchTerms: ["chauffagiste", "pompe a chaleur"] },
  { key: "menuisier", label: "menuisiers", searchTerms: ["menuisier", "menuiserie exterieure"] },
  { key: "carreleur", label: "carreleurs", searchTerms: ["carreleur", "pose carrelage"] },
  { key: "macon", label: "macons", searchTerms: ["macon", "maconnerie generale"] },
  { key: "couvreur", label: "couvreurs", searchTerms: ["couvreur", "charpente couverture"] },
  { key: "facadier", label: "facadiers", searchTerms: ["facadier", "ravalement facade"] },
] as const;
const TARGET_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Bordeaux",
  "Nantes",
  "Lille",
  "Montpellier",
  "Rennes",
  "Nice",
  "Strasbourg",
  "Grenoble",
];

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ProspectSearchTarget = {
  key: string;
  label: string;
  city: string;
  searchTerms: string[];
};

type DiscoveredDomain = {
  domain: string;
  companyName: string;
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

type HunterEmailResult = {
  email: string;
  score: number;
};

type HunterEmailRecord = {
  value?: string;
  confidence?: number;
  type?: string;
};

function getDaySeed(date = new Date()) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}

function pickDailyItems<T>(items: readonly T[], count: number, seed: number, step: number) {
  const picks: T[] = [];

  if (items.length === 0) {
    return picks;
  }

  const normalizedStep = Math.max(1, Math.abs(step) % items.length || 1);

  for (let index = 0; index < count && index < items.length; index += 1) {
    picks.push(items[(seed + index * normalizedStep) % items.length]);
  }

  return picks;
}

function getDailySearchTargets(): ProspectSearchTarget[] {
  const seed = getDaySeed();
  const trades = pickDailyItems(BUILDING_TRADES, SEARCH_TARGETS_PER_RUN, seed % BUILDING_TRADES.length, 3);
  const cities = pickDailyItems(TARGET_CITIES, SEARCH_TARGETS_PER_RUN, (seed * 2) % TARGET_CITIES.length, 5);

  return trades.map((trade, index) => ({
    key: trade.key,
    label: trade.label,
    city: cities[index % cities.length] || TARGET_CITIES[0],
    searchTerms: [...trade.searchTerms],
  }));
}

function normalizeDomain(value: string) {
  return value.replace(/^www\./, "").toLowerCase();
}

function isBlockedDiscoveryDomain(domain: string) {
  const normalized = normalizeDomain(domain);
  return SEARCH_RESULT_BLOCKLIST.some((blocked) => normalized.includes(blocked));
}

function humanizeCompanyName(domain: string) {
  const root = normalizeDomain(domain).split(".").slice(0, -1).join(".");
  const tokens = root
    .split(/[-_.]+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1));

  return tokens.join(" ") || domain;
}

function buildSearchQueries(target: ProspectSearchTarget) {
  const exclusions = "-pagesjaunes -facebook -instagram -linkedin -societe -youtube";

  return [
    `${target.searchTerms[0]} ${target.city} artisan site:.fr ${exclusions}`,
    `${target.searchTerms[1] || target.searchTerms[0]} ${target.city} entreprise batiment site:.fr ${exclusions}`,
  ];
}

async function fetchSearchHtml(query: string) {
  const response = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  return response.text();
}

async function discoverDomainsForTarget(target: ProspectSearchTarget) {
  const discovered = new Map<string, DiscoveredDomain>();

  for (const query of buildSearchQueries(target)) {
    try {
      const html = await fetchSearchHtml(query);
      const domainRegex = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.(?:fr|com|net))/g;

      for (const match of html.matchAll(domainRegex)) {
        const rawDomain = match[1]?.toLowerCase();
        if (!rawDomain) continue;

        const domain = normalizeDomain(rawDomain);
        if (isBlockedDiscoveryDomain(domain)) continue;

        if (!discovered.has(domain)) {
          discovered.set(domain, {
            domain,
            companyName: humanizeCompanyName(domain),
          });
        }

        if (discovered.size >= DOMAINS_PER_TARGET) {
          break;
        }
      }

      if (discovered.size >= DOMAINS_PER_TARGET) {
        break;
      }
    } catch (error) {
      console.error("prospect-domain-discovery", error);
    }
  }

  return Array.from(discovered.values()).slice(0, DOMAINS_PER_TARGET);
}

function scoreHunterEmail(item: unknown): HunterEmailResult | null {
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

async function findEmailsViaHunter(poolSize: number) {
  const targets = getDailySearchTargets();
  const candidates: ProspectCandidate[] = [];

  for (const target of targets) {
    const domains = await discoverDomainsForTarget(target);

    for (const discovered of domains) {
      try {
        const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${discovered.domain}&api_key=${HUNTER_API_KEY}`;
        const hunterRes = await fetch(hunterUrl, { cache: "no-store" });
        if (!hunterRes.ok) continue;

        const payload = await hunterRes.json();
        const emails: unknown[] = Array.isArray(payload?.data?.emails) ? payload.data.emails : [];
        const scoredEmails = emails
          .map((item: unknown) => scoreHunterEmail(item))
          .filter((item): item is HunterEmailResult => Boolean(item))
          .sort((left, right) => right.score - left.score)
          .slice(0, 2);

        for (const scored of scoredEmails) {
          candidates.push({
            email: scored.email,
            source: `Robot (Hunter • ${target.label} • ${target.city} • ${discovered.domain})`,
            tradeLabel: target.label,
            city: target.city,
            domain: discovered.domain,
            companyName: discovered.companyName,
            score: scored.score,
          });
        }
      } catch (error) {
        console.error("prospect-hunter", error);
      }
    }
  }

  const uniqueByEmail = new Map<string, ProspectCandidate>();
  for (const candidate of candidates.sort((left, right) => right.score - left.score)) {
    if (!uniqueByEmail.has(candidate.email)) {
      uniqueByEmail.set(candidate.email, candidate);
    }
  }

  return {
    targets,
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
      : Math.min(hardCap, MANUAL_QUEUE_CAP);
    const attemptedToday = runtime.canAutoSend ? await getTodayAttemptCount(now) : 0;
    const runtimeReason = runtime.canAutoSend ? null : runtime.reason;
    // Hobby plans can only invoke one Vercel cron per day, so a scheduled run
    // needs to cover both the queue send and lead discovery phases.
    const canSendNow = runtime.canAutoSend && (isProspectSendingHour(now) || isCronTrigger);
    const canDiscoverNow = isProspectCollectionHour(now) || isCronTrigger;
    const sent: string[] = [];
    const queued: string[] = [];
    const failed: string[] = [];
    const recentProcessed = new Set<string>();

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
              data: {
                status: "Sent",
                createdAt: new Date(),
              },
            });
            sent.push(row.email);
            recentProcessed.add(row.email);
          } catch (error) {
            const status = error instanceof ProspectingConfigError ? "Blocked" : "Failed";
            await prisma.prospectMail.update({
              where: { id: row.id },
              data: {
                status,
                createdAt: new Date(),
              },
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

    const remainingForDiscovery = canSendNow
      ? Math.max(0, effectiveDailyLimit - (attemptedToday + sent.length + failed.length))
      : effectiveDailyLimit;
    let targets: ProspectSearchTarget[] = [];

    if (canDiscoverNow && remainingForDiscovery > 0) {
      const poolSize = Math.max(remainingForDiscovery * CANDIDATE_POOL_MULTIPLIER, remainingForDiscovery);
      const discovery = await findEmailsViaHunter(poolSize);
      targets = discovery.targets;

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
    const targetSummary =
      targets.length > 0
        ? targets.map((target) => `${target.label} • ${target.city}`).join(" | ")
        : "aucun ciblage execute";
    const messageParts = [
      sent.length > 0 ? `${sent.length} email(s) envoye(s)` : null,
      queued.length > 0 ? `${queued.length} lead(s) mis en file d'attente` : null,
      failed.length > 0 ? `${failed.length} echec(s)` : null,
    ].filter(Boolean);
    const message =
      messageParts.length > 0
        ? `Robot execute : ${messageParts.join(" • ")}. Fenetres actives : collecte 17:00-07:59 | prospection 09:00-16:59 Europe/Paris. Limite du jour : ${effectiveDailyLimit}. Ciblage du jour : ${targetSummary}.`
        : canDiscoverNow
          ? `Aucun nouveau lead exploitable trouve. Limite du jour : ${effectiveDailyLimit}. Ciblage du jour : ${targetSummary}.`
          : runtimeReason
            ? `Robot bloque par sa configuration. ${runtimeReason}`
            : scheduleReason
              ? `Robot en veille. ${scheduleReason}`
              : `Fenetre d'envoi active mais aucun lead n'a pu etre traite. Limite du jour : ${effectiveDailyLimit}.`;

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
      targets: targets.map((target) => ({
        trade: target.label,
        city: target.city,
      })),
      dailyLimit: effectiveDailyLimit,
      attemptedToday,
      warmupStage: warmupStage.label,
    });
  } catch (error) {
    return internalServerError("cron-prospect", error, "Erreur lors de l'execution du robot");
  }
}
