"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { useTheme } from "next-themes";

/**
 * Wraps <ClerkProvider/> and adapts its `appearance` to the current next-themes value.
 * Must be a client component because `useTheme()` is client-only.
 *
 * We keep the same shape as before but flip colors based on `resolvedTheme`.
 * Clerk's `variables` drive the form/card colors; `elements` drive Tailwind classes.
 */
export function ClerkThemedProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const variables = isDark
    ? {
        colorPrimary: "#a78bfa",
        colorText: "#f8fafc",
        colorTextSecondary: "#cbd5e1",
        colorBackground: "#0b1024",
        colorInputText: "#f8fafc",
        colorInputBackground: "rgba(255,255,255,0.04)",
        borderRadius: "1rem",
        fontFamily: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
      }
    : {
        colorPrimary: "#7c3aed",
        colorText: "#0f172a",
        colorTextSecondary: "#64748b",
        colorBackground: "#ffffff",
        colorInputText: "#0f172a",
        colorInputBackground: "#f8fafc",
        borderRadius: "1rem",
        fontFamily: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
      };

  return (
    <ClerkProvider
      localization={frFR}
      appearance={{
        variables,
        elements: {
          card: "shadow-xl shadow-violet-500/8 border border-slate-200/60 rounded-2xl dark:border-white/10 dark:shadow-violet-500/15",
          headerTitle: "text-slate-950 dark:text-white",
          headerSubtitle: "text-slate-500 dark:text-slate-400",
          socialButtonsBlockButton:
            "rounded-xl border-slate-200 hover:border-violet-300 transition dark:border-white/10 dark:hover:border-violet-400/40",
          formButtonPrimary:
            "rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-md shadow-violet-500/20",
          formFieldInput:
            "rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 dark:border-white/10 dark:focus:border-violet-400",
          footerActionLink:
            "text-violet-600 hover:text-violet-700 font-medium dark:text-violet-300 dark:hover:text-violet-200",
          dividerLine: "bg-slate-200 dark:bg-white/10",
          dividerText: "text-slate-400 text-xs dark:text-slate-500",
          formFieldLabel: "text-slate-700 font-medium text-sm dark:text-slate-200",
          identityPreviewText: "text-slate-600 dark:text-slate-300",
          identityPreviewEditButton:
            "text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
