export default function DashboardLoading() {
  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      <div className="flex min-h-screen w-full flex-col px-4 pb-28 pt-4 sm:px-6 lg:ml-[276px] lg:max-w-[calc(100%-276px)] lg:px-4 lg:pb-10">
        <main className="mt-4 flex-1 lg:mt-6">
          {/* Desktop skeleton */}
          <div className="hidden lg:flex lg:flex-col lg:gap-10 animate-pulse">
            {/* Greeting */}
            <div className="h-9 w-72 rounded-lg bg-slate-200 dark:bg-white/8" />

            {/* 3 KPI cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="h-36 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10" />
              <div className="h-36 rounded-2xl bg-amber-100 dark:bg-amber-500/10" />
              <div className="h-36 rounded-2xl bg-violet-100 dark:bg-violet-500/10" />
            </div>

            {/* Actions */}
            <div>
              <div className="mb-4 h-6 w-32 rounded bg-slate-200 dark:bg-white/8" />
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5" />
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="h-[380px] rounded-2xl bg-slate-900/80 dark:bg-slate-800/60" />

            {/* 2 columns */}
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5" />
              <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5" />
            </div>
          </div>

          {/* Mobile skeleton */}
          <div className="flex flex-col gap-4 lg:hidden animate-pulse">
            <div className="h-40 rounded-2xl bg-slate-100 dark:bg-white/5" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-xl bg-slate-100 dark:bg-white/5" />
              <div className="h-20 rounded-xl bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-64 rounded-2xl bg-slate-100 dark:bg-white/5" />
          </div>
        </main>
      </div>
    </div>
  );
}
