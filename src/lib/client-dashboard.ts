import { prisma } from "@/lib/prisma";

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

type RawDashboardQuote = {
  numero: string;
  date: Date;
  lignesNorm?: any[];
  statut: string;
  remise: number | null;
  tva: number | null;
  lignes: unknown;
  createdAt?: Date;
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

export type TresorerieSummary = {
  encaisse: number;     // factures "Payée"
  aEncaisser: number;   // factures "Émise" / "En attente" non échues
  enRetard: number;     // factures "En retard" ou échues non payées
  nombreFactures: number;
  tauxRecouvrement: number; // encaissé / (encaissé + enRetard) * 100
};

export type BeneficeSummary = {
  caFacture: number;    // totalTTC factures payées
  depenses: number;     // total dépenses
  beneficeNet: number;  // caFacture - depenses
  margePct: number;     // beneficeNet / caFacture * 100
};

export type EcheanceItem = {
  numero: string;
  nomClient: string;
  totalTTC: number;
  dateEcheance: string;
  joursRestants: number;
};

export type FunnelEtape = {
  label: string;
  count: number;
  amount: number;
  pct: number; // par rapport au total devis
  color: string;
};

export type ClientDashboardSummary = {
  starterCatalogCount: number;
  totalQuotes: number;
  totalHT: number;
  totalTTC: number;
  acceptedCount: number;
  pendingCount: number;
  refusedCount: number;
  acceptedRevenueHT: number;
  pipelineRevenueHT: number;
  lostRevenueHT: number;
  followUpCount: number;
  conversionRate: number;
  averageTicket: number;
  avgResponseDays: number;
  recentQuotes: ClientDashboardQuoteSummary[];
  followUpQuotes: ClientDashboardQuoteSummary[];
  monthlyData: ClientDashboardMonthlyDatum[];
  topClients: Array<{ nom: string; devisCount: number; revenueHT: number }>;
  tresorerie: TresorerieSummary;
  benefice: BeneficeSummary;
  echeances: EcheanceItem[];
  semaine: SemaineSummary;
  funnel: FunnelEtape[];
};

export type SemaineSummary = {
  nouveauxDevis: number;
  devisAcceptes: number;
  facturesEmises: number;
  facturesPayees: number;
  caEncaisse: number;
  depensesSemaine: number;
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
    normalizeLineItems(quote.lignesNorm),
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

  const today = new Date();
  const inFourteenDays = new Date();
  inFourteenDays.setDate(today.getDate() + 14);

  // Requêtes parallèles ciblées (beaucoup plus rapide que tout charger)
  const [
    totalCount,
    acceptedCount,
    pendingCount,
    refusedCount,
    recentQuotes,
    followUpQuotesRaw,
    acceptedQuotesForChart,
    refusedQuotesForLost,
    starterCatalogCount,
    factures,
    echeances,
    depenses,
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

    // 3b. Nombre de devis refusés
    prisma.devis.count({ where: { userId, statut: "Refusé" } }),

    // 4. Les 4 devis les plus récents
    prisma.devis.findMany({
      where: { userId },
      select: {
        numero: true,
        date: true,
        statut: true,
        remise: true,
        tva: true,
        lignesNorm: true,
        createdAt: true,
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
        lignesNorm: true,
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
        createdAt: true,
        remise: true,
        tva: true,
        lignesNorm: true,
        client: { select: { nom: true } },
      },
    }),

    // 6b. Devis refusés des 6 derniers mois (revenu perdu)
    prisma.devis.findMany({
      where: {
        userId,
        statut: "Refusé",
        date: { gte: sixMonthsAgo },
      },
      select: {
        date: true,
        createdAt: true,
        remise: true,
        tva: true,
        lignesNorm: true,
      },
    }),

    // 7. Nombre de prestations dans le catalogue
    prisma.prestation.count({ where: { userId } }),

    // 8. Factures pour trésorerie
    prisma.facture.findMany({
      where: { userId },
      select: {
        totalTTC: true,
        statut: true,
        dateEcheance: true,
      },
    }),

    // 9. Échéances à venir (7-14 jours)
    prisma.facture.findMany({
      where: {
        userId,
        dateEcheance: { gte: today, lte: inFourteenDays },
        statut: { notIn: ["Payée", "Annulée"] },
      },
      select: {
        numero: true,
        nomClient: true,
        totalTTC: true,
        dateEcheance: true
      },
      orderBy: { dateEcheance: "asc" },
    }),

    // 10. Dépenses pour bénéfice net
    prisma.depense.findMany({
      where: { userId },
      select: { montant: true },
    }),
  ]);

  // Calcul des totaux uniquement sur les devis acceptés récents (pas tous les devis)
  // allRelevantQuotes removed (unused)

  let totalHT = 0;
  let totalTTC = 0;
  let acceptedRevenueHT = 0;
  let pipelineRevenueHT = 0;
  let lostRevenueHT = 0;

  // On calcule les totaux globaux en chargeant les devis par batch si nécessaire
  // Pour l'instant, on utilise les devis chargés pour une estimation rapide
  // Les vrais totaux seront recalculés quand l'utilisateur navigue vers la page devis

  // Calcul des totaux pour les devis acceptés (revenus validés)
  for (const quote of acceptedQuotesForChart as RawDashboardQuote[]) {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignesNorm),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    acceptedRevenueHT += totals.totalHT;
    totalHT += totals.totalHT;
    totalTTC += totals.totalTTC;
  }

  // Calcul du revenu perdu (devis refusés des 6 derniers mois)
  for (const quote of refusedQuotesForLost as RawDashboardQuote[]) {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignesNorm),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    lostRevenueHT += totals.totalHT;
  }

  // Délai moyen de réponse (depuis la création jusqu'à acceptation/refus)
  const respondedQuotes = [
    ...(acceptedQuotesForChart as (RawDashboardQuote & { createdAt: Date })[]),
    ...(refusedQuotesForLost as (RawDashboardQuote & { createdAt: Date })[]),
  ].filter((q) => q.createdAt);
  const totalResponseDays = respondedQuotes.reduce((sum, q) => {
    const days = (q.date.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.max(0, days);
  }, 0);
  const avgResponseDays = respondedQuotes.length > 0
    ? Math.round((totalResponseDays / respondedQuotes.length) * 10) / 10
    : 0;

  // Calcul des totaux pour les devis en attente (pipeline)
  for (const quote of followUpQuotesRaw as RawDashboardQuote[]) {
    const totals = computeQuoteTotals(
      normalizeLineItems(quote.lignesNorm),
      Number(quote.tva) || 0,
      Number(quote.remise) || 0,
    );
    pipelineRevenueHT += totals.totalHT;
  }

  const conversionRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;
  const averageTicket = acceptedCount > 0 ? acceptedRevenueHT / acceptedCount : 0;

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
      normalizeLineItems(quote.lignesNorm),
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

  // Top clients par revenu
  const clientRevenue = new Map<string, { nom: string; devisCount: number; revenueHT: number }>();
  for (const quote of acceptedQuotesForChart as RawDashboardQuote[]) {
    const nom = quote.client?.nom || "Inconnu";
    const existing = clientRevenue.get(nom) || { nom, devisCount: 0, revenueHT: 0 };
    const lines = Array.isArray(quote.lignesNorm) ? (quote.lignesNorm as DashboardLineItem[]) : [];
    const totals = computeQuoteTotals(lines, quote.tva || 0, quote.remise || 0);
    existing.devisCount++;
    existing.revenueHT += totals.totalHT;
    clientRevenue.set(nom, existing);
  }
  const topClients = Array.from(clientRevenue.values())
    .sort((a, b) => b.revenueHT - a.revenueHT)
    .slice(0, 5);

  // Trésorerie depuis les factures
  let encaisse = 0;
  let aEncaisser = 0;
  let enRetard = 0;
  let nombreFactures = factures.length;

  for (const f of factures) {
    if (f.statut === "Payée") {
      encaisse += Number(f.totalTTC);
    } else if (f.statut === "En retard") {
      enRetard += Number(f.totalTTC);
    } else if (f.statut !== "Annulée") {
      if (f.dateEcheance && f.dateEcheance < today) {
        enRetard += Number(f.totalTTC);
      } else {
        aEncaisser += Number(f.totalTTC);
      }
    }
  }

  const totalRecouvrable = encaisse + enRetard;
  const tauxRecouvrement = totalRecouvrable > 0 ? Math.round((encaisse / totalRecouvrable) * 100) : 100;

  const tresorerie: TresorerieSummary = {
    encaisse,
    aEncaisser,
    enRetard,
    nombreFactures,
    tauxRecouvrement,
  };

  // Bénéfice net
  const caFacture = encaisse; // factures payées = CA réel
  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
  const beneficeNet = caFacture - totalDepenses;
  const margePct = caFacture > 0 ? Math.round((beneficeNet / caFacture) * 100) : 0;

  const benefice: BeneficeSummary = {
    caFacture,
    depenses: totalDepenses,
    beneficeNet,
    margePct,
  };

  // Prochaines échéances
  const echeancesProchaines = echeances
    .filter((e) => e.dateEcheance)
    .map((e) => ({
      numero: e.numero,
      nomClient: e.nomClient,
      totalTTC: Number(e.totalTTC),
      dateEcheance: e.dateEcheance!.toISOString(),
      joursRestants: Math.ceil((e.dateEcheance!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));

  // Résumé de la semaine
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const [nouveauxDevis, devisAcceptesSemaine, facturesEmises, facturesPayees, depensesAgg] = await Promise.all([
    prisma.devis.count({ where: { userId, createdAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.devis.count({ where: { userId, statut: "Accepté", updatedAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.facture.count({ where: { userId, createdAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.facture.count({ where: { userId, statut: "Payée", updatedAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.depense.aggregate({ where: { userId, date: { gte: startOfWeek, lt: endOfWeek } }, _sum: { montant: true } }),
  ]);

  const facturesPayeesSemaine = await prisma.facture.findMany({
    where: { userId, statut: "Payée", updatedAt: { gte: startOfWeek, lt: endOfWeek } },
    select: { totalTTC: true },
  });
  const caEncaisse = facturesPayeesSemaine.reduce((s, f) => s + Number(f.totalTTC), 0);

  // Funnel de conversion : Devis créés → Acceptés → Facturés → Payés
  const facturesFromDevis = await prisma.facture.findMany({
    where: { userId, devisId: { not: null } },
    select: { totalTTC: true, statut: true, devisId: true },
  });
  const devisFacturesIds = new Set(facturesFromDevis.map((f) => f.devisId));
  const nbFacturesFromDevis = facturesFromDevis.length;
  const facturesPayeesFromDevis = facturesFromDevis.filter((f) => f.statut === "Payée");
  const nbFactureesPayees = facturesPayeesFromDevis.length;
  const montantFacturesPayees = facturesPayeesFromDevis.reduce((s, f) => s + Number(f.totalTTC), 0);

  const funnel: FunnelEtape[] = [
    { label: "Devis créés", count: totalCount, amount: totalTTC, pct: 100, color: "violet" },
    { label: "Acceptés", count: acceptedCount, amount: acceptedRevenueHT, pct: totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0, color: "emerald" },
    { label: "Facturés", count: nbFacturesFromDevis, amount: facturesFromDevis.reduce((s, f) => s + Number(f.totalTTC), 0), pct: totalCount > 0 ? Math.round((nbFacturesFromDevis / totalCount) * 100) : 0, color: "blue" },
    { label: "Payés", count: nbFactureesPayees, amount: montantFacturesPayees, pct: totalCount > 0 ? Math.round((nbFactureesPayees / totalCount) * 100) : 0, color: "amber" },
  ];

  return {
    starterCatalogCount,
    totalQuotes: totalCount,
    totalHT,
    totalTTC,
    acceptedCount,
    pendingCount,
    refusedCount,
    acceptedRevenueHT,
    pipelineRevenueHT,
    lostRevenueHT,
    followUpCount: followUpQuotesRaw.length,
    conversionRate,
    averageTicket,
    avgResponseDays,
    recentQuotes: (recentQuotes as RawDashboardQuote[]).map(mapQuote),
    followUpQuotes: (followUpQuotesRaw as RawDashboardQuote[]).map(mapQuote),
    monthlyData: months.map(({ name, CA }) => ({ name, CA })),
    topClients,
    tresorerie,
    benefice,
    echeances: echeancesProchaines,
    semaine: {
      nouveauxDevis,
      devisAcceptes: devisAcceptesSemaine,
      facturesEmises,
      facturesPayees,
      caEncaisse,
      depensesSemaine: Number(depensesAgg._sum.montant ?? 0),
    },
    funnel,
  };
}
