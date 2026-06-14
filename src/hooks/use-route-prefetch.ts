"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Warm the Next.js router cache for a list of likely-next routes once the
 * browser is idle. Safari does not implement `requestIdleCallback` so we fall
 * back to a 1.2s `setTimeout` that fires after the page is generally past
 * first paint.
 *
 * Pass the `enabled` flag to short-circuit when the call site is rendered in
 * a context where prefetching is wasteful (e.g. the user is on a tiny screen
 * with data-saver, on a route where the dock is hidden, etc).
 */
export function useRoutePrefetch(routes: readonly string[], enabled: boolean = true): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || routes.length === 0 || typeof window === "undefined") return;

    const run = () => {
      for (const route of routes) {
        try {
          router.prefetch(route);
        } catch {
          // router.prefetch is fire-and-forget; failures during navigation
          // teardown are harmless.
        }
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(run, 1200);
    return () => window.clearTimeout(timeout);
  }, [enabled, routes, router]);
}
