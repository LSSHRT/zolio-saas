import type { Metadata } from "next";
import LandingRouter from "@/components/LandingRouter";

export const metadata: Metadata = {
  title: "Zolio : Gestion administrative pour électriciens du BTP — 199 €/mois",
  description: "Électriciens du BTP : Gagnez 10h/semaine d'administratif, zéro client perdu. Nous gérons vos devis aux normes NF C 15-100 sous 24h, factures, relances impayés, attestations Consuel & URSSAF. Premier mois gratuit.",
  alternates: {
    canonical: "https://www.zolio.site",
  },
};

export default function Page() {
  return <LandingRouter />;
}
