"use client";

import useSWR from "swr";
import { AlertTriangle } from "lucide-react";

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

export function SystemRuntimeLayer() {
  const { data } = useSWR<SystemRuntimePayload>("/api/system/status", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const systemBanner = data?.systemBanner?.trim() ?? "";

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
    </>
  );
}
