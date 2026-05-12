import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import DashboardContent from "./dashboard-content";

export const metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble de votre activité : chiffre d'affaires, devis, factures et statistiques de votre entreprise.",
};

const EMPTY_SUMMARY = {
  totalQuotes: 0,
  totalHT: 0,
  totalTTC: 0,
  acceptedCount: 0,
  pendingCount: 0,
  refusedCount: 0,
  acceptedRevenueHT: 0,
  pipelineRevenueHT: 0,
  lostRevenueHT: 0,
  followUpCount: 0,
  conversionRate: 0,
  averageTicket: 0,
  avgResponseDays: 0,
  recentQuotes: [],
  followUpQuotes: [],
  monthlyData: [],
  topClients: [],
  starterCatalogCount: 0,
  tresorerie: { encaisse: 0, aEncaisser: 0, enRetard: 0, nombreFactures: 0, tauxRecouvrement: 0 },
  benefice: { caFacture: 0, depenses: 0, beneficeNet: 0, margePct: 0 },
  echeances: [],
  semaine: { nouveauxDevis: 0, devisAcceptes: 0, facturesEmises: 0, facturesPayees: 0, caEncaisse: 0, depensesSemaine: 0 },
  funnel: [],
};

const EMPTY_INITIAL_DATA = {
  companyTrade: null,
  catalogImported: false,
  onboardingDone: false,
  starterCatalogCount: 0,
  canAccessAdmin: false,
  isPro: false,
};

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  // Read flags directly from JWT claims (no Clerk API call). The client `useUser()` hook
  // hydrates with full user data once mounted.
  const claims = sessionClaims as Record<string, unknown> | null;
  const publicMeta = (claims?.publicMetadata as Record<string, unknown>) || {};
  const initialData = {
    ...EMPTY_INITIAL_DATA,
    canAccessAdmin: publicMeta.isAdmin === true,
    isPro: publicMeta.isPro === true,
  };

  return (
    <DashboardContent
      initialUser={{ firstName: null, imageUrl: null }}
      initialData={initialData}
      initialSummary={EMPTY_SUMMARY}
    />
  );
}
