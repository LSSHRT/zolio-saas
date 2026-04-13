import type { Metadata } from "next";
import LandingRouter from "@/components/LandingRouter";

export const metadata: Metadata = {
  title: "Zolio — Logiciel de Devis et Factures pour Artisans (Gratuit)",
  description: "Créez des devis professionnels en 3 minutes depuis votre téléphone. Signature digitale, facturation en 1 clic. Conçu pour les artisans du bâtiment. 1 devis offert, sans carte bancaire.",
  alternates: {
    canonical: "https://www.zolio.site",
  },
};

export default function Page() {
  return <LandingRouter />;
}
