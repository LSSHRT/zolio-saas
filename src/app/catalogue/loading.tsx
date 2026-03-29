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

      {/* Starter trade + info */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="h-56 rounded-[1.8rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-56 rounded-[1.8rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Search */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="h-12 rounded-[1.25rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Prestation cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[1.7rem] border border-slate-200/70 bg-slate-50/85 p-5 dark:border-white/8 dark:bg-white/4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-16 w-36 rounded-[1.2rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-16 rounded-[1.2rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-16 rounded-[1.2rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-16 rounded-[1.2rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="h-11 rounded-[1rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-11 rounded-[1rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-11 rounded-[1rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
