import type { Metadata } from "next";
import type { TradeKey } from "@/lib/trades";
import { TRADE_OPTIONS, getTradeDefinition, DEFAULT_TRADE } from "@/lib/trades";
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
  if (!trade) return { title: "Spécialité introuvable | Zolio" };

  const label = trade.label;
  const labelLower = label.toLowerCase();
  const title = `Logiciel Devis & Factures ${label} — Zolio`;
  const description = `Créez vos devis d'électricité (${labelLower}) comme un pro. Devis conformes NF C 15-100, signature client, factures et suivi de chantier depuis votre téléphone. 3 devis gratuits.`;

  return {
    title,
    description,
    keywords: [
      `logiciel devis ${labelLower}`,
      `facturation ${labelLower}`,
      `devis ${labelLower} gratuit`,
      `devis en ligne ${labelLower}`,
      "logiciel électricien",
      "devis électricité",
      "devis chantier électrique",
    ],
    openGraph: { title, description, type: "website" },
    alternates: { canonical: `https://www.zolio.site/m/${metier}` },
  };
}

export default async function TradeLandingPage({ params }: Props) {
  const { metier } = await params;
  const trade: TradeKey = getTradeDefinition(metier)?.key ?? DEFAULT_TRADE;

  return <TradeLandingClient tradeKey={trade} />;
}
