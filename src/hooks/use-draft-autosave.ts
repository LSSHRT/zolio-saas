"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildDraftKey,
  clearDraft as clearDraftEntry,
  readDraft,
  writeDraft,
} from "@/lib/draft-storage";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

export type UseDraftAutosaveOptions<T> = {
  /** Stable namespace for this form, e.g. "clients-nouveau". */
  namespace: string;
  /** Identifier scoping the draft to a user (typically Clerk user id). When
   *  null the draft is stored under "anon" — that is fine for guest tabs but
   *  callers should pass a real id when available. */
  scope: string | null | undefined;
  /** Bumped on incompatible `T` shape changes. */
  version: number;
  /** Live form state to persist. */
  data: T;
  /** Returns true when the current data is effectively empty and should not
   *  be persisted (and any existing draft should be cleared). */
  isEmpty: (data: T) => boolean;
  /** Optional debounce. Defaults to 400ms. */
  debounceMs?: number;
  /** Drafts older than this (ms) are dropped on read. */
  maxAgeMs?: number;
};

export type UseDraftAutosaveResult = {
  status: DraftStatus;
  savedAt: Date | null;
  /** True once the initial restore attempt has settled. Form callers should
   *  not start observing data changes until this flips to true to avoid
   *  writing the empty initial state on top of a real draft. */
  hydrated: boolean;
  /** Latest restored data (or null if no draft existed). Consumed once via
   *  `consumeRestored` so React strict-mode double mounts don't loop. */
  restored: unknown;
  consumeRestored: () => void;
  /** Manual clear, e.g. after a successful submit or an explicit "discard"
   *  button. Resets status to idle. */
  clear: () => void;
};

export function useDraftAutosave<T>({
  namespace,
  scope,
  version,
  data,
  isEmpty,
  debounceMs = 400,
  maxAgeMs,
}: UseDraftAutosaveOptions<T>): UseDraftAutosaveResult & { restored: T | null } {
  const key = buildDraftKey(namespace, scope);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState<T | null>(null);
  const lastSerializedRef = useRef<string>("");

  useEffect(() => {
    const restoredDraft = readDraft<T>(key, { version, maxAgeMs });
    if (restoredDraft) {
      setRestored(restoredDraft.data);
      setSavedAt(restoredDraft.savedAt);
      setStatus("saved");
      lastSerializedRef.current = JSON.stringify(restoredDraft.data);
    }
    setHydrated(true);
  }, [key, version, maxAgeMs]);

  useEffect(() => {
    if (!hydrated) return;

    if (isEmpty(data)) {
      if (lastSerializedRef.current !== "") {
        clearDraftEntry(key);
        lastSerializedRef.current = "";
        setStatus("idle");
        setSavedAt(null);
      }
      return;
    }

    const serialized = JSON.stringify(data);
    if (serialized === lastSerializedRef.current) return;

    setStatus("saving");
    const handle = window.setTimeout(() => {
      const writtenAt = writeDraft(key, data, version);
      if (writtenAt) {
        lastSerializedRef.current = serialized;
        setSavedAt(writtenAt);
        setStatus("saved");
      } else {
        setStatus("error");
      }
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [data, debounceMs, hydrated, isEmpty, key, version]);

  const consumeRestored = () => setRestored(null);
  const clear = () => {
    clearDraftEntry(key);
    lastSerializedRef.current = "";
    setSavedAt(null);
    setRestored(null);
    setStatus("idle");
  };

  return { status, savedAt, hydrated, restored, consumeRestored, clear };
}
