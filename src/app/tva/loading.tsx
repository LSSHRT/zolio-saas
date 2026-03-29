"use client";

export default function Loading() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
      <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[1.75rem] bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
