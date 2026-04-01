import type { Metadata } from "next";
import type { TradeKey } from "@/lib/trades";
import { TRADE_OPTIONS, getTradeDefinition } from "@/lib/trades";
import TradeLandingClient from "./TradeLandingClient";

interface Props {
  params: Promise<{ metier: string }>;
}

export async function generateStaticParams() {
  return TRADE_OPTIONS.map((t) => ({ metier: t.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const trade = getTradeDefinition(metier);
  if (!trade) return { title: "Métier introuvable | Zolio" };

  const label = trade.label;
  const labelLower = label.toLowerCase();
  const title = `Logiciel Devis & Factures pour ${label} — Zolio`;
  const description = `Créez vos devis peint ${labelLower}e comme un pro. Devis, signature client, factures et suivi de chantier depuis votre téléphone. 3 devis gratuits.`;

  return {
    title,
    description,
    keywords: [
      `logiciel devis ${labelLower}e`,
      `facturation ${labelLower}`,
      `devis ${labelLower} gratuit`,
      `devis en ligne ${labelLower}`,
      `facture ${labelLower}e`,
      "logiciel artisan",
      "devis chantier",
    ],
    openGraph: { title, description, type: "website" },
    alternates: { canonical: `https://zolio.site/m/${metier}` },
  };
}

export default async function TradeLandingPage({ params }: Props) {
  const { metier } = await params;
  const trade: TradeKey = getTradeDefinition(metier)?.key ?? "peintre";

  return <TradeLandingClient tradeKey={trade} />;
}
