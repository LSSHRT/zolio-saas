// Typed localStorage wrapper for form drafts.
// Goals:
//  - One place to handle JSON parse/stringify errors, quota errors, and missing
//    `window` during SSR.
//  - Schema versioning so we can ship breaking changes to draft shapes without
//    crashing existing users on next deploy.
//  - Soft expiration so stale drafts don't haunt users forever.
//  - Per-user namespacing so two Clerk accounts sharing a browser don't see
//    each other's drafts.

export type DraftEnvelope<T> = {
  version: number;
  savedAt: string;
  data: T;
};

export type DraftOptions = {
  /** Bumped whenever the draft `T` shape changes incompatibly. Drafts with a
   *  mismatching version are dropped on read. */
  version: number;
  /** Drafts older than this (ms) are dropped on read. Default 14 days. */
  maxAgeMs?: number;
};

const DEFAULT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function buildDraftKey(namespace: string, scope: string | null | undefined): string {
  const trimmedScope = scope?.trim() || "anon";
  return `zolio:draft:${namespace}:${trimmedScope}`;
}

export function readDraft<T>(
  key: string,
  options: DraftOptions,
): { data: T; savedAt: Date } | null {
  if (!isBrowser()) return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(key);
    return null;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as DraftEnvelope<T>).version !== options.version ||
    typeof (parsed as DraftEnvelope<T>).savedAt !== "string"
  ) {
    safeRemove(key);
    return null;
  }

  const envelope = parsed as DraftEnvelope<T>;
  const savedAt = new Date(envelope.savedAt);
  if (Number.isNaN(savedAt.getTime())) {
    safeRemove(key);
    return null;
  }

  const maxAge = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  if (Date.now() - savedAt.getTime() > maxAge) {
    safeRemove(key);
    return null;
  }

  return { data: envelope.data, savedAt };
}

export function writeDraft<T>(key: string, data: T, version: number): Date | null {
  if (!isBrowser()) return null;

  const savedAt = new Date();
  const envelope: DraftEnvelope<T> = {
    version,
    savedAt: savedAt.toISOString(),
    data,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
    return savedAt;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  safeRemove(key);
}

function safeRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // intentionally swallow — Safari private mode and quota-exceeded both
    // throw here and there is nothing we can do.
  }
}

export function formatDraftTime(savedAt: Date | null | undefined): string | null {
  if (!savedAt) return null;
  if (Number.isNaN(savedAt.getTime())) return null;

  const now = new Date();
  const sameDay =
    savedAt.getFullYear() === now.getFullYear() &&
    savedAt.getMonth() === now.getMonth() &&
    savedAt.getDate() === now.getDate();

  if (sameDay) {
    return savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  return savedAt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
