import { Skeleton } from "@/components/Skeleton";

type Props = {
  variant?: "list" | "dashboard" | "form";
};

export function ClientShellSkeleton({ variant = "list" }: Props) {
  return (
    <div
      aria-hidden
      className="client-workspace lg-v2-workspace relative min-h-screen overflow-x-hidden text-slate-950 dark:text-white"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),rgba(251,146,60,0.06),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),rgba(251,146,60,0.08),transparent_60%)] lg:hidden" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col gap-3 border-r border-slate-200/60 bg-white/80 px-3 py-4 dark:border-white/8 dark:bg-slate-950/60 lg:flex">
        <Skeleton className="h-11 w-44" rounded="rounded-2xl" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-10 w-full" rounded="rounded-lg" />
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>

      <div
        className="flex min-h-screen w-full flex-col px-4 pt-3 sm:px-6 sm:pt-4 lg:ml-[240px] lg:max-w-[calc(100%-240px)] lg:px-8 xl:px-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
      >
        <header className="sticky top-2 z-40 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/60 lg:hidden">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11" rounded="rounded-full" />
            <Skeleton className="h-11 w-11" rounded="rounded-2xl" />
          </div>
          <Skeleton className="h-9 w-24" />
        </header>

        <main className="mt-4 max-w-[1440px] flex-1 space-y-4 lg:mx-auto lg:mt-8 lg:w-full lg:space-y-8">
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 px-5 py-5 dark:border-white/8 dark:bg-white/[0.03] sm:px-6 sm:py-6">
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </section>

          {variant === "form" ? (
            <section className="space-y-3 rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/8 dark:bg-white/[0.03]">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </section>
          ) : variant === "dashboard" ? (
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]">
              <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-64" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </section>
          )}
        </main>
      </div>

      <nav
        className="fixed inset-x-3 z-30 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around gap-0.5 rounded-2xl border border-slate-200/60 bg-white/85 px-2 py-2 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/70 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <Skeleton className="h-11 w-12" rounded="rounded-xl" />
        <Skeleton className="h-11 w-12" rounded="rounded-xl" />
        <Skeleton className="h-12 w-12 -mt-4" rounded="rounded-2xl" />
        <Skeleton className="h-11 w-12" rounded="rounded-xl" />
        <Skeleton className="h-11 w-12" rounded="rounded-xl" />
      </nav>
    </div>
  );
}
