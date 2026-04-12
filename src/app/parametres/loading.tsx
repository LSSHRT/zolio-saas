"use client";

export default function Loading() {
  return (
    <div className="client-workspace relative min-h-screen overflow-hidden">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="client-panel w-full max-w-2xl rounded-2xl p-6">
          <div className="space-y-6">
            {/* Logo + title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>

            {/* Form fields */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-11 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}

            {/* Submit button */}
            <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
