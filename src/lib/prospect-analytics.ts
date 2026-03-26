import { prisma } from "@/lib/prisma";

export type ProspectAnalytics = {
  totalSent: number;
  totalOpened: number;
  totalFailed: number;
  totalQueued: number;
  openRate: number; // Pourcentage
  dailyBreakdown: Array<{
    date: string;
    sent: number;
    opened: number;
    failed: number;
  }>;
  topDomains: Array<{
    domain: string;
    count: number;
    source: string;
  }>;
};

export async function getProspectAnalytics(days: number = 30): Promise<ProspectAnalytics> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const mails = await prisma.prospectMail.findMany({
    where: {
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalSent = mails.filter((m) => m.status === "Sent").length;
  const totalOpened = mails.filter((m) => m.status === "Opened").length;
  const totalFailed = mails.filter((m) => m.status === "Failed").length;
  const totalQueued = mails.filter((m) => m.status === "Queued").length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  // Répartition par jour
  const dailyMap = new Map<string, { sent: number; opened: number; failed: number }>();
  for (const mail of mails) {
    const date = mail.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(date) || { sent: 0, opened: 0, failed: 0 };
    if (mail.status === "Sent") existing.sent++;
    if (mail.status === "Opened") existing.opened++;
    if (mail.status === "Failed") existing.failed++;
    dailyMap.set(date, existing);
  }

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .slice(-14); // 14 derniers jours

  // Top domaines sources
  const domainMap = new Map<string, { count: number; source: string }>();
  for (const mail of mails) {
    const domain = mail.email.split("@")[1] || "unknown";
    const existing = domainMap.get(domain) || { count: 0, source: mail.source };
    existing.count++;
    domainMap.set(domain, existing);
  }

  const topDomains = Array.from(domainMap.entries())
    .map(([domain, data]) => ({ domain, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSent,
    totalOpened,
    totalFailed,
    totalQueued,
    openRate,
    dailyBreakdown,
    topDomains,
  };
}
