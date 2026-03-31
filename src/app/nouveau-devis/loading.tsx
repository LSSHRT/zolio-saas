"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-5 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        {/* Form skeleton */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-white/8 dark:bg-slate-900">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
            <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
