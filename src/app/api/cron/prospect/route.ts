import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sendProspectEmail } from "@/lib/sendEmail";
import { isAdminUser } from "@/lib/admin";
import { ADMIN_SETTING_KEYS, appendAdminAuditLog } from "@/lib/admin-settings";
import { internalServerError, jsonError } from "@/lib/http";
import {
  ProspectingConfigError,
  getProspectCooldownCutoff,
  getProspectDailyLimit,
  getProspectingRuntime,
  isPersonalMailbox,
  isValidEmail,
  normalizeEmail,
} from "@/lib/prospecting";
import { prisma } from "@/lib/prisma";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";
const SEARCH_TARGETS_PER_RUN = 3;
const DOMAINS_PER_TARGET = 3;
const CANDIDATE_POOL_MULTIPLIER = 4;
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

async function findEmailsViaHunter() {
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
    candidates: Array.from(uniqueByEmail.values()).slice(
      0,
      Math.max(getProspectDailyLimit() * CANDIDATE_POOL_MULTIPLIER, getProspectDailyLimit()),
    ),
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
    const dailyLimit = getProspectDailyLimit();
    const { targets, candidates } = await findEmailsViaHunter();
    const recentProcessed = new Set<string>();
    const queued: string[] = [];
    const sent: string[] = [];
    const failed: string[] = [];

    for (const candidate of candidates) {
      if (sent.length + queued.length + failed.length >= dailyLimit) {
        break;
      }

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
    }

    const actor = isAdminTrigger
      ? currentAdmin?.emailAddresses[0]?.emailAddress || "Admin"
      : "Cron Vercel";
    const targetSummary = targets.map((target) => `${target.label} • ${target.city}`).join(" | ");
    const messageParts = [
      sent.length > 0 ? `${sent.length} email(s) envoye(s)` : null,
      queued.length > 0 ? `${queued.length} lead(s) mis en file d'attente` : null,
      failed.length > 0 ? `${failed.length} echec(s)` : null,
    ].filter(Boolean);
    const message =
      messageParts.length > 0
        ? `Robot execute : ${messageParts.join(" • ")}. Ciblage du jour : ${targetSummary}.`
        : runtime.canAutoSend
          ? `Aucun nouveau lead exploitable trouve. Ciblage du jour : ${targetSummary}.`
          : `Aucun nouveau lead exploitable trouve. Le robot reste en mode collecte. Ciblage du jour : ${targetSummary}.`;

    await appendAdminAuditLog({
      level: failed.length > 0 ? "warning" : "success",
      scope: "acquisition",
      action: isAdminTrigger ? "cron.test" : "cron.run",
      actor,
      message,
      meta: runtime.canAutoSend
        ? sent.join(", ") || targetSummary
        : queued.join(", ") || runtime.reason || targetSummary,
    });

    return NextResponse.json({
      message,
      sent,
      queued,
      failed,
      mode: runtime.mode,
      sendingReason: runtime.reason,
      targets: targets.map((target) => ({
        trade: target.label,
        city: target.city,
      })),
      dailyLimit,
    });
  } catch (error) {
    return internalServerError("cron-prospect", error, "Erreur lors de l'execution du robot");
  }
}
