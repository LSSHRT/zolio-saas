"use client";

type SkeletonProps = {
  className?: string;
  rounded?: string;
};

/**
 * Composant skeleton réutilisable pour les états de chargement.
 * Utilise l'animation shimmer déjà définie dans globals.css.
 */
export function Skeleton({ className = "", rounded = "rounded-xl" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton pour une carte KPI (chiffre clé)
 */
export function KpiSkeleton() {
  return (
    <div className="rounded-[1.55rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
      <Skeleton className="h-3 w-20 mb-3" rounded="rounded-lg" />
      <Skeleton className="h-8 w-28 mb-3" rounded="rounded-lg" />
      <Skeleton className="h-4 w-36" rounded="rounded-lg" />
    </div>
  );
}

/**
 * Skeleton pour une carte devis
 */
export function DevisCardSkeleton() {
  return (
    <div className="rounded-[1.55rem] border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 shrink-0" rounded="rounded-2xl" />
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" rounded="rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour une ligne de liste
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 shrink-0" rounded="rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-6 w-16" rounded="rounded-full" />
    </div>
  );
}

/**
 * Skeleton pour le graphique
 */
export function ChartSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="flex items-end gap-2 h-32 w-full justify-center">
        {[40, 65, 45, 80, 55, 70].map((h, i) => (
          <div
            key={i}
            className="animate-shimmer w-8 rounded-t-lg"
            style={{ height: `${h}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/**
 * Skeleton pour le dashboard mobile
 */
export function DashboardMobileSkeleton() {
  return (
    <div className="space-y-4 md:hidden">
      {/* Hero section */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-5 dark:border-white/8 dark:bg-white/4">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-2">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      </div>

      {/* KPIs */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      </div>

      {/* Devis récents */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 dark:border-white/8 dark:bg-white/4">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          <DevisCardSkeleton />
          <DevisCardSkeleton />
          <DevisCardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour le dashboard desktop
 */
export function DashboardDesktopSkeleton() {
  return (
    <div className="hidden md:grid items-start gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.82fr)]">
      {/* Colonne gauche */}
      <div className="space-y-4">
        {/* Hero */}
        <div className="rounded-[2.35rem] border border-slate-200/70 bg-white/75 px-5 py-6 dark:border-white/8 dark:bg-white/4">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-12 w-80 mb-2" />
          <Skeleton className="h-5 w-96 mb-6" />
          <div className="grid grid-cols-3 gap-3">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        </div>

        {/* KPIs */}
        <div className="rounded-[2.15rem] border border-slate-200/70 bg-white/75 p-5 dark:border-white/8 dark:bg-white/4">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-7 w-56 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        </div>

        {/* Devis */}
        <div className="rounded-[2.1rem] border border-slate-200/70 bg-white/75 p-5 dark:border-white/8 dark:bg-white/4">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <DevisCardSkeleton />
            <DevisCardSkeleton />
            <DevisCardSkeleton />
            <DevisCardSkeleton />
          </div>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="space-y-4">
        <div className="rounded-[2.2rem] border border-slate-200/70 bg-white/75 p-5 dark:border-white/8 dark:bg-white/4">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-3">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
