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

      {/* Quick access + info */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
        <div className="h-44 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-44 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Note cards grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
