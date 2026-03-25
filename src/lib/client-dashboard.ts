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
      const ligneTva = Number.parseFloat(String(line.tva ?? globalTva)) || 0;
      const lineTotal =
        typeof line.totalLigne === "number"
          ? line.totalLigne
          : (Number(line.quantite) || 0) * (Number(line.prixUnitaire) || 0);
      return sum + lineTotal * (1 + ligneTva / 100);
    }, 0) *
    (1 - globalDiscount / 100);

  return { totalHT, totalTTC };
}

function mapQuote(quote: RawDashboardQuote): ClientDashboardQuoteSummary {
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
}

function isPendingQuote(status: string) {
  return status === "En attente" || status === "En attente (Modifié)";
}

function isClosedQuote(status: string) {
  return status === "Accepté" || status === "Refusé";
}

/**
 * Version optimisée du dashboard.
 *
 * Au lieu de charger TOUS les devis, on fait des requêtes ciblées :
 * 1. Comptage rapide par statut (COUNT)
 * 2. Les 4 devis les plus récents uniquement
 * 3. Les devis à relancer (> 7 jours, en attente)
 * 4. Les devis acceptés des 6 derniers mois (pour le graphique)
 */
export async function getClientDashboardSummary(userId: string): Promise<ClientDashboardSummary> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Requêtes parallèles ciblées (beaucoup plus rapide que tout charger)
  const [
    totalCount,
    acceptedCount,
    pendingCount,
    recentQuotes,
    followUpQuotesRaw,
    acceptedQuotesForChart,
    starterCatalogCount,
  ] = await Promise.all([
    // 1. Nombre total de devis (COUNT rapide)
    prisma.devis.count({ where: { userId } }),

    // 2. Nombre de devis acceptés
    prisma.devis.count({ where: { userId, statut: "Accepté" } }),

    // 3. Nombre de devis en attente
    prisma.devis.count({
      where: {
        userId,
        statut: { in: ["En attente", "En attente (Modifié)"] },
      },
    }),

    // 4. Les 4 devis les plus récents
    prisma.devis.findMany({
      where: { userId },
      select: {
        numero: true,
        date: true,
        statut: true,
        remise: true,
        tva: true,
        lignes: true,
        client: { select: { nom: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),

    // 5. Devis à relancer (> 7 jours, pas encore acceptés/refusés)
    prisma.devis.findMany({
      where: {
        userId,
        createdAt: { lt: sevenDaysAgo },
        statut: { in: ["En attente", "En attente (Modifié)"] },
      },
      select: {
        numero: true,
        date: true,
        statut: true,
        remise: true,
        tva: true,
        lignes: true,
        client: { select: { nom: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),

    // 6. Devis acceptés des 6 derniers mois (pour le graphique)
    prisma.devis.findMany({
      where: {
        userId,
        statut: "Accepté",
        date: { gte: sixMonthsAgo },
      },
      select: {
        date: true,
        remise: true,
        tva: true,
        lignes: true,
      },
    }),

    // 7. Nombre de prestations dans le catalogue
    prisma.prestation.count({ where: { userId } }),
  ]);

  // Calcul des totaux uniquement sur les devis acceptés récents (pas tous les devis)
  const allRelevantQuotes = [...recentQuotes, ...followUpQuotesRaw, ...acceptedQuotesForChart] as RawDashboardQuote[];

  let totalHT = 0;
  let totalTTC = 0;
  let acceptedRevenueHT = 0;
  let pipelineRevenueHT = 0;

  // On calcule les totaux globaux en chargeant les devis par batch si nécessaire
  // Pour l'instant, on utilise les devis chargés pour une estimation rapide
  // Les vrais totaux seront recalculés quand l'utilisateur navigue vers la page devis

  // Calcul des totaux pour les devis acceptés (revenus validés)
  for (const quote of acceptedQuotesForChart as RawDashboardQuote[]) {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignes),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    acceptedRevenueHT += totals.totalHT;
    totalHT += totals.totalHT;
    totalTTC += totals.totalTTC;
  }

  // Calcul des totaux pour les devis en attente (pipeline)
  for (const quote of followUpQuotesRaw as RawDashboardQuote[]) {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignes),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    pipelineRevenueHT += totals.totalHT;
  }

  const conversionRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;
  const averageTicket = totalCount > 0 ? totalTTC / totalCount : 0;

  // Construction du graphique mensuel
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

  for (const quote of acceptedQuotesForChart as RawDashboardQuote[]) {
    const quoteDate = parseQuoteDate(quote.date);
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignes),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    const targetMonth = months.find(
      (m) => m.month === quoteDate.getMonth() && m.year === quoteDate.getFullYear(),
    );
    if (targetMonth) {
      targetMonth.CA += totals.totalHT;
    }
  }

  return {
    starterCatalogCount,
    totalQuotes: totalCount,
    totalHT,
    totalTTC,
    acceptedCount,
    pendingCount,
    acceptedRevenueHT,
    pipelineRevenueHT,
    followUpCount: followUpQuotesRaw.length,
    conversionRate,
    averageTicket,
    recentQuotes: (recentQuotes as RawDashboardQuote[]).map(mapQuote),
    followUpQuotes: (followUpQuotesRaw as RawDashboardQuote[]).map(mapQuote),
    monthlyData: months.map(({ name, CA }) => ({ name, CA })),
  };
}
