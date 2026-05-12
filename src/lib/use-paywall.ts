"use client";

import { useCallback, useState } from "react";
import type { PaywallContext } from "@/components/paywall-modal";

type PaywallTrigger = "quota_80" | "quota_100" | "feature_locked" | "manual";

interface PaywallState {
  open: boolean;
  trigger: PaywallTrigger;
  context?: PaywallContext;
}

export function usePaywall() {
  const [state, setState] = useState<PaywallState>({
    open: false,
    trigger: "manual",
  });

  const openPaywall = useCallback((trigger: PaywallTrigger, context?: PaywallContext) => {
    setState({ open: true, trigger, context });
  }, []);

  const closePaywall = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return {
    paywallProps: {
      open: state.open,
      trigger: state.trigger,
      context: state.context,
      onClose: closePaywall,
    },
    openPaywall,
    closePaywall,
  };
}

/**
 * Computes whether to auto-open the paywall based on quota usage.
 * Returns the trigger type to use, or null if not needed.
 *
 * Strategy:
 * - At 100% (no quota remaining): open with trigger "quota_100"
 * - At ≥ 80% remaining used: nudge with trigger "quota_80" (only once per session via localStorage)
 */
export function computeQuotaTrigger(quota: { isPro?: boolean; used?: number; limit?: number }): {
  trigger: PaywallTrigger;
  context: PaywallContext;
} | null {
  if (!quota || quota.isPro) return null;
  const used = quota.used ?? 0;
  const limit = quota.limit ?? 3;
  if (!limit || !Number.isFinite(limit)) return null;
  if (used >= limit) {
    return { trigger: "quota_100", context: { used, limit } };
  }
  if (limit > 0 && used / limit >= 0.8) {
    return { trigger: "quota_80", context: { used, limit } };
  }
  return null;
}
