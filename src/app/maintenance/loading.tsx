"use client";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_26%),linear-gradient(180deg,#050816_0%,#020617_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-8 text-center sm:p-10">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gray-700 animate-pulse" />
          <div className="mx-auto mt-6 h-3 w-40 rounded bg-gray-700 animate-pulse" />
          <div className="mx-auto mt-4 h-8 w-64 rounded bg-gray-700 animate-pulse" />
          <div className="mx-auto mt-4 h-5 w-80 rounded bg-gray-700 animate-pulse" />
          <div className="mx-auto mt-8 h-10 w-48 rounded-xl bg-gray-700 animate-pulse" />
        </section>
      </div>
    </main>
  );
}
