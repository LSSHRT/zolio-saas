"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle, ShieldAlert, Wrench } from "lucide-react";

type SystemRuntimePayload = {
  systemBanner: string;
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  canBypassMaintenance: boolean;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de récupérer l'état système");
  }
  return response.json() as Promise<SystemRuntimePayload>;
};

const MAINTENANCE_BYPASS_PATHS = ["/admin", "/sign-in", "/sign-up"];

export function SystemRuntimeLayer() {
  const pathname = usePathname();
  const { data } = useSWR<SystemRuntimePayload>("/api/system/status", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const systemBanner = data?.systemBanner?.trim() ?? "";
  const isMaintenanceBypassPath = MAINTENANCE_BYPASS_PATHS.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const showMaintenanceOverlay =
    Boolean(data?.maintenanceEnabled) &&
    !data?.canBypassMaintenance &&
    !isMaintenanceBypassPath;

  return (
    <>
      {systemBanner && (
        <div className="sticky top-0 z-[70] border-b border-amber-300/20 bg-amber-300/12 px-4 py-3 text-center text-sm text-amber-50 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-200" />
            <p>{systemBanner}</p>
          </div>
        </div>
      )}

      {showMaintenanceOverlay && (
        <div className="fixed inset-0 z-[90] flex min-h-screen items-center justify-center bg-slate-950/94 px-4 py-10 backdrop-blur-2xl">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-8 text-center shadow-[0_30px_120px_-40px_rgba(0,0,0,0.75)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-amber-400/12 text-amber-200 ring-1 ring-amber-300/20">
              <Wrench className="h-10 w-10" />
            </div>
            <p className="mt-6 text-[11px] uppercase tracking-[0.34em] text-slate-500">Zolio maintenance</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              La plateforme est temporairement en maintenance.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              {data?.maintenanceMessage?.trim() ||
                "Nous appliquons une mise à jour importante. Merci de revenir dans quelques minutes."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Revenir à l’accueil
              </Link>
              <Link
                href="/sign-in?redirect_url=/admin"
                className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Accès administrateur
              </Link>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-slate-300">
              <ShieldAlert className="h-3.5 w-3.5 text-violet-200" />
              Les administrateurs gardent l’accès au cockpit.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
