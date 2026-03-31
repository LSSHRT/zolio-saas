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

      {/* Plan cards */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="h-64 rounded-[1.8rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-64 rounded-[1.8rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
