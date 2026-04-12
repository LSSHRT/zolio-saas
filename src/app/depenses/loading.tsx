"use client";

export default function Loading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>

      {/* Search */}
      <div className="h-12 rounded-[1.1rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />

      {/* Expense cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
