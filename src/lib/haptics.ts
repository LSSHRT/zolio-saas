// Light haptic feedback for mobile interactions.
// Falls back to a no-op when `navigator.vibrate` is unavailable (most desktops,
// older browsers, or when the user has disabled motion). Calls are wrapped in
// try/catch because some PWA contexts throw NotAllowedError on the first call.

export type HapticIntensity = "light" | "medium" | "heavy" | "selection";

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  selection: 5,
  light: 10,
  medium: [10, 8, 14],
  heavy: [12, 10, 18, 10, 24],
};

let warned = false;

export function haptic(intensity: HapticIntensity = "light"): void {
  if (typeof navigator === "undefined") return;
  const vibrate = navigator.vibrate?.bind(navigator);
  if (!vibrate) return;

  try {
    vibrate(PATTERNS[intensity]);
  } catch (error) {
    if (!warned && process.env.NODE_ENV !== "production") {
      warned = true;
      console.warn("[haptics] vibrate() rejected:", error);
    }
  }
}

export function hapticOnTap<E extends { preventDefault?: () => void }>(
  intensity: HapticIntensity = "selection",
): (event: E) => void {
  return () => haptic(intensity);
}
