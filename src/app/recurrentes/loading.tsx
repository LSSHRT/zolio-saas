"use client";

import { RefreshCw } from "lucide-react";
import {
  ClientBrandMark,
  ClientDesktopNav,
} from "@/components/client-shell";

export default function Loading() {
  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-24 text-slate-950 dark:text-white sm:pb-28">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-4 lg:px-8 lg:pb-10">
        <header className="client-panel sticky top-2 z-40 rounded-[1.8rem] px-4 py-3 backdrop-blur-xl sm:top-3 sm:rounded-[2rem] sm:px-6 sm:py-4">
          <div className="hidden items-center justify-between md:flex">
            <ClientBrandMark />
          </div>
        </header>

        <ClientDesktopNav active="tools" />

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          {/* Hero section skeleton */}
          <section className="client-panel-strong overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-6 lg:px-7">
            <div className="mb-4">
              <div className="h-3 w-24 rounded bg-slate-200/60 dark:bg-white/10" />
              <div className="mt-4 h-9 w-64 rounded bg-slate-200/60 dark:bg-white/10" />
              <div className="mt-3 h-4 w-96 rounded bg-slate-100/60 dark:bg-white/8" />
            </div>
            <div className="mt-6 hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="client-kpi-card">
                  <div className="h-3 w-20 rounded bg-slate-200/60 dark:bg-white/10" />
                  <div className="mt-4 h-8 w-16 rounded bg-slate-200/60 dark:bg-white/10" />
                  <div className="mt-4 h-7 w-28 rounded-full bg-slate-200/60 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </section>

          {/* Search skeleton */}
          <section className="client-panel rounded-[2rem] p-5 sm:p-6">
            <div className="h-12 rounded-2xl bg-slate-200/60 dark:bg-white/10 animate-pulse" />
          </section>

          {/* Cards skeleton */}
          <section className="client-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-3">
              <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                <div className="h-3 w-24 rounded bg-slate-200/60 dark:bg-white/10" />
                <div className="mt-2 h-4 w-32 rounded bg-slate-200/60 dark:bg-white/10" />
              </div>

              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-shimmer rounded-[1.75rem] border border-slate-200/70 bg-white/70 p-5 dark:border-white/8 dark:bg-white/4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200/60 dark:bg-white/10" />
                      <div>
                        <div className="mb-2 h-4 w-32 rounded bg-slate-200/60 dark:bg-white/10" />
                        <div className="h-3 w-24 rounded bg-slate-100/60 dark:bg-white/8" />
                      </div>
                    </div>
                    <div className="h-6 w-20 rounded-full bg-slate-200/60 dark:bg-white/10" />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="h-8 w-24 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                    <div className="h-8 w-20 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                    <div className="h-8 w-24 rounded-xl bg-slate-100/60 dark:bg-white/8 md:ml-auto" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-10 w-28 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                    <div className="h-10 w-24 rounded-xl bg-slate-100/60 dark:bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="hidden border-t border-slate-200/60 py-4 text-center text-xs text-slate-400 dark:border-white/6 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-6">
            <span>© {new Date().getFullYear()} Zolio</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
