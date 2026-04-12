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

      {/* Info banner */}
      <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />

      {/* Planning items */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-white/8 dark:bg-white/4 animate-pulse">
            <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="mt-4 h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="mt-3 h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="mt-4 flex justify-end">
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
