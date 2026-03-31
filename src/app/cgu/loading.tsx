"use client";

export default function Loading() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="h-8 w-96 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-6" />
      <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-8" />
      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
