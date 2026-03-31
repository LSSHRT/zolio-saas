"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#05050A] py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="h-5 w-36 rounded bg-gray-700 animate-pulse mb-12" />
        <div className="mx-auto h-10 w-72 rounded bg-gray-700 animate-pulse mb-12" />
        <div className="space-y-4 rounded-3xl border border-white/5 bg-neutral-900/50 p-8 sm:p-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-48 rounded bg-gray-700 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-700 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-gray-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
