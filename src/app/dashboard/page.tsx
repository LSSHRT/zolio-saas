import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble de votre activité : chiffre d'affaires, devis, factures et statistiques de votre entreprise.",
};

import { getClientDashboardSummary } from "@/lib/client-dashboard";
import DashboardContent from "./dashboard-content";

const EMPTY_INITIAL_DATA = {
  companyTrade: null,
  catalogImported: false,
  onboardingDone: false,
  starterCatalogCount: 0,
  canAccessAdmin: false,
  isPro: false,
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

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  let summary;
  try {
    summary = await getClientDashboardSummary(userId);
  } catch (error) {
    console.error("[DashboardPage] Failed to load summary:", error);
    summary = EMPTY_SUMMARY;
  }

  const companyTrade = (user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade) as string | undefined;
  const catalogImported = !!(user?.unsafeMetadata?.starterCatalogImported || user?.publicMetadata?.starterCatalogImported);
  const onboardingDone = !!(user?.unsafeMetadata?.onboardingCompleted || user?.publicMetadata?.onboardingCompleted);
  const canAccessAdmin = user?.publicMetadata?.isAdmin === true;
  const isPro = user?.publicMetadata?.isPro === true;
  const firstName = user?.firstName || null;
  const imageUrl = user?.imageUrl || null;

  const initialData = {
    companyTrade: companyTrade || null,
    catalogImported,
    onboardingDone,
    starterCatalogCount: summary?.starterCatalogCount ?? 0,
    canAccessAdmin,
    isPro,
  };

  return (
    <DashboardContent
      initialUser={{ firstName, imageUrl }}
      initialData={initialData}
      initialSummary={summary}
    />
  );
}
