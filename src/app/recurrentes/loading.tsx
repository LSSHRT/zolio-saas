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
      <div className="h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />

      {/* Cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
