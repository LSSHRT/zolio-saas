"use client";

import DashboardContent from "./dashboard-content";

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

// Pure client page (matches /devis pattern). Auth is enforced by middleware.
// User data (firstName, imageUrl, admin/pro flags) is hydrated via useUser() inside DashboardContent.
// Dashboard summary is fetched via SWR. No server roundtrip = instant navigation.
export default function DashboardPage() {
  return (
    <DashboardContent
      initialUser={{ firstName: null, imageUrl: null }}
      initialData={EMPTY_INITIAL_DATA}
      initialSummary={EMPTY_SUMMARY}
    />
  );
}
