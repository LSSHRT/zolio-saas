"use client";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b,transparent_45%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="h-3 w-24 rounded bg-gray-700 animate-pulse" />
        <div className="mt-4 h-8 w-64 rounded bg-gray-700 animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-gray-700 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-gray-700 animate-pulse" />
        </div>
        <div className="mt-6 h-4 w-48 rounded bg-gray-700 animate-pulse" />
      </div>
    </main>
  );
}
