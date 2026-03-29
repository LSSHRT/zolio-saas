"use client";

export default function Loading() {
  return (
    <div className="admin-cockpit min-h-screen px-4 py-10 font-sans">
      <div className="pointer-events-none absolute inset-0 admin-grid-overlay" />
      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200/60 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-200/60 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200/60 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>

        {/* Charts / panels */}
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-64 rounded-2xl bg-gray-200/60 dark:bg-gray-700 animate-pulse" />
          <div className="h-64 rounded-2xl bg-gray-200/60 dark:bg-gray-700 animate-pulse" />
        </div>

        {/* Table area */}
        <div className="h-48 rounded-2xl bg-gray-200/60 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
