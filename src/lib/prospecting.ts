import nodemailer from "nodemailer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PERSONAL_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.fr",
  "live.com",
  "live.fr",
  "outlook.com",
  "outlook.fr",
  "yahoo.com",
  "yahoo.fr",
  "wanadoo.fr",
  "orange.fr",
  "sfr.fr",
  "free.fr",
  "laposte.net",
  "icloud.com",
  "me.com",
  "msn.com",
  "aol.com",
]);
const PROSPECT_TIMEZONE = "Europe/Paris";

export type ProspectingMode = "queue_only" | "manual_only" | "live";
export type ProspectWarmupStageKey = "starter" | "ramp" | "growth" | "steady";

export type ProspectWarmupStage = {
  key: ProspectWarmupStageKey;
  label: string;
  dailyLimit: number;
};

export class ProspectingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProspectingConfigError";
  }
}

function normalizeString(value: string | undefined | null) {
  return (value || "").trim();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function getEmailDomain(value: string) {
  const normalized = normalizeEmail(value);
  const parts = normalized.split("@");
  return parts.length === 2 ? parts[1] : "";
}

export function isPersonalMailbox(value: string) {
  return PERSONAL_MAILBOX_DOMAINS.has(getEmailDomain(value));
}

export function getProspectCooldownDays() {
  const raw = Number.parseInt(process.env.PROSPECT_COOLDOWN_DAYS || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 60;
}

export function getProspectDailyLimit() {
  const raw = Number.parseInt(process.env.PROSPECT_DAILY_LIMIT || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}

export function getProspectCooldownCutoff() {
  return new Date(Date.now() - getProspectCooldownDays() * 24 * 60 * 60 * 1000);
}

export function isRecentProspectActivity(dateLike: string | Date) {
  return new Date(dateLike) > getProspectCooldownCutoff();
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday || "Mon",
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

export function getProspectParisTimeParts(date = new Date()) {
  const parts = getTimeZoneParts(date, PROSPECT_TIMEZONE);
  return {
    ...parts,
    isWeekday: ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(parts.weekday),
  };
}

export function getProspectParisDayRange(date = new Date()) {
  const parts = getProspectParisTimeParts(date);
  const offsetMs = getTimeZoneOffsetMs(date, PROSPECT_TIMEZONE);
  const startUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0) - offsetMs;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000),
  };
}

export function isProspectWorkingHour(date = new Date()) {
  const parts = getProspectParisTimeParts(date);
  return parts.hour >= 8 && parts.hour <= 16;
}

export function isProspectSendingHour(date = new Date()) {
  const parts = getProspectParisTimeParts(date);
  return parts.isWeekday && parts.hour >= 9 && parts.hour <= 16;
}

export function getProspectWarmupStage(daysSinceStart: number): ProspectWarmupStage {
  if (daysSinceStart < 5) {
    return {
      key: "starter",
      label: "Jours 1 a 5",
      dailyLimit: 3,
    };
  }

  if (daysSinceStart < 10) {
    return {
      key: "ramp",
      label: "Jours 6 a 10",
      dailyLimit: 5,
    };
  }

  if (daysSinceStart < 20) {
    return {
      key: "growth",
      label: "Jours 11 a 20",
      dailyLimit: 8,
    };
  }

  return {
    key: "steady",
    label: "Apres 20 jours",
    dailyLimit: 10,
  };
}

export function getProspectingRuntime() {
  const host = normalizeString(process.env.PROSPECT_SMTP_HOST);
  const port = Number.parseInt(normalizeString(process.env.PROSPECT_SMTP_PORT || "587"), 10) || 587;
  const user = normalizeString(process.env.PROSPECT_SMTP_USER);
  const pass = normalizeString(process.env.PROSPECT_SMTP_PASS);
  const fromEmail = normalizeString(process.env.PROSPECT_FROM_EMAIL || user);
  const replyToEmail = normalizeString(process.env.PROSPECT_REPLY_TO || fromEmail);
  const unsubscribeUrl = normalizeString(process.env.PROSPECT_UNSUBSCRIBE_URL);
  const autosendEnabled = process.env.PROSPECT_AUTOSEND_ENABLED === "true";
  const senderConfigured = Boolean(host && user && pass && fromEmail);
  const senderEmailsAreValid =
    (!user || isValidEmail(user)) &&
    (!fromEmail || isValidEmail(fromEmail)) &&
    (!replyToEmail || isValidEmail(replyToEmail));
  const personalMailboxSender =
    isPersonalMailbox(user) || isPersonalMailbox(fromEmail) || host === "smtp.gmail.com";

  if (!senderConfigured) {
    return {
      senderConfigured: false,
      canManualSend: false,
      canAutoSend: false,
      mode: "queue_only" as const,
      host,
      port,
      user,
      pass,
      fromEmail: fromEmail || null,
      replyToEmail: replyToEmail || null,
      unsubscribeUrl: unsubscribeUrl || null,
      reason:
        "Sender prospect non configuré. Ajoute PROSPECT_SMTP_HOST, PROSPECT_SMTP_PORT, PROSPECT_SMTP_USER, PROSPECT_SMTP_PASS et PROSPECT_FROM_EMAIL.",
    };
  }

  if (!senderEmailsAreValid) {
    return {
      senderConfigured: true,
      canManualSend: false,
      canAutoSend: false,
      mode: "queue_only" as const,
      host,
      port,
      user,
      pass,
      fromEmail,
      replyToEmail: replyToEmail || null,
      unsubscribeUrl: unsubscribeUrl || null,
      reason:
        "Le sender prospect est invalide. Vérifie PROSPECT_SMTP_USER, PROSPECT_FROM_EMAIL et PROSPECT_REPLY_TO.",
    };
  }

  if (personalMailboxSender) {
    return {
      senderConfigured: true,
      canManualSend: false,
      canAutoSend: false,
      mode: "queue_only" as const,
      host,
      port,
      user,
      pass,
      fromEmail,
      replyToEmail: replyToEmail || null,
      unsubscribeUrl: unsubscribeUrl || null,
      reason:
        "La prospection est bloquée sur une boite personnelle. Utilise un sender dédié avec domaine propre et authentification SPF/DKIM/DMARC.",
    };
  }

  return {
    senderConfigured: true,
    canManualSend: true,
    canAutoSend: autosendEnabled,
    mode: autosendEnabled ? ("live" as const) : ("manual_only" as const),
    host,
    port,
    user,
    pass,
    fromEmail,
    replyToEmail: replyToEmail || null,
    unsubscribeUrl: unsubscribeUrl || null,
    reason: autosendEnabled
      ? null
      : "Le robot est en mode collecte. Active PROSPECT_AUTOSEND_ENABLED=true pour autoriser l'envoi automatique.",
  };
}

export function createProspectTransport() {
  const runtime = getProspectingRuntime();

  if (!runtime.canManualSend) {
    throw new ProspectingConfigError(runtime.reason || "Sender prospect indisponible.");
  }

  return {
    runtime,
    transporter: nodemailer.createTransport({
      host: runtime.host,
      port: runtime.port,
      secure: runtime.port === 465,
      auth: {
        user: runtime.user,
        pass: runtime.pass,
      },
    }),
  };
}
