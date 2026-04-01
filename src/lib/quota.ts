import { prisma } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

export const FREE_TIER = {
  MAX_DEVIS_PER_MONTH: 3,
};

export async function getQuotaInfo(): Promise<{
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { isPro: false, used: 0, limit: 0, remaining: 0, resetAt: new Date() };
  }

  const userId = clerkUser.id;
  const isPro = (clerkUser.publicMetadata?.isPro as boolean) === true;

  if (isPro) {
    // Illimité pour les Pro
    return { isPro: true, used: 0, limit: Infinity, remaining: Infinity, resetAt: new Date() };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const used = await prisma.devis.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  const limit = FREE_TIER.MAX_DEVIS_PER_MONTH;
  const remaining = Math.max(0, limit - used);

  return { isPro: false, used, limit, remaining, resetAt: endOfMonth };
}

export async function canCreateDevis(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const quota = await getQuotaInfo();

  if (quota.isPro) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  const allowed = quota.remaining > 0;
  return { allowed, remaining: quota.remaining, limit: quota.limit };
}
