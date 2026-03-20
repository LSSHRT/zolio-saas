import { prisma } from "@/lib/prisma";

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

type RawDashboardQuote = {
  numero: string;
  date: Date;
  statut: string;
  remise: number | null;
  tva: number | null;
  lignes: unknown;
  client: {
    nom: string;
    email: string | null;
  };
};

export type ClientDashboardQuoteSummary = {
  numero: string;
  nomClient: string;
  emailClient: string;
  date: string;
  statut: string;
  totalHT: number;
  totalTTC: number;
};

export type ClientDashboardMonthlyDatum = {
  name: string;
  CA: number;
};

export type ClientDashboardSummary = {
  starterCatalogCount: number;
  totalQuotes: number;
  totalHT: number;
  totalTTC: number;
  acceptedCount: number;
  pendingCount: number;
  acceptedRevenueHT: number;
  pipelineRevenueHT: number;
  followUpCount: number;
  conversionRate: number;
  averageTicket: number;
  recentQuotes: ClientDashboardQuoteSummary[];
  followUpQuotes: ClientDashboardQuoteSummary[];
  monthlyData: ClientDashboardMonthlyDatum[];
};

type DashboardLineItem = {
  quantite?: number;
  prixUnitaire?: number;
  totalLigne?: number;
  tva?: number | string;
  isOptional?: boolean;
};

function parseQuoteDate(value: string | Date) {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeLineItems(value: unknown): DashboardLineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is DashboardLineItem => typeof item === "object" && item !== null);
}

function computeQuoteTotals(lines: DashboardLineItem[], globalTva: number, globalDiscount: number) {
  const activeLines = lines.filter((line) => !line.isOptional);

  const totalHTBase = activeLines.reduce((sum, line) => {
    const lineTotal =
      typeof line.totalLigne === "number"
        ? line.totalLigne
        : (Number(line.quantite) || 0) * (Number(line.prixUnitaire) || 0);
    return sum + lineTotal;
  }, 0);

  const totalHT = totalHTBase * (1 - globalDiscount / 100);
  const totalTTC =
    activeLines.reduce((sum, line) => {
      const lineTva = Number.parseFloat(String(line.tva ?? globalTva)) || 0;
      const lineTotal =
        typeof line.totalLigne === "number"
          ? line.totalLigne
          : (Number(line.quantite) || 0) * (Number(line.prixUnitaire) || 0);
      return sum + lineTotal * (1 + lineTva / 100);
    }, 0) *
    (1 - globalDiscount / 100);

  return {
    totalHT,
    totalTTC,
  };
}

function isPendingQuote(status: string) {
  return status === "En attente" || status === "En attente (Modifié)";
}

function isClosedQuote(status: string) {
  return status === "Accepté" || status === "Refusé";
}

export async function getClientDashboardSummary(userId: string): Promise<ClientDashboardSummary> {
  const [quotes, starterCatalogCount] = await Promise.all([
    prisma.devis.findMany({
      where: { userId },
      select: {
        numero: true,
        date: true,
        statut: true,
        remise: true,
        tva: true,
        lignes: true,
        client: {
          select: {
            nom: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.prestation.count({
      where: { userId },
    }),
  ]);

  const normalizedQuotes: ClientDashboardQuoteSummary[] = (quotes as RawDashboardQuote[]).map((quote) => {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignes),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );

    return {
      numero: quote.numero,
      nomClient: quote.client?.nom || "Inconnu",
      emailClient: quote.client?.email || "",
      date: quote.date.toISOString(),
      statut: quote.statut,
      totalHT: totals.totalHT,
      totalTTC: totals.totalTTC,
    };
  });

  const totalQuotes = normalizedQuotes.length;
  const acceptedQuotes = normalizedQuotes.filter((quote) => quote.statut === "Accepté");
  const pendingQuotes = normalizedQuotes.filter((quote) => isPendingQuote(quote.statut));
  const acceptedRevenueHT = acceptedQuotes.reduce((sum, quote) => sum + quote.totalHT, 0);
  const pipelineRevenueHT = pendingQuotes.reduce((sum, quote) => sum + quote.totalHT, 0);
  const totalHT = normalizedQuotes.reduce((sum, quote) => sum + quote.totalHT, 0);
  const totalTTC = normalizedQuotes.reduce((sum, quote) => sum + quote.totalTTC, 0);
  const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes.length / totalQuotes) * 100) : 0;
  const averageTicket = totalQuotes > 0 ? totalTTC / totalQuotes : 0;
  const now = Date.now();

  const followUpQuotes = normalizedQuotes
    .filter((quote) => {
      if (isClosedQuote(quote.statut)) {
        return false;
      }

      const quoteDate = parseQuoteDate(quote.date);
      const diffDays = Math.ceil(Math.abs(now - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    })
    .slice(0, 4);

  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return {
      name: MONTH_NAMES[date.getMonth()],
      month: date.getMonth(),
      year: date.getFullYear(),
      CA: 0,
    };
  });

  for (const quote of acceptedQuotes) {
    const quoteDate = parseQuoteDate(quote.date);
    const targetMonth = months.find(
      (month) =>
        month.month === quoteDate.getMonth() && month.year === quoteDate.getFullYear(),
    );

    if (targetMonth) {
      targetMonth.CA += quote.totalHT;
    }
  }

  return {
    starterCatalogCount,
    totalQuotes,
    totalHT,
    totalTTC,
    acceptedCount: acceptedQuotes.length,
    pendingCount: pendingQuotes.length,
    acceptedRevenueHT,
    pipelineRevenueHT,
    followUpCount: followUpQuotes.length,
    conversionRate,
    averageTicket,
    recentQuotes: normalizedQuotes.slice(0, 4),
    followUpQuotes,
    monthlyData: months.map(({ name, CA }) => ({ name, CA })),
  };
}
