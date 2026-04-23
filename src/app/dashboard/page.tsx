import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble de votre activité : chiffre d'affaires, devis, factures et statistiques de votre entreprise.",
};

import { getClientDashboardSummary } from "@/lib/client-dashboard";
import DashboardContent from "./dashboard-content";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const summary = await getClientDashboardSummary(userId);

  const companyTrade = (user?.unsafeMetadata?.companyTrade || user?.publicMetadata?.companyTrade) as string | undefined;
  const catalogImported = !!(user?.unsafeMetadata?.starterCatalogImported || user?.publicMetadata?.starterCatalogImported);
  const onboardingDone = !!(user?.unsafeMetadata?.onboardingCompleted || user?.publicMetadata?.onboardingCompleted);
  const canAccessAdmin = user?.publicMetadata?.isAdmin === true;
  const isPro = user?.publicMetadata?.isPro === true;
  const firstName = user?.firstName || null;
  const imageUrl = user?.imageUrl || null;

  return (
    <DashboardContent
      summary={summary}
      firstName={firstName}
      imageUrl={imageUrl}
      companyTrade={companyTrade}
      catalogImported={catalogImported}
      onboardingDone={onboardingDone}
      canAccessAdmin={canAccessAdmin}
      isPro={isPro}
    />
  );
}
