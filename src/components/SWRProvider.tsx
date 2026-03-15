"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Déduplique les requêtes identiques dans une fenêtre de 10s
        dedupingInterval: 10000,
        // Ne refetch pas automatiquement quand l'onglet reprend le focus
        revalidateOnFocus: false,
        // Délai minimum entre deux revalidations sur focus (si activé ponctuellement)
        focusThrottleInterval: 30000,
        // Retry après erreur : max 2 fois
        errorRetryCount: 2,
        // Garde les données précédentes pendant le rechargement (pas de flash vide)
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
