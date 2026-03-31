"use client";

export default function Loading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-[1.5rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>

      {/* Signals + quick actions */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]">
        <div className="h-56 rounded-[1.6rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-56 rounded-[1.6rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Charts / tables */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-[1.6rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-72 rounded-[1.6rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
