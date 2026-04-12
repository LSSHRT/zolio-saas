"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:pl-[276px] transition-colors duration-300">
      {/* Mock Sidebar (Desktop) */}
      <div className="fixed inset-y-4 left-4 z-30 hidden w-[260px] flex-col rounded-2xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-slate-900/50">
        <div className="h-12 w-full rounded-2xl bg-slate-200/60 animate-pulse dark:bg-white/10 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 w-full rounded-xl bg-slate-200/60 animate-pulse dark:bg-white/5" />
          ))}
        </div>
        <div className="mt-auto space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-11 w-full rounded-xl bg-slate-200/60 animate-pulse dark:bg-white/5" />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto space-y-6 pt-4">
        {/* Mock Header */}
        <header className="flex items-center justify-between px-4 py-4 rounded-2xl border border-slate-200/80 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
          <div className="h-6 w-32 rounded-lg bg-slate-200/60 animate-pulse dark:bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200/60 animate-pulse dark:bg-white/10" />
            <div className="h-6 w-20 rounded-lg bg-slate-200/60 animate-pulse dark:bg-white/10" />
          </div>
        </header>

        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded-lg bg-slate-200/60 animate-pulse dark:bg-white/10" />
            <div className="h-10 w-2/3 rounded-lg bg-slate-200/60 animate-pulse dark:bg-white/10" />
            <div className="flex gap-3 pt-4">
              <div className="h-11 w-32 rounded-full bg-violet-100 animate-pulse dark:bg-violet-900/30" />
              <div className="h-11 w-32 rounded-full bg-slate-200/60 animate-pulse dark:bg-white/10" />
            </div>
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
              <div className="h-3 w-20 rounded bg-slate-200/60 animate-pulse dark:bg-white/10 mb-3" />
              <div className="h-7 w-24 rounded bg-slate-200/60 animate-pulse dark:bg-white/10 mb-2" />
              <div className="h-3 w-28 rounded bg-slate-100/60 animate-pulse dark:bg-white/5" />
            </div>
          ))}
        </div>

        {/* Main content list skeleton */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-6">
             <div className="h-6 w-48 rounded-lg bg-slate-200/60 animate-pulse dark:bg-white/10" />
             <div className="h-8 w-24 rounded-xl bg-slate-200/60 animate-pulse dark:bg-white/10" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 w-full rounded-2xl border border-slate-200/60 bg-white/30 animate-pulse dark:border-white/10 dark:bg-white/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200/60 dark:bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-200/60 dark:bg-white/10" />
                    <div className="h-3 w-1/4 rounded bg-slate-100/60 dark:bg-white/5" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-slate-200/60 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
